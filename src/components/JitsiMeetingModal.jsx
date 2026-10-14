import React, { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SecurityIcon from '@mui/icons-material/Security';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallEndIcon from '@mui/icons-material/CallEnd';

import { jitsiService, getMeetingUrl, generateMeetingInvitation } from '../services/jitsiService';
import { useAlert } from '../contexts/AlertContext';

export default function JitsiMeetingModal({
  open,
  onClose,
  roomName,
  clientName = 'Traveler',
  clientPhone = '',
  agentName = 'Flight Expert',
  origin = '',
  destination = '',
  dateTime = 'Immediate Consultation',
}) {
  const { showAlert } = useAlert();
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const meetingUrl = getMeetingUrl(roomName);

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    setLoading(true);

    jitsiService.loadJitsiScript()
      .then((JitsiMeetExternalAPI) => {
        if (isCancelled || !containerRef.current) return;

        // Clean up previous instance if any
        if (jitsiApiRef.current) {
          try { jitsiApiRef.current.dispose(); } catch (e) {}
          jitsiApiRef.current = null;
        }

        const domain = jitsiService.domain;
        const options = {
          roomName: roomName || 'WowMyFlight-Consultation',
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: agentName || 'Agent Sales Desk',
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'select-background', 'download', 'help', 'mute-everyone',
            ],
          },
        };

        const api = new JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          setLoading(false);
          console.log('✅ [Jitsi] Connected to room:', roomName);
        });

        api.addEventListener('readyToClose', () => {
          onClose();
        });

        // Fallback hide spinner after 3 seconds
        setTimeout(() => {
          if (!isCancelled) setLoading(false);
        }, 3000);
      })
      .catch((err) => {
        console.error('❌ [Jitsi] Error initializing Jitsi External API:', err);
        setLoading(false);
        showAlert('Could not load Jitsi video SDK. Opening external link...', 'warning');
      });

    return () => {
      isCancelled = true;
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
        jitsiApiRef.current = null;
      }
    };
  }, [open, roomName, agentName]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(meetingUrl);
    setCopied(true);
    showAlert('Jitsi Meeting Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const inviteText = generateMeetingInvitation({
      roomName,
      meetingUrl,
      clientName,
      agentName,
      dateTime,
      origin,
      destination,
    });

    const cleanPhone = (clientPhone || '').replace(/\D/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteText)}`
      : `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

    window.open(waUrl, '_blank');
    showAlert(`WhatsApp video invitation generated for ${clientName}`, 'success');
  };

  const handleOpenExternal = () => {
    window.open(meetingUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#0F172A',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        },
      }}
    >
      {/* ─── Header ─── */}
      <DialogTitle
        sx={{
          p: 2,
          px: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#1E293B',
          borderBottom: '1px solid #334155',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              bgcolor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VideocamIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Jitsi Live Video Consultation
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Participant: <b>{clientName}</b> | Room: <code>{roomName}</code>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<SecurityIcon sx={{ fontSize: '14px !important', color: 'var(--wd-10B981, #10B981) !important' }} />}
            label="Encrypted P2P"
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 22,
            }}
          />

          <Tooltip title="Copy Meeting Link">
            <IconButton onClick={handleCopyLink} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#fff' } }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Open in External Browser Window">
            <IconButton onClick={handleOpenExternal} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#fff' } }}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ─── Video Embed Container ─── */}
      <DialogContent sx={{ p: 0, bgcolor: '#000', position: 'relative', minHeight: { xs: 420, sm: 540 } }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              zIndex: 10,
            }}
          >
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
              Connecting to secure Jitsi Meet room...
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Preparing camera, microphone, and WebRTC encrypted stream
            </Typography>
          </Box>
        )}

        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            height: { xs: 420, sm: 540 },
            bgcolor: '#000',
            '& iframe': {
              border: 'none',
              width: '100%',
              height: '100%',
            },
          }}
        />
      </DialogContent>

      {/* ─── Bottom Actions Bar ─── */}
      <DialogActions
        sx={{
          p: 1.5,
          px: 2.5,
          bgcolor: '#1E293B',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Meeting Link:
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: '#0F172A',
              borderColor: '#334155',
              borderRadius: 1.5,
              color: '#38BDF8',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              maxWidth: { xs: 180, sm: 280 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meetingUrl}
          </Paper>

          <Button
            size="small"
            variant="outlined"
            onClick={handleCopyLink}
            startIcon={<ContentCopyIcon />}
            sx={{
              color: '#E2E8F0',
              borderColor: '#475569',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { borderColor: '#94A3B8', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={handleShareWhatsApp}
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
            }}
          >
            Send Invite via WhatsApp
          </Button>

          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<CallEndIcon />}
            onClick={onClose}
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
            }}
          >
            Leave / End Meeting
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
