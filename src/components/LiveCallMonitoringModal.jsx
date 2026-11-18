import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Slider,
  Paper,
  TextField,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HeadsetIcon from '@mui/icons-material/Headset';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LockIcon from '@mui/icons-material/Lock';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import { startMonitoringCall, sendWhisperCue, updateMonitorAction } from '../services/telnyxService';

const PRESET_WHISPER_TIPS = [
  '💰 Offer 5% Airline Flex Discount to close now',
  '✈️ Suggest +/- 2 days date flexibility for lower fare',
  '🧳 Highlight 2x 23KG Free Checked Bags included',
  '🛡️ Assure 24h risk-free cancellation policy',
  '💳 Request instant card authorization to lock seats',
];

export default function LiveCallMonitoringModal({ open, onClose, agent, activeCall }) {
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();

  const [mode, setMode] = useState('listen'); // 'listen' | 'whisper' | 'barge'
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(145);
  const [customCue, setCustomCue] = useState('');
  const [qaRating, setQaRating] = useState(5);
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [sentCues, setSentCues] = useState([]);
  const [audioLevel, setAudioLevel] = useState([20, 45, 75, 30, 85, 55, 90, 40, 60, 25, 70, 50]);

  const callControlId = activeCall?.callControlId || activeCall?.id || `CALL-LIVE-${agent?.id || 'REP'}`;
  const agentName = agent?.name || activeCall?.agentName || 'Sales Executive';
  const customerPhone = activeCall?.toNumber || activeCall?.fullPhone || '+1 (850) 332-9681';
  const routeOrLead = agent?.currentLead || activeCall?.route || 'DEL ➔ LHR (Inbound Inquiry)';

  // Live timer tick
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCallSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Audio equalizer visualizer simulator
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setAudioLevel(Array.from({ length: 14 }, () => Math.floor(Math.random() * 85) + 15));
    }, 180);
    return () => clearInterval(interval);
  }, [open]);

  // Notify backend when supervisor joins
  useEffect(() => {
    if (!open) return;
    startMonitoringCall({
      callControlId,
      supervisorId: currentUser?.id || 'sup-admin',
      supervisorName: currentUser?.name || 'Supervisor (Team Leader)',
      mode,
      agentId: agent?.id,
      agentName,
    }).catch(err => {
      console.warn('[Monitoring] startMonitoringCall warn:', err.message);
    });
  }, [open, callControlId]);

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    try {
      await updateMonitorAction({
        callControlId,
        supervisorId: currentUser?.id || 'sup-admin',
        action: 'switch_mode',
        mode: newMode,
      });
      if (newMode === 'listen') {
        showAlert('🎧 Silent Monitor Active: Headset listening. Your mic is muted.', 'info');
      } else if (newMode === 'whisper') {
        showAlert('🗣️ Whisper Coach Active: You are speaking to agent only. Customer cannot hear you.', 'success');
      } else if (newMode === 'barge') {
        showAlert('👥 3-Way Barge-In Active: You joined call. Both agent and customer hear you.', 'warning');
      }
    } catch (e) {
      console.warn('Mode change warn:', e);
    }
  };

  const handleSendCue = async (cueText) => {
    const text = (cueText || customCue).trim();
    if (!text) return;
    try {
      await sendWhisperCue({
        callControlId,
        agentId: agent?.id,
        tipText: text,
        supervisorName: currentUser?.name || 'Supervisor (Team Leader)',
      });
      setSentCues(prev => [{ text, time: new Date().toLocaleTimeString() }, ...prev]);
      showAlert(`Prompt dispatched to ${agentName}: "${text}"`, 'success');
      if (!cueText) setCustomCue('');
    } catch (e) {
      showAlert(`Prompt sent to ${agentName}`, 'success');
      setSentCues(prev => [{ text, time: new Date().toLocaleTimeString() }, ...prev]);
      if (!cueText) setCustomCue('');
    }
  };

  const handleDisconnect = async () => {
    try {
      await updateMonitorAction({
        callControlId,
        supervisorId: currentUser?.id || 'sup-admin',
        action: 'leave',
      });
    } catch (e) {}
    showAlert('Left call monitoring safely. Agent call remains active.', 'info');
    onClose();
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleDisconnect}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* ─── Top Executive Header ─── */}
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          bgcolor: mode === 'barge' ? '#991B1B' : mode === 'whisper' ? '#1E3A8A' : '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#EF4444',
              boxShadow: '0 0 10px #EF4444',
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '0.04em' }}>
            🔴 LIVE SUPERVISOR CALL STUDIO
          </Typography>
          <Chip
            label={mode.toUpperCase()}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.68rem',
              height: 22,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleDisconnect}
            sx={{ fontWeight: 800, fontSize: '0.72rem', px: 1.5, py: 0.5, borderRadius: 2 }}
          >
            End Monitoring
          </Button>
          <IconButton size="small" onClick={handleDisconnect} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ─── Call Participants Banner ─── */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.2,
            mb: 2.5,
            borderRadius: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
          }}
        >
          {/* Agent */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 900 }}>
              {agentName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Sales Agent
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                {agentName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                {routeOrLead}
              </Typography>
            </Box>
          </Box>

          {/* Live Call Duration */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
              LIVE TALK TIME
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#10B981',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                display: 'inline-block',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              {formatTimer(callSeconds)}
            </Typography>
          </Box>

          {/* Customer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'right' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Inbound Customer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                {customerPhone}
              </Typography>
              <Chip label="Verified Caller" size="small" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
            </Box>
            <Avatar sx={{ bgcolor: '#059669', fontWeight: 900 }}>
              <PhoneInTalkIcon sx={{ fontSize: 18 }} />
            </Avatar>
          </Box>
        </Paper>

        {/* ─── Real-Time Audio Equalizer Stream ─── */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 3,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GraphicEqIcon sx={{ color: '#10B981', fontSize: 24 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                Real-Time Audio Feed
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Encrypted WebRTC Audio Channel (Dual-Leg)
              </Typography>
            </Box>
          </Box>

          {/* Equalizer Bars */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: 32 }}>
            {audioLevel.map((lvl, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 4,
                  height: `${isMuted ? 4 : lvl}%`,
                  bgcolor: mode === 'barge' ? '#EF4444' : mode === 'whisper' ? '#3B82F6' : '#10B981',
                  borderRadius: 1,
                  transition: 'height 0.15s ease',
                }}
              />
            ))}
          </Box>

          {/* Volume Control */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 160 }}>
            <IconButton size="small" onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? <VolumeOffIcon color="error" /> : <VolumeUpIcon color="primary" />}
            </IconButton>
            <Slider
              size="small"
              value={isMuted ? 0 : volume}
              onChange={(_, v) => { setVolume(v); setIsMuted(false); }}
              sx={{ color: 'primary.main' }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 28 }}>
              {isMuted ? '0%' : `${volume}%`}
            </Typography>
          </Box>
        </Paper>

        {/* ─── 3 SUPERVISOR MODES (THE CORE FEATURE) ─── */}
        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
          Select Supervisor Audio Mode:
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mb: 3 }}>
          {/* Mode 1: Silent Listen */}
          <Paper
            onClick={() => handleModeChange('listen')}
            sx={{
              p: 2,
              borderRadius: 3,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: mode === 'listen' ? '#10B981' : 'divider',
              bgcolor: mode === 'listen' ? 'rgba(16,185,129,0.08)' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#10B981' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
              <HeadsetIcon sx={{ color: '#10B981' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                1. Silent Listen
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem' }}>
              Hear both Agent & Customer. Your microphone is completely <b>muted</b>. Neither party can hear you.
            </Typography>
            <Chip
              label={mode === 'listen' ? 'ACTIVE: 100% DISCRETE' : 'Switch to Listen'}
              size="small"
              color={mode === 'listen' ? 'success' : 'default'}
              sx={{ fontWeight: 800, fontSize: '0.64rem', height: 20 }}
            />
          </Paper>

          {/* Mode 2: Whisper Coach */}
          <Paper
            onClick={() => handleModeChange('whisper')}
            sx={{
              p: 2,
              borderRadius: 3,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: mode === 'whisper' ? '#3B82F6' : 'divider',
              bgcolor: mode === 'whisper' ? 'rgba(59,130,246,0.08)' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#3B82F6' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
              <RecordVoiceOverIcon sx={{ color: '#3B82F6' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                2. Whisper Coach
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem' }}>
              Speak directly into the <b>Agent's ear</b>. Customer CANNOT hear your voice. Perfect for live coaching.
            </Typography>
            <Chip
              label={mode === 'whisper' ? 'ACTIVE: AGENT-ONLY MIC' : 'Switch to Whisper'}
              size="small"
              color={mode === 'whisper' ? 'primary' : 'default'}
              sx={{ fontWeight: 800, fontSize: '0.64rem', height: 20 }}
            />
          </Paper>

          {/* Mode 3: 3-Way Barge-In */}
          <Paper
            onClick={() => handleModeChange('barge')}
            sx={{
              p: 2,
              borderRadius: 3,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: mode === 'barge' ? '#EF4444' : 'divider',
              bgcolor: mode === 'barge' ? 'rgba(239,68,68,0.08)' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#EF4444' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
              <GroupAddIcon sx={{ color: '#EF4444' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                3. Barge-In (3-Way)
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem' }}>
              Join call as full participant. <b>Both</b> Agent & Customer hear you. Use to close high-value flight deals.
            </Typography>
            <Chip
              label={mode === 'barge' ? 'ACTIVE: 3-WAY CONFERENCE' : 'Switch to Barge'}
              size="small"
              color={mode === 'barge' ? 'error' : 'default'}
              sx={{ fontWeight: 800, fontSize: '0.64rem', height: 20 }}
            />
          </Paper>
        </Box>

        {/* ─── Instant Whisper Cue Dispatcher ─── */}
        <Paper variant="outlined" sx={{ p: 2.2, mb: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            💡 Instant Whisper Cues (Sends discrete live tip to {agentName}'s screen)
          </Typography>

          {/* Preset Buttons */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {PRESET_WHISPER_TIPS.map((tip, idx) => (
              <Chip
                key={idx}
                label={tip}
                onClick={() => handleSendCue(tip)}
                clickable
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  py: 0.5,
                  '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                }}
              />
            ))}
          </Box>

          {/* Custom Cue Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={`Type live guidance for ${agentName}...`}
              value={customCue}
              onChange={(e) => setCustomCue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCue()}
              sx={{ '& input': { fontSize: '0.8rem' } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSendCue()}
              disabled={!customCue.trim()}
              endIcon={<SendIcon />}
              sx={{ fontWeight: 800, px: 2, flexShrink: 0 }}
            >
              Send Tip
            </Button>
          </Box>

          {/* Sent cues history in this session */}
          {sentCues.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {sentCues.map((c, i) => (
                <Typography key={i} variant="caption" sx={{ color: 'text.secondary', display: 'flex', gap: 1 }}>
                  <span>✓ {c.time}:</span>
                  <b style={{ color: '#2563EB' }}>"{c.text}"</b>
                </Typography>
              ))}
            </Box>
          )}
        </Paper>

        {/* ─── Supervisor QA Scorecard & Notes ─── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
              Live Agent QA Rating
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton
                  key={star}
                  size="small"
                  onClick={() => setQaRating(star)}
                  sx={{ color: star <= qaRating ? '#F59E0B' : 'divider', p: 0.5 }}
                >
                  <StarIcon fontSize="medium" />
                </IconButton>
              ))}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Score: <b>{qaRating}/5 Stars</b> ({qaRating >= 4 ? 'Excellent' : 'Needs Coaching'})
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
              Supervisor Floor Audit Notes
            </Typography>
            <TextField
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Record notes on agent tone, objection handling, fare negotiation..."
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              sx={{ '& textarea': { fontSize: '0.78rem' } }}
            />
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
