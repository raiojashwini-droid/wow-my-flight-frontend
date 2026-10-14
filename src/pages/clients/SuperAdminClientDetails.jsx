import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

// Icons
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ForumIcon from '@mui/icons-material/Forum';
import StarIcon from '@mui/icons-material/Star';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AddTaskIcon from '@mui/icons-material/AddTask';

// Services & Components
import { dbService } from '../../services/dbService';
import PageHeader from '../../components/PageHeader';
import AppCard from '../../components/AppCard';
import AppModal from '../../components/AppModal';
import PaymentLinkModal from '../../components/PaymentLinkModal';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';

export const SuperAdminClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();

  // Permission helpers
  const hasPermission = (key) => {
    if (currentUser?.customPermissions?.enabled) {
      return !!currentUser.customPermissions.granular?.[key];
    }
    return true; // Default allow when no custom permissions set
  };

  const [activeTab, setActiveTab] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newLogText, setNewLogText] = useState('');
  const [logChannel, setLogChannel] = useState('WhatsApp');

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: dbService.getClients
  });

  const { data: singleClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => dbService.getClientById(id),
    enabled: !!id
  });

  const matchedClient = singleClient || clients.find((c) => c.id === id);

  const client = useMemo(() => ({
    id: id || '',
    firstName: matchedClient?.firstName || '',
    lastName: matchedClient?.lastName || '',
    email: matchedClient?.email || '',
    phone: matchedClient?.phone || '',
    country: matchedClient?.country || matchedClient?.nationality || '',
    nationality: matchedClient?.nationality || matchedClient?.country || '',
    city: matchedClient?.city || '',
    timezone: matchedClient?.timezone || '',
    preferredLanguage: matchedClient?.preferredLanguage || '',
    passportNumber: matchedClient?.passportNumber || '',
    passportExpiry: matchedClient?.passportExpiry || '',
    otherNationalities: matchedClient?.otherNationalities || '',
    preferredCabinClass: matchedClient?.preferredCabinClass || '',
    tier: matchedClient?.tier || 'Standard',
    frequentFlyer: matchedClient?.frequentFlyer || [],
    preferredAirlines: matchedClient?.preferredAirlines || [],
    seatPreference: matchedClient?.seatPreference || '',
    mealPreference: matchedClient?.mealPreference || '',
    specialAssistance: matchedClient?.specialAssistance || '',
    assignedConsultant: matchedClient?.assignedConsultant || '',
    totalSpent: matchedClient?.totalSpent || '$0',
    totalBookings: matchedClient?.totalBookings || 0,
    ...matchedClient
  }), [matchedClient, id]);

  const mockBookingsList = [];
  const mockInvoices = [];
  const mockRefunds = [];

  const { data: customerQuotes = [] } = useQuery({
    queryKey: ['customer-quotes', id, matchedClient?.email, matchedClient?.phone],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem('crm-quotes');
        const localQuotes = stored ? JSON.parse(stored) : [];
        let remoteQuotes = [];
        try {
          const backendUrl = dbService.getBackendUrl ? dbService.getBackendUrl() : 'http://localhost:3001';
          const res = await fetch(`${backendUrl}/api/quotes`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              remoteQuotes = json.data;
            }
          }
        } catch (e) { }

        const all = [...localQuotes, ...remoteQuotes];
        const seen = new Set();
        const unique = all.filter(q => {
          const qId = q.quoteId || q.id;
          if (!qId || seen.has(qId)) return false;
          seen.add(qId);
          return true;
        });

        const cEmail = (matchedClient?.email || '').toLowerCase();
        const cPhone = (matchedClient?.phone || '').replace(/[^0-9]/g, '');
        const cName = `${matchedClient?.firstName || ''} ${matchedClient?.lastName || ''}`.trim().toLowerCase();

        return unique.filter(q => {
          const qEmail = (q.customerEmail || q.email || '').toLowerCase();
          const qPhone = (q.customerPhone || q.phone || '').replace(/[^0-9]/g, '');
          const qName = (q.customerName || '').toLowerCase();
          return (cEmail && qEmail && cEmail === qEmail) ||
                 (cPhone && qPhone && cPhone === qPhone) ||
                 (cName && qName && cName === qName) ||
                 (q.clientId && q.clientId === id);
        });
      } catch (e) {
        return [];
      }
    },
    enabled: !!id
  });

  const [commLogs, setCommLogs] = useState([]);
  const [notesTasks, setNotesTasks] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const handleAddCommLog = () => {
    if (!newLogText.trim()) return;
    const newEntry = {
      id: Date.now(),
      channel: logChannel,
      time: 'Just now',
      agent: currentUser?.name || 'Admin',
      text: newLogText
    };
    setCommLogs([newEntry, ...commLogs]);
    setNewLogText('');
    showAlert(`Communication record added to ${client.firstName}'s Customer 360 timeline!`, 'success');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Button
        startIcon={<KeyboardArrowLeftIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 1.5, color: 'text.secondary' }}
      >
        Back to Customers
      </Button>

      {/* ─── 1. CUSTOMER 360 HEADER & LIFETIME VALUE (CLV) STRIP ─── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 900 }}>
              {client.firstName?.[0]}{client.lastName?.[0]}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {client.firstName} {client.lastName}
                </Typography>
                <Chip size="small" label={`Tier: ${client.tier || 'Standard'}`} color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                <Chip size="small" label="Customer Record" color="success" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Customer ID: <b>#{client.id}</b> &nbsp;|&nbsp; Location: <b>{[client.city, client.country || client.nationality].filter(Boolean).join(', ') || '—'}</b> {client.timezone ? `(${client.timezone})` : ''} &nbsp;|&nbsp; Assigned Agent: <b>{client.assignedConsultant || 'Unassigned'}</b>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {hasPermission('makeCall') && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<PhoneIcon />}
                onClick={() => showAlert(`Calling ${client.firstName} via Telnyx WebRTC…`, 'success')}
              >
                Call
              </Button>
            )}
            {hasPermission('sendWhatsApp') && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<WhatsAppIcon />}
                onClick={() => navigate('/social-inbox?channel=whatsapp')}
              >
                WhatsApp
              </Button>
            )}
            {hasPermission('createBooking') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<FlightTakeoffIcon />}
                onClick={() => {
                  navigate('/quotes', { state: { client } });
                }}
              >
                Create Flight Quote
              </Button>
            )}
            {hasPermission('createPaymentRequest') && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<MonetizationOnIcon />}
                onClick={() => setPaymentModalOpen(true)}
              >
                Send Payment Link
              </Button>
            )}
          </Box>

        </Box>

        <Divider sx={{ my: 2 }} />

        {/* CLV Metric Bar */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[
            { label: 'Customer Lifetime Value (LTV)', value: client.totalSpent || '$0', color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Total Confirmed Bookings', value: `${mockBookingsList.length} Flights`, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Preferred Cabin Class', value: client.preferredCabinClass || '—', color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Loyalty Tier Status', value: client.tier || 'Standard', color: '#D97706', bg: '#FFFBEB' },
          ].map((kpi, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: kpi.bg, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.2 }}>
                {kpi.label}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: kpi.color }}>
                {kpi.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* ─── CUSTOMER 360 TABS (6 FULL TOUCHPOINTS) ─── */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="👤 Personal & Passport" sx={{ fontWeight: 700 }} />
        <Tab icon={<HistoryEduIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`📋 Previous Leads & Quotes (${customerQuotes.length})`} sx={{ fontWeight: 700 }} />
        <Tab icon={<ForumIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`💬 Communications & Calls (${commLogs.length})`} sx={{ fontWeight: 700 }} />
        <Tab icon={<AirplaneTicketIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`✈️ Bookings & E-Tickets (${mockBookingsList.length})`} sx={{ fontWeight: 700 }} />
        <Tab icon={<ReceiptIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`💳 Payments & Refunds (${mockInvoices.length})`} sx={{ fontWeight: 700 }} />
        <Tab icon={<StarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="⭐ Preferences & SSR" sx={{ fontWeight: 700 }} />
        <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="📝 Notes, Tasks & Complaints" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* ─── TAB 0: PERSONAL & PASSPORT DATA ─── */}
      {activeTab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: 'primary.main' }}>
              👤 PERSONAL MASTER DATA
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1.5, fontSize: 14 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Full Name:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{client.firstName} {client.lastName}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Email Address:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.email || '—'}</Typography>
                {client.email && <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Phone Number:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{client.phone || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Country:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.country || client.nationality || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>City:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.city || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Time Zone:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.timezone || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Language Preference:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.preferredLanguage || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Loyalty / VIP Tier:</Typography>
              <Chip size="small" label={client.tier || 'Standard'} sx={{ fontWeight: 800, width: 'fit-content', bgcolor: '#FEF9C3', color: '#854D0E', fontSize: '0.72rem' }} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: 'info.main' }}>
              🛂 PASSPORT & TRAVEL PREFERENCES
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 1.5, fontSize: 14 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Passport Number:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{client.passportNumber || 'Not Provided'}</Typography>
                {client.passportNumber && <Chip size="small" label="Saved" color="success" sx={{ fontSize: '0.65rem', height: 20 }} />}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Passport Expiry Date:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{client.passportExpiry || 'Not Provided'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Preferred Cabin Class:</Typography>
              {client.preferredCabinClass ? (
                <Chip size="small" label={client.preferredCabinClass} color="primary" sx={{ fontWeight: 800, width: 'fit-content' }} />
              ) : (
                <Typography variant="body2" color="text.secondary">—</Typography>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Seat Preference:</Typography>
              <Typography variant="body2" sx={{ fontWeight: client.seatPreference ? 700 : 400 }}>{client.seatPreference || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Meal Preference:</Typography>
              <Typography variant="body2" sx={{ fontWeight: client.mealPreference ? 700 : 400 }}>{client.mealPreference || '—'}</Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ─── TAB 1: PREVIOUS LEADS & QUOTES ─── */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>PAST FLIGHT INQUIRIES & QUOTATIONS</Typography>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => navigate('/quotes', { state: { client } })}
            >
              + New Quote
            </Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 650 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', background: '#FAFAFA' }}>
                  {['Quote Ref', 'Date Inquired', 'Route & Option', 'Carrier', 'Gross Price ($)', 'Net Fare ($)', 'Agency Profit ($)', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customerQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      No flight inquiries or quotations recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  customerQuotes.map((q) => {
                    const qId = q.quoteId || q.id;
                    const qDate = q.createdDate || (q.createdAt ? q.createdAt.split('T')[0] : 'Today');
                    const qRoute = q.route || `${q.origin || ''} → ${q.destination || ''}`;
                    const qAirline = q.airline || q.options?.[0]?.airline || 'Flight Option';
                    const grossPrice = Number(q.totalPrice || q.customerPrice || q.options?.[0]?.customerPrice || 0);
                    const netFare = Number(q.netPrice || q.options?.[0]?.supplierCost || 0);
                    const profit = Number(q.markup || q.options?.[0]?.profit || (grossPrice - netFare));
                    const status = q.status || 'Draft';
                    return (
                      <tr key={qId} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#2563EB' }}>{qId}</td>
                        <td style={{ padding: '12px', color: 'text.secondary' }}>{qDate}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{qRoute}</td>
                        <td style={{ padding: '12px' }}>{qAirline}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#16A34A' }}>${grossPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px', color: '#2563EB', fontWeight: 600 }}>${netFare.toFixed(2)}</td>
                        <td style={{ padding: '12px', fontWeight: 900, color: '#059669' }}>+${profit.toFixed(2)}</td>
                        <td style={{ padding: '12px' }}>
                          <Chip
                            size="small"
                            label={status}
                            color={status.includes('CONVERTED') || status === 'Accepted' ? 'success' : 'default'}
                            sx={{ fontSize: '0.65rem', fontWeight: 800 }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}

      {/* ─── TAB 2: OMNICHANNEL COMMUNICATIONS STREAM ─── */}
      {activeTab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '8fr 4fr' }, gap: 2.5 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
              CHRONOLOGICAL OMNICHANNEL CALL & CHAT TIMELINE
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {commLogs.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No communication records logged yet. Use the composer on the right to log calls, chats, or notes.
                  </Typography>
                </Box>
              ) : (
                commLogs.map((log) => (
                  <Box key={log.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          icon={log.channel === 'WhatsApp' ? <WhatsAppIcon /> : log.channel === 'Call' ? <PhoneIcon /> : <EmailIcon />}
                          label={log.channel}
                          color={log.channel === 'WhatsApp' || log.channel === 'Call' ? 'success' : 'primary'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Agent: {log.agent}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{log.time}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#334155' }}>
                      {log.text}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* Quick Note Composer */}
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, height: 'fit-content' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
              📝 LOG NEW CALL / CHAT
            </Typography>
            <FormControl size="small" fullWidth sx={{ mb: 2 }}>
              <InputLabel>Channel</InputLabel>
              <Select value={logChannel} label="Channel" onChange={e => setLogChannel(e.target.value)}>
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="Call">Phone Call (Telnyx)</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="Internal Note">Internal Agent Note</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={`Enter details of conversation with ${client.firstName || 'customer'}...`}
              value={newLogText}
              onChange={e => setNewLogText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleAddCommLog}
              sx={{ fontWeight: 700 }}
            >
              Save to Timeline
            </Button>
          </Paper>
        </Box>
      )}

      {/* ─── TAB 3: BOOKINGS & 13-DIGIT E-TICKETS ─── */}
      {activeTab === 3 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>CONFIRMED BOOKINGS & 13-DIGIT E-TICKETS</Typography>
            <Chip size="small" label={`Lifetime Flights: ${mockBookingsList.length}`} color="primary" sx={{ fontWeight: 800 }} />
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', background: '#FAFAFA' }}>
                  {['Booking Ref', 'GDS PNR', '13-Digit E-Ticket #', 'Route', 'Travel Date', 'Class & Baggage', 'Amount ($)', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockBookingsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      No confirmed bookings or e-tickets found for this customer.
                    </td>
                  </tr>
                ) : (
                  mockBookingsList.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#2563EB' }}>{b.id}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700 }}>{b.pnr || '—'}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                        {b.ticketNumber || '—'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FlightTakeoffIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          {b.route || '—'}
                        </Box>
                      </td>
                      <td style={{ padding: '12px' }}>{b.travelDate || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{b.cabinClass || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.baggage || '—'}</Typography>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#10B981' }}>${b.sellingPrice?.toFixed(2) || b.sellingPrice || 0}</td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          size="small"
                          label={b.bookingStatus || 'Confirmed'}
                          color={b.bookingStatus === 'TICKETED' || b.bookingStatus === 'COMPLETED' ? 'success' : 'primary'}
                          sx={{ fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}

      {/* ─── TAB 4: PAYMENTS & REFUNDS ─── */}
      {activeTab === 4 && (
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          {/* Invoices Table */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>FINANCIAL INVOICES & COLLECTIONS</Typography>
              <Button size="small" variant="contained" color="secondary" onClick={() => setPaymentModalOpen(true)}>
                + Generate Payment Link
              </Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 650 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9', background: '#FAFAFA' }}>
                    {['Invoice #', 'Booking Ref', 'Amount ($)', 'Payment Method', 'Payment Type', 'Status', 'Date Paid'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                        No financial invoices or payment transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    mockInvoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '12px', fontWeight: 800, fontFamily: 'monospace' }}>{inv.id}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#64748B' }}>{inv.bookingRef}</td>
                        <td style={{ padding: '12px', fontWeight: 900, color: '#10B981' }}>{inv.amount}</td>
                        <td style={{ padding: '12px' }}>{inv.method}</td>
                        <td style={{ padding: '12px', color: 'text.secondary' }}>{inv.type}</td>
                        <td style={{ padding: '12px' }}>
                          <Chip size="small" label={inv.status} color="success" sx={{ fontSize: '0.65rem', fontWeight: 800 }} />
                        </td>
                        <td style={{ padding: '12px', color: '#64748B' }}>{inv.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Box>
          </Paper>

          {/* Refunds & Cancellations */}
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5, color: '#DC2626' }}>
              🔄 REFUND & CANCELLATION DISPUTE LOGS
            </Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FEF2F2' }}>
                  {['Refund ID', 'Booking', 'Original Fare', 'Airline Penalty', 'Agency Fee', 'Net Refund Paid', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#991B1B', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                      No refund or cancellation dispute records logged.
                    </td>
                  </tr>
                ) : (
                  mockRefunds.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 800 }}>{r.id}</td>
                      <td style={{ padding: '8px 10px' }}>{r.bookingRef}</td>
                      <td style={{ padding: '8px 10px' }}>${r.grossAmount}</td>
                      <td style={{ padding: '8px 10px', color: '#DC2626' }}>-${r.airlinePenalty}</td>
                      <td style={{ padding: '8px 10px', color: '#D97706' }}>-${r.agencyFee}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 900, color: '#16A34A' }}>${r.netRefund}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <Chip label={r.status} size="small" color="success" sx={{ fontSize: '0.62rem', height: 18 }} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Paper>
        </Box>
      )}

      {/* ─── TAB 5: PREFERENCES & SSR ─── */}
      {activeTab === 5 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: 'primary.main' }}>
              ✈️ FLIGHT & CABIN PREFERENCES
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 1.5, fontSize: 14 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Preferred Cabin Class:</Typography>
              {client.preferredCabinClass ? (
                <Chip size="small" label={client.preferredCabinClass} color="primary" sx={{ fontWeight: 800, width: 'fit-content' }} />
              ) : (
                <Typography variant="body2" color="text.secondary">—</Typography>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Seat Preference:</Typography>
              <Typography variant="body2" sx={{ fontWeight: client.seatPreference ? 700 : 400 }}>{client.seatPreference || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Meal Preference:</Typography>
              <Typography variant="body2" sx={{ fontWeight: client.mealPreference ? 700 : 400 }}>{client.mealPreference || '—'}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Special Assistance:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{client.specialAssistance || 'None'}</Typography>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: 'warning.main' }}>
              💳 FREQUENT FLYER ACCOUNTS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Array.isArray(client.frequentFlyer) && client.frequentFlyer.length > 0 ? (
                client.frequentFlyer.map((ff, i) => (
                  <Box key={i} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{ff.airline} — {ff.program}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>Account: {ff.number}</Typography>
                    </Box>
                    <Chip size="small" label={`🌟 ${ff.status}`} color="warning" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No frequent flyer accounts registered.</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* ─── TAB 6: INTERNAL NOTES, TASKS & COMPLAINTS ─── */}
      {activeTab === 6 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          {/* Tasks & Remarks */}
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
              📌 AGENT TASKS & INTERNAL REMARKS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {notesTasks.length > 0 ? (
                notesTasks.map(t => (
                  <Box key={t.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Chip label={t.type} size="small" color={t.type === 'Task' ? 'primary' : 'default'} sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
                      <Typography variant="caption" color="text.secondary">Due: {t.dueDate}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">Assigned to: <b>{t.assignee}</b></Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No internal tasks or remarks recorded.</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Complaints & Dispute Resolution */}
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: '#DC2626' }}>
              ⚠️ CUSTOMER COMPLAINTS & SLA LOGS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {complaints.length > 0 ? (
                complaints.map(c => (
                  <Box key={c.id} sx={{ p: 1.5, border: '1px solid #FECACA', borderRadius: 2, bgcolor: '#FEF2F2' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#991B1B' }}>{c.id} ({c.date})</Typography>
                      <Chip label={c.status} size="small" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#7F1D1D', mb: 0.5 }}>Issue: {c.issue}</Typography>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>Resolution: {c.resolution}</Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No customer complaints or disputes reported.</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Payment Link Modal */}
      <PaymentLinkModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={(data) => {
          setPaymentModalOpen(false);
          showAlert(`Payment link generated for ${client.firstName} — ${data.currency} ${Number(data.amount).toLocaleString()}`, 'success');
        }}
      />
    </Box>
  );
};

export default SuperAdminClientDetails;

