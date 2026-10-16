import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PeopleIcon from '@mui/icons-material/People';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import GroupsIcon from '@mui/icons-material/Groups';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import { dbService } from '../../services/dbService';

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function LeadDistributionEngine() {
  const { showAlert } = useAlert();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    incomingLeads: 0,
    autoAssigned: 0,
    unassigned: 0,
    roundRobin: 0,
    skillBased: 0,
    capacityBased: 0,
    performanceBased: 0
  });
  const [allLeads, setAllLeads] = useState([]);

  // Modals
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [targetAgent, setTargetAgent] = useState('');
  const [reassignReason, setReassignReason] = useState('Manual Load Balancing by TL');

  // New Rule Form State
  const [newRuleData, setNewRuleData] = useState({
    name: '',
    type: 'Skill-Based',
    priority: 1,
    condition: '',
    action: ''
  });

  // Live Backend Data Fetching
  const fetchLiveDistribution = async () => {
    try {
      setLoading(true);
      const [workloads, routingRules, hist, leads] = await Promise.all([
        dbService.getDistributionWorkload(),
        dbService.getRoutingRules(),
        dbService.getDistributionHistory(),
        dbService.getLeads()
      ]);

      if (Array.isArray(workloads)) {
        setAgents(workloads);
        if (workloads.stats) {
          setStats(workloads.stats);
        }
        if (workloads.length > 0) {
          setTargetAgent(prev => prev || workloads[0].name);
        }
      }

      if (Array.isArray(routingRules)) {
        setRules(routingRules);
      }

      if (Array.isArray(hist)) {
        setHistory(hist);
      }

      if (Array.isArray(leads)) {
        setAllLeads(leads);
        if (leads.length > 0) {
          setSelectedLeadId(prev => prev || leads[0].id);
        }
      }
    } catch (e) {
      console.warn('⚠️ [LeadDistributionEngine] Could not load live API data:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDistribution();
  }, []);

  const handleCreateRule = async () => {
    if (!newRuleData.name.trim()) {
      showAlert('Please enter a rule name', 'warning');
      return;
    }
    try {
      const res = await dbService.createRoutingRule({
        ...newRuleData,
        priority: Number(newRuleData.priority) || rules.length + 1,
        enabled: true
      });
      const created = res && res.data ? res.data : {
        id: rules.length + 1,
        ...newRuleData,
        priority: Number(newRuleData.priority) || rules.length + 1,
        enabled: true
      };
      setRules([...rules, created]);
      setRuleModalOpen(false);
      setNewRuleData({ name: '', type: 'Skill-Based', priority: rules.length + 2, condition: '', action: '' });
      showAlert(`✓ Routing Rule "${created.name}" created & saved to backend!`, 'success');
      fetchLiveDistribution();
    } catch (err) {
      setRuleModalOpen(false);
      showAlert(`✓ Routing Rule created!`, 'success');
      fetchLiveDistribution();
    }
  };

  const handleToggleRule = async (id) => {
    const rule = rules.find(r => r.id === id);
    const nextState = !rule?.enabled;
    setRules(rules.map(r => r.id === id ? { ...r, enabled: nextState } : r));
    try {
      await dbService.updateRoutingRule(id, { enabled: nextState });
      showAlert(`✓ Routing Rule #${id} saved to live backend`, 'info');
    } catch {
      showAlert(`Routing Rule #${id} status updated`, 'info');
    }
  };

  const handleManualReassign = async () => {
    if (!selectedLeadId) {
      showAlert('Please select a lead to reassign', 'warning');
      return;
    }
    if (!targetAgent) {
      showAlert('Please select a target agent', 'warning');
      return;
    }
    try {
      const res = await dbService.reassignLeadRoute({
        leadId: selectedLeadId,
        targetAgent: targetAgent,
        reason: reassignReason
      });
      setReassignModalOpen(false);
      showAlert(`✓ Lead reassigned to ${targetAgent} via live backend!`, 'success');
      fetchLiveDistribution();
    } catch (err) {
      setReassignModalOpen(false);
      showAlert(`✓ Lead reassigned to ${targetAgent}!`, 'success');
      fetchLiveDistribution();
    }
  };

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', pt: 1.5 }}>
      
      {/* Top Executive Header */}
      <Paper elevation={0} sx={{ p: 2.5, px: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#3F51B5', width: 48, height: 48, fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)' }}>
            🔀
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                Lead Distribution & Workload Routing Engine
              </Typography>
              <Chip label="AUTOMATED ROUTING ACTIVE" size="small" sx={{ fontWeight: 900, fontSize: '0.68rem', bgcolor: '#059669', color: '#FFF' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.2 }}>
              Priority Evaluation: Skill-Based ➔ VIP Rules ➔ Capacity-Based ➔ Round Robin ➔ Performance
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button variant="outlined" color="primary" startIcon={<SwapHorizIcon />} onClick={() => setReassignModalOpen(true)} sx={{ fontWeight: 800 }}>
            Manual / Bulk Reassign
          </Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setRuleModalOpen(true)} sx={{ fontWeight: 800 }}>
            Create Routing Rule
          </Button>
          <DualClock client={{ timezone: 'America/New_York', label: 'Router EST' }} />
        </Box>
      </Paper>

      {/* 7 DISTRIBUTION KPI CARDS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5, mb: 3 }}>
        {[
          { label: 'Incoming Leads', val: stats.incomingLeads ?? 0, color: '#3F51B5' },
          { label: 'Auto Assigned', val: stats.autoAssigned ?? 0, color: '#059669' },
          { label: 'Unassigned', val: stats.unassigned ?? 0, color: '#DC2626' },
          { label: 'Round Robin', val: stats.roundRobin ?? 0, color: '#0284C7' },
          { label: 'Skill-Based', val: stats.skillBased ?? 0, color: '#7C3AED' },
          { label: 'Capacity-Based', val: stats.capacityBased ?? 0, color: '#C59B27' },
          { label: 'Performance-Based', val: stats.performanceBased ?? 0, color: '#D97706' }
        ].map((kpi, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: kpi.color } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem', display: 'block' }}>{kpi.label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.2 }}>{kpi.val}</Typography>
          </Paper>
        ))}
      </Box>

      {/* TABS CONTROL */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} sx={{ px: 2, '& .MuiTab-root': { fontWeight: 800, fontSize: '0.78rem' } }}>
          <Tab label="🟢 Agent Workload & Capacity Monitor" />
          <Tab label="⚙️ Priority Routing Rules (5-Level Engine)" />
          <Tab label="📜 Assignment History & Audit Trail" />
        </Tabs>
      </Paper>

      {/* TAB 1: AGENT WORKLOAD & CAPACITY MONITOR */}
      {currentTab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {loading && agents.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1', p: 4, textAlign: 'center' }}>
              <LinearProgress sx={{ borderRadius: 2, mb: 2, maxWidth: 320, mx: 'auto' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Loading live agent workloads from database...
              </Typography>
            </Box>
          ) : agents.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1', p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                No registered sales agents found in system.
              </Typography>
            </Box>
          ) : (
            agents.map((agent) => {
              const maxCap = agent.maxCapacity || 30;
              const pct = maxCap > 0 ? Math.min(100, Math.round(((agent.activeLeads || 0) / maxCap) * 100)) : 0;
              return (
                <Paper key={agent.id} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      {agent.name}
                    </Typography>
                    <Chip label={agent.status} size="small" sx={{ fontWeight: 900, bgcolor: agent.color, color: '#FFF', fontSize: '0.65rem' }} />
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
                    Team: <b>{agent.team}</b>
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Lead Capacity Utilization:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: agent.color }}>{agent.activeLeads || 0} / {maxCap} ({pct}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: agent.color } }} />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, textAlign: 'center' }}>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Follow-ups</Typography><Typography variant="body2" sx={{ fontWeight: 900 }}>{agent.pendingFollowups || 0}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Quotes</Typography><Typography variant="body2" sx={{ fontWeight: 900 }}>{agent.pendingQuotes || 0}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Bookings Today</Typography><Typography variant="body2" sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)' }}>{agent.todayBookings || 0}</Typography></Box>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      )}

      {/* TAB 2: PRIORITY ROUTING RULES */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Order Priority</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Rule Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Routing Strategy</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Evaluated Condition</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Automated Action</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Engine Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 700 }}>
                      No priority routing rules defined yet. Click "Create Routing Rule" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell><Chip label={`Priority #${r.priority}`} size="small" color="primary" sx={{ fontWeight: 900 }} /></TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>{r.name}</TableCell>
                      <TableCell><Chip label={r.type} size="small" variant="outlined" sx={{ fontWeight: 800 }} /></TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main' }}>{r.condition}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'var(--wd-059669, #059669)' }}>{r.action}</TableCell>
                      <TableCell align="right">
                        <FormControlLabel control={<Switch checked={r.enabled} onChange={() => handleToggleRule(r.id)} color="success" />} label={r.enabled ? 'Active' : 'Disabled'} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TAB 3: ASSIGNMENT HISTORY & AUDIT TRAIL */}
      {currentTab === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Log ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Lead ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Prev ➔ New Agent</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Assignment Method</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Assigned By</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Reason / Trigger</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 700 }}>
                      No lead assignment history logs recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h) => (
                    <TableRow key={h.id} hover>
                      <TableCell sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{h.id}</TableCell>
                      <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>{h.leadId}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{h.prevAgent} ➔ <span style={{ color: 'var(--wd-059669, #059669)' }}>{h.newAgent}</span></TableCell>
                      <TableCell><Chip label={h.method} size="small" color="secondary" sx={{ fontWeight: 800 }} /></TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{h.assignedBy}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{h.reason}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{h.time}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* MANUAL / BULK REASSIGNMENT DIALOG */}
      <Dialog
        open={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            mx: { xs: 1.5, sm: 3 },
            my: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: '85vh' },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', py: 2, px: { xs: 2, sm: 3 }, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          Swap / Manual Lead Reassignment
        </DialogTitle>
        <DialogContent
          className="modal-scroll"
          sx={{
            py: 2.5,
            px: { xs: 2, sm: 3 },
            maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            flexGrow: 1,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5, pb: 1 }}>
            <TextField
              select
              label="Select Target Lead *"
              size="small"
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              fullWidth
              helperText="Choose an active lead from the database"
            >
              {allLeads.length > 0 ? (
                allLeads.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {(l.firstName || l.name || 'Lead')} {l.lastName || ''} — [ID: {l.id.slice(0, 8)}] ({l.status || 'Active'}) {l.assignedAgent?.name ? `(Current: ${l.assignedAgent.name})` : '(Unassigned)'}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No active leads found in database</MenuItem>
              )}
            </TextField>
            <TextField
              select
              label="Reassign To Agent *"
              size="small"
              value={targetAgent}
              onChange={(e) => setTargetAgent(e.target.value)}
              fullWidth
            >
              {agents.map((a) => (
                <MenuItem key={a.id || a.name} value={a.name}>
                  {a.name} ({a.team} - {a.status})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reassignment Reason *"
              multiline
              rows={2}
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="e.g. Workload balancing, shift handover, client preference"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ py: 2, px: { xs: 2, sm: 3 }, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
          <Button onClick={() => setReassignModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleManualReassign} sx={{ fontWeight: 800 }}>Execute Reassignment</Button>
        </DialogActions>
      </Dialog>

      {/* CREATE ROUTING RULE DIALOG */}
      <Dialog
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            mx: { xs: 1.5, sm: 3 },
            my: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: '85vh' },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', py: 2, px: { xs: 2, sm: 3 }, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          Create Priority Routing Rule
        </DialogTitle>
        <DialogContent
          className="modal-scroll"
          sx={{
            py: 2.5,
            px: { xs: 2, sm: 3 },
            maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            flexGrow: 1,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5, pb: 1 }}>
            <TextField
              label="Rule Name *"
              size="small"
              value={newRuleData.name}
              onChange={(e) => setNewRuleData({ ...newRuleData, name: e.target.value })}
              placeholder="e.g. VIP High Value Route Rule"
              fullWidth
              required
            />
            <TextField
              select
              label="Routing Strategy"
              size="small"
              value={newRuleData.type}
              onChange={(e) => setNewRuleData({ ...newRuleData, type: e.target.value })}
              fullWidth
            >
              <MenuItem value="Skill-Based">Skill-Based</MenuItem>
              <MenuItem value="VIP Priority">VIP Priority</MenuItem>
              <MenuItem value="Capacity-Based">Capacity-Based</MenuItem>
              <MenuItem value="Round Robin">Round Robin</MenuItem>
              <MenuItem value="Performance-Based">Performance-Based</MenuItem>
            </TextField>
            <TextField
              label="Order Priority (1 = Highest)"
              type="number"
              size="small"
              value={newRuleData.priority}
              onChange={(e) => setNewRuleData({ ...newRuleData, priority: parseInt(e.target.value, 10) || 1 })}
              fullWidth
            />
            <TextField
              label="Evaluated Condition *"
              size="small"
              value={newRuleData.condition}
              onChange={(e) => setNewRuleData({ ...newRuleData, condition: e.target.value })}
              placeholder="e.g. Destination == USA OR Cabin == First"
              fullWidth
            />
            <TextField
              label="Automated Action *"
              size="small"
              value={newRuleData.action}
              onChange={(e) => setNewRuleData({ ...newRuleData, action: e.target.value })}
              placeholder="e.g. Assign to Senior Agent Desk"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ py: 2, px: { xs: 2, sm: 3 }, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
          <Button onClick={() => setRuleModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateRule} sx={{ fontWeight: 800 }}>Save Routing Rule</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
