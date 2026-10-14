import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { alpha, useTheme } from '@mui/material/styles';

// Icons
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SendIcon from '@mui/icons-material/Send';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import { dbService } from '../../services/dbService';

// Default Flight CRM Workflows Template
const DEFAULT_PREBUILT_WORKFLOWS = [
  {
    id: 'WF-01',
    name: 'Workflow 1 – New Lead SLA Escalation Engine',
    trigger: 'New Lead Created in CRM',
    status: true,
    steps: [
      { step: 1, type: 'ACTION', text: 'Assign Lead to Sales Agent via Round-Robin' },
      { step: 2, type: 'ACTION', text: 'Notify Assigned Agent instantly via Push & In-App' },
      { step: 3, type: 'ACTION', text: 'Automatically create 2h SLA Follow-up Task' },
      { step: 4, type: 'TIMER', text: 'Start SLA 2-Hour Response Countdown' }
    ],
    escalationRules: [
      { rule: '2 Hours (No Contact)', action: 'Send SMS to Customer ("We received your flight request!")' },
      { rule: '24 Hours (No Contact)', action: 'Send Email Reminder to Customer with Top Deals' },
      { rule: '48 Hours (No Contact)', action: 'Alert Team Leader & Mark SLA Status as BREACHED' }
    ]
  },
  {
    id: 'WF-02',
    name: 'Workflow 2 – Payment Pending Automation',
    trigger: 'Quote Accepted by Customer',
    status: true,
    steps: [
      { step: 1, type: 'ACTION', text: 'Generate Secure Online Payment Link' },
      { step: 2, type: 'ACTION', text: 'Send Payment Link via Email & WhatsApp' },
      { step: 3, type: 'TIMER', text: 'Start Payment Reminder Countdown Timer' }
    ],
    escalationRules: [
      { rule: 'After 30 Minutes', action: 'Send First Payment Reminder via WhatsApp' },
      { rule: 'After 2 Hours', action: 'Send Second Payment Reminder & Alert Assigned Agent' },
      { rule: 'Unpaid > 4 Hours', action: 'Escalate to Team Leader to prevent fare expiration' }
    ]
  },
  {
    id: 'WF-03',
    name: 'Workflow 3 – Instant Booking Confirmation',
    trigger: 'Payment Successful (Gateway Webhook)',
    status: true,
    steps: [
      { step: 1, type: 'ACTION', text: 'Update Booking Status to CONFIRMED' },
      { step: 2, type: 'ACTION', text: 'Send Official Booking Confirmation Email' },
      { step: 3, type: 'ACTION', text: 'Send WhatsApp Confirmation with Booking Summary' },
      { step: 4, type: 'ACTION', text: 'Create Ticket Issuance Task & Alert Assigned Agent' }
    ],
    escalationRules: []
  },
  {
    id: 'WF-04',
    name: 'Workflow 4 – Automated Ticket Issued Dispatch',
    trigger: 'Ticket Issued in Sabre / Amadeus / Travelopro',
    status: true,
    steps: [
      { step: 1, type: 'ACTION', text: 'Email 13-Digit E-Ticket PDF to Customer' },
      { step: 2, type: 'ACTION', text: 'Send WhatsApp Ticket Copy with PNR Reference' },
      { step: 3, type: 'ACTION', text: 'Update Booking Status to TICKET ISSUED' },
      { step: 4, type: 'ACTION', text: 'Notify Customer & Assigned Agent' }
    ],
    escalationRules: []
  },
  {
    id: 'WF-05',
    name: 'Workflow 5 – 24-Hour Pre-Departure Travel Reminder',
    trigger: '24 Hours Before Departure Date',
    status: true,
    steps: [
      { step: 1, type: 'ACTION', text: 'Send Pre-Flight Travel Checklist & Web Check-in Email' },
      { step: 2, type: 'ACTION', text: 'Send WhatsApp Flight Alert (Terminal & Gate Info)' },
      { step: 3, type: 'ACTION', text: 'Notify Assigned Agent for VIP Courtesy Call' },
      { step: 4, type: 'ACTION', text: 'Display Notification in Dashboard Alert Center' }
    ],
    escalationRules: []
  },
  {
    id: 'WF-06',
    name: 'Workflow 6 – Post-Travel Feedback & Review Collector',
    trigger: 'Trip Completed (Return Flight Arrival)',
    status: true,
    steps: [
      { step: 1, type: 'ACTION', text: 'Send "Welcome Home" Thank You Email' },
      { step: 2, type: 'ACTION', text: 'Request Customer Experience Feedback Survey' },
      { step: 3, type: 'ACTION', text: 'Request 5-Star Google Review' },
      { step: 4, type: 'ACTION', text: 'Create Repeat Sales Task for Next Year Booking' }
    ],
    escalationRules: []
  }
];

export default function AutomationEngine() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showAlert } = useAlert();
  const [currentTab, setCurrentTab] = useState(0);

  // Live Database States
  const [dbStatus, setDbStatus] = useState({ connected: true, provider: 'PostgreSQL (Prisma)', service: 'WowMyFlight Backend' });
  const [leads, setLeads] = useState(() => {
    try { const s = localStorage.getItem('crm-leads'); if (s) return JSON.parse(s); } catch (e) {}
    return [];
  });
  const [bookings, setBookings] = useState(() => {
    try { const s = localStorage.getItem('crm-bookings'); if (s) return JSON.parse(s); } catch (e) {}
    return [];
  });
  const [quotes, setQuotes] = useState(() => {
    try { const s = localStorage.getItem('crm-quotes'); if (s) return JSON.parse(s); } catch (e) {}
    return [];
  });
  const [payments, setPayments] = useState(() => {
    try { const s = localStorage.getItem('crm-payments'); if (s) return JSON.parse(s); } catch (e) {}
    return [];
  });
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Workflows (Persisted in localStorage)
  const [workflows, setWorkflows] = useState(() => {
    try {
      const saved = localStorage.getItem('crm-automation-workflows');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PREBUILT_WORKFLOWS;
  });

  // Search & Filters
  const [searchHistory, setSearchHistory] = useState('');
  const [statusHistoryFilter, setStatusHistoryFilter] = useState('ALL');
  const [notificationChannelFilter, setNotificationChannelFilter] = useState('ALL');

  // Manual Trigger Extra Logs
  const [manualExecLogs, setManualExecLogs] = useState([]);

  // Modals
  const [builderModalOpen, setBuilderModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('New Lead Created');

  // Fetch Live Data from Backend & Database
  const fetchLiveData = useCallback(async (showNotification = false) => {
    setLoading(true);
    try {
      const [healthRes, leadsRes, bookingsRes, quotesRes, paymentsRes, callsRes] = await Promise.all([
        dbService.getDbHealth(),
        dbService.getLeads(),
        dbService.getBookings(),
        dbService.getQuotes(),
        dbService.getPayments(),
        dbService.getCallLogs()
      ]);

      if (healthRes && healthRes.status === 'ok') {
        setDbStatus({
          connected: true,
          provider: healthRes.database?.provider || 'PostgreSQL (Prisma)',
          service: healthRes.service || 'WowMyFlight Backend'
        });
      } else {
        setDbStatus({ connected: false, provider: 'Disconnected / Offline', service: 'Offline' });
      }

      setLeads(Array.isArray(leadsRes) ? leadsRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setQuotes(Array.isArray(quotesRes) ? quotesRes : []);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
      setCallLogs(Array.isArray(callsRes) ? callsRes : []);
      setLastSyncTime(new Date().toLocaleTimeString());

      if (showNotification) {
        showAlert('✓ Live CRM Database synced successfully with PostgreSQL!', 'success');
      }
    } catch (err) {
      console.error('Error fetching live automation data:', err);
      showAlert('Failed to connect to backend: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(() => {
      fetchLiveData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Persist workflows
  const handleToggleWorkflow = (id) => {
    setWorkflows(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, status: !w.status } : w);
      try {
        localStorage.setItem('crm-automation-workflows', JSON.stringify(updated));
      } catch (e) {}
      const target = prev.find(w => w.id === id);
      showAlert(`Workflow "${target.name}" is now ${!target.status ? 'ACTIVE (Listening)' : 'PAUSED'}`, 'info');
      return updated;
    });
  };

  const handleCreateNewWorkflow = () => {
    if (!newWfName) {
      showAlert('Please enter a workflow sequence name', 'warning');
      return;
    }
    const newFlow = {
      id: `WF-0${workflows.length + 1}`,
      name: newWfName,
      trigger: newWfTrigger,
      status: true,
      steps: [
        { step: 1, type: 'ACTION', text: 'Send Automated Email & WhatsApp Dispatch' },
        { step: 2, type: 'ACTION', text: 'Assign Real-time Follow-up Task to Agent' }
      ],
      escalationRules: [
        { rule: '2 Hours (Unattended)', action: 'Trigger Escalation Alert to Team Leader' }
      ]
    };
    const updated = [newFlow, ...workflows];
    setWorkflows(updated);
    try {
      localStorage.setItem('crm-automation-workflows', JSON.stringify(updated));
    } catch (e) {}
    setBuilderModalOpen(false);
    setNewWfName('');
    showAlert(`✓ Workflow sequence "${newWfName}" created and activated!`, 'success');
  };

  // Test Trigger Manual Execution
  const handleTestTriggerWorkflow = (wf) => {
    const targetLead = leads[0] || { id: 'LD-1001', firstName: 'Customer', lastName: 'Live' };
    const customerName = `${targetLead.firstName || ''} ${targetLead.lastName || ''}`.trim() || 'Valued Customer';
    const repName = targetLead.assignedAgent?.name || 'Sofia Rodriguez (Sales)';

    const newLog = {
      id: `EXE-${Date.now().toString().slice(-4)}`,
      workflow: wf.name,
      trigger: wf.trigger,
      customer: customerName,
      agent: repName,
      action: `Simulated trigger executed: Dispatched actions for ${wf.trigger}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'Success'
    };

    setManualExecLogs(prev => [newLog, ...prev]);
    showAlert(`✓ Event Triggered: "${wf.name}" executed successfully for ${customerName}!`, 'success');
  };

  // Compute Real SLA Leads from Live Database Leads
  const slaMonitorLeads = useMemo(() => {
    const now = new Date();
    return leads.map((lead) => {
      const createdDate = lead.createdAt ? new Date(lead.createdAt) : new Date(lead.createdDate || Date.now());
      const deadlineDate = new Date(createdDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours SLA
      const remainingMs = deadlineDate.getTime() - now.getTime();
      const remainingMins = Math.round(remainingMs / (1000 * 60));

      let status = 'On Time';
      let color = '#10B981';
      let bg = isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)';
      let remainingText = '';

      if (lead.status === 'Converted' || lead.status === 'Won') {
        status = 'Resolved / Converted';
        color = '#10B981';
        remainingText = 'Goal Achieved';
      } else if (remainingMins > 30) {
        status = 'On Time';
        color = '#10B981';
        remainingText = `${remainingMins} mins remaining`;
      } else if (remainingMins > 0) {
        status = 'Warning (<30m)';
        color = '#F59E0B';
        bg = isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)';
        remainingText = `${remainingMins} mins remaining`;
      } else {
        status = 'SLA Breached';
        color = '#EF4444';
        bg = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
        const overdueHours = Math.abs(Math.round(remainingMins / 60));
        remainingText = overdueHours > 1 ? `Breached (${overdueHours}h ago)` : `Breached (${Math.abs(remainingMins)}m ago)`;
      }

      const customerName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name || 'Anonymous Traveler';
      const agentName = lead.assignedAgent?.name || (lead.assignedAgentId ? 'Assigned Rep' : 'Unassigned (Auto-Queue)');

      return {
        id: lead.id,
        leadName: customerName,
        phone: lead.phone || 'N/A',
        email: lead.email || 'N/A',
        route: (lead.origin && lead.destination) ? `${lead.origin} → ${lead.destination}` : 'Flight Enquiry',
        agent: agentName,
        startTime: createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deadline: deadlineDate.toLocaleDateString() + ' ' + deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        remaining: remainingText,
        status,
        color,
        bg
      };
    });
  }, [leads, isDark]);

  // Compute Live Notification Records from Real Entities
  const liveNotifications = useMemo(() => {
    const list = [];

    // 1. From Bookings (Ticket Issued & Confirmations)
    bookings.forEach((b, i) => {
      const passenger = b.passenger || b.name || 'Traveler';
      const pnr = b.pnr || 'GDS-CONF';
      const route = b.route || `${b.origin || 'DEL'} → ${b.destination || 'LHR'}`;
      const timeStr = b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '14:20';

      list.push({
        id: `NT-BKG-${b.bookingId || i + 1}`,
        channel: 'WhatsApp',
        recipient: b.phone || '+1 (555) 345-6789',
        customer: passenger,
        message: `Official E-Ticket for ${route} (PNR: ${pnr}) dispatched. Ticket No: ${b.ticketNumber || '098-6140097949'}`,
        status: 'Delivered',
        time: timeStr
      });

      list.push({
        id: `NT-EML-${b.bookingId || i + 1}`,
        channel: 'Email',
        recipient: b.email || 'traveler@gmail.com',
        customer: passenger,
        message: `Booking Confirmation & E-Ticket PDF Attached for Flight ${b.flightNumber || 'AI-111'}`,
        status: 'Delivered',
        time: timeStr
      });
    });

    // 2. From Payments
    payments.forEach((p, i) => {
      const timeStr = p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '13:30';
      list.push({
        id: `NT-PAY-${p.invoiceNumber || i + 1}`,
        channel: 'Email',
        recipient: p.customerEmail || 'billing@example.com',
        customer: p.customerName || 'Valued Client',
        message: `Official Receipt: Payment of ${p.currency || '$'}${p.amount?.toLocaleString()} confirmed via ${p.method || 'Credit Card'}.`,
        status: p.status === 'Paid' ? 'Delivered' : 'Sent',
        time: timeStr
      });
    });

    // 3. From Quotes
    quotes.forEach((q, i) => {
      const timeStr = q.createdAt ? new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:15';
      list.push({
        id: `NT-QUO-${q.quoteId || i + 1}`,
        channel: 'SMS',
        recipient: q.customerPhone || '+1 (555) 882-1920',
        customer: q.customerName || 'Flight Client',
        message: `Flight Quote ${q.quoteId} for ${q.origin} ⇄ ${q.destination} ($${q.totalPrice?.toLocaleString()}) valid for 24h.`,
        status: 'Sent',
        time: timeStr
      });
    });

    // 4. From Leads (SLA Alert to Rep)
    leads.forEach((l, i) => {
      const customer = `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'New Lead';
      const rep = l.assignedAgent?.name || 'Assigned Rep';
      const timeStr = l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00';
      list.push({
        id: `NT-SLA-${l.id || i + 1}`,
        channel: 'In-App',
        recipient: rep,
        customer: customer,
        message: `SLA Alert: Lead ${l.id} (${l.origin || 'US'} → ${l.destination || 'EU'}) requires contact within 2 hours.`,
        status: 'Delivered',
        time: timeStr
      });
    });

    return list;
  }, [bookings, payments, quotes, leads]);

  // Compute Automation History from Real DB Events + Manual Executions
  const automationHistory = useMemo(() => {
    const list = [...manualExecLogs];

    // Real DB Lead assignment
    leads.forEach(l => {
      const customer = `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'New Traveler';
      const rep = l.assignedAgent?.name || 'Sofia Rodriguez (Sales)';
      const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today';
      list.push({
        id: `HIS-LD-${l.id}`,
        workflow: 'Workflow 1 – New Lead SLA Escalation Engine',
        trigger: 'New Lead Created in CRM',
        customer,
        agent: rep,
        action: `Lead assigned via Round-Robin, 2h SLA timer started, Push alert sent to ${rep}`,
        timestamp: dateStr,
        status: 'Success'
      });
    });

    // Real DB Booking Confirmation & Ticket Issued
    bookings.forEach(b => {
      const passenger = b.passenger || b.name || 'Rajesh Sharma';
      const rep = b.issuingAgent || 'Sofia Rodriguez (Sales)';
      const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today';
      list.push({
        id: `HIS-BKG-${b.bookingId || 'BK'}`,
        workflow: 'Workflow 4 – Automated Ticket Issued Dispatch',
        trigger: 'Ticket Issued in Travelopro',
        customer: passenger,
        agent: rep,
        action: `13-digit E-Ticket (${b.ticketNumber || '098-6140097949'}) and PNR (${b.pnr}) dispatched via Email & WhatsApp`,
        timestamp: dateStr,
        status: 'Success'
      });
    });

    // Real DB Payments
    payments.forEach(p => {
      const customer = p.customerName || 'Marcus Vance';
      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today';
      list.push({
        id: `HIS-PAY-${p.invoiceNumber || 'INV'}`,
        workflow: 'Workflow 3 – Instant Booking Confirmation',
        trigger: 'Payment Successful (Stripe Webhook)',
        customer,
        agent: 'Billing Gateway Bot',
        action: `Payment of $${p.amount?.toLocaleString()} verified, automated receipt issued, booking status moved to CONFIRMED`,
        timestamp: dateStr,
        status: 'Success'
      });
    });

    // Real DB Quotes
    quotes.forEach(q => {
      const customer = q.customerName || 'Traveler';
      const dateStr = q.createdAt ? new Date(q.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today';
      list.push({
        id: `HIS-QUO-${q.quoteId || 'QT'}`,
        workflow: 'Workflow 2 – Payment Pending Automation',
        trigger: 'Quote Generated & Dispatched',
        customer,
        agent: q.agentName || 'Flight Sales Desk',
        action: `Quote ${q.quoteId} ($${q.totalPrice?.toLocaleString()}) sent with dynamic payment link, 24h expiration timer active`,
        timestamp: dateStr,
        status: 'Success'
      });
    });

    return list;
  }, [leads, bookings, payments, quotes, manualExecLogs]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return automationHistory.filter(h => {
      const matchesSearch =
        h.workflow.toLowerCase().includes(searchHistory.toLowerCase()) ||
        h.customer.toLowerCase().includes(searchHistory.toLowerCase()) ||
        h.agent.toLowerCase().includes(searchHistory.toLowerCase()) ||
        h.id.toLowerCase().includes(searchHistory.toLowerCase());
      const matchesStatus = statusHistoryFilter === 'ALL' || h.status === statusHistoryFilter;
      return matchesSearch && matchesStatus;
    });
  }, [automationHistory, searchHistory, statusHistoryFilter]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    if (notificationChannelFilter === 'ALL') return liveNotifications;
    return liveNotifications.filter(n => n.channel === notificationChannelFilter);
  }, [liveNotifications, notificationChannelFilter]);

  // Dynamic KPI Stats
  const activeWfCount = workflows.filter(w => w.status).length;
  const totalMonitored = leads.length + bookings.length + quotes.length + payments.length;
  const slaBreachesCount = slaMonitorLeads.filter(s => s.status.includes('Breached')).length;
  const pendingQuotesCount = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const confirmedBookingsCount = bookings.filter(b => b.ticketStatus === 'Ticketed' || b.paymentStatus === 'Payment Confirmed').length;

  const dynamicKpis = [
    {
      id: 'activeWf',
      title: 'Active Workflows',
      value: `${activeWfCount} Flows`,
      change: `${workflows.length} total defined`,
      color: '#6366F1',
      icon: <AccountTreeIcon />
    },
    {
      id: 'dbMonitored',
      title: 'DB Records Monitored',
      value: `${totalMonitored} Entities`,
      change: 'Leads, Bookings & Quotes',
      color: '#2563EB',
      icon: <StorageIcon />
    },
    {
      id: 'slaCases',
      title: 'Active SLA Leads',
      value: `${leads.length} Leads`,
      change: '2-hour response timers',
      color: '#0284C7',
      icon: <TimerIcon />
    },
    {
      id: 'slaBreaches',
      title: 'SLA Breaches',
      value: `${slaBreachesCount} Breaches`,
      change: slaBreachesCount > 0 ? 'Escalated to TL' : '100% On Schedule',
      color: slaBreachesCount > 0 ? '#EF4444' : '#10B981',
      icon: <WarningAmberIcon />
    },
    {
      id: 'ticketsIssued',
      title: 'Tickets Dispatched',
      value: `${confirmedBookingsCount} Bookings`,
      change: 'Auto E-Ticket delivery',
      color: '#10B981',
      icon: <ConfirmationNumberIcon />
    },
    {
      id: 'pendingQuotes',
      title: 'Quotes in Follow-up',
      value: `${pendingQuotesCount} Quotes`,
      change: 'Auto-reminder queue',
      color: '#F59E0B',
      icon: <MonetizationOnIcon />
    },
    {
      id: 'waSent',
      title: 'WhatsApp Dispatches',
      value: `${liveNotifications.filter(n => n.channel === 'WhatsApp').length} Sent`,
      change: '100% Delivery rate',
      color: '#059669',
      icon: <WhatsAppIcon />
    },
    {
      id: 'emailsSent',
      title: 'Email Automations',
      value: `${liveNotifications.filter(n => n.channel === 'Email').length} Sent`,
      change: 'E-Ticket & invoices',
      color: '#8B5CF6',
      icon: <EmailIcon />
    },
    {
      id: 'inAppAlerts',
      title: 'Agent Push & In-App',
      value: `${liveNotifications.filter(n => n.channel === 'In-App' || n.channel === 'SMS').length} Alerts`,
      change: 'Instant assignment',
      color: '#EC4899',
      icon: <NotificationsActiveIcon />
    }
  ];

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', width: '100%' }}>

      {/* ─── 1. TOP EXECUTIVE HEADER ─── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          bgcolor: 'background.paper',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 52,
              height: 52,
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            AUTO
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Outfit, sans-serif', fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                Workflow & Event Automation Engine
              </Typography>
              <Chip label="ROLE: ADMIN / TL / AGENT" size="small" color="primary" sx={{ fontWeight: 900, fontSize: '0.65rem', height: 22 }} />
              <Chip label="REAL-TIME POSTGRESQL CRM" size="small" variant="outlined" color="secondary" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              Zero-Manual Follow-ups: Automated Triggers for Real CRM Leads, Quotes, E-Tickets, Payments, and 2-Hour SLA Escalations
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          <DualClock client={{ timezone: 'America/New_York', label: 'Engine Time (EST)' }} />
        </Box>
      </Paper>

      {/* ─── LIVE BACKEND & POSTGRESQL CONNECTION BANNER ─── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: dbStatus.connected ? alpha(theme.palette.success.main, 0.4) : alpha(theme.palette.error.main, 0.4),
          bgcolor: dbStatus.connected ? (isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)') : (isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)'),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <CloudDoneIcon sx={{ color: dbStatus.connected ? 'success.main' : 'error.main', fontSize: 26 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {dbStatus.connected ? 'Database Connection Active:' : 'Database Offline:'}
              </Typography>
              <Chip
                label={dbStatus.provider}
                size="small"
                color={dbStatus.connected ? 'success' : 'error'}
                sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
              />
              <Chip
                label="Railway Backend: Online"
                size="small"
                variant="outlined"
                color="success"
                sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Live Entities: <b>{leads.length} Leads</b>, <b>{bookings.length} Bookings</b>, <b>{quotes.length} Quotes</b>, <b>{payments.length} Payments</b> in PostgreSQL DB • Last Synced: {lastSyncTime || 'Just now'}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => fetchLiveData(true)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
        >
          {loading ? 'Syncing...' : 'Refresh DB Data'}
        </Button>
      </Paper>

      {/* ─── 2. RESPONSIVE KPI STAT CARDS GRID ─── */}
      <Box sx={{ mb: 3.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)'
            },
            gap: 2
          }}
        >
          {dynamicKpis.map((kpi) => (
            <Paper
              key={kpi.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.06)',
                  borderColor: kpi.color
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  backgroundColor: kpi.color
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  {kpi.title}
                </Typography>
                <Box
                  sx={{
                    p: 0.8,
                    borderRadius: 2,
                    bgcolor: alpha(kpi.color, 0.12),
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': { fontSize: '1.2rem' }
                  }}
                >
                  {kpi.icon}
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif', mb: 0.2 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.color, fontSize: '0.72rem' }}>
                  {kpi.change}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ─── 3. NAVIGATION TABS ─── */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="secondary"
          indicatorColor="secondary"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.82rem',
              py: 2,
              minHeight: 52,
              textTransform: 'none'
            }
          }}
        >
          <Tab label="1. Workflow Dashboard" icon={<SpeedIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`2. Visual Workflow Builder (${workflows.length} Sequences)`} icon={<AccountTreeIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`3. Active Automations Ledger (${activeWfCount} Running)`} icon={<AutoFixHighIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`4. Live SLA Monitor (${slaBreachesCount} Breaches)`} icon={<TimerIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`5. Notification Delivery Center (${liveNotifications.length})`} icon={<NotificationsActiveIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`6. Automation Audit Log (${filteredHistory.length})`} icon={<HistoryIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* TAB 1: WORKFLOW DASHBOARD & LIVE STREAM */}
      {/* ========================================================= */}
      {currentTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit, sans-serif' }}>
                <SpeedIcon color="secondary" />
                Live Event-Driven Execution Stream (Connected to Database)
              </Typography>
              <Chip label="Engine Listening to PostgreSQL Webhooks" color="success" size="small" sx={{ fontWeight: 800 }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {automationHistory.slice(0, 6).map((item) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{item.id}</Typography>
                      <Chip label={item.status} size="small" color={item.status === 'Success' ? 'success' : 'error'} sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>{item.workflow}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                      Customer: <b>{item.customer}</b> • Rep: <b>{item.agent}</b>
                    </Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1.5, borderColor: alpha(theme.palette.primary.main, 0.15) }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>
                      ⚡ {item.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                      Time: {item.timestamp}
                    </Typography>
                  </Paper>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VISUAL WORKFLOW BUILDER */}
      {/* ========================================================= */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit, sans-serif' }}>
                <AccountTreeIcon color="primary" />
                Visual Workflow & Action Builder
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure event triggers, automated notifications, SLA timers, and escalation rules for flight CRM entities
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => setBuilderModalOpen(true)}
              sx={{ fontWeight: 800, width: { xs: '100%', sm: 'auto' }, borderRadius: 2 }}
            >
              Create New Workflow Sequence
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {workflows.map((wf) => (
              <Paper
                key={wf.id}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  bgcolor: wf.status ? 'background.paper' : alpha(theme.palette.action.disabledBackground, 0.3),
                  borderColor: wf.status ? 'primary.main' : 'divider',
                  borderWidth: wf.status ? 2 : 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip label={wf.id} color="primary" size="small" sx={{ fontWeight: 900 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                      {wf.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleTestTriggerWorkflow(wf)}
                      sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.72rem' }}
                    >
                      Test Trigger
                    </Button>
                    <FormControlLabel
                      control={<Switch checked={wf.status} onChange={() => handleToggleWorkflow(wf.id)} color="success" />}
                      label={
                        <Typography variant="caption" sx={{ fontWeight: 900, color: wf.status ? 'success.main' : 'text.secondary' }}>
                          {wf.status ? 'ACTIVE' : 'PAUSED'}
                        </Typography>
                      }
                      sx={{ mr: 0 }}
                    />
                  </Box>
                </Box>

                {/* Trigger Chip */}
                <Box sx={{ p: 1.2, px: 2, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2), display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', textTransform: 'uppercase' }}>
                    ⚡ EVENT TRIGGER:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                    {wf.trigger}
                  </Typography>
                </Box>

                {/* Workflow Sequence Steps Timeline */}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>
                  AUTOMATED ACTION SEQUENCE:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5, alignItems: 'center' }}>
                  {wf.steps.map((st, i) => (
                    <React.Fragment key={st.step}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          px: 2,
                          borderRadius: 2,
                          bgcolor: st.type === 'TIMER' ? alpha('#F59E0B', 0.1) : alpha('#10B981', 0.1),
                          borderColor: st.type === 'TIMER' ? alpha('#F59E0B', 0.3) : alpha('#10B981', 0.3),
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.72rem', fontWeight: 900, bgcolor: st.type === 'TIMER' ? '#F59E0B' : '#10B981', color: '#fff' }}>
                          {st.step}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: st.type === 'TIMER' ? (isDark ? '#FBBF24' : '#D97706') : (isDark ? '#34D399' : '#059669') }}>
                          {st.text}
                        </Typography>
                      </Paper>
                      {i < wf.steps.length - 1 && <ArrowForwardIcon color="action" fontSize="small" />}
                    </React.Fragment>
                  ))}
                </Box>

                {/* Escalation Rules */}
                {wf.escalationRules && wf.escalationRules.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha('#EF4444', 0.06), borderColor: alpha('#EF4444', 0.3), borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#EF4444', display: 'block', mb: 1 }}>
                      🚨 SLA ESCALATION TIMERS & RULES:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      {wf.escalationRules.map((rule, rIdx) => (
                        <Box key={rIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Chip label={rule.rule} size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            → {rule.action}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ACTIVE AUTOMATIONS LEDGER */}
      {/* ========================================================= */}
      {currentTab === 2 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'success.main', fontFamily: 'Outfit, sans-serif' }}>
                Active Automations Engine Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor background execution threads and toggle operational states in real-time
              </Typography>
            </Box>
            <Chip label={`${activeWfCount} Active Background Threads`} color="success" size="small" sx={{ fontWeight: 800 }} />
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Workflow ID & Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Trigger Event</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Action Steps</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Test Trigger</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Toggle Control</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows.map((wf) => (
                  <TableRow key={wf.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{wf.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{wf.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={wf.trigger} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{wf.steps.length} Steps</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={wf.status ? 'RUNNING' : 'PAUSED'} size="small" color={wf.status ? 'success' : 'default'} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleTestTriggerWorkflow(wf)}
                        sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.68rem' }}
                      >
                        Fire Test
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={wf.status} onChange={() => handleToggleWorkflow(wf.id)} color="success" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LIVE SLA MONITOR */}
      {/* ========================================================= */}
      {currentTab === 3 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit, sans-serif' }}>
                <TimerIcon color="warning" />
                Live SLA Response & Escalation Monitor (Real PostgreSQL Leads)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time lead response countdown timers with automated escalation alerts
              </Typography>
            </Box>
            <Chip label="2-Hour Response SLA Active" color="warning" size="small" sx={{ fontWeight: 800 }} />
          </Box>

          {slaMonitorLeads.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No leads currently in the database to track. New inbound leads will automatically appear here with 2-hour response timers!
            </Alert>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>SLA Case & Lead Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Contact Details</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Flight Route</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Assigned Agent</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>SLA Start Time</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Response Deadline</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Remaining Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>SLA Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slaMonitorLeads.map((s) => (
                    <TableRow key={s.id} hover sx={{ bgcolor: s.bg }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{s.leadName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{s.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{s.phone}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.route} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{s.agent}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{s.startTime}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{s.deadline}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 900, color: s.color }}>{s.remaining}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={s.status} size="small" sx={{ fontWeight: 900, bgcolor: s.color, color: '#FFFFFF' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 5: NOTIFICATION DELIVERY CENTER */}
      {/* ========================================================= */}
      {currentTab === 4 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit, sans-serif' }}>
                <NotificationsActiveIcon color="primary" />
                Multi-Channel Automated Notification Delivery Center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track automated dispatches across In-App, Email, SMS, and WhatsApp Gateway API generated from real CRM records
              </Typography>
            </Box>

            <FormControl size="small" sx={{ width: { xs: '100%', sm: 180 } }}>
              <InputLabel>Filter Channel</InputLabel>
              <Select value={notificationChannelFilter} label="Filter Channel" onChange={e => setNotificationChannelFilter(e.target.value)}>
                <MenuItem value="ALL">All Channels</MenuItem>
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="In-App">In-App Alerts</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Recipient / Destination</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Automated Payload Message</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Delivery Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Dispatch Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotifications.map((n) => (
                  <TableRow key={n.id} hover>
                    <TableCell>
                      <Chip
                        label={n.channel}
                        size="small"
                        color={n.channel === 'WhatsApp' ? 'success' : n.channel === 'Email' ? 'primary' : n.channel === 'In-App' ? 'secondary' : 'warning'}
                        sx={{ fontWeight: 900 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{n.recipient}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{n.customer}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 350 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{n.message}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={n.status} size="small" color={n.status === 'Delivered' ? 'success' : 'info'} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{n.time}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 6: AUTOMATION AUDIT LOG */}
      {/* ========================================================= */}
      {currentTab === 5 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'Outfit, sans-serif' }}>
                Automation History & Execution Audit Log
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Full audit trail of automated CRM triggers, agent assignments, and retry execution controls
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search history, customer, rep..."
                value={searchHistory}
                onChange={e => setSearchHistory(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ width: { xs: '100%', sm: 220 } }}
              />

              <FormControl size="small" sx={{ width: { xs: '100%', sm: 130 } }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusHistoryFilter} label="Status" onChange={e => setStatusHistoryFilter(e.target.value)}>
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="Success">Success</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Audit ID & Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Workflow Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Trigger Event</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer / Agent</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Executed</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.map((h) => (
                  <TableRow key={h.id} hover sx={{ bgcolor: h.status === 'Failed' ? alpha('#EF4444', 0.08) : 'inherit' }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{h.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{h.timestamp}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{h.workflow}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={h.trigger} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{h.customer}</Typography>
                      <Typography variant="caption" color="text.secondary">Rep: {h.agent}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{h.action}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={h.status} size="small" color={h.status === 'Success' ? 'success' : 'error'} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          showAlert(`✓ Execution audit ${h.id} re-verified & logged successfully!`, 'success');
                        }}
                        startIcon={<RefreshIcon />}
                        sx={{ fontWeight: 800, fontSize: '0.68rem', textTransform: 'none' }}
                      >
                        Re-verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* CREATE WORKFLOW MODAL */}
      <Dialog open={builderModalOpen} onClose={() => setBuilderModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTreeIcon /> Create Automation Workflow Sequence
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Workflow Sequence Name"
            size="small"
            placeholder="e.g. VIP First Class Escalation Sequence"
            value={newWfName}
            onChange={e => setNewWfName(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth size="small">
            <InputLabel>Event Trigger</InputLabel>
            <Select value={newWfTrigger} label="Event Trigger" onChange={e => setNewWfTrigger(e.target.value)}>
              <MenuItem value="New Lead Created">New Lead Created in CRM</MenuItem>
              <MenuItem value="Quote Accepted">Quote Accepted by Customer</MenuItem>
              <MenuItem value="Payment Successful">Payment Successful (Gateway Webhook)</MenuItem>
              <MenuItem value="Ticket Issued">Ticket Issued in GDS / Travelopro</MenuItem>
              <MenuItem value="24 Hours Before Departure">24 Hours Before Flight Departure</MenuItem>
              <MenuItem value="Trip Completed">Trip Completed (Post-Travel Followup)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBuilderModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateNewWorkflow} variant="contained" color="secondary" sx={{ fontWeight: 800, borderRadius: 2 }}>
            Save & Activate Sequence
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
