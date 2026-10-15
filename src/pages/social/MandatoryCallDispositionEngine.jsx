import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CallMadeIcon from '@mui/icons-material/CallMade';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

import { io } from 'socket.io-client';
import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import useAuth from '../../hooks/useAuth';
import { dbService } from '../../services/dbService';

// ==========================================
// DISPOSITION WORKFLOW RULES DEFINITIONS
// ==========================================
const DISPOSITION_CONFIG = [
  { name: 'Interested', category: 'Positive', color: '#059669', icon: '👍', action: 'Update Lead status to Contacted and create follow-up reminder.' },
  { name: 'Quote Sent', category: 'Positive', color: '#2563EB', icon: '📄', action: 'Update Lead status to Proposal Sent and log quote activity.' },
  { name: 'Payment Pending', category: 'Positive', color: '#059669', icon: '💳', action: 'Update Lead to Payment Pending and activate SLA timer.' },
  { name: 'Booked', category: 'Positive', color: '#16A34A', icon: '✈️', action: 'Convert Lead into Confirmed Booking and alert ticketing desk.' },
  { name: 'Callback Requested', category: 'Follow-up', color: '#D97706', icon: '⏰', action: 'Schedule callback reminder and notify assigned agent.' },
  { name: 'Busy', category: 'Follow-up', color: '#C59B27', icon: '⏳', action: 'Set retry follow-up task after 30 minutes.' },
  { name: 'No Answer', category: 'Follow-up', color: '#9CA3AF', icon: '📵', action: 'Increment call attempt count and reschedule retry.' },
  { name: 'Not Interested', category: 'Negative', color: '#6B7280', icon: '❌', action: 'Move lead to Lost pipeline with required loss reason.' },
  { name: 'Wrong Number', category: 'Negative', color: '#DC2626', icon: '⚠️', action: 'Flag contact for phone verification and data cleanse.' },
  { name: 'Escalated', category: 'Escalation', color: '#7C3AED', icon: '🚨', action: 'Notify Team Leader immediately and open escalation ticket.' },
  { name: 'Complaint', category: 'Escalation', color: '#B91C1C', icon: '👿', action: 'Create priority customer support grievance case.' }
];

export default function MandatoryCallDispositionEngine() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();

  // Core Data
  const [logs, setLogs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentTab, setCurrentTab] = useState(0); // 0 = Live Logs, 1 = Action Matrix

  // Wrap-up Form State
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [disposition, setDisposition] = useState('Interested');
  const [notes, setNotes] = useState('');
  const [callbackDateTime, setCallbackDateTime] = useState('');
  const [bookingValue, setBookingValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Real Dispositions & CRM Leads
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dispRes, leadsRes] = await Promise.all([
        dbService.getCallDispositions().catch(() => null),
        dbService.getLeads().catch(() => [])
      ]);

      if (dispRes && Array.isArray(dispRes.data)) {
        setLogs(dispRes.data);
      }
      if (Array.isArray(leadsRes)) {
        setLeads(leadsRes);
      }
    } catch (err) {
      console.warn('⚠️ [Disposition] Error loading data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle incoming redirect from Calling Desk with prefilled phone/name
  useEffect(() => {
    if (location.state && location.state.openWrapUp) {
      const targetPhone = location.state.customerPhone || '';
      const targetName = location.state.customerName || '';
      setCustomerPhone(targetPhone);
      setCustomerName(targetName);

      // Check if phone matches any known lead
      if (targetPhone && leads.length > 0) {
        const cleanTarget = targetPhone.replace(/\D/g, '');
        const matched = leads.find(l => {
          const lPhone = (l.phone || '').replace(/\D/g, '');
          return lPhone && cleanTarget && (lPhone.includes(cleanTarget.slice(-7)) || cleanTarget.includes(lPhone.slice(-7)));
        });
        if (matched) {
          setSelectedLeadId(matched.id);
          if (!targetName) setCustomerName(matched.name || `${matched.firstName || ''} ${matched.lastName || ''}`.trim());
        }
      }

      setWrapUpOpen(true);
      // Clear location state to prevent reopening on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, leads]);

  // Real-time Socket.io updates for new dispositions
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('telnyx:disposition_created', (newLog) => {
      setLogs((prev) => {
        const exists = prev.some((l) => l.id === newLog.id);
        if (exists) return prev;
        return [newLog, ...prev];
      });
      showAlert(`✓ New disposition logged: ${newLog.disposition} for ${newLog.customer}`, 'info');
    });

    return () => {
      socket.disconnect();
    };
  }, [showAlert]);

  // Handle lead selection in dropdown
  const handleLeadSelect = (leadId) => {
    setSelectedLeadId(leadId);
    if (!leadId) {
      return;
    }
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const fullName = lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Valued Traveler';
      setCustomerName(fullName);
      setCustomerPhone(lead.phone || lead.contactPhone || '');
    }
  };

  // KPI Calculations (100% Dynamic from live logs)
  const metrics = useMemo(() => {
    const total = logs.length;
    const positive = logs.filter(l => ['Interested', 'Quote Sent', 'Booked', 'Payment Pending'].includes(l.disposition)).length;
    const followup = logs.filter(l => ['Callback Requested', 'Busy', 'No Answer'].includes(l.disposition)).length;
    const lost = logs.filter(l => ['Not Interested', 'Wrong Number'].includes(l.disposition)).length;
    const escalation = logs.filter(l => ['Escalated', 'Complaint'].includes(l.disposition)).length;

    const breakdown = {};
    DISPOSITION_CONFIG.forEach(c => {
      breakdown[c.name] = logs.filter(l => (l.disposition || '').toLowerCase() === c.name.toLowerCase()).length;
    });

    return { total, positive, followup, lost, escalation, breakdown };
  }, [logs]);

  // Filtered logs based on search input
  const filteredLogs = useMemo(() => {
    if (!searchFilter.trim()) return logs;
    const q = searchFilter.toLowerCase();
    return logs.filter(l =>
      (l.customer || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.agent || '').toLowerCase().includes(q) ||
      (l.disposition || '').toLowerCase().includes(q) ||
      (l.notes || '').toLowerCase().includes(q) ||
      (l.id || '').toLowerCase().includes(q)
    );
  }, [logs, searchFilter]);

  // Save Disposition to Backend and PostgreSQL
  const handleSaveWrapUp = async () => {
    if (!notes.trim()) {
      showAlert('⚠️ Please enter mandatory call conversation notes!', 'warning');
      return;
    }

    setSaving(true);
    const matchedConfig = DISPOSITION_CONFIG.find(c => c.name === disposition);
    const actionDesc = matchedConfig ? matchedConfig.action : `Updated status to ${disposition}`;
    const currentAgentName = currentUser?.name || 'CRM Agent';
    const targetCustomer = customerName.trim() || 'Inbound Caller';
    const targetPhone = customerPhone.trim() || '+1 (Direct Line)';

    try {
      const res = await dbService.saveCallDisposition({
        customer: targetCustomer,
        phone: targetPhone,
        agent: currentAgentName,
        disposition,
        notes: notes.trim(),
        actionTaken: actionDesc,
        leadId: selectedLeadId || null,
        callbackDateTime: callbackDateTime || null,
        bookingValue: bookingValue ? parseFloat(bookingValue) : null
      });

      const newLog = res && res.log ? res.log : {
        id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
        customer: targetCustomer,
        phone: targetPhone,
        agent: currentAgentName,
        disposition,
        notes: notes.trim(),
        time: 'Just now',
        actionTaken: actionDesc,
        linkedLead: selectedLeadId ? targetCustomer : null
      };

      setLogs(prev => [newLog, ...prev.filter(l => l.id !== newLog.id)]);
      setWrapUpOpen(false);
      setNotes('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedLeadId('');
      setBookingValue('');
      setCallbackDateTime('');
      showAlert(`✓ Disposition [${disposition}] recorded! CRM auto-action: ${actionDesc}`, 'success');
    } catch (err) {
      console.error('Error saving disposition:', err);
      showAlert(`❌ Failed to save disposition: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Disposition Entry
  const handleDeleteLog = async (id) => {
    if (!window.confirm(`Delete disposition log ${id}?`)) return;
    try {
      await dbService.deleteCallDisposition(id);
      setLogs(prev => prev.filter(l => l.id !== id));
      showAlert(`✓ Disposition log ${id} deleted successfully`, 'success');
    } catch (err) {
      console.error('Error deleting disposition:', err);
      showAlert('Failed to delete disposition log', 'error');
    }
  };

  // Direct Redial on Calling Desk
  const handleCallCustomer = (phone) => {
    if (!phone) return;
    navigate('/calling-desk', {
      state: { autoDialNumber: phone }
    });
  };

  return (
    <Box sx={{ pt: { xs: 2, sm: 3 }, pb: 6, minHeight: '100vh', px: { xs: 1.5, sm: 2.5, md: 3 } }}>
      
      {/* ── Top Executive Header ────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#3F51B5',
              width: 48,
              height: 48,
              fontWeight: 900,
              fontSize: '1.2rem',
              boxShadow: '0 4px 14px rgba(63, 81, 181, 0.35)',
            }}
          >
            <NoteAltIcon />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                Call Dispositions & Automated Workflow Engine
              </Typography>
              <Chip
                label="LIVE CRM SYNCED"
                size="small"
                sx={{ fontWeight: 900, fontSize: '0.68rem', bgcolor: '#059669', color: '#FFF' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.3 }}>
              Mandatory post-call outcome logger: Updates CRM Lead lifecycle, starts SLA timers, and tracks sales conversions
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          <Tooltip title="Refresh live disposition logs and CRM leads">
            <IconButton onClick={loadData} color="primary" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NoteAltIcon />}
            onClick={() => {
              setSelectedLeadId('');
              setCustomerName('');
              setCustomerPhone('');
              setNotes('');
              setWrapUpOpen(true);
            }}
            sx={{
              fontWeight: 900,
              px: 2.5,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(63, 81, 181, 0.3)',
            }}
          >
            Log Call Disposition
          </Button>
          <Button
            variant="outlined"
            color="info"
            startIcon={<PhoneInTalkIcon />}
            onClick={() => navigate('/calling-desk')}
            sx={{ fontWeight: 800, borderRadius: 2.5 }}
          >
            Calling Desk
          </Button>
          <DualClock client={{ timezone: 'America/New_York', label: 'Disposition EST' }} />
        </Box>
      </Paper>

      {/* ── 5 Main Summary KPI Cards (100% Dynamic) ────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Dispositions', val: metrics.total, sub: 'All logged calls', color: '#3F51B5' },
          { label: 'Positive Outcomes', val: metrics.positive, sub: 'Interested, Quote, Booked', color: '#059669' },
          { label: 'Follow-ups Required', val: metrics.followup, sub: 'Callback, Busy, No Answer', color: '#D97706' },
          { label: 'Lost / Disqualified', val: metrics.lost, sub: 'Not Interested, Wrong Num', color: '#DC2626' },
          { label: 'Escalations / Complaints', val: metrics.escalation, sub: 'TL & Grievance Alert', color: '#7C3AED' },
        ].map((kpi, idx) => (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: kpi.color,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              {kpi.label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5, mb: 0.2 }}>
              {kpi.val}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
              {kpi.sub}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Disposition Category Breakdown Chips ────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {DISPOSITION_CONFIG.map((c) => (
          <Paper
            key={c.name}
            elevation={0}
            sx={{
              px: 1.8,
              py: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {c.icon} {c.name}:
            </Typography>
            <Chip
              label={metrics.breakdown[c.name] || 0}
              size="small"
              sx={{
                fontWeight: 900,
                height: 20,
                bgcolor: c.color,
                color: '#FFF',
                fontSize: '0.72rem',
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* ── Tabs Navigation ─────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'none',
              minHeight: 52,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📋 Live Disposition Logs & Call Audit Trail</span>
                <Chip label={logs.length} size="small" color="primary" sx={{ fontWeight: 800, height: 20 }} />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>⚡ Automated CRM Action Rules Matrix</span>
                <Chip label={DISPOSITION_CONFIG.length} size="small" sx={{ fontWeight: 800, height: 20 }} />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* ── TAB 0: LIVE DISPOSITION LOGS & CALL AUDIT TRAIL ─────────────── */}
      {currentTab === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {/* Table Header Filter Toolbar */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', bgcolor: 'background.paper' }}>
            <TextField
              size="small"
              placeholder="Search by customer, phone, agent, disposition, notes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: '100%', sm: 380 } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Showing {filteredLogs.length} of {logs.length} records
            </Typography>
          </Box>
          <Divider />

          {loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress size={36} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Loading live disposition audit logs...
              </Typography>
            </Box>
          ) : filteredLogs.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  color: '#64748B',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <NoteAltIcon sx={{ fontSize: '2rem' }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
                {logs.length === 0 ? 'No Call Dispositions Recorded Yet' : 'No Matching Dispositions Found'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, maxWidth: 500, mx: 'auto', mb: 2 }}>
                {logs.length === 0
                  ? 'All wrap-ups submitted from the Calling Desk or via the "Log Call Disposition" button will be saved in real-time.'
                  : 'Try adjusting your search filter keywords.'}
              </Typography>
              {logs.length === 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<NoteAltIcon />}
                  onClick={() => setWrapUpOpen(true)}
                  sx={{ fontWeight: 800 }}
                >
                  Log First Call Disposition
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'background.neutral' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Log ID</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Customer & Phone</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Agent</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Disposition</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Conversation Notes</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Automated CRM Action</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.map((l) => {
                    const cfg = DISPOSITION_CONFIG.find(c => c.name.toLowerCase() === (l.disposition || '').toLowerCase());
                    const dispColor = cfg ? cfg.color : '#3F51B5';
                    const dispIcon = cfg ? cfg.icon : '📝';

                    return (
                      <TableRow key={l.id} hover>
                        <TableCell sx={{ fontWeight: 900, fontFamily: 'monospace', color: 'primary.main' }}>
                          {l.id}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                            {l.customer}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                            {l.phone}
                          </Typography>
                          {l.linkedLead && (
                            <Chip
                              icon={<AssignmentIndIcon sx={{ fontSize: '0.8rem !important' }} />}
                              label="CRM Lead Linked"
                              size="small"
                              sx={{ ml: 1, height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {l.agent}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${dispIcon} ${l.disposition}`}
                            size="small"
                            sx={{
                              fontWeight: 900,
                              bgcolor: dispColor,
                              color: '#FFF',
                              fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', mb: 0.3 }}>
                            {l.notes}
                          </Typography>
                          {l.bookingValue && (
                            <Chip
                              label={`💰 Deal Value: $${Number(l.bookingValue).toLocaleString()}`}
                              size="small"
                              sx={{ mr: 0.8, mt: 0.4, height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#166534' }}
                            />
                          )}
                          {l.callbackDateTime && (
                            <Chip
                              label={`⏰ Callback: ${new Date(l.callbackDateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                              size="small"
                              sx={{ mt: 0.4, height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#059669', maxWidth: 220 }}>
                          {l.actionTaken || 'CRM Status Updated'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          {l.time}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {l.phone && (
                              <Tooltip title="Dial number on Calling Desk">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleCallCustomer(l.phone)}
                                >
                                  <PhoneInTalkIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete this disposition log">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteLog(l.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ── TAB 1: AUTOMATED CRM ACTION RULES MATRIX ────────────────────── */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
              Standard Operating Procedure (SOP): CRM Automation Rules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              When an agent selects any disposition below, the system automatically transitions the CRM lead, triggers follow-ups, and logs audit events in PostgreSQL.
            </Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Disposition Option</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Automatic CRM Action Triggered</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Current Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DISPOSITION_CONFIG.map((c) => (
                  <TableRow key={c.name} hover>
                    <TableCell sx={{ fontWeight: 900 }}>
                      <Chip label={`${c.icon} ${c.name}`} size="small" sx={{ fontWeight: 900, bgcolor: c.color, color: '#FFF' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{c.category}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{c.action}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                      {metrics.breakdown[c.name] || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── POST-CALL WRAP-UP & DISPOSITION DIALOG ──────────────────────── */}
      <Dialog open={wrapUpOpen} onClose={() => setWrapUpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: '#3F51B5', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NoteAltIcon />
          <span>Post-Call Wrap-Up & Disposition Form</span>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2.5, fontWeight: 700 }}>
            Mandatory post-call wrap-up: Select or enter customer details and log conversation notes. This triggers real-time CRM lifecycle progression.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Select CRM Lead (Auto-fill) */}
            <TextField
              select
              label="Select Existing CRM Lead (Optional Auto-fill)"
              size="small"
              value={selectedLeadId}
              onChange={(e) => handleLeadSelect(e.target.value)}
              helperText="Selecting a lead will auto-fill customer name & phone and update their CRM stage."
              fullWidth
            >
              <MenuItem value="">
                <em>-- Direct Caller / Not a CRM Lead --</em>
              </MenuItem>
              {leads.map((l) => {
                const leadName = l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Traveler';
                const dest = l.destination || l.flightInfo?.destination || '';
                return (
                  <MenuItem key={l.id} value={l.id}>
                    👤 {leadName} {l.phone ? `(${l.phone})` : ''} • {l.status} {dest ? `[${dest}]` : ''}
                  </MenuItem>
                );
              })}
            </TextField>

            {/* Customer Details */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Customer Name *"
                size="small"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Smith"
                fullWidth
                required
              />
              <TextField
                label="Customer Phone *"
                size="small"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                fullWidth
                required
              />
            </Box>

            {/* Disposition Dropdown */}
            <TextField
              select
              label="Call Disposition Outcome *"
              size="small"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              fullWidth
            >
              {DISPOSITION_CONFIG.map((c) => (
                <MenuItem key={c.name} value={c.name}>
                  {c.icon} {c.name} ({c.category})
                </MenuItem>
              ))}
            </TextField>

            {/* Conversation Notes */}
            <TextField
              label="Mandatory Call Conversation Notes *"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Required: Summarize conversation requirements, flight preferences, or objection handling..."
              fullWidth
              required
            />

            {/* Conditional callback date/time */}
            {disposition === 'Callback Requested' && (
              <TextField
                type="datetime-local"
                label="Required Callback Date & Time *"
                size="small"
                value={callbackDateTime}
                onChange={(e) => setCallbackDateTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            )}

            {/* Estimated Booking Value */}
            <TextField
              label="Estimated Deal / Booking Value ($)"
              size="small"
              type="number"
              value={bookingValue}
              onChange={(e) => setBookingValue(e.target.value)}
              placeholder="e.g. 1450"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWrapUpOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveWrapUp}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {saving ? 'Recording...' : 'Confirm Wrap-Up & Trigger Workflows'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
