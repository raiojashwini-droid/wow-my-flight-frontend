import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';

// Icons
import HeadsetIcon from '@mui/icons-material/Headset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import SpeedIcon from '@mui/icons-material/Speed';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SchoolIcon from '@mui/icons-material/School';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// Recharts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

import DualClock from '../../components/DualClock';
import AgentActivityFeed from '../../components/AgentActivityFeed';
import { useAlert } from '../../contexts/AlertContext';
import { teamLeaderDashboardService } from '../../services/phase3Service';

// ==========================================
// DATASETS & LIVE DEFAULTS
// ==========================================

const INITIAL_KPIS = [
  { id: 'leads', title: 'Team Leads', value: '0', change: 'Live DB count', isUp: true, icon: <PeopleIcon sx={{ color: '#3F51B5' }} />, color: '#E8EAF6' },
  { id: 'bookings', title: 'Team Bookings', value: '0', change: 'Live DB count', isUp: true, icon: <AirplaneTicketIcon sx={{ color: 'var(--wd-059669, #059669)' }} />, color: '#ECFDF5' },
  { id: 'revenue', title: 'Team Revenue', value: '$0', change: 'Live DB payments', isUp: true, icon: <MonetizationOnIcon sx={{ color: '#C59B27' }} />, color: '#FFFBEB' },
  { id: 'conversion', title: 'Conversion Rate', value: '0.0%', change: 'Calculated conversion', isUp: true, icon: <TrendingUpIcon sx={{ color: '#2563EB' }} />, color: '#EFF6FF' },
  { id: 'calls', title: 'Total Calls', value: '0', change: 'Floor volume', isUp: true, icon: <PhoneInTalkIcon sx={{ color: '#7C3AED' }} />, color: '#F5F3FF' },
  { id: 'talktime', title: 'Total Talk Time', value: '0h 0m', change: 'Floor volume', isUp: true, icon: <AccessTimeIcon sx={{ color: '#D97706' }} />, color: '#FEF3C7' },
  { id: 'followups', title: 'Pending Follow-ups', value: '0', change: 'Live follow-ups', isUp: false, icon: <HourglassEmptyIcon sx={{ color: '#DC2626' }} />, color: '#FEF2F2' },
  { id: 'sla', title: 'SLA Compliance', value: '100%', change: 'Live compliance', isUp: true, icon: <SpeedIcon sx={{ color: 'var(--wd-059669, #059669)' }} />, color: '#ECFDF5' },
  { id: 'qa', title: 'Booking QA Score', value: '100%', change: 'Audit accuracy', isUp: true, icon: <VerifiedIcon sx={{ color: '#2563EB' }} />, color: '#EFF6FF' },
  { id: 'revPerAgent', title: 'Revenue per Agent', value: '$0', change: 'Live rep avg', isUp: true, icon: <BarChartIcon sx={{ color: '#3F51B5' }} />, color: '#E8EAF6' },
  { id: 'bookPerAgent', title: 'Bookings per Agent', value: '0.0', change: 'Live closed deals', isUp: true, icon: <AssignmentIcon sx={{ color: '#C59B27' }} />, color: '#FFFBEB' }
];

const INITIAL_AGENTS = [];
const INITIAL_FLOOR_MONITORING = [];
const INITIAL_LEADS = [];
const INITIAL_APPROVALS = [];
const INITIAL_ESCALATIONS = [];
const INITIAL_COACHING = [];
const INITIAL_PENDING_PAYMENTS = [];
const REVENUE_TREND_DATA = [];
const CALLS_VS_BOOKINGS_DATA = [];

const QA_RADAR_DATA = [
  { subject: 'Pax & DOB Match', teamAvg: 100, target: 95 },
  { subject: 'Route & Dates Check', teamAvg: 100, target: 95 },
  { subject: 'Baggage Allowance', teamAvg: 100, target: 95 },
  { subject: 'Fare Rule Compliance', teamAvg: 100, target: 95 },
  { subject: 'Payment Verification', teamAvg: 100, target: 95 },
  { subject: 'Agent Notes Quality', teamAvg: 100, target: 95 }
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function TeamLeaderDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showAlert } = useAlert();
  const [currentTab, setCurrentTab] = useState(0);

  // States for sub-modules
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [floorAgents, setFloorAgents] = useState(INITIAL_FLOOR_MONITORING);
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [escalations, setEscalations] = useState(INITIAL_ESCALATIONS);
  const [coachingList, setCoachingList] = useState(INITIAL_COACHING);
  const [pendingPayments, setPendingPayments] = useState(INITIAL_PENDING_PAYMENTS);

  // Filter & Search states
  const [agentSearch, setAgentSearch] = useState('');
  const [agentBadgeFilter, setAgentBadgeFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [leadPriorityFilter, setLeadPriorityFilter] = useState('ALL');
  const [leadStatusFilter, setLeadStatusFilter] = useState('ALL');

  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Modals state
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [distSource, setDistSource] = useState('All Inbound');
  const [distStrategy, setDistStrategy] = useState('Round Robin (Active Agents)');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAgentToAssign, setSelectedAgentToAssign] = useState('');

  const [coachModalOpen, setCoachModalOpen] = useState(false);
  const [coachingAgent, setCoachingAgent] = useState('');
  const [coachingTopic, setCoachingTopic] = useState('');
  const [coachingNotes, setCoachingNotes] = useState('');

  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [escalationResolutionNote, setEscalationResolutionNote] = useState('');

  // Fetch live Team Leader Dashboard data from backend API (/api/team-leader-dashboard)
  React.useEffect(() => {
    let isMounted = true;
    teamLeaderDashboardService.getData().then(data => {
      if (!isMounted || !data) return;
      if (Array.isArray(data.kpis) && data.kpis.length > 0) {
        setKpis(prev => prev.map(k => {
          const match = data.kpis.find(dk => dk.id === k.id);
          return match ? { ...k, value: match.value, change: match.change || k.change } : k;
        }));
      }
      if (Array.isArray(data.agents)) setAgents(data.agents);
      if (Array.isArray(data.floorAgents)) setFloorAgents(data.floorAgents);
      if (Array.isArray(data.leads)) setLeads(data.leads);
      if (Array.isArray(data.approvals)) setApprovals(data.approvals);
      if (Array.isArray(data.escalations)) setEscalations(data.escalations);
      if (Array.isArray(data.coachingList)) setCoachingList(data.coachingList);
      if (Array.isArray(data.pendingPayments)) setPendingPayments(data.pendingPayments);
    }).catch(err => console.warn('Team Leader Dashboard API load warning:', err.message));
    return () => { isMounted = false; };
  }, []);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Discount Handlers
  const handleApproveDiscount = async (id, discount, leadName) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
    await teamLeaderDashboardService.approveDiscount(id);
    showAlert(`✓ Approved $${discount} discount for ${leadName}. Sales Agent notified.`, 'success');
  };

  const handleRejectDiscount = async (id, leadName) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected' } : a));
    await teamLeaderDashboardService.rejectDiscount(id);
    showAlert(`✕ Discount rejected for ${leadName}. Retaining full booking margin.`, 'error');
  };

  const handleCounterOffer = async (id, counterAmount, leadName) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: `Counter $${counterAmount}` } : a));
    await teamLeaderDashboardService.counterDiscount(id, counterAmount);
    showAlert(`Counter-offer of -$${counterAmount} sent to agent for ${leadName}.`, 'warning');
  };

  // Lead Handlers
  const handleDistributeLeads = async () => {
    setDistributeOpen(false);
    setLeads(prev => prev.map(l => l.status === 'Unassigned' ? { ...l, status: 'In Progress', assignedAgent: 'Sarah Jenkins' } : l));
    await teamLeaderDashboardService.distributeLeads(distSource, distStrategy);
    showAlert(`🚀 Unassigned leads distributed via ${distStrategy} from "${distSource}"`, 'success');
  };

  const handleOpenAssign = (lead) => {
    setSelectedLead(lead);
    setSelectedAgentToAssign(lead.assignedAgent !== 'Unassigned' ? lead.assignedAgent : 'Sarah Jenkins');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedLead || !selectedAgentToAssign) return;
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, assignedAgent: selectedAgentToAssign, status: 'In Progress' } : l));
    await teamLeaderDashboardService.assignLead(selectedLead.id, selectedAgentToAssign);
    setAssignModalOpen(false);
    showAlert(`Lead ${selectedLead.id} (${selectedLead.customerName}) assigned to ${selectedAgentToAssign}`, 'success');
  };

  // Coaching Handlers
  const handleOpenCoach = (agentName) => {
    setCoachingAgent(agentName);
    setCoachingTopic('Booking QA & Fare Rules Review');
    setCoachingNotes('');
    setCoachModalOpen(true);
  };

  const handleSaveCoaching = async () => {
    if (!coachingAgent || !coachingTopic) return;
    const newSession = {
      id: `COACH-0${coachingList.length + 1}`,
      agent: coachingAgent,
      date: new Date().toISOString().split('T')[0],
      topic: coachingTopic,
      mistakeType: 'Procedural QA Coaching',
      scoreImpact: '+5% Projected',
      status: 'Completed',
      notes: coachingNotes || 'General performance & QA guidelines aligned.'
    };
    setCoachingList([newSession, ...coachingList]);
    await teamLeaderDashboardService.scheduleCoaching(newSession);
    setCoachModalOpen(false);
    showAlert(`Coaching session recorded and marked completed for ${coachingAgent}`, 'success');
  };

  // Escalation Handlers
  const handleOpenResolveEscalation = (esc) => {
    setSelectedEscalation(esc);
    setEscalationResolutionNote('');
    setEscalationModalOpen(true);
  };

  const handleConfirmResolveEscalation = async () => {
    if (!selectedEscalation) return;
    setEscalations(prev => prev.map(e => e.id === selectedEscalation.id ? { ...e, status: 'Resolved', notes: `${e.notes} [RESOLVED: ${escalationResolutionNote || 'Resolved by Team Leader'}]` } : e));
    await teamLeaderDashboardService.resolveEscalation(selectedEscalation.id, escalationResolutionNote);
    setEscalationModalOpen(false);
    showAlert(`Escalation ${selectedEscalation.id} for ${selectedEscalation.leadName} marked as Resolved!`, 'success');
  };

  const handleReassignEscalation = (escId, currentAgent) => {
    const nextAgent = currentAgent === 'Sarah Jenkins' ? 'Alex Miller' : 'Sarah Jenkins';
    setEscalations(prev => prev.map(e => e.id === escId ? { ...e, assignedAgent: nextAgent, notes: `${e.notes} [Reassigned to Senior Agent ${nextAgent}]` } : e));
    showAlert(`Escalation ${escId} reassigned to ${nextAgent}`, 'info');
  };

  // Payment Handlers
  const handleSendReminder = async (customer, channel) => {
    const payItem = pendingPayments.find(p => p.customer === customer);
    if (payItem) {
      await teamLeaderDashboardService.sendPaymentReminder(payItem.id, channel);
    }
    showAlert(`Payment reminder sent to ${customer} via ${channel}!`, 'success');
  };

  const handleEscalateToFinance = (bookingId, customer) => {
    showAlert(`Booking ${bookingId} (${customer}) escalated to Finance Recovery Queue`, 'warning');
  };

  // Filtered Agent Performance Data
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(agentSearch.toLowerCase()) || agent.role.toLowerCase().includes(agentSearch.toLowerCase());
      const matchesBadge = agentBadgeFilter === 'ALL' || agent.badge === agentBadgeFilter;
      return matchesSearch && matchesBadge;
    });
  }, [agents, agentSearch, agentBadgeFilter]);

  // Filtered Leads Data
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesPriority = leadPriorityFilter === 'ALL' || lead.priority === leadPriorityFilter;
      const matchesStatus = leadStatusFilter === 'ALL' || lead.status === leadStatusFilter;
      return matchesPriority && matchesStatus;
    });
  }, [leads, leadPriorityFilter, leadStatusFilter]);

  // Filtered Pending Payments Data
  const filteredPayments = useMemo(() => {
    return pendingPayments.filter(pay => {
      if (paymentFilter === 'ALL') return true;
      return pay.status === paymentFilter;
    });
  }, [pendingPayments, paymentFilter]);

  const pendingApprovals = approvals.filter(a => a.status.startsWith('Pending'));

  return (
    <Box sx={{ pb: 5, minHeight: '100vh' }}>
      
      {/* Top Header Card with Command Center Identity */}
      <Paper elevation={0} sx={{ p: 2, px: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 900 }}>
            TL
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                Team Leader Command Centre
              </Typography>
              <Chip label="ROLE: TEAM LEADER" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Live Flight Operations, Agent QA Oversight, Floor Escalations & Revenue Monitoring
            </Typography>
          </Box>
        </Box>
        <DualClock client={{ timezone: 'America/New_York', label: 'Client Time (EST)' }} />
      </Paper>

      {/* 11 TOP KPI METRICS CARDS */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 1.5 }}>
          {INITIAL_KPIS.map((kpi) => (
            <Paper
              key={kpi.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.06)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  {kpi.title}
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.hover' : kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                  {kpi.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  {kpi.isUp ? (
                    <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.isUp ? 'success.main' : 'error.main', fontSize: '0.65rem' }}>
                    {kpi.change}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Activity Feed Bar */}
      <AgentActivityFeed agents={floorAgents} />

      {/* DASHBOARD MODULE TABS */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.78rem',
              py: 1.8,
              minHeight: 48,
              textTransform: 'none'
            }
          }}
        >
          <Tab label="1. Overview & Live Floor" icon={<HeadsetIcon fontSize="small" />} iconPosition="start" />
          <Tab label="2. Agent Performance Table" icon={<PeopleIcon fontSize="small" />} iconPosition="start" />
          <Tab label="3. Lead Management & Assignment" icon={<AssignmentIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`4. Discount Approvals (${pendingApprovals.length})`} icon={<MonetizationOnIcon fontSize="small" />} iconPosition="start" />
          <Tab label="5. Escalation Center" icon={<WarningAmberIcon fontSize="small" />} iconPosition="start" />
          <Tab label="6. Coaching & QA Tracker" icon={<SchoolIcon fontSize="small" />} iconPosition="start" />
          <Tab label="7. Pending Payments" icon={<PaymentIcon fontSize="small" />} iconPosition="start" />
          <Tab label="8. Team Analytics" icon={<BarChartIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & LIVE FLOOR CALL MONITORING */}
      {/* ========================================================= */}
      {currentTab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5 }}>
          {/* Left Side: Live Call Floor & Quick Stats */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HeadsetIcon color="primary" />
                    LIVE FLOOR AGENT CALL MONITORING
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Real-time rep status, active call durations, and QA audio listen-in controls
                  </Typography>
                </Box>
                <Chip label="8 Agents Monitored" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {floorAgents.map((agent) => (
                  <Paper
                    key={agent.id}
                    variant="outlined"
                    sx={{
                      p: 1.8,
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      bgcolor: isDark
                        ? agent.status === 'ON CALL'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : agent.status === 'WRAP UP'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : agent.status === 'IDLE'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : agent.status === 'ON BREAK'
                          ? 'rgba(148, 163, 184, 0.1)'
                          : 'background.paper'
                        : agent.status === 'ON CALL'
                        ? '#F0FDF4'
                        : agent.status === 'WRAP UP'
                        ? '#FFFBEB'
                        : '#F8FAFC',
                      borderColor: isDark
                        ? agent.status === 'ON CALL'
                          ? 'rgba(16, 185, 129, 0.35)'
                          : agent.status === 'WRAP UP'
                          ? 'rgba(245, 158, 11, 0.35)'
                          : agent.status === 'IDLE'
                          ? 'rgba(239, 68, 68, 0.35)'
                          : 'divider'
                        : agent.status === 'ON CALL'
                        ? '#BBF7D0'
                        : agent.status === 'WRAP UP'
                        ? '#FDE68A'
                        : '#E2E8F0'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 900, bgcolor: agent.status === 'ON CALL' ? 'success.main' : 'primary.main' }}>
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {agent.currentLead} • <span style={{ color: isDark ? '#F87171' : '#DC2626', fontWeight: 700 }}>({agent.timeOnStatus})</span>
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={agent.status} size="small" color={agent.color} sx={{ height: 22, fontSize: '0.65rem', fontWeight: 900 }} />
                      {agent.status === 'ON CALL' && (
                        <Tooltip title="Listen to live call / Audio QA Barge">
                          <Button size="small" variant="contained" color="success" onClick={() => showAlert(`Listening into ${agent.name}'s live call with customer (${agent.currentLead})`, 'info')} sx={{ fontSize: '0.68rem', fontWeight: 800, py: 0.4 }}>
                            🎧 Listen
                          </Button>
                        </Tooltip>
                      )}
                      <Button size="small" variant="outlined" color="primary" onClick={() => handleOpenCoach(agent.name)} sx={{ fontSize: '0.68rem', fontWeight: 700, py: 0.4 }}>
                        Coach
                      </Button>
                      <Button size="small" variant="text" onClick={() => showAlert(`Message prompt sent to ${agent.name}`, 'info')} sx={{ fontSize: '0.68rem', fontWeight: 700, minWidth: 0, p: 0.5 }}>
                        💬
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>

            {/* Urgent Lead Queue Card */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  🚨 URGENT SLA & NEGLECTED LEADS QUEUE
                </Typography>
                <Chip label="High Priority" size="small" color="error" sx={{ fontWeight: 800 }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2.5 }}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: 'background.neutral' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Unassigned Leads</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>{leads.filter(l => l.status === 'Unassigned').length}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: isDark ? 'rgba(14, 165, 233, 0.12)' : '#F0F9FF', borderColor: isDark ? 'rgba(14, 165, 233, 0.35)' : '#BAE6FD' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0284C7' }}>Inbound VIPs</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#38BDF8' : '#0369A1' }}>3</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#F87171' : '#DC2626' }}>Max Wait Time</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#F87171' : '#B91C1C' }}>23 min</Typography>
                </Paper>
              </Box>
              <Button variant="contained" fullWidth color="primary" onClick={() => setDistributeOpen(true)} sx={{ fontWeight: 800, py: 1 }}>
                🚀 Smart Distribute Unassigned Leads
              </Button>
            </Paper>
          </Box>

          {/* Right Side: Quick Approvals & Daily Mini Charts */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Quick Discount Desk Preview */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'divider', borderRadius: 3, bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#B45309' }}>
                  💰 DISCOUNT APPROVALS WAITING ({pendingApprovals.length})
                </Typography>
                <Button size="small" variant="text" onClick={() => setCurrentTab(3)} sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                  View All
                </Button>
              </Box>

              {pendingApprovals.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>
                    All discounts resolved!
                  </Typography>
                </Box>
              ) : (
                pendingApprovals.slice(0, 2).map((app) => (
                  <Paper key={app.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2, bgcolor: 'background.paper', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {app.agent} ➔ {app.customer}
                      </Typography>
                      <Chip label={`-$${app.requestedDiscount}`} size="small" color="error" sx={{ fontWeight: 900, height: 20, fontSize: '0.68rem' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Route: <b>{app.sector}</b> | Margin Remaining: <b style={{ color: '#10B981' }}>${app.marginAfterDiscount}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 1.5, p: 0.8, bgcolor: 'background.neutral', borderRadius: 1.5, color: 'text.secondary' }}>
                      "{app.reason}"
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                      <Button size="small" variant="contained" color="success" onClick={() => handleApproveDiscount(app.id, app.requestedDiscount, app.customer)} sx={{ fontWeight: 800, fontSize: '0.7rem' }}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleRejectDiscount(app.id, app.customer)} sx={{ fontWeight: 800, fontSize: '0.7rem' }}>
                        Reject
                      </Button>
                    </Box>
                  </Paper>
                ))
              )}
            </Paper>

            {/* Mini Revenue Overview Chart */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                📈 TEAM WEEKLY REVENUE TREND
              </Typography>
              <Box sx={{ height: 200, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={REVENUE_TREND_DATA}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3F51B5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3F51B5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <YAxis tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#3F51B5" fillOpacity={1} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AGENT PERFORMANCE TABLE */}
      {/* ========================================================= */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Sales Floor Agent Performance Table
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track conversion %, calls completed, total talk time, QA score audits, and SLA compliance
              </Typography>
            </Box>

            {/* Filter and Search Bar */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search agent name or role..."
                value={agentSearch}
                onChange={e => setAgentSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ width: { xs: '100%', sm: 240 } }}
              />
              <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
                <InputLabel>Performance Tier</InputLabel>
                <Select value={agentBadgeFilter} label="Performance Tier" onChange={e => setAgentBadgeFilter(e.target.value)}>
                  <MenuItem value="ALL">All Tiers</MenuItem>
                  <MenuItem value="Top Performer">Top Performers</MenuItem>
                  <MenuItem value="Consistent">Consistent</MenuItem>
                  <MenuItem value="Needs Coaching">Needs Coaching</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: 950 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Agent Name</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Assigned Leads</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Active Bookings</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Revenue ($)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Conversion %</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Calls Done</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Talk Time</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Follow-ups</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>QA Score</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>SLA Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((agent) => (
                  <TableRow key={agent.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.72rem', fontWeight: 900, bgcolor: agent.badge === 'Top Performer' ? '#C59B27' : 'primary.main' }}>
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {agent.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={agent.badge}
                            color={agent.badge === 'Top Performer' ? 'secondary' : agent.badge === 'Needs Coaching' ? 'warning' : 'default'}
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{agent.assignedLeads}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'primary.main' }}>{agent.activeBookings}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)' }}>${agent.revenue.toLocaleString()}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{agent.conversion}%</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{agent.callsCompleted}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{agent.talkTime}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: agent.pendingFollowups > 4 ? '#DC2626' : 'inherit' }}>
                      {agent.pendingFollowups}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: agent.qaScore >= 95 ? '#059669' : '#D97706' }}>
                          {agent.qaScore}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={agent.slaStatus}
                        size="small"
                        color={agent.slaStatus === 'On Track' ? 'success' : agent.slaStatus === 'At Risk' ? 'warning' : 'error'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined" color="primary" onClick={() => handleOpenCoach(agent.name)} sx={{ fontSize: '0.68rem', fontWeight: 800, py: 0.4 }}>
                        Coach Rep
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10]}
            component="div"
            count={filteredAgents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LEAD MANAGEMENT & ASSIGNMENT */}
      {/* ========================================================= */}
      {currentTab === 2 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Lead Assignment & Distribution Hub
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign inbound leads, reassign stalled prospects between agents, and manage capacity
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={leadPriorityFilter} label="Priority" onChange={e => setLeadPriorityFilter(e.target.value)}>
                  <MenuItem value="ALL">All Priorities</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Normal">Normal</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={leadStatusFilter} label="Status" onChange={e => setLeadStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Quoted">Quoted</MenuItem>
                  <MenuItem value="Stalled">Stalled</MenuItem>
                </Select>
              </FormControl>

              <Button variant="contained" color="primary" onClick={() => setDistributeOpen(true)} startIcon={<PersonAddIcon />} sx={{ fontWeight: 800 }}>
                Auto Distribute
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Lead ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Destination / Route</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Travel Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Lead Source</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Assigned Agent</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{lead.id}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{lead.customerName} ({lead.pax} Pax)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>{lead.destination}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{lead.travelDate}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{lead.source}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={lead.priority}
                        size="small"
                        color={lead.priority === 'VIP' ? 'secondary' : lead.priority === 'Urgent' ? 'error' : lead.priority === 'High' ? 'warning' : 'default'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: lead.assignedAgent === 'Unassigned' ? '#DC2626' : 'text.primary' }}>
                      {lead.assignedAgent}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={lead.status}
                        size="small"
                        color={lead.status === 'Unassigned' ? 'error' : lead.status === 'Stalled' ? 'warning' : 'info'}
                        variant="outlined"
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant={lead.assignedAgent === 'Unassigned' ? 'contained' : 'outlined'}
                        color={lead.assignedAgent === 'Unassigned' ? 'primary' : 'secondary'}
                        onClick={() => handleOpenAssign(lead)}
                        startIcon={lead.assignedAgent === 'Unassigned' ? <PersonAddIcon /> : <SwapHorizIcon />}
                        sx={{ fontSize: '0.68rem', fontWeight: 800, py: 0.4 }}
                      >
                        {lead.assignedAgent === 'Unassigned' ? 'Assign' : 'Reassign'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DISCOUNT & SPECIAL PRICING APPROVALS */}
      {/* ========================================================= */}
      {currentTab === 3 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#B45309' }}>
                Discount & Special Pricing Approvals Desk
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review margin exceptions requested by agents before ticketing and contract issuance
              </Typography>
            </Box>
            <Chip label={`${pendingApprovals.length} Pending Approval`} color={pendingApprovals.length > 0 ? "warning" : "success"} sx={{ fontWeight: 800 }} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {approvals.map((app) => (
              <Paper
                key={app.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: isDark
                    ? app.status === 'Approved'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : app.status === 'Rejected'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(245, 158, 11, 0.08)'
                    : app.status === 'Approved'
                    ? '#F0FDF4'
                    : app.status === 'Rejected'
                    ? '#FEF2F2'
                    : '#FFFDF9',
                  borderColor: isDark
                    ? app.status === 'Approved'
                      ? 'rgba(16, 185, 129, 0.35)'
                      : app.status === 'Rejected'
                      ? 'rgba(239, 68, 68, 0.35)'
                      : 'rgba(245, 158, 11, 0.35)'
                    : app.status === 'Approved'
                    ? '#86EFAC'
                    : app.status === 'Rejected'
                    ? '#FCA5A5'
                    : '#F59E0B'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                    {app.bookingId} • {app.customer}
                  </Typography>
                  <Chip
                    label={app.status}
                    size="small"
                    color={app.status === 'Approved' ? 'success' : app.status === 'Rejected' ? 'error' : 'warning'}
                    sx={{ fontWeight: 800 }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 0.8, fontSize: 13, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Sales Agent:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>{app.agent}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Flight Sector:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>{app.sector} ({app.cabin})</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Original Price:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>${app.originalPrice}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Requested Discount:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#DC2626' }}>-${app.requestedDiscount}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Final Price:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)' }}>${app.finalPrice}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Margin Left:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563EB' }}>+${app.marginAfterDiscount}</Typography>
                </Box>

                <Paper variant="outlined" sx={{ p: 1.2, mb: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.2 }}>Agent Reason:</Typography>
                  <Typography variant="caption" sx={{ fontStyle: 'italic', fontWeight: 600 }}>"{app.reason}"</Typography>
                </Paper>

                {app.status === 'Pending' ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                    <Button variant="contained" color="success" size="small" onClick={() => handleApproveDiscount(app.id, app.requestedDiscount, app.customer)} sx={{ fontWeight: 800 }}>
                      Approve
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleRejectDiscount(app.id, app.customer)} sx={{ fontWeight: 800 }}>
                      Reject
                    </Button>
                    <Button variant="outlined" color="warning" size="small" onClick={() => handleCounterOffer(app.id, Math.round(app.requestedDiscount / 2), app.customer)} sx={{ gridColumn: 'span 2', fontWeight: 700 }}>
                      Counter Offer (-${Math.round(app.requestedDiscount / 2)})
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', fontWeight: 800, color: 'text.secondary' }}>
                    Decision Recorded
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ESCALATION CENTER */}
      {/* ========================================================= */}
      {currentTab === 4 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F87171' : '#DC2626', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberIcon color="error" />
                Floor Escalation Center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolve high-risk lead escalations, customer complaints, and route issues
              </Typography>
            </Box>
            <Chip label={`${escalations.filter(e => e.status !== 'Resolved').length} Active Escalations`} color="error" sx={{ fontWeight: 800 }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {escalations.map((esc) => (
              <Paper
                key={esc.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  borderColor: isDark
                    ? esc.status === 'Resolved'
                      ? 'rgba(16, 185, 129, 0.35)'
                      : esc.priority === 'Critical'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'divider'
                    : esc.status === 'Resolved'
                    ? '#86EFAC'
                    : esc.priority === 'Critical'
                    ? '#EF4444'
                    : 'divider',
                  bgcolor: isDark
                    ? esc.status === 'Resolved'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : esc.priority === 'Critical'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'background.paper'
                    : esc.status === 'Resolved'
                    ? '#F0FDF4'
                    : esc.priority === 'Critical'
                    ? '#FFF5F5'
                    : '#FFFFFF'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      {esc.id} • {esc.leadName}
                    </Typography>
                    <Chip
                      label={esc.priority}
                      size="small"
                      color={esc.priority === 'Critical' ? 'error' : esc.priority === 'High' ? 'warning' : 'default'}
                      sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                    />
                    <Chip
                      label={esc.status}
                      size="small"
                      color={esc.status === 'Resolved' ? 'success' : 'error'}
                      sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Reported: {esc.date} • Rep: <b>{esc.assignedAgent}</b>
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626', mb: 1 }}>
                  Reason: {esc.reason}
                </Typography>

                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.2 }}>Case Details & Notes:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{esc.notes}</Typography>
                </Paper>

                {esc.status !== 'Resolved' && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" color="success" size="small" onClick={() => handleOpenResolveEscalation(esc)} startIcon={<CheckCircleIcon />} sx={{ fontWeight: 800 }}>
                      Resolve Escalation
                    </Button>
                    <Button variant="outlined" color="primary" size="small" onClick={() => handleReassignEscalation(esc.id, esc.assignedAgent)} startIcon={<SwapHorizIcon />} sx={{ fontWeight: 700 }}>
                      Reassign to Senior Agent
                    </Button>
                    <Button variant="outlined" color="secondary" size="small" onClick={() => handleOpenCoach(esc.assignedAgent)} startIcon={<SchoolIcon />} sx={{ fontWeight: 700 }}>
                      Coach Agent on Incident
                    </Button>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 6: COACHING & QA TRACKER */}
      {/* ========================================================= */}
      {currentTab === 5 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
          {/* Coaching Sessions History */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  AGENT COACHING & MISTAKE AUDITS
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Track 1-on-1 coaching logs and QA improvement targets
                </Typography>
              </Box>
              <Button variant="contained" size="small" color="primary" onClick={() => handleOpenCoach('Sarah Jenkins')} startIcon={<SchoolIcon />} sx={{ fontWeight: 800 }}>
                Log Session
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {coachingList.map((c) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {c.agent} • <span style={{ color: '#2563EB' }}>{c.topic}</span>
                    </Typography>
                    <Chip label={c.status} size="small" color="success" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.8 }}>
                    Date: {c.date} • Root Cause: <b style={{ color: '#DC2626' }}>{c.mistakeType}</b> ({c.scoreImpact})
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', bgcolor: 'background.paper', p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    "{c.notes}"
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>

          {/* QA Score Audit & Checklist Performance */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
              🎯 TEAM QA CHECKLIST COMPLIANCE RADAR
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 600 }}>
              Average compliance rates across all 14 mandatory booking QA checkpoints
            </Typography>
            
            <Box sx={{ height: 280, width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart data={QA_RADAR_DATA}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[60, 100]} />
                  <Radar name="Team Avg %" dataKey="teamAvg" stroke="#3F51B5" fill="#3F51B5" fillOpacity={0.5} />
                  <Radar name="Target %" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  <Legend />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Top Recurring Booking Errors (Floor Alert):
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>1. Baggage inclusion misbriefed on Economy Light</Typography>
                <Chip label="12% frequency" size="small" color="error" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>2. Missing passport expiry check (&lt; 6 months)</Typography>
                <Chip label="8% frequency" size="small" color="warning" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>3. Delayed confirmation email trigger</Typography>
                <Chip label="5% frequency" size="small" color="warning" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 7: PENDING PAYMENTS MONITOR */}
      {/* ========================================================= */}
      {currentTab === 6 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)' }}>
                Pending Payments & Balance Due Monitor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track open customer balances, overdue deposits, and trigger automated WhatsApp/Email reminders
              </Typography>
            </Box>

            <FormControl size="small" sx={{ width: 160 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select value={paymentFilter} label="Payment Status" onChange={e => setPaymentFilter(e.target.value)}>
                <MenuItem value="ALL">All Payments</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
                <MenuItem value="Due Today">Due Today</MenuItem>
                <MenuItem value="Upcoming">Upcoming</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Payment ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Booking Ref</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Total Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Paid Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Pending Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Due Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((pay) => (
                  <TableRow key={pay.id} hover>
                    <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{pay.id}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{pay.customer}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>{pay.bookingId}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${pay.totalAmount.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--wd-059669, #059669)' }}>${pay.paidAmount.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: pay.pendingAmount > 0 ? '#DC2626' : '#059669' }}>
                      ${pay.pendingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{pay.dueDate}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={pay.status}
                        size="small"
                        color={pay.status === 'Paid' ? 'success' : pay.status === 'Overdue' ? 'error' : pay.status === 'Due Today' ? 'warning' : 'default'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {pay.pendingAmount > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center' }}>
                          <Tooltip title="Send WhatsApp Reminder">
                            <Button size="small" variant="contained" color="success" onClick={() => handleSendReminder(pay.customer, 'WhatsApp')} sx={{ minWidth: 0, p: 0.6, fontSize: '0.7rem' }}>
                              <WhatsAppIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Send Email Reminder">
                            <Button size="small" variant="outlined" color="primary" onClick={() => handleSendReminder(pay.customer, 'Email')} sx={{ minWidth: 0, p: 0.6, fontSize: '0.7rem' }}>
                              <EmailIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Escalate to Finance Recovery">
                            <Button size="small" variant="outlined" color="error" onClick={() => handleEscalateToFinance(pay.bookingId, pay.customer)} sx={{ minWidth: 0, p: 0.6, fontSize: '0.7rem' }}>
                              ⚠️
                            </Button>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'var(--wd-059669, #059669)', fontWeight: 800 }}>
                          ✓ Completed
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 8: TEAM ANALYTICS */}
      {/* ========================================================= */}
      {currentTab === 7 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Top 2 Charts Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
            {/* Chart 1: Revenue vs Target */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                📊 TEAM DAILY REVENUE VS TARGET ($)
              </Typography>
              <Box sx={{ height: 260, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={REVENUE_TREND_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'} />
                    <XAxis dataKey="day" tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="Actual Revenue ($)" fill="#3F51B5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target ($)" fill="#C59B27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* Chart 2: Calls vs Conversion */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                📞 CALL VOLUME VS BOOKING CONVERSION %
              </Typography>
              <Box sx={{ height: 260, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ComposedChart data={CALLS_VS_BOOKINGS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'} />
                    <XAxis dataKey="agent" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <YAxis yAxisId="left" orientation="left" stroke="#3F51B5" tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="calls" name="Calls Done" fill="#3F51B5" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="conv" name="Conversion %" stroke="#10B981" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          {/* Bottom Chart: Revenue per Agent Bar Chart */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
              🏆 REVENUE GENERATED PER SALES AGENT ($)
            </Typography>
            <Box sx={{ height: 280, width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={agents} layout="vertical" margin={{ left: 40, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'} />
                  <XAxis type="number" tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                  <RechartsTooltip />
                  <Bar dataKey="revenue" name="Total Revenue ($)" fill="#059669" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. SMART LEAD DISTRIBUTION MODAL */}
      <Dialog
        open={distributeOpen}
        onClose={() => setDistributeOpen(false)}
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
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', py: 2, px: { xs: 2, sm: 3 }, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          🚀 Smart Inbound Lead Distribution
        </DialogTitle>
        <DialogContent
          className="modal-scroll"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: 2.5,
            pb: 2,
            px: { xs: 2, sm: 3 },
            maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
            overflowY: 'auto',
            overflowX: 'hidden',
            flexGrow: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Select inbound lead channel and automated distribution algorithm:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Lead Source Channel</InputLabel>
            <Select value={distSource} label="Lead Source Channel" onChange={e => setDistSource(e.target.value)}>
              <MenuItem value="All Inbound">All Inbound Channels (15 Leads)</MenuItem>
              <MenuItem value="Google Ads">Google Ads Flight Campaigns (8 Leads)</MenuItem>
              <MenuItem value="Meta / WhatsApp">Meta & WhatsApp Inbound (4 Leads)</MenuItem>
              <MenuItem value="Website Organic">Website Organic Searches (3 Leads)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Distribution Strategy</InputLabel>
            <Select value={distStrategy} label="Distribution Strategy" onChange={e => setDistStrategy(e.target.value)}>
              <MenuItem value="Round Robin (Active Agents)">Round Robin (Active Reps Only)</MenuItem>
              <MenuItem value="Skill Based (Route Expertise)">Skill Based (US/UK to Senior Reps)</MenuItem>
              <MenuItem value="Capacity Weighted">Capacity Weighted (Fill Inactive Reps)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDistributeOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDistributeLeads} variant="contained" color="primary" sx={{ fontWeight: 800 }}>
            Distribute Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. LEAD ASSIGN / REASSIGN MODAL */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            mx: { xs: 1.5, sm: 3 },
            my: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: '85vh' },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', py: 2, px: { xs: 2, sm: 3 }, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          👤 Assign / Reallocate Lead
        </DialogTitle>
        <DialogContent
          className="modal-scroll"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: 2.5,
            pb: 2,
            px: { xs: 2, sm: 3 },
            maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
            overflowY: 'auto',
            overflowX: 'hidden',
            flexGrow: 1,
          }}
        >
          {selectedLead && (
            <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedLead.customerName}</Typography>
              <Typography variant="caption" color="text.secondary">
                Route: <b>{selectedLead.destination}</b> | Priority: <b>{selectedLead.priority}</b>
              </Typography>
            </Box>
          )}

          <FormControl fullWidth size="small">
            <InputLabel>Select Target Agent</InputLabel>
            <Select value={selectedAgentToAssign} label="Select Target Agent" onChange={e => setSelectedAgentToAssign(e.target.value)}>
              {agents.map(a => (
                <MenuItem key={a.id} value={a.name}>
                  {a.name} ({a.badge} - {a.activeBookings} Active Deals)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAssignModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmAssign} variant="contained" color="primary" sx={{ fontWeight: 800 }}>
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. COACH AGENT MODAL */}
      <Dialog
        open={coachModalOpen}
        onClose={() => setCoachModalOpen(false)}
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
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, py: 2, px: { xs: 2, sm: 3 }, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <SchoolIcon /> Log 1-on-1 Coaching Session
        </DialogTitle>
        <DialogContent
          className="modal-scroll"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: 2.5,
            pb: 2,
            px: { xs: 2, sm: 3 },
            maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
            overflowY: 'auto',
            overflowX: 'hidden',
            flexGrow: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Document coaching notes, QA checklist feedback, and targeted improvements for this sales agent:
          </Typography>

          <TextField
            label="Agent Name"
            size="small"
            value={coachingAgent}
            onChange={e => setCoachingAgent(e.target.value)}
            fullWidth
          />

          <TextField
            label="Coaching Topic / Focus Area"
            size="small"
            value={coachingTopic}
            onChange={e => setCoachingTopic(e.target.value)}
            fullWidth
          />

          <TextField
            label="Coaching Notes & Action Items"
            size="small"
            multiline
            rows={4}
            value={coachingNotes}
            onChange={e => setCoachingNotes(e.target.value)}
            placeholder="E.g., Briefed on verifying baggage allowance in Sabre before quoting economy saver fares. Target: 100% QA on next 5 bookings."
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setCoachModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveCoaching} variant="contained" color="success" sx={{ fontWeight: 800 }}>
            Save & Complete Coaching
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. RESOLVE ESCALATION MODAL */}
      <Dialog
        open={escalationModalOpen}
        onClose={() => setEscalationModalOpen(false)}
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
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'var(--wd-059669, #059669)', display: 'flex', alignItems: 'center', gap: 1, py: 2, px: { xs: 2, sm: 3 }, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <CheckCircleIcon /> Resolve Floor Escalation
        </DialogTitle>
        <DialogContent
          className="modal-scroll"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: 2.5,
            pb: 2,
            px: { xs: 2, sm: 3 },
            maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
            overflowY: 'auto',
            overflowX: 'hidden',
            flexGrow: 1,
          }}
        >
          {selectedEscalation && (
            <Box sx={{ p: 1.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DC2626' }}>
                {selectedEscalation.id} • {selectedEscalation.leadName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Reason: <b>{selectedEscalation.reason}</b>
              </Typography>
            </Box>
          )}

          <TextField
            label="Resolution Action & Supervisor Notes"
            size="small"
            multiline
            rows={3}
            value={escalationResolutionNote}
            onChange={e => setEscalationResolutionNote(e.target.value)}
            placeholder="Describe the solution provided to customer (e.g. matched competitor fare, waived reissue fee, or updated routing)..."
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setEscalationModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmResolveEscalation} variant="contained" color="success" sx={{ fontWeight: 800 }}>
            Mark Escalation Resolved
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
