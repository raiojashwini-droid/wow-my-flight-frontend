import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
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
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';

// Icons
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SpeedIcon from '@mui/icons-material/Speed';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import RefreshIcon from '@mui/icons-material/Refresh';

// Recharts
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import { slaManagementService } from '../../services/phase3Service';

// ==========================================
// MOCK DATASETS
// ==========================================

const INITIAL_SLA_KPIS = [
  { id: 'activeSla', title: 'Total Active SLAs', value: '0 Active', change: 'Live countdowns', color: '#6366F1', icon: <TimerIcon /> },
  { id: 'completedOnTime', title: 'Completed On Time', value: '0 SLAs', change: '100% on-time', color: '#10B981', icon: <CheckCircleIcon /> },
  { id: 'approaching', title: 'Approaching Deadline', value: '0 SLAs', change: '< 2m remaining', color: '#F59E0B', icon: <WarningAmberIcon /> },
  { id: 'breached', title: 'SLA Breached', value: '0 Breaches', change: 'Zero breaches', color: '#EF4444', icon: <ReportProblemIcon /> },
  { id: 'avgResponse', title: 'Avg Response Time', value: '0m', change: 'Target < 5m', color: '#0284C7', icon: <SpeedIcon /> },
  { id: 'avgTicketing', title: 'Avg Ticketing Time', value: '0m', change: 'Target < 10m', color: '#8B5CF6', icon: <ConfirmationNumberIcon /> },
  { id: 'slaCompliance', title: 'SLA Compliance %', value: '100%', change: 'Live compliance', color: '#D97706', icon: <VerifiedIcon /> }
];

const DEFAULT_MANDATORY_SLA_RULES = [
  { id: 'RULE-1', event: 'New Lead Created', targetText: 'First Contact within 5 Minutes', targetMinutes: 5, agentAlert: 'At 3 Minutes', tlAlert: 'At 5 Minutes', expertTlEscalation: 'If unresolved after 10m', priority: 'Standard', status: 'Active' },
  { id: 'RULE-2', event: 'High-Value Lead ($10k+)', targetText: 'First Contact within 2 Minutes', targetMinutes: 2, agentAlert: 'At 1 Minute', tlAlert: 'At 2 Minutes', expertTlEscalation: 'Immediate Red Alert', priority: 'Critical Red', status: 'Active' },
  { id: 'RULE-3', event: 'Payment Received', targetText: 'Ticketing within 10 Minutes', targetMinutes: 10, agentAlert: 'At 8 Minutes', tlAlert: 'At 10 Minutes', expertTlEscalation: 'Escalate pending GDS PNR', priority: 'High Priority', status: 'Active' },
  { id: 'RULE-4', event: 'Customer Request / Inquiry', targetText: 'Response within 15 Minutes', targetMinutes: 15, agentAlert: 'At 10 Minutes', tlAlert: 'At 15 Minutes', expertTlEscalation: 'Escalate to Concierge Desk', priority: 'Standard', status: 'Active' }
];

const INITIAL_ACTIVE_SLA_TRACKER = [];
const INITIAL_SLA_ALERTS = [];
const AGENT_COMPLIANCE_DATA = [];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SlaManagement() {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const [currentTab, setCurrentTab] = useState(0);

  // States
  const [kpis, setKpis] = useState(INITIAL_SLA_KPIS);
  const [rules, setRules] = useState(DEFAULT_MANDATORY_SLA_RULES);
  const [activeTracker, setActiveTracker] = useState(INITIAL_ACTIVE_SLA_TRACKER);
  const [alerts, setAlerts] = useState(INITIAL_SLA_ALERTS);

  // Live SLA Data from backend (/api/sla-management)
  React.useEffect(() => {
    let isMounted = true;
    slaManagementService.getData().then(data => {
      if (!isMounted || !data) return;
      if (Array.isArray(data.kpis) && data.kpis.length > 0) {
        setKpis(prev => prev.map(k => {
          const match = data.kpis.find(dk => dk.id === k.id);
          return match ? { ...k, value: match.value, change: match.change || k.change } : k;
        }));
      }
      if (Array.isArray(data.rules) && data.rules.length > 0) setRules(data.rules);
      if (Array.isArray(data.activeTracker)) setActiveTracker(data.activeTracker);
      if (Array.isArray(data.alerts)) setAlerts(data.alerts);
    }).catch(err => console.warn('SLA Management API load warning:', err.message));
    return () => { isMounted = false; };
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editTargetMinutes, setEditTargetMinutes] = useState(5);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setEditTargetMinutes(rule.targetMinutes);
    setEditRuleModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!selectedRule) return;
    setRules(prev => prev.map(r => r.id === selectedRule.id ? { ...r, targetMinutes: editTargetMinutes, targetText: `First Contact within ${editTargetMinutes} Minutes` } : r));
    setEditRuleModalOpen(false);
    await slaManagementService.updateRule(selectedRule.id, { targetMinutes: editTargetMinutes });
    showAlert(`✓ SLA Rule "${selectedRule.event}" updated to ${editTargetMinutes} minutes target!`, 'success');
  };

  const handleResolveBreach = async (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    await slaManagementService.resolveAlert(alertId);
    showAlert(`✓ Breach alert ${alertId} acknowledged and resolved!`, 'success');
  };

  const filteredActiveTracker = useMemo(() => {
    return activeTracker.filter(item => {
      const matchesSearch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || item.agent.toLowerCase().includes(searchQuery.toLowerCase()) || item.leadBookingId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [activeTracker, searchQuery, statusFilter, priorityFilter]);

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', width: '100%' }}>
      
      {/* ─── 1. TOP EXECUTIVE HEADER ─── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          display: 'flex',
          justify: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              width: 52,
              height: 52,
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            SLA
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Outfit, sans-serif', fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                SLA Service Level Agreement Management System
              </Typography>
              <Chip label="ROLE: ADMIN / TL / EXPERT TL" size="small" color="warning" sx={{ fontWeight: 900, fontSize: '0.65rem', height: 22 }} />
              <Chip label="REAL-TIME MONITORING" size="small" variant="outlined" color="primary" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              Automated Response Deadlines & Escalations: New Lead (5m), High-Value (2m), Payment Ticketing (10m), Customer Request (15m)
            </Typography>
          </Box>
        </Box>
        <DualClock client={{ timezone: 'America/New_York', label: 'SLA Engine Time (EST)' }} />
      </Paper>

      {/* ─── 2. RESPONSIVE KPI CARDS GRID ─── */}
      <Box sx={{ mb: 3.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 2
          }}
        >
          {kpis.map((kpi) => (
            <Paper
              key={kpi.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: kpi.color,
                  boxShadow: theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.06)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  backgroundColor: kpi.color
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  {kpi.title}
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: alpha(kpi.color, 0.12), color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.color, fontSize: '0.72rem' }}>
                  {kpi.change}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ─── 3. TABS ─── */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="secondary"
          indicatorColor="secondary"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.82rem',
              py: 2,
              minHeight: 52,
              textTransform: 'none'
            }
          }}
        >
          <Tab label="1. Live SLA Countdown Tracker" icon={<TimerIcon fontSize="small" />} iconPosition="start" />
          <Tab label="2. Mandatory SLA Rules Config" icon={<GavelIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`3. Escalation & Breach Alerts (${alerts.length})`} icon={<NotificationsActiveIcon fontSize="small" />} iconPosition="start" />
          <Tab label="4. Agent SLA Compliance Leaderboard" icon={<AssessmentIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* TAB 1: LIVE SLA COUNTDOWN TRACKER */}
      {/* ========================================================= */}
      {currentTab === 0 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'Outfit, sans-serif' }}>
                Real-Time SLA Deadline Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live countdown timers for open leads, payment ticketing, and customer inquiries
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search lead, agent, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ width: { xs: '100%', sm: 200 } }}
              />
              <FormControl size="small" sx={{ width: { xs: '100%', sm: 130 } }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="On Time">On Time</MenuItem>
                  <MenuItem value="Warning">Warning</MenuItem>
                  <MenuItem value="SLA Breached">SLA Breached</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 750 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Lead / Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>SLA Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Assigned Agent / TL</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Remaining Time</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Priority</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActiveTracker.map((s) => (
                  <TableRow key={s.id} hover sx={{ bgcolor: s.bg }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{s.customerName}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{s.leadBookingId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{s.type}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{s.agent}</Typography>
                      <Typography variant="caption" color="text.secondary">TL: {s.tl}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 900, color: s.color }}>{s.remaining}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={s.priority} size="small" color={s.priority.includes('Red') ? 'error' : 'warning'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={s.status} size="small" sx={{ fontWeight: 900, bgcolor: s.color, color: '#FFFFFF' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RULES CONFIG */}
      {/* ========================================================= */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'Outfit, sans-serif' }}>
              Mandatory SLA Rules Benchmarks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Target thresholds for response time, agent warnings, and escalation rules
            </Typography>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 750 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Event Trigger</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Target Benchmark</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Agent Alert</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>TL Warning</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Escalation Rule</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{r.event}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{r.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={r.targetText} size="small" color="primary" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{r.agentAlert}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{r.tlAlert}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>{r.expertTlEscalation}</Typography></TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditRule(r)} sx={{ fontWeight: 800 }}>
                        Edit SLA
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* MODAL */}
      <Dialog open={editRuleModalOpen} onClose={() => setEditRuleModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit SLA Benchmark</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Event: <b>{selectedRule?.event}</b>
          </Typography>
          <TextField
            label="Target SLA Minutes"
            type="number"
            size="small"
            value={editTargetMinutes}
            onChange={e => setEditTargetMinutes(Number(e.target.value))}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditRuleModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained" color="primary" sx={{ fontWeight: 800 }}>
            Save Benchmark
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
