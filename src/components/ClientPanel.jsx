import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VideocamIcon from '@mui/icons-material/Videocam';

const STATUS_OPTIONS = [
  'New Lead',
  'Contacted',
  'Callback',
  'Qualified',
  'Quote Sent',
  'TL Review',
  'Payment Pending',
  'Booked',
  'Lost',
  'No Response'
];

export default function ClientPanel({ lead, onComment, onAction, onStatusChange }) {
  const [comment, setComment] = useState('');
  const add = () => { if (comment.trim()) { onComment(comment); setComment(''); } };
  
  if (!lead) {
    return (
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Select a lead to view client details</Typography>
      </Paper>
    );
  }

  const section = (name, children) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '.06em', display: 'block', mb: 0.5 }}>
        {name}
      </Typography>
      {children}
    </Box>
  );

  const cleanTimeZone = (lead.timeZone || 'UTC+00:00 UTC').split(' ')[0];

  return (
    <Paper elevation={0} sx={{ 
      p: 2.5, 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 3.5, 
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: 'background.paper',
      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.02)'
    }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '1.1rem' }}>
            {lead.firstName || 'Customer'} {lead.lastName || ''}
          </Typography>
          <Typography component="div" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            CLIENT ID: <span style={{ color: 'inherit' }}>{lead.clientId || lead.id || 'N/A'}</span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Launch Live Video Consultation (Jitsi Meet)">
            <IconButton
              size="small"
              onClick={() => onAction('video_meeting')}
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                color: '#4F46E5',
                border: '1px solid var(--wb-C7D2FE, #C7D2FE)',
                '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF', transform: 'scale(1.05)' },
                transition: 'all 0.15s ease'
              }}
            >
              <VideocamIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onStatusChange && (
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={lead.status || 'New Lead'}
                onChange={(e) => onStatusChange(e.target.value)}
                sx={{ fontSize: '0.75rem', fontWeight: 800, height: 30, borderRadius: 2 }}
              >
                {STATUS_OPTIONS.map((st) => (
                  <MenuItem key={st} value={st} sx={{ fontSize: '0.75rem' }}>
                    {st}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 1 }}>
        {section('PERSONAL DATA', 
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            <span>Country: <b style={{ color: 'inherit' }}>{lead.country || 'International'}</b></span>
            <span>Time Zone: <b style={{ color: 'inherit' }}>{cleanTimeZone}</b></span>
            <span>City: <b style={{ color: 'inherit' }}>{lead.city || 'N/A'}</b></span>
          </Box>
        )}
        {section('CONTACT', 
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            <span>Email: <b style={{ color: 'inherit' }}>{lead.email || 'N/A'}</b></span>
            <span>Phone: <b style={{ color: 'inherit' }}>{lead.fullPhone || lead.phone || 'N/A'}</b></span>
            <span>Source: <b style={{ color: 'inherit' }}>{lead.source || 'Website'}</b></span>
          </Box>
        )}
      </Box>

      {section('FLIGHT REQUEST', 
        <Box sx={{ 
          bgcolor: 'primary.50', 
          p: 1.5, 
          borderRadius: 3, 
          fontSize: '0.85rem', 
          border: '1px solid',
          borderColor: 'primary.100',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlightTakeoffIcon fontSize="small" />
            {lead.origin || 'DEL'} → {lead.destination || 'LHR'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontWeight: 600, mt: 0.5, fontSize: '0.75rem' }}>
            <span>Depart: {lead.travelDate || 'Flexible'}</span>
            {lead.returnDate && <span>Return: {lead.returnDate}</span>}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
            <span>{lead.cabinClass || 'Economy'}</span>
            <span>{lead.passengers || 1} Passengers</span>
          </Box>
          {lead.budget ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'var(--wd-15803D, #15803D)', fontWeight: 700, fontSize: '0.75rem', mt: 0.3 }}>
              <AttachMoneyIcon sx={{ fontSize: 14 }} /> Budget Target: ${lead.budget}
            </Box>
          ) : null}
        </Box>
      )}

      {section('ACTIVITY HISTORY', 
        <Paper variant="outlined" sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 2.5, minHeight: 130, maxHeight: 220, p: 1.5, bgcolor: 'background.neutral' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(lead.activities || []).map((a, i) => (
              <Box key={`${a.time || i}-${i}`} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, minWidth: 55, fontSize: '0.7rem' }}>
                  {a.time || 'Today'}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>{a.agent || 'me'}</Typography>
                    <Chip 
                      label={a.status || 'Note'} 
                      size="small" 
                      sx={{ 
                        height: 18, 
                        fontSize: '0.62rem', 
                        fontWeight: 800, 
                        bgcolor: a.status === 'Quote Sent' ? '#DCFCE7' : a.status === 'TL Review' ? '#FEF3C7' : '#EFF6FF', 
                        color: a.status === 'Quote Sent' ? '#15803D' : a.status === 'TL Review' ? '#B45309' : '#1D4ED8',
                        border: 'none'
                      }} 
                    />
                  </Box>
                  {a.comments && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2, fontSize: '0.72rem' }}>
                      {a.comments}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
            {(!lead.activities || lead.activities.length === 0) && (
              <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', display: 'block', py: 2 }}>
                No recent activity logs.
              </Typography>
            )}
          </Box>
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <TextField 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          size="small" 
          fullWidth 
          placeholder="Add comment..." 
          onKeyDown={e => e.key === 'Enter' && add()} 
          sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontSize: '0.85rem' } }}
        />
        <Button onClick={add} variant="contained" size="small" sx={{ borderRadius: 2, px: 3, fontWeight: 800 }}>Add</Button>
      </Box>
      
      <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

      {/* Quick Action Matrix for Travel Sales CRM */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1 }}>
        <Button 
          onClick={() => onAction('video_meeting')} 
          size="small" 
          variant="contained" 
          sx={{ 
            borderRadius: 2, 
            fontWeight: 800, 
            py: 0.9, 
            fontSize: '0.72rem', 
            textTransform: 'none',
            bgcolor: '#4F46E5',
            '&:hover': { bgcolor: '#4338CA', transform: 'translateY(-1px)' },
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          📹 Video Consultation
        </Button>
        <Button 
          onClick={() => onAction('whatsapp_quote')} 
          size="small" 
          variant="contained" 
          sx={{ 
            borderRadius: 2, 
            fontWeight: 800, 
            py: 0.9, 
            fontSize: '0.72rem', 
            textTransform: 'none',
            bgcolor: '#16A34A',
            '&:hover': { bgcolor: '#15803D', transform: 'translateY(-1px)' },
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          📱 WhatsApp
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1 }}>
        <Button 
          onClick={() => onAction('flight_expert')} 
          size="small" 
          variant="outlined" 
          color="primary"
          sx={{ borderRadius: 2, fontWeight: 700, py: 0.8, fontSize: '0.7rem', textTransform: 'none' }}
        >
          ✈️ GDS Desk
        </Button>
        <Button 
          onClick={() => onAction('tl_approval')} 
          size="small" 
          variant="outlined" 
          color="warning"
          sx={{ borderRadius: 2, fontWeight: 700, py: 0.8, fontSize: '0.7rem', textTransform: 'none' }}
        >
          🛡️ TL Discount
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
        <Button onClick={() => onAction('quote')} size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, py: 0.8, fontSize: '0.7rem', textTransform: 'none' }}>📄 Full Quote</Button>
        <Button onClick={() => onAction('payment')} size="small" variant="outlined" color="secondary" sx={{ borderRadius: 2, fontWeight: 700, py: 0.8, fontSize: '0.7rem', textTransform: 'none' }}>💳 Pay Link</Button>
      </Box>
    </Paper>
  );
}

