import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';

export default function DualClock({ client }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (timezone) => {
    try {
      return time.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '00:00';
    }
  };

  const getClientHour = (timezone) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hourCycle: 'h23' }).formatToParts(time);
      const hr = parts.find(p => p.type === 'hour')?.value;
      return parseInt(hr || '0', 10);
    } catch {
      return 12;
    }
  };

  const agentTime = formatTime(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const clientTime = formatTime(client?.timezone || 'America/New_York');
  const hour = getClientHour(client?.timezone || 'America/New_York');
  const isDay = hour >= 6 && hour < 18;

  const getClientDisplayLabel = () => {
    if (!client?.label) return 'EST';
    const raw = String(client.label).trim();
    const match = raw.match(/\(([^)]+)\)/);
    if (match) return match[1];
    if (raw.toLowerCase().includes('client')) {
      const cleaned = raw.replace(/client\s*(time)?/i, '').trim();
      return cleaned || 'EST';
    }
    return raw;
  };

  return (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexWrap: 'nowrap',
      gap: 1.5, 
      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
      py: 0.6,
      px: 1.8,
      height: 38,
      boxSizing: 'border-box',
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      '&:hover': { borderColor: 'primary.light', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>Agent (Local):</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: { xs: 'inline', sm: 'none' } }}>Agent:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.84rem' }}>{agentTime}</Typography>
      </Box>
      <Box sx={{ width: '1px', height: 16, bgcolor: 'divider' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <PublicIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>Client ({getClientDisplayLabel()}):</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: { xs: 'inline', sm: 'none' } }}>Client:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main', fontFamily: 'monospace', fontSize: '0.84rem' }}>{clientTime}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.8, py: 0.2, borderRadius: 1.5, bgcolor: isDay ? '#FFFBEB' : '#F1F5F9' }}>
        {isDay ? <WbSunnyIcon sx={{ color: '#F59E0B', fontSize: 13 }} /> : <NightlightRoundIcon sx={{ color: 'var(--wd-475569, #475569)', fontSize: 13 }} />}
        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.62rem', color: isDay ? '#D97706' : '#334155' }}>
          {isDay ? 'DAY' : 'NIGHT'}
        </Typography>
      </Box>
    </Box>
  );
}
