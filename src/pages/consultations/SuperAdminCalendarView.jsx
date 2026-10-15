import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';

// Components & Services
import { dbService } from '../../services/dbService';
import PageHeader from '../../components/PageHeader';
import AppModal from '../../components/AppModal';
import StatCard from '../../components/StatCard';
import { useAlert } from '../../contexts/AlertContext';
import { SERVICES } from '../../constants/mockData';

export const SuperAdminCalendarView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [cardInfo, setCardInfo] = useState(() => location.state?.cardInfo || null);

  useEffect(() => {
    if (location.state?.cardInfo) {
      setCardInfo(location.state.cardInfo);
    }
  }, [location.state]);

  const getCardIcon = (iconType) => {
    switch (iconType) {
      case 'PeopleAlt': return <PeopleAltIcon />;
      case 'Add': return <AddIcon />;
      case 'CalendarMonth': return <CalendarMonthIcon />;
      case 'Payments': return <PaymentsIcon />;
      case 'TrendingUp': return <TrendingUpIcon />;
      case 'Assignment': return <AssignmentIcon />;
      case 'CheckCircleOutlined': return <CheckCircleOutlinedIcon />;
      case 'WarningAmber': return <WarningAmberIcon />;
      case 'Receipt': return <ReceiptIcon />;
      case 'CreditCard': return <CreditCardIcon />;
      default: return null;
    }
  };

  const { currentUser, isConsultant } = useAuth();

  const getRolePrefix = () => {
    if (!currentUser) return 'super_admin';
    if (currentUser.role === 'consultant') return 'agent';
    return currentUser.role;
  };

  const getTodayDateStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [activeAgentId, setActiveAgentId] = useState(isConsultant ? currentUser?.id || '' : '');
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // New consultation fields
  const [clientName, setClientName] = useState('');
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [agentId, setAgentId] = useState(isConsultant ? currentUser?.id || '' : '');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(getTodayDateStr());
  };

  const monthYearTitle = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Sync with currentUser role/id changes
  useEffect(() => {
    if (isConsultant && currentUser) {
      setActiveAgentId(currentUser.id);
      setAgentId(currentUser.id);
    } else if (!isConsultant) {
      setActiveAgentId('');
    }
  }, [currentUser, isConsultant]);

  // Fetch consultations from backend API
  const { data: consultations = [] } = useQuery({
    queryKey: ['consultations'],
    queryFn: dbService.getConsultations
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: dbService.getLeads
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: dbService.getAgents
  });

  // Ensure an agent is selected as host once agents are loaded
  useEffect(() => {
    if (agents && agents.length > 0) {
      const match = agents.some(a => a.id === agentId);
      if (!match || !agentId) {
        if (isConsultant && currentUser) {
          const self = agents.find(a => a.id === currentUser.id);
          setAgentId(self ? self.id : agents[0].id);
        } else {
          setAgentId(agents[0].id);
        }
      }
    }
  }, [agents, currentUser, isConsultant, agentId]);

  // Normalize consultations so that backend Prisma (dateTime, agentId) and frontend format work seamlessly
  const normalizedConsultations = React.useMemo(() => {
    return (consultations || []).map(c => {
      const dStr = c.meetingDate || (c.dateTime ? c.dateTime.split('T')[0] : '');
      const tStr = c.meetingTime || (c.dateTime && c.dateTime.includes('T') ? c.dateTime.split('T')[1].substring(0, 5) : '10:00');
      const aId = c.assignedConsultantId || c.agentId;
      return {
        ...c,
        meetingDate: dStr,
        meetingTime: tStr,
        assignedConsultantId: aId
      };
    });
  }, [consultations]);

  // Mutations
  const createConsultationMutation = useMutation({
    mutationFn: dbService.createConsultation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      showAlert('Flight consultation scheduled successfully in calendar & database!', 'success');
      setScheduleModalOpen(false);
      setClientName('');
      setMeetingNotes('');
    }
  });

  const handleScheduleSubmit = () => {
    if (!clientName.trim()) {
      showAlert('Client or Lead name is required', 'warning');
      return;
    }
    
    // Find if lead exists to bind leadId and contact info
    const lead = leads.find(l => `${l.firstName || ''} ${l.lastName || ''}`.trim().toLowerCase() === clientName.trim().toLowerCase());
    const selectedAgent = agents.find(a => a.id === agentId) || agents[0];
    const resolvedAgentId = selectedAgent ? selectedAgent.id : (agentId || null);
    const resolvedAgentName = selectedAgent ? (selectedAgent.name || selectedAgent.fullName || 'Flight Consultant') : 'Flight Consultant';

    createConsultationMutation.mutate({
      leadId: lead ? lead.id : null,
      clientName: clientName.trim(),
      clientEmail: lead ? lead.email : null,
      clientPhone: lead ? lead.phone : null,
      meetingDate: selectedDate,
      meetingTime,
      dateTime: `${selectedDate}T${meetingTime}:00`,
      durationMinutes: duration,
      assignedConsultantId: resolvedAgentId,
      agentId: resolvedAgentId,
      agentName: resolvedAgentName,
      serviceType: 'Flight Consultation & Follow-up',
      notes: meetingNotes
    });
  };

  // Full Dynamic Calendar Grid (Monday to Sunday)
  const calendarCells = React.useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const leadingOffset = (firstDayOfWeek + 6) % 7;
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // 1. Previous month leading days
    for (let i = leadingOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        meetings: normalizedConsultations.filter(c =>
          c.meetingDate === dateStr &&
          (activeAgentId ? (c.assignedConsultantId === activeAgentId || (isConsultant && !c.assignedConsultantId)) : true)
        )
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        meetings: normalizedConsultations.filter(c =>
          c.meetingDate === dateStr &&
          (activeAgentId ? (c.assignedConsultantId === activeAgentId || (isConsultant && !c.assignedConsultantId)) : true)
        )
      });
    }

    // 3. Trailing days from next month to complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      cells.push({
        dayNum: n,
        dateStr,
        isCurrentMonth: false,
        meetings: normalizedConsultations.filter(c =>
          c.meetingDate === dateStr &&
          (activeAgentId ? (c.assignedConsultantId === activeAgentId || (isConsultant && !c.assignedConsultantId)) : true)
        )
      });
    }

    return cells;
  }, [calendarDate, normalizedConsultations, activeAgentId, isConsultant]);

  // Current selected day meetings list
  const selectedDayMeetings = React.useMemo(() => {
    return normalizedConsultations.filter(c =>
      c.meetingDate === selectedDate &&
      (activeAgentId 
        ? (c.assignedConsultantId === activeAgentId || (isConsultant && !c.assignedConsultantId))
        : true)
    );
  }, [normalizedConsultations, selectedDate, activeAgentId, isConsultant]);

  return (
    <Box>
      <Button
        startIcon={<KeyboardArrowLeftIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2, color: 'text.secondary', display: 'inline-flex' }}
      >
        Back to Dashboard
      </Button>
      <PageHeader
        title="Agent Calendar Scheduler"
        subtitle="Manage upcoming consultation meetings, time allocations, and client booking schedules."
        action={
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setScheduleModalOpen(true)}
          >
            Book Appointment
          </Button>
        }
      />

      {cardInfo && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 3, 
            p: '12px 24px', 
            borderRadius: 3, 
            background: `linear-gradient(135deg, ${cardInfo.color}0D 0%, ${cardInfo.color}1E 100%)`, 
            border: '1px solid',
            borderColor: `${cardInfo.color}25`,
            boxShadow: `0 4px 20px ${cardInfo.color}08`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '6px',
              height: '100%',
              backgroundColor: cardInfo.color,
              borderRadius: '12px 0 0 12px' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: `${cardInfo.color}25`, 
                color: cardInfo.color,
                '& svg': { fontSize: '1.25rem' }
              }}
            >
              {getCardIcon(cardInfo.iconType)}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cardInfo.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {cardInfo.value}
            </Typography>
            {cardInfo.trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    p: '2px 8px',
                    borderRadius: '12px',
                    background: parseFloat(cardInfo.trend) >= 0 
                      ? 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)' 
                      : 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                >
                  {parseFloat(cardInfo.trend) >= 0 ? '↑' : '↓'} {cardInfo.trend}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.8 }}>
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3.5, alignItems: 'stretch', width: '100%' }}>
        {/* Left: Scheduler Settings & Day List */}
        <Box sx={{ flex: 1, minWidth: { md: '320px' }, width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Filter */}
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Agent Filter
            </Typography>
            <TextField
              select
              value={activeAgentId}
              onChange={(e) => {
                setActiveAgentId(e.target.value);
                setCardInfo(null);
              }}
              label="Assigned Expert"
              fullWidth
              size="small"
              disabled={isConsultant}
            >
              <MenuItem value="">Show All Experts</MenuItem>
              {agents.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          {/* Selected Date Meetings List */}
          <Paper sx={{ flexGrow: 1, p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Schedule for {selectedDate}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {selectedDayMeetings.length} sessions booked
            </Typography>
            
            {selectedDayMeetings.length === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  No sessions scheduled for this date.
                </Typography>
              </Box>
            ) : (
              <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 400 }}>
                {selectedDayMeetings.map((mt) => {
                  const c = agents.find((cons) => cons.id === mt.assignedConsultantId);
                  return (
                    <ListItemButton
                      key={mt.id}
                      onClick={() => navigate(`/${getRolePrefix()}/consultations/details/${mt.id}`)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        borderLeft: '4px solid',
                        borderLeftColor: 
                          mt.status === 'Completed' 
                            ? 'success.main' 
                            : (mt.status === 'Cancelled' || mt.status === 'No-Show' ? '#F59E0B' : 'secondary.main'),
                        bgcolor: 'background.neutral',
                        py: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {mt.clientName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                              {mt.meetingTime}
                            </Typography>
                          </Box>
                        }
                        secondary={`Host: ${c ? c.name : 'Unknown'} (${mt.durationMinutes} min)`}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Paper>
        </Box>

        {/* Right: Calendar Grid */}
        <Box sx={{ flex: 2.2, minWidth: 0, width: '100%' }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Dynamic Header Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {monthYearTitle}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleToday}
                  sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                  Today
                </Button>
                <IconButton onClick={handlePrevMonth} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <ArrowBackIosIcon fontSize="inherit" />
                </IconButton>
                <IconButton onClick={handleNextMonth} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <ArrowForwardIosIcon fontSize="inherit" />
                </IconButton>
              </Box>
            </Box>

            {/* Weekdays Labels */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1, textAlign: 'center', fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Box key={day} sx={{ py: 0.5 }}>
                  {day}
                </Box>
              ))}
            </Box>

            {/* Dynamic Calendar Cells Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, flexGrow: 1 }}>
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === getTodayDateStr();
                const hasMeetings = cell.meetings.length > 0;
                const hasNoShowOrCancelled = cell.meetings.some(m => m.status === 'Cancelled' || m.status === 'No-Show');
                
                let borderStyle = '1px solid';
                let borderColor = 'divider';
                let bgColor = cell.isCurrentMonth ? 'background.paper' : (isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC');
                
                if (isSelected) {
                  borderStyle = '2px solid';
                  borderColor = 'primary.main';
                  bgColor = isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF';
                } else if (hasNoShowOrCancelled) {
                  borderStyle = '2px solid';
                  borderColor = '#F59E0B';
                  bgColor = isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB';
                } else if (hasMeetings) {
                  borderStyle = '1px solid';
                  borderColor = '#3B82F6';
                  bgColor = isDark ? 'rgba(59, 130, 246, 0.12)' : '#F0F9FF';
                } else if (isToday) {
                  borderColor = '#10B981';
                  bgColor = isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5';
                }

                return (
                  <Paper
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    sx={{
                      minHeight: 74,
                      p: 1.2,
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: borderStyle,
                      borderColor: borderColor,
                      backgroundColor: bgColor,
                      opacity: cell.isCurrentMonth ? 1 : 0.45,
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        opacity: 1
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: isSelected || isToday ? 900 : 600,
                          color: isSelected ? 'primary.main' : isToday ? 'success.main' : 'text.primary',
                          fontSize: '0.85rem'
                        }}
                      >
                        {cell.dayNum}
                      </Typography>
                      {isToday && (
                        <Chip label="Today" size="small" color="success" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, px: 0.2 }} />
                      )}
                    </Box>

                    {hasMeetings && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {cell.meetings.map((m) => (
                          <Box
                            key={m.id}
                            title={`${m.clientName} (${m.meetingTime})`}
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: 
                                m.status === 'Completed' 
                                  ? 'success.main' 
                                  : (m.status === 'Cancelled' || m.status === 'No-Show' ? '#F59E0B' : 'primary.main')
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* MODAL: Book Flight Consultation */}
      <AppModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={`Book Flight Consultation for ${selectedDate}`}
        actions={
          <>
            <Button onClick={() => setScheduleModalOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              variant="contained"
              color="primary"
              disabled={createConsultationMutation.isPending}
              sx={{ fontWeight: 800 }}
            >
              {createConsultationMutation.isPending ? 'Scheduling...' : 'Schedule Session'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5, pb: 1 }}>
          <Autocomplete
            freeSolo
            options={leads.map(l => `${l.firstName || ''} ${l.lastName || ''}`.trim()).filter(Boolean)}
            value={clientName}
            onChange={(_, newValue) => setClientName(newValue || '')}
            onInputChange={(_, newInputValue) => setClientName(newInputValue || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client or Lead Name"
                placeholder="Select an existing lead or type customer name..."
                fullWidth
                required
              />
            )}
          />

          <Box className="grid grid-cols-12 gap-2">
            <Box className="col-span-6">
              <TextField
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                label="Start Time"
                type="time"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box className="col-span-6">
              <FormControl fullWidth size="small">
                <InputLabel id="duration-select-label">Duration</InputLabel>
                <Select
                  labelId="duration-select-label"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  label="Duration"
                >
                  <MenuItem value={30}>30 Minutes</MenuItem>
                  <MenuItem value={45}>45 Minutes</MenuItem>
                  <MenuItem value={60}>60 Minutes</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <FormControl fullWidth size="small" disabled={isConsultant}>
            <InputLabel id="agent-host-select-label">Select Agent Host</InputLabel>
            <Select
              labelId="agent-host-select-label"
              value={agents.some(c => c.id === agentId) ? agentId : (agents[0]?.id || '')}
              onChange={(e) => setAgentId(e.target.value)}
              label="Select Agent Host"
            >
              {agents.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name || c.fullName || c.email} {c.role ? `(${c.role})` : ''}
                </MenuItem>
              ))}
              {agents.length === 0 && (
                <MenuItem value="" disabled>
                  No agents available
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <TextField
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            label="Meeting Objectives & Routing Notes"
            multiline
            rows={3}
            fullWidth
            placeholder="Discuss preferred airlines, routing, layover constraints, or quote review..."
          />
        </Box>
      </AppModal>
    </Box>
  );
};

export default SuperAdminCalendarView;
