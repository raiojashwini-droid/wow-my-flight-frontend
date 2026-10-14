import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';

export default function AgentActivityFeed({ agents: propAgents = [] }) { 
  const [actions, setActions] = useState({}); 
  const agents = propAgents || [];

  const select = (id, label, choices) => (
    <Select 
      displayEmpty 
      size="small" 
      value={actions[`${id}-${label}`] || ''} 
      onChange={e => setActions({ ...actions, [`${id}-${label}`]: e.target.value })} 
      sx={{ 
        height: 32, 
        fontSize: '0.75rem', 
        bgcolor: 'background.paper',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
      }}
    >
      <MenuItem value="" disabled sx={{ fontSize: '0.75rem' }}>{label} ▾</MenuItem>
      {choices.map(x => <MenuItem key={x} value={x} sx={{ fontSize: '0.75rem' }}>{x}</MenuItem>)}
    </Select>
  );

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 2, bgcolor: 'background.neutral' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'text.primary', letterSpacing: '.05em' }}>
        REAL-TIME AGENT ACTIVITY FEED
      </Typography>
      {agents.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            No live agent call sessions currently active on floor
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Active agent audio feeds and status controls will appear here as soon as reps make or receive calls.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {agents.map((agent, id) => {
            const tone = agent.tone || (agent.status === 'On Call' || agent.status === 'ON CALL' ? '#22c55e' : '#3b82f6');
            return (
              <Paper key={agent.name || id} elevation={0} sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: agent.status === 'On Call' || agent.status === 'ON CALL' ? '#86efac' : 'divider',
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: agent.status === 'On Call' || agent.status === 'ON CALL' ? '0 4px 15px rgba(34, 197, 94, 0.05)' : 'none',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }
              }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Badge 
                    overlap="circular" 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{ '& .MuiBadge-badge': { backgroundColor: tone, width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--wb-FFFFFF, #FFFFFF)' } }}
                  >
                    <Avatar sx={{ width: 42, height: 42, bgcolor: tone + '20', color: tone, fontWeight: 700 }}>
                      {(agent.name || 'A')[0]}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 800 }}>{agent.name}</Typography>
                    <Typography variant="caption" sx={{ color: tone, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {agent.status === 'On Call' || agent.status === 'ON CALL' ? <PhoneInTalkIcon sx={{ fontSize: 12 }} /> : <AccessTimeIcon sx={{ fontSize: 12 }} />}
                      {agent.status || 'Active'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1.5, p: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>⏱ {agent.timer || agent.timeOnStatus || 'Active'}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{agent.recent || 'Floor Rep'}</Typography>
                </Box>
                
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {select(id, 'Barge / Whisper', ['Barge Into Call', 'Whisper to Agent', 'Listen Only'])}
                  {select(id, 'Lead Options', ['Recycle All Leads', "Recycle Today's", 'Select Leads'])}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Paper>
  ); 
}
