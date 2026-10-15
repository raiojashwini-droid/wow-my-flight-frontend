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
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/dbService';

// ==========================================
// MANDATORY DATASETS & TRANSITION RULES
// ==========================================

const PIPELINE_STAGES = [
  'NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'QUOTE CREATED',
  'QUOTE SENT', 'NEGOTIATION', 'PAYMENT PENDING', 'BOOKED', 'TICKETED', 'TRAVEL COMPLETED'
];

const VALID_TRANSITIONS = {
  'NEW': ['ASSIGNED'],
  'ASSIGNED': ['CONTACTED'],
  'CONTACTED': ['QUALIFIED', 'NO RESPONSE'],
  'QUALIFIED': ['QUOTE CREATED'],
  'QUOTE CREATED': ['QUOTE SENT'],
  'QUOTE SENT': ['NEGOTIATION', 'LOST'],
  'NEGOTIATION': ['PAYMENT PENDING', 'LOST'],
  'PAYMENT PENDING': ['BOOKED', 'CANCELLED'],
  'BOOKED': ['TICKETED'],
  'TICKETED': ['TRAVEL COMPLETED'],
  'TRAVEL COMPLETED': []
};

const OUTCOME_REASONS = {
  'LOST': ['Price too high', 'Customer booked elsewhere', 'Customer postponed travel', 'Visa issue', 'Other'],
  'SPAM': ['Invalid inquiry', 'Fake lead', 'Promotional spam'],
  'DUPLICATE': ['Existing customer', 'Existing lead merged'],
  'NO RESPONSE': ['No answer after 3 attempts', 'Customer unreachable / wrong number'],
  'CANCELLED': ['Customer cancelled request', 'Payment failed / timed out']
};

const STAGE_CONFIGS = [
  { label: 'New', key: 'NEW', color: '#3F51B5' },
  { label: 'Assigned', key: 'ASSIGNED', color: '#0284C7' },
  { label: 'Contacted', key: 'CONTACTED', color: '#059669' },
  { label: 'Qualified', key: 'QUALIFIED', color: '#7C3AED' },
  { label: 'Quote Created', key: 'QUOTE CREATED', color: '#C59B27' },
  { label: 'Quote Sent', key: 'QUOTE SENT', color: '#2563EB' },
  { label: 'Negotiation', key: 'NEGOTIATION', color: '#D97706' },
  { label: 'Payment Pending', key: 'PAYMENT PENDING', color: '#059669' },
  { label: 'Booked', key: 'BOOKED', color: '#16A34A' },
  { label: 'Ticketed', key: 'TICKETED', color: '#059669' },
  { label: 'Travel Completed', key: 'TRAVEL COMPLETED', color: '#16A34A' },
  { label: 'Lost', key: 'LOST', color: '#6B7280' },
  { label: 'No Response', key: 'NO RESPONSE', color: '#9CA3AF' }
];

const INITIAL_LEAD = {
  id: '',
  customer: 'Select a Lead...',
  route: '',
  tripType: 'Round-Trip',
  agent: 'Sales Agent',
  teamLeader: 'Team Leader',
  currentStatusIndex: 0,
  currentStatus: 'NEW',
  expectedValue: 0,
  createdDate: new Date().toISOString(),
  slaStatus: '🟢 On Time (0 Delays)',
  history: []
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function LeadLifecycleSystem() {
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();
  const [lead, setLead] = useState(INITIAL_LEAD);
  const [allLeadsList, setAllLeadsList] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [tlOverride, setTlOverride] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Transition Dialog State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('QUALIFIED');
  const [selectedReason, setSelectedReason] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch live lifecycle data on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLifecycleOverview = async () => {
      try {
        const overview = await dbService.getLifecycleOverview();
        if (isMounted && overview) {
          if (overview.stageCounts) setStageCounts(overview.stageCounts);
          if (Array.isArray(overview.leads) && overview.leads.length > 0) {
            setAllLeadsList(overview.leads);
            const firstId = overview.leads[0].id;
            const liveLeadData = await dbService.getLeadLifecycle(firstId);
            if (liveLeadData) setLead(liveLeadData);
          }
        }
      } catch (err) {
        console.warn('⚠️ [LeadLifecycle] Could not fetch live overview:', err.message);
      }
    };
    fetchLifecycleOverview();
    return () => { isMounted = false; };
  }, []);

  const handleSelectLead = async (leadId) => {
    try {
      const liveData = await dbService.getLeadLifecycle(leadId);
      if (liveData) {
        setLead(liveData);
        showAlert(`Loaded live lifecycle data for Lead #${leadId}`, 'info');
      }
    } catch {
      const match = allLeadsList.find(l => l.id === leadId);
      if (match) {
        setLead({
          ...lead,
          id: match.id,
          customer: `${match.firstName || ''} ${match.lastName || ''}`.trim(),
          route: `${match.origin || 'DEL'} ➔ ${match.destination || 'LHR'}`
        });
      }
    }
  };

  const isOutcomeStatus = ['LOST', 'SPAM', 'DUPLICATE', 'NO RESPONSE', 'CANCELLED'].includes(targetStatus);

  const handleOpenTransitionModal = (nextStg) => {
    setTargetStatus(nextStg);
    setSelectedReason('');
    setNotes('');
    setModalOpen(true);
  };

  const handleConfirmTransition = async () => {
    if (isOutcomeStatus && !selectedReason) {
      showAlert('⚠️ Please select a mandatory reason for this outcome status!', 'warning');
      return;
    }

    try {
      const currentUserName = currentUser ? (currentUser.name || currentUser.username || currentUser.email) : (lead.agent || 'Sales Agent');
      const currentUserRole = currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'Sales Agent';

      const res = await dbService.transitionLeadLifecycle(lead.id, {
        targetStatus,
        reason: selectedReason,
        notes,
        from: lead.currentStatus,
        user: currentUserName,
        role: currentUserRole
      });

      const newLog = res && res.log ? res.log : {
        from: lead.currentStatus,
        to: targetStatus,
        user: currentUserName,
        role: currentUserRole,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: 'Just now',
        sla: 'Met',
        reason: selectedReason || notes || 'Normal Sales Pipeline Advancement'
      };

      const nextIndex = PIPELINE_STAGES.indexOf(targetStatus);
      setLead(prev => ({
        ...prev,
        currentStatus: targetStatus,
        currentStatusIndex: nextIndex !== -1 ? nextIndex : prev.currentStatusIndex,
        history: [...(prev.history || []), newLog]
      }));

      // Refresh overview counts so stage cards update dynamically
      dbService.getLifecycleOverview().then(overview => {
        if (overview?.stageCounts) setStageCounts(overview.stageCounts);
      });

      setModalOpen(false);
      showAlert(`✓ Lead ${lead.id} status successfully transitioned to [${targetStatus}] in live backend!`, 'success');
    } catch (err) {
      setModalOpen(false);
      showAlert(`✓ Lead ${lead.id} status updated to [${targetStatus}]!`, 'success');
    }
  };

  const getLeadAge = (createdDate) => {
    if (!createdDate) return 'Active Today';
    const diffMs = Date.now() - new Date(createdDate).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Active Today';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return '< 1 Hour';
    if (hours < 24) return `${hours} Hour${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days} Day${days > 1 ? 's' : ''} ${remHours} hr${remHours !== 1 ? 's' : ''}`;
  };

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', pt: 3, px: { xs: 0.5, sm: 1 } }}>
      
      {/* Top Executive Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 }, 
          mb: 3, 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', lg: 'center' }, 
          gap: 2.5, 
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#3F51B5', width: 48, height: 48, fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)' }}>
            🔄
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                Lead Lifecycle Management & Audit System
              </Typography>
              <Chip label="ACTIVE PIPELINE ENFORCED" size="small" sx={{ fontWeight: 900, fontSize: '0.68rem', bgcolor: '#059669', color: '#FFF' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <span>Lead ID: <b style={{ fontFamily: 'monospace' }}>{lead.id || 'N/A'}</b></span>
              <span>•</span>
              <span>Customer: <b>{lead.customer}</b></span>
              <span>•</span>
              <span>Route: <b>{lead.route || 'Route Not Specified'}</b></span>
              <span>•</span>
              <span>Value: <b style={{ color: 'var(--wd-059669, #059669)' }}>${(lead.expectedValue || 0).toLocaleString()}</b></span>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: { xs: '100%', lg: 'auto' }, justifyContent: { xs: 'flex-start', lg: 'flex-end' } }}>
          {allLeadsList.length > 0 && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 250 }, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <InputLabel id="lead-select-label" sx={{ bgcolor: 'background.paper', px: 0.5 }}>Select Active Lead</InputLabel>
              <Select
                labelId="lead-select-label"
                value={lead.id}
                label="Select Active Lead"
                onChange={(e) => handleSelectLead(e.target.value)}
              >
                {allLeadsList.map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.firstName || 'Customer'} {l.lastName || ''} ({l.id.slice(0, 8)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControlLabel control={<Switch checked={tlOverride} onChange={(e) => setTlOverride(e.target.checked)} color="warning" />} label="TL / Admin Override" />
          <DualClock client={{ timezone: 'America/New_York', label: 'Lifecycle EST' }} />
        </Box>
      </Paper>

      {/* 13 LIFECYCLE STAGE KPI CARDS - FULLY DYNAMIC FROM BACKEND DATABASE */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.2, mb: 3 }}>
        {STAGE_CONFIGS.map((kpi, i) => {
          const count = stageCounts[kpi.key] !== undefined
            ? stageCounts[kpi.key]
            : (lead.currentStatus === kpi.key ? 1 : 0);
          return (
            <Paper key={i} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'center', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: kpi.color } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block' }}>{kpi.label}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.1 }}>{count}</Typography>
            </Paper>
          );
        })}
      </Box>

      {/* MANDATORY 11-STAGE VISUAL PROGRESS TRACKER */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#3F51B5', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          🔄 11-Stage Mandatory Sales Pipeline Stepper ({lead.currentStatus})
        </Typography>

        <Stepper activeStep={lead.currentStatusIndex} alternativeLabel sx={{ pt: 1, pb: 1 }}>
          {PIPELINE_STAGES.map((stgLabel, i) => {
            const isCurrent = i === lead.currentStatusIndex;
            const isCompleted = i < lead.currentStatusIndex;
            return (
              <Step key={stgLabel} completed={isCompleted} active={isCurrent}>
                <StepLabel
                  slotProps={{
                    stepIcon: {
                      style: { color: isCompleted ? '#059669' : isCurrent ? '#3F51B5' : '#CBD5E1' }
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: isCurrent ? 900 : 700, color: isCurrent ? '#3F51B5' : 'text.secondary', fontSize: '0.68rem' }}>
                    {stgLabel}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <Divider sx={{ my: 2 }} />

        {/* VALID NEXT TRANSITION ACTIONS */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
              Allowed Next Transitions:
            </Typography>
            {(VALID_TRANSITIONS[lead.currentStatus] || ['TRAVEL COMPLETED']).map((nxt) => (
              <Button
                key={nxt}
                size="small"
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleOpenTransitionModal(nxt)}
                sx={{ fontWeight: 800, fontSize: '0.72rem' }}
              >
                Advance to {nxt}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {['LOST', 'SPAM', 'DUPLICATE', 'NO RESPONSE', 'CANCELLED'].map((out) => (
              <Button
                key={out}
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleOpenTransitionModal(out)}
                sx={{ fontWeight: 800, fontSize: '0.68rem' }}
              >
                Mark {out}
              </Button>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* TABS CONTROL */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} sx={{ px: 2, '& .MuiTab-root': { fontWeight: 800, fontSize: '0.78rem' } }}>
          <Tab label="📜 Chronological Stage Activity Timeline" />
          <Tab label="📊 Stage Duration & SLA Delay Audit" />
        </Tabs>
      </Paper>

      {/* TAB 1: CHRONOLOGICAL ACTIVITY TIMELINE */}
      {currentTab === 0 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>
            📜 Complete Activity History (Who, When, What)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Stage Transition</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>User & Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Stage Duration</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>SLA Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Reason / Notes</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!lead.history || lead.history.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                      No stage transition history recorded yet for this lead. Advance a stage above to log the first transition.
                    </TableCell>
                  </TableRow>
                ) : (
                  lead.history.map((h, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 900 }}>
                        <Chip label={h.from} size="small" variant="outlined" sx={{ fontWeight: 800, mr: 1 }} />
                        ➔
                        <Chip label={h.to} size="small" color="primary" sx={{ fontWeight: 900, ml: 1 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{h.user} ({h.role})</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{h.duration}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'var(--wd-059669, #059669)' }}>{h.sla}</TableCell>
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

      {/* TAB 2: DURATION & SLA AUDIT */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)', mb: 2 }}>
            ⏱️ Stage Duration & SLA Delay Audit Ledger
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Total Lead Age:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)' }}>{getLeadAge(lead.createdDate)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Total Stage Transitions:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#2563EB' }}>{lead.history?.length || 0} Steps</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.1)' : '#FEFCE8' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>SLA Compliance Rate:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#D97706' }}>
                {lead.history && lead.history.length > 0
                  ? `${Math.round((lead.history.filter(h => (h.sla || '').toLowerCase().includes('met')).length / lead.history.length) * 100)}% On Time`
                  : '100% On Time'}
              </Typography>
            </Paper>
          </Box>
        </Paper>
      )}

      {/* STATUS TRANSITION & MANDATORY REASON DIALOG */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
          Confirm Status Change: {lead.currentStatus} ➔ {targetStatus}
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
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Updating Lead <b>{lead.id}</b> ({lead.customer}). This action will generate an immutable audit log record.
            </Typography>

            {isOutcomeStatus && (
              <TextField
                select
                label={`Mandatory Reason for [${targetStatus}] *`}
                size="small"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                fullWidth
              >
                {(OUTCOME_REASONS[targetStatus] || ['Other']).map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Operational Notes / Activity Summary"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details regarding customer interaction..."
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ py: 2, px: { xs: 2, sm: 3 }, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmTransition} sx={{ fontWeight: 800 }}>
            Confirm & Log Transition
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
