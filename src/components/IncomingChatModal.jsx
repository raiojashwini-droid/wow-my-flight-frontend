import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Slide,
  IconButton,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SouthEastIcon from '@mui/icons-material/SouthEast';
import { useTelnyx } from '../contexts/TelnyxContext';
import { useAlert } from '../contexts/AlertContext';

export default function IncomingChatModal() {
  const { incomingChatRequest, acceptChatRequest, dismissChatRequest } = useTelnyx();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-dismiss after 60 seconds if untouched
  useEffect(() => {
    if (!incomingChatRequest) return;
    const timer = setTimeout(() => {
      dismissChatRequest();
    }, 60000);
    return () => clearTimeout(timer);
  }, [incomingChatRequest, dismissChatRequest]);

  if (!incomingChatRequest) return null;

  const handleAccept = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    acceptChatRequest(incomingChatRequest.chatRequestId, (res) => {
      setIsSubmitting(false);
      if (res && res.success) {
        if (showAlert) {
          showAlert(`Chat accepted! Connected with ${incomingChatRequest.customerName || 'Customer'}.`, 'success');
        }
        navigate('/live-chat', { state: { sessionId: incomingChatRequest.chatRequestId } });
      } else {
        if (showAlert) {
          showAlert(res?.message || 'This chat was already accepted by another agent.', 'warning');
        }
      }
    });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 80, sm: 96 },
        left: { xs: 16, sm: 24 },
        zIndex: 9999,
        width: 250,
      }}
    >
      <Slide direction="right" in={Boolean(incomingChatRequest)} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            p: 2,
            borderRadius: 2,
            borderLeft: '4px solid #1976D2',
            borderTop: '1px solid #E2E8F0',
            borderRight: '1px solid #E2E8F0',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Customer Name */}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              color: '#1E293B',
              lineHeight: 1.3,
              mb: 0.3,
            }}
            noWrap
          >
            {incomingChatRequest.customerName || 'Edward Ferrars'}
          </Typography>

          {/* Subtitle: ↘ Chat */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B', fontSize: '0.8rem', mb: 0.3 }}>
            <SouthEastIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
            <Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>
              Chat
            </Typography>
          </Box>

          {/* LiveChat Tag */}
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: '#64748B',
              fontWeight: 500,
              mb: 1.5,
            }}
          >
            LiveChat
          </Typography>

          {/* Action Buttons: Reject / Accept */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={dismissChatRequest}
              sx={{
                flex: 1,
                py: 0.6,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: '#64748B',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                '&:hover': {
                  bgcolor: '#F8FAFC',
                  borderColor: '#94A3B8',
                },
              }}
            >
              Reject
            </Button>

            <Button
              variant="contained"
              size="small"
              disabled={isSubmitting}
              onClick={handleAccept}
              sx={{
                flex: 1,
                py: 0.6,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                bgcolor: '#1976D2',
                color: '#FFFFFF',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#1565C0',
                  boxShadow: 'none',
                },
              }}
            >
              {isSubmitting ? '...' : 'Accept'}
            </Button>
          </Box>

          {/* Transfer / Swap icon button row */}
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
            <IconButton
              size="small"
              sx={{
                p: 0.5,
                border: '1px solid #E2E8F0',
                borderRadius: 1.5,
                color: '#64748B',
                width: 32,
                height: 28,
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
}

