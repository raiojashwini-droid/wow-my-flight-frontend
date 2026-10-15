import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import BackspaceIcon from '@mui/icons-material/Backspace';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import HeadsetIcon from '@mui/icons-material/Headset';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NoteAltIcon from '@mui/icons-material/NoteAlt';

import { io } from 'socket.io-client';
import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import useAuth from '../../hooks/useAuth';
import { useTelnyx } from '../../contexts/TelnyxContext';
import {
  fetchCallHistory,
  toE164,
  formatCallDuration,
  formatPhoneDisplay,
} from '../../services/telnyxService';

const DELETED_CALL_IDS_KEY = 'crm_deleted_call_ids';
const TIMELINE_STORAGE_KEY = 'crm_communication_timeline';
const LAST_DIALED_KEY = 'crm_last_dialed_call';

const getDeletedCallIds = () => {
  try {
    const saved = localStorage.getItem(DELETED_CALL_IDS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

export default function CallingSoftphoneWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();
  const {
    makeCall,
    hangup: webrtcHangup,
    sdkStatus,
    initializeSdk,
    callState,
    callSeconds: webrtcCallSeconds,
    isMuted,
    isOnHold,
    toggleMute,
    toggleHold,
    sendDTMF,
    incomingCall,
    answerCall,
    rejectCall,
    phoneNumbers: telnyxPhoneNumbers,
    selectedFromNumber: telnyxSelectedFromNumber,
    setSelectedFromNumber: setTelnyxSelectedFromNumber,
  } = useTelnyx();

  const [currentTab, setCurrentTab] = useState(0);
  const [agentPresence, setAgentPresence] = useState('AVAILABLE');
  const [searchFilter, setSearchFilter] = useState('');

  // Softphone State
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedFromNumber, setSelectedFromNumber] = useState('');
  const [dialNumber, setDialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const activeCallIdRef = useRef(null);

  // Handle incoming number from Customer 360, Leads, or Dispositions
  useEffect(() => {
    const incomingNumber = location.state?.autoDialNumber || location.state?.customerPhone || location.state?.targetNumber;
    if (incomingNumber) {
      setDialNumber(incomingNumber);
      const callerName = location.state.customerName ? `for ${location.state.customerName}` : '';
      showAlert(`📞 Number ${incomingNumber} loaded ${callerName}. Click 'Start WebRTC Call' to connect!`, 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showAlert]);

  // Real Data Store
  const [callHistory, setCallHistory] = useState([]);

  // Audio Player State
  const [playingRecordingId, setPlayingRecordingId] = useState(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Delete State
  const [callToDelete, setCallToDelete] = useState(null);

  // Sync phone numbers from Telnyx context
  useEffect(() => {
    if (telnyxPhoneNumbers && telnyxPhoneNumbers.length > 0) {
      setPhoneNumbers(telnyxPhoneNumbers);
      if (!selectedFromNumber) {
        setSelectedFromNumber(telnyxSelectedFromNumber || telnyxPhoneNumbers[0].number);
      }
    }
  }, [telnyxPhoneNumbers, telnyxSelectedFromNumber, selectedFromNumber]);

  // Load Real Call History
  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const deletedIds = getDeletedCallIds();

      // 1. Fetch from server API
      const serverCalls = await fetchCallHistory().catch(() => []);

      // 2. Fetch local call timeline items
      let localCalls = [];
      try {
        const savedTimeline = localStorage.getItem(TIMELINE_STORAGE_KEY);
        if (savedTimeline) {
          const items = JSON.parse(savedTimeline);
          localCalls = items
            .filter((item) => item.channel === 'Call')
            .map((item) => ({
              id: item.id,
              callControlId: item.callControlId || item.id,
              direction: item.direction || 'outbound',
              fromNumber: item.from || '+18333955554',
              toNumber: item.to || item.customerPhone,
              customerName: item.customer,
              agentName: item.agent || 'CRM Agent',
              startedAt: item.timestamp,
              durationSeconds: item.durationSeconds || 0,
              status: item.status?.toLowerCase() || 'completed',
              recordingUrl: item.recordingUrl || null,
            }));
        }
      } catch (e) {
        console.warn('Error reading local calls:', e);
      }

      // Merge and deduplicate by callControlId or id
      const combined = [...(Array.isArray(serverCalls) ? serverCalls : []), ...localCalls];
      const seen = new Set();
      const uniqueCalls = [];

      for (const call of combined) {
        const key = String(call.callControlId || call.id);
        if (!seen.has(key) && !deletedIds.has(key)) {
          seen.add(key);
          uniqueCalls.push(call);
        }
      }

      // Sort newest first
      uniqueCalls.sort((a, b) => new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0));
      setCallHistory(uniqueCalls);
    } catch (err) {
      console.warn('[CallingDesk] Error loading call history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  // Real-Time Socket.io Listeners
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('telnyx:call_answered', () => {
      showAlert('🟢 Call connected and active with customer', 'success');
      loadCalls();
    });

    socket.on('telnyx:call_ended', () => {
      showAlert('🔴 Call ended (Remote party disconnected)', 'info');
      loadCalls();
    });

    return () => {
      socket.disconnect();
    };
  }, [showAlert, loadCalls]);

  // Last Called Number & Information
  const lastCall = useMemo(() => {
    if (callHistory.length > 0) return callHistory[0];
    try {
      const saved = localStorage.getItem(LAST_DIALED_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [callHistory]);

  // Unique Recently Dialed Numbers (from actual calls, not dummy mock contacts)
  const recentNumbers = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const c of callHistory) {
      const num = c.toNumber || c.fromNumber;
      if (num && !seen.has(num)) {
        seen.add(num);
        list.push({
          number: num,
          formatted: formatPhoneDisplay(num),
          direction: c.direction || 'outbound',
          timestamp: c.startedAt || c.createdAt || c.timestamp,
          duration: c.durationSeconds || 0,
        });
      }
    }
    return list;
  }, [callHistory]);

  // KPI Calculations from REAL call logs
  const metrics = useMemo(() => {
    const total = callHistory.length;
    let inbound = 0;
    let outbound = 0;
    let missed = 0;
    let answered = 0;
    let totalDuration = 0;

    callHistory.forEach((c) => {
      const dir = (c.direction || '').toLowerCase();
      if (dir === 'inbound') inbound++;
      else outbound++;

      const isMissed =
        c.status === 'missed' ||
        c.status === 'no_answer' ||
        (dir === 'inbound' && !c.durationSeconds);
      if (isMissed) {
        missed++;
      } else {
        answered++;
        totalDuration += Number(c.durationSeconds) || 0;
      }
    });

    const avgSeconds = answered > 0 ? Math.round(totalDuration / answered) : 0;
    const answerRate = total > 0 ? `${Math.round((answered / total) * 100)}%` : '0%';

    return {
      total,
      inbound,
      outbound,
      missed,
      avgDuration: formatCallDuration(avgSeconds),
      answerRate,
    };
  }, [callHistory]);

  // Filtered Calls for History Tab
  const filteredCalls = useMemo(() => {
    if (!searchFilter.trim()) return callHistory;
    const q = searchFilter.toLowerCase();
    return callHistory.filter((c) => {
      const phone = c.toNumber || c.fromNumber || '';
      const name = c.customerName || '';
      const agent = c.agentName || '';
      return (
        name.toLowerCase().includes(q) ||
        phone.includes(q) ||
        agent.toLowerCase().includes(q)
      );
    });
  }, [callHistory, searchFilter]);

  // Real Missed Calls Queue
  const missedCallsQueue = useMemo(() => {
    return callHistory.filter((c) => {
      const dir = (c.direction || '').toLowerCase();
      return (
        c.status === 'missed' ||
        c.status === 'no_answer' ||
        (dir === 'inbound' && (!c.durationSeconds || c.durationSeconds === 0))
      );
    });
  }, [callHistory]);

  // Softphone Actions
  const handleDialDigit = (digit) => {
    if (callState === 'ON_CALL') {
      sendDTMF(digit);
    }
    setDialNumber((prev) => (prev || '') + digit);
  };

  const handleBackspace = () => {
    setDialNumber((prev) => (prev ? prev.slice(0, -1) : ''));
  };

  const handleStartCall = async (overrideNumber = null) => {
    const target = overrideNumber || dialNumber;
    if (!target) {
      showAlert('Please enter or select a valid phone number', 'warning');
      return;
    }
    const cleanNumber = toE164(target) || target;
    setDialNumber(cleanNumber);

    if (sdkStatus !== 'registered') {
      try {
        showAlert('⏳ Connecting WebRTC audio client...', 'info');
        await initializeSdk();
      } catch (sdkErr) {
        console.warn('WebRTC init attempt:', sdkErr);
      }
    }

    try {
      showAlert(`📞 Dialing ${cleanNumber}... Waiting for answer`, 'info');
      await makeCall({ toNumber: cleanNumber });

      // Save to last dialed storage immediately
      const lastEntry = {
        toNumber: cleanNumber,
        fromNumber: selectedFromNumber || '+18333955554',
        startedAt: new Date().toISOString(),
        direction: 'outbound',
        status: 'Initiated',
        durationSeconds: 0,
      };
      localStorage.setItem(LAST_DIALED_KEY, JSON.stringify(lastEntry));

      // Save call to local timeline store for immediate tracking
      const callId = `call_${Date.now()}`;
      activeCallIdRef.current = callId;
      const newCallEntry = {
        id: callId,
        channel: 'Call',
        direction: 'outbound',
        customer: 'Outbound Customer',
        customerPhone: cleanNumber,
        to: cleanNumber,
        from: selectedFromNumber || '+18333955554',
        agent: currentUser?.name || 'CRM Agent',
        timestamp: new Date().toISOString(),
        durationSeconds: 0,
        status: 'Initiated',
      };

      try {
        const savedTimeline = localStorage.getItem(TIMELINE_STORAGE_KEY);
        const list = savedTimeline ? JSON.parse(savedTimeline) : [];
        list.unshift(newCallEntry);
        localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.warn('Could not store call entry:', err);
      }

      loadCalls();
    } catch (err) {
      console.error('[CallingWorkspace] WebRTC call error:', err.message);
      showAlert(`⚠️ Call could not be placed: ${err.message}`, 'error');
    }
  };

  const handleEndCall = () => {
    const finalSeconds = Math.max(1, webrtcCallSeconds || 0);
    const targetCallId = activeCallIdRef.current;

    try {
      // 1. Update the local timeline storage entry with real talk duration
      const savedTimeline = localStorage.getItem(TIMELINE_STORAGE_KEY);
      if (savedTimeline) {
        const list = JSON.parse(savedTimeline);
        const updatedList = list.map((item) => {
          if (item.id === targetCallId || (!targetCallId && item.to === dialNumber && (!item.durationSeconds || item.durationSeconds === 0))) {
            return {
              ...item,
              durationSeconds: finalSeconds,
              status: 'completed',
            };
          }
          return item;
        });
        localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(updatedList));
      }

      // 2. Update the LAST_DIALED_KEY entry
      const savedLast = localStorage.getItem(LAST_DIALED_KEY);
      if (savedLast) {
        try {
          const parsedLast = JSON.parse(savedLast);
          localStorage.setItem(
            LAST_DIALED_KEY,
            JSON.stringify({
              ...parsedLast,
              durationSeconds: finalSeconds,
              status: 'completed',
            })
          );
        } catch (e) {}
      }

      webrtcHangup();
    } catch (e) {
      console.warn('Hangup action error:', e.message);
    }
    showAlert(`🔴 Call ended (${formatCallDuration(finalSeconds)} talk duration logged)`, 'info');
    activeCallIdRef.current = null;
    loadCalls();
  };

  // Delete a single call record
  const confirmDeleteCall = (call) => {
    setCallToDelete(call);
  };

  const executeDeleteCall = () => {
    if (!callToDelete) return;
    const targetId = String(callToDelete.callControlId || callToDelete.id);

    try {
      const deletedIds = getDeletedCallIds();
      deletedIds.add(targetId);
      localStorage.setItem(DELETED_CALL_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

      // Also remove from local timeline storage if present
      const savedTimeline = localStorage.getItem(TIMELINE_STORAGE_KEY);
      if (savedTimeline) {
        const list = JSON.parse(savedTimeline);
        const filtered = list.filter(
          (item) => String(item.callControlId || item.id) !== targetId
        );
        localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(filtered));
      }

      showAlert('Call record deleted successfully', 'success');
      setCallToDelete(null);
      loadCalls();
    } catch (err) {
      console.error('Delete call error:', err);
      showAlert('Failed to delete call record', 'error');
    }
  };

  const isCallActive = callState !== 'IDLE' && callState !== 'ENDED';

  return (
    <Box sx={{ width: '100%', pt: { xs: 2.5, sm: 3.5 }, pb: 6, minHeight: '100vh', px: { xs: 1.5, sm: 2.5, md: 3 } }}>

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
              bgcolor: '#1E293B',
              color: '#38BDF8',
              width: 50,
              height: 50,
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
            }}
          >
            <HeadsetIcon sx={{ fontSize: '1.6rem' }} />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: 'text.primary',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '-0.3px',
                }}
              >
                Calling & Softphone Workspace
              </Typography>
              {sdkStatus === 'registered' ? (
                <Chip
                  icon={<CheckCircleIcon sx={{ color: '#FFF !important', fontSize: '0.85rem' }} />}
                  label="WEBRTC ONLINE (TWO-WAY AUDIO READY)"
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.68rem',
                    bgcolor: '#059669',
                    color: '#FFF',
                    letterSpacing: '0.3px',
                  }}
                />
              ) : sdkStatus === 'loading' ? (
                <Chip
                  label="WEBRTC CONNECTING..."
                  size="small"
                  sx={{ fontWeight: 900, fontSize: '0.68rem', bgcolor: '#D97706', color: '#FFF' }}
                />
              ) : (
                <Chip
                  label="WEBRTC OFFLINE (CLICK TO RECONNECT)"
                  size="small"
                  onClick={() => initializeSdk()}
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.68rem',
                    bgcolor: '#DC2626',
                    color: '#FFF',
                    cursor: 'pointer',
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.3 }}>
              Make & receive verified Telnyx voice calls, live audio controls, and real-time history
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Agent Presence Selector */}
          <TextField
            select
            size="small"
            label="Agent Status"
            value={agentPresence}
            onChange={(e) => setAgentPresence(e.target.value)}
            sx={{ minWidth: 145 }}
          >
            <MenuItem value="AVAILABLE">🟢 Available</MenuItem>
            <MenuItem value="BUSY">🟡 Busy</MenuItem>
            <MenuItem value="ON CALL">🔵 On Call</MenuItem>
            <MenuItem value="BREAK">🟠 On Break</MenuItem>
            <MenuItem value="OFFLINE">🔴 Offline</MenuItem>
          </TextField>

          {/* Refresh Calls Button */}
          <Tooltip title="Refresh Call Logs & Data">
            <span>
              <Button
                variant="outlined"
                size="small"
                onClick={loadCalls}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                sx={{ fontWeight: 800, textTransform: 'none', height: 40 }}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>

          <DualClock client={{ timezone: 'America/New_York', label: 'Telecom EST' }} />
        </Box>
      </Paper>

      {/* ── 5 Sleek Real-Time KPI Cards (100% Real Data) ────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Calls Logged', val: metrics.total, sub: 'Real Telnyx + CRM', color: '#3F51B5' },
          { label: 'Inbound Calls', val: metrics.inbound, sub: 'Received Calls', color: '#059669' },
          { label: 'Outbound Calls', val: metrics.outbound, sub: 'Placed by Agents', color: '#0284C7' },
          { label: 'Missed / Unanswered', val: metrics.missed, sub: 'Requires Callback', color: '#DC2626' },
          { label: 'Avg Talk Duration', val: metrics.avgDuration, sub: `Answer Rate: ${metrics.answerRate}`, color: '#7C3AED' },
        ].map((kpi, idx) => (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
              },
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem', display: 'block' }}
            >
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

      {/* ── Main Workspace Grid: Dialer (Left) + Tabs Workspace (Right) ─── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '350px 1fr' }, gap: 3 }}>

        {/* ── Left Column: Softphone Dialer ───────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#0B132B',
            color: '#FFFFFF',
            boxShadow: '0 8px 30px rgba(11, 19, 43, 0.4)',
          }}
        >
          {/* Outgoing Caller ID Line Selector */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#94A3B8',
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                display: 'block',
                mb: 0.5,
                letterSpacing: '0.5px',
              }}
            >
              Outgoing Caller ID Line
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedFromNumber || (phoneNumbers[0]?.number || '+18333955554')}
              onChange={(e) => {
                setSelectedFromNumber(e.target.value);
                setTelnyxSelectedFromNumber(e.target.value);
              }}
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: '#1C2541 !important',
                  color: '#38BDF8 !important',
                  borderRadius: 2,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                },
                '& .MuiSvgIcon-root': { color: '#38BDF8' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3A506B !important' },
              }}
            >
              {phoneNumbers.length > 0 ? (
                phoneNumbers.map((p) => (
                  <MenuItem key={p.id || p.number} value={p.number} sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    📞 {p.number} {p.type ? `(${p.type.replace('_', ' ').toUpperCase()})` : ''}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="+18333955554" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  📞 +18333955554 (TOLL FREE)
                </MenuItem>
              )}
            </TextField>
          </Box>

          {/* ── LAST CALLED NUMBER CARD (Jisko Last Call Kiya) ──────────── */}
          {lastCall && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2.5,
                bgcolor: '#1C2541',
                border: '1px solid #38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box sx={{ overflow: 'hidden' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#38BDF8',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.2,
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: '0.75rem' }} />
                  <span>Last Called Number</span>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                  }}
                >
                  {formatPhoneDisplay(lastCall.toNumber || lastCall.fromNumber)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', display: 'block' }}>
                  {lastCall.startedAt
                    ? new Date(lastCall.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Recently'}{' '}
                  • {formatCallDuration(lastCall.durationSeconds || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="info"
                  startIcon={<PhoneInTalkIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={() => {
                    const targetNum = lastCall.toNumber || lastCall.fromNumber;
                    setDialNumber(targetNum);
                    handleStartCall(targetNum);
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    textTransform: 'none',
                    bgcolor: '#0284C7',
                    '&:hover': { bgcolor: '#0369A1' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Redial
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<NoteAltIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={() => {
                    const targetNum = lastCall.toNumber || lastCall.fromNumber;
                    navigate('/call-dispositions', {
                      state: {
                        customerPhone: targetNum,
                        customerName: lastCall.customerName || '',
                        openWrapUp: true,
                      },
                    });
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    textTransform: 'none',
                    bgcolor: '#F59E0B',
                    color: '#000',
                    '&:hover': { bgcolor: '#D97706', color: '#FFF' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Disposition
                </Button>
              </Box>
            </Paper>
          )}

          {/* Quick Recent Numbers Chips (from real dialed history) */}
          {recentNumbers.length > 1 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#94A3B8',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  display: 'block',
                  mb: 0.8,
                  letterSpacing: '0.4px',
                }}
              >
                Recent Numbers
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {recentNumbers.slice(0, 3).map((rec, idx) => (
                  <Chip
                    key={idx}
                    label={`📞 ${formatPhoneDisplay(rec.number)}`}
                    size="small"
                    onClick={() => setDialNumber(rec.number)}
                    sx={{
                      bgcolor: '#1C2541',
                      color: '#38BDF8',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      border: '1px solid #3A506B',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#25355B', borderColor: '#38BDF8' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Phone Number Display / Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Enter Phone Number..."
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStartCall();
            }}
            slotProps={{
              input: {
                endAdornment: dialNumber ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleBackspace}
                      sx={{ color: '#94A3B8', '&:hover': { color: '#F8FAFC' } }}
                    >
                      <BackspaceIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              mb: 2,
              '& .MuiInputBase-root': {
                bgcolor: '#1C2541 !important',
                borderRadius: 2,
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF !important',
                WebkitTextFillColor: '#FFFFFF !important',
                fontWeight: 900,
                fontSize: '1.25rem',
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: '1.5px',
                py: 1.4,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3A506B !important',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#38BDF8 !important',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#38BDF8 !important',
              },
            }}
          />

          {/* Tactile Keypad Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.2, mb: 2.5 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <Button
                key={digit}
                variant="outlined"
                onClick={() => handleDialDigit(digit)}
                sx={{
                  py: 1.4,
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  color: '#F8FAFC',
                  borderColor: '#3A506B',
                  borderRadius: 2,
                  bgcolor: '#1C2541',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#25355B',
                    borderColor: '#38BDF8',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    bgcolor: '#38BDF8',
                    color: '#0B132B',
                  },
                }}
              >
                {digit}
              </Button>
            ))}
          </Box>

          {/* Call Controls: Active Call vs Idle */}
          {isCallActive ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: '#1C2541',
                  borderColor: callState === 'ON_CALL' ? '#22C55E' : '#FACC15',
                  textAlign: 'center',
                  boxShadow: callState === 'ON_CALL' ? '0 0 20px rgba(34, 197, 94, 0.25)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {callState === 'ON_CALL' ? (
                  <Chip
                    icon={<CheckCircleIcon sx={{ color: '#FFF !important' }} />}
                    label="🟢 CONNECTED (AUDIO LIVE)"
                    size="small"
                    sx={{ bgcolor: '#22C55E', color: '#FFF', fontWeight: 900, mb: 1, fontSize: '0.72rem' }}
                  />
                ) : (
                  <Chip
                    icon={<PhoneForwardedIcon sx={{ color: 'var(--wd-000000, #000000) !important' }} />}
                    label="🔔 DIALING... (Waiting for answer)"
                    size="small"
                    sx={{ bgcolor: '#FACC15', color: '#000', fontWeight: 900, mb: 1, fontSize: '0.72rem' }}
                  />
                )}
                <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 800, display: 'block' }}>
                  🎙️ TWO-WAY WEBRTC AUDIO STREAM
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: callState === 'ON_CALL' ? '#22C55E' : '#FACC15',
                    my: 0.5,
                    fontFamily: 'monospace',
                  }}
                >
                  {formatCallDuration(webrtcCallSeconds)}
                </Typography>

                {/* In-Call Actions: Mute / Hold */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant={isMuted ? 'contained' : 'outlined'}
                    color={isMuted ? 'error' : 'inherit'}
                    size="small"
                    fullWidth
                    startIcon={isMuted ? <MicOffIcon /> : <MicIcon />}
                    onClick={toggleMute}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      borderColor: '#3A506B',
                      color: isMuted ? '#FFF' : '#38BDF8',
                    }}
                  >
                    {isMuted ? 'Unmute Mic' : 'Mute Mic'}
                  </Button>
                  <Button
                    variant={isOnHold ? 'contained' : 'outlined'}
                    color={isOnHold ? 'warning' : 'inherit'}
                    size="small"
                    fullWidth
                    startIcon={<PauseIcon />}
                    onClick={toggleHold}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      borderColor: '#3A506B',
                      color: isOnHold ? '#FFF' : '#FBBF24',
                    }}
                  >
                    {isOnHold ? 'Resume' : 'Hold'}
                  </Button>
                </Box>
              </Paper>

              <Button
                variant="contained"
                color="error"
                fullWidth
                size="large"
                startIcon={<CallEndIcon />}
                onClick={handleEndCall}
                sx={{
                  fontWeight: 900,
                  py: 1.4,
                  fontSize: '1rem',
                  borderRadius: 2.5,
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                }}
              >
                End Call
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              startIcon={<PhoneInTalkIcon />}
              onClick={() => handleStartCall()}
              sx={{
                fontWeight: 900,
                py: 1.4,
                fontSize: '1rem',
                borderRadius: 2.5,
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              Start WebRTC Call
            </Button>
          )}
        </Paper>

        {/* ── Right Column: Workspace Tabs & Real-Time Data ────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Navigation Tabs Bar */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
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
                    <span>🎙️ Call History & Recordings</span>
                    <Chip label={callHistory.length} size="small" sx={{ fontWeight: 800, height: 20 }} />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>📵 Missed & Follow-ups</span>
                    {missedCallsQueue.length > 0 && (
                      <Chip
                        label={missedCallsQueue.length}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 800, height: 20 }}
                      />
                    )}
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>🕒 Recent Dialed Numbers & Logs</span>
                    <Chip
                      label={recentNumbers.length}
                      size="small"
                      sx={{ fontWeight: 800, height: 20 }}
                    />
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          {/* ── TAB 0: CALL RECORDINGS & REAL HISTORY ──────────────────── */}
          {currentTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Search Bar */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search by phone number, customer name, or agent..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2.5,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                }}
              />

              {loading ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                  }}
                >
                  <CircularProgress size={36} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Loading verified call records...
                  </Typography>
                </Paper>
              ) : filteredCalls.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                      color: '#64748B',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: '2rem' }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
                    No Call Records Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, maxWidth: 450, mx: 'auto' }}>
                    Calls placed or received via the dialer will automatically be logged here with phone number, duration, and audio playback.
                  </Typography>
                </Paper>
              ) : (
                filteredCalls.map((rec) => {
                  const targetNumber = rec.toNumber || rec.fromNumber || '';
                  const displayName = rec.customerName || formatPhoneDisplay(targetNumber) || 'Direct Dial Contact';
                  const isOutbound = (rec.direction || '').toLowerCase() === 'outbound';
                  const durationFormatted = formatCallDuration(rec.durationSeconds || 0);
                  const isCurrentPlaying = playingRecordingId === rec.id;

                  return (
                    <Paper
                      key={rec.id || rec.callControlId}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.05)' },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                          <Avatar
                            sx={{
                              bgcolor: isOutbound ? '#EFF6FF' : '#F0FDF4',
                              color: isOutbound ? '#2563EB' : '#16A34A',
                              width: 44,
                              height: 44,
                            }}
                          >
                            {isOutbound ? <PhoneForwardedIcon /> : <PhoneCallbackIcon />}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                                {formatPhoneDisplay(targetNumber)}
                              </Typography>
                              <Chip
                                label={isOutbound ? 'Outbound' : 'Inbound'}
                                size="small"
                                color={isOutbound ? 'primary' : 'success'}
                                sx={{ fontWeight: 800, height: 20, fontSize: '0.68rem' }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              Rep: <b>{rec.agentName || 'Agent'}</b> •{' '}
                              Time:{' '}
                              <b>
                                {rec.startedAt
                                  ? new Date(rec.startedAt).toLocaleString()
                                  : 'Recently'}
                              </b>
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`Duration: ${durationFormatted}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800, fontFamily: 'monospace' }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<PhoneInTalkIcon />}
                            onClick={() => {
                              setDialNumber(targetNumber);
                              handleStartCall(targetNumber);
                            }}
                            sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                          >
                            Redial
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<NoteAltIcon />}
                            onClick={() => {
                              navigate('/call-dispositions', {
                                state: {
                                  customerPhone: targetNumber,
                                  customerName: rec.customerName || '',
                                  openWrapUp: true,
                                },
                              });
                            }}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              textTransform: 'none',
                              bgcolor: '#F59E0B',
                              color: '#000',
                              '&:hover': { bgcolor: '#D97706', color: '#FFF' },
                            }}
                          >
                            Disposition
                          </Button>
                          <Tooltip title="Delete this call record">
                            <IconButton
                              size="small"
                              onClick={() => confirmDeleteCall(rec)}
                              sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Built-in Audio Recording Player */}
                      {rec.recordingUrl ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            mt: 2,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'background.neutral',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setPlayingRecordingId(isCurrentPlaying ? null : rec.id);
                            }}
                          >
                            {isCurrentPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                          </IconButton>
                          <Slider
                            size="small"
                            value={isCurrentPlaying ? audioPlaybackProgress : 0}
                            onChange={(e, val) => setAudioPlaybackProgress(val)}
                            sx={{ flexGrow: 1, color: '#3F51B5' }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                            {durationFormatted}
                          </Typography>
                          <Tooltip title="Download Audio File">
                            <IconButton
                              size="small"
                              color="primary"
                              component="a"
                              href={rec.recordingUrl}
                              target="_blank"
                              download
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ) : (
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label="Live Call Session Logged"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary' }}
                          />
                        </Box>
                      )}
                    </Paper>
                  );
                })
              )}
            </Box>
          )}

          {/* ── TAB 1: MISSED & FOLLOW-UP QUEUE ────────────────────────── */}
          {currentTab === 1 && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'background.paper',
              }}
            >
              {missedCallsQueue.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4',
                      color: '#16A34A',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: '2rem' }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
                    All Caught Up!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    There are currently no unanswered missed calls or pending callbacks in the queue.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'background.neutral' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Phone Number</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Time Missed</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {missedCallsQueue.map((m) => {
                        const targetNumber = m.toNumber || m.fromNumber;

                        return (
                          <TableRow key={m.id || m.callControlId} hover>
                            <TableCell sx={{ fontWeight: 900 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'var(--wl-FEE2E2, #FEE2E2)', color: '#DC2626' }}>
                                  <PhoneMissedIcon sx={{ fontSize: '1rem' }} />
                                </Avatar>
                                {formatPhoneDisplay(targetNumber)}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {m.startedAt ? new Date(m.startedAt).toLocaleString() : 'Recent'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label="Callback Pending"
                                size="small"
                                color="error"
                                sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<PhoneInTalkIcon />}
                                onClick={() => {
                                  setDialNumber(targetNumber);
                                  handleStartCall(targetNumber);
                                }}
                                sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                              >
                                Call Back
                              </Button>
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

          {/* ── TAB 2: RECENT DIALED NUMBERS & LOGS ─────────────────────── */}
          {currentTab === 2 && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5, color: 'text.primary' }}>
                Recent Dialed Numbers & Call Activity ({recentNumbers.length} Unique Numbers)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {recentNumbers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontWeight: 600 }}>
                    No call logs yet. Dial any number on the softphone keypad to start placing calls.
                  </Typography>
                ) : (
                  recentNumbers.map((rec, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 1.8,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        '&:hover': { bgcolor: 'background.neutral' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF', color: '#2563EB', width: 40, height: 40 }}>
                          <PhoneInTalkIcon sx={{ fontSize: '1.2rem' }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace' }}>
                            {formatPhoneDisplay(rec.number)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Last active: {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : 'Recently'} • Duration: {formatCallDuration(rec.duration)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<PhoneInTalkIcon />}
                          onClick={() => {
                            setDialNumber(rec.number);
                            handleStartCall(rec.number);
                          }}
                          sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                        >
                          Redial Now
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={<NoteAltIcon />}
                          onClick={() => {
                            navigate('/call-dispositions', {
                              state: {
                                customerPhone: rec.number,
                                customerName: '',
                                openWrapUp: true,
                              },
                            });
                          }}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            textTransform: 'none',
                            bgcolor: '#F59E0B',
                            color: '#000',
                            '&:hover': { bgcolor: '#D97706', color: '#FFF' },
                          }}
                        >
                          Disposition
                        </Button>
                      </Box>
                    </Paper>
                  ))
                )}
              </Box>
            </Paper>
          )}

        </Box>
      </Box>

      {/* ── Modal: Real Incoming Call Notification ───────────────────── */}
      <Dialog open={Boolean(incomingCall)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: 'var(--wd-16A34A, #16A34A)', textAlign: 'center', pt: 3 }}>
          📞 Incoming WebRTC Call
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
            {incomingCall ? formatPhoneDisplay(incomingCall.from || incomingCall.caller_id) : 'Unknown Caller'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<CallEndIcon />}
            onClick={() => rejectCall && rejectCall()}
            sx={{ fontWeight: 900 }}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PhoneInTalkIcon />}
            onClick={() => answerCall && answerCall()}
            sx={{ fontWeight: 900 }}
          >
            Answer Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmation Modal: Delete Single Call ──────────────────── */}
      <Dialog
        open={Boolean(callToDelete)}
        onClose={() => setCallToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#DC2626' }}>
          Delete Call Record?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this call record with{' '}
            <b>{callToDelete?.toNumber || callToDelete?.fromNumber}</b>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCallToDelete(null)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={executeDeleteCall}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 900 }}
          >
            Delete Record
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
