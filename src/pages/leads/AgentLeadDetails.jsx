import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// MUI
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

// Icons
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import FlightIcon from '@mui/icons-material/Flight';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Components & Services
import { dbService } from '../../services/dbService';
import PageHeader from '../../components/PageHeader';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { useTelnyx } from '../../contexts/TelnyxContext';

const CABIN_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];
const AIRPORT_OPTIONS = ['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD', 'LHR', 'DXB', 'JFK', 'SIN', 'BKK', 'CDG', 'AMS', 'FRA', 'SYD'];
const STATUS_OPTIONS = ['New', 'Contacted', 'Callback', 'Qualified', 'Quote Sent', 'TL Review', 'Payment Pending', 'Booked', 'Lost'];
const TEMP_OPTIONS = ['COLD', 'WARM', 'HOT', 'VIP'];

export const AgentLeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();
  const { makeCall } = useTelnyx();

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [noteText, setNoteText] = useState('');
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });

  // ── Data ──────────────────────────────────────────────────────────
  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => dbService.getLeadById(id),
  });

  // ── Mutations ─────────────────────────────────────────────────────

  // 1. Update Lead (Edit)
  const updateLeadMutation = useMutation({
    mutationFn: (data) => dbService.updateLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      showAlert('Lead updated successfully ✅', 'success');
      setEditOpen(false);
    },
    onError: () => showAlert('Failed to update lead', 'error'),
  });

  // 2. Add Note (saves to activities array + notes field)
  const addNoteMutation = useMutation({
    mutationFn: (data) => dbService.updateLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      showAlert('Note saved ✅', 'success');
      setNoteText('');
      setNoteOpen(false);
    },
    onError: () => showAlert('Failed to save note', 'error'),
  });

  if (isLoading) {
    return (
      <Box p={5} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box p={5}>
        <Typography>Lead not found.</Typography>
        <Button startIcon={<KeyboardArrowLeftIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────

  // EDIT: open modal pre-filled
  const handleOpenEdit = () => {
    setEditForm({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      origin: lead.origin || '',
      destination: lead.destination || '',
      travelDate: lead.travelDate || '',
      returnDate: lead.returnDate || '',
      cabinClass: lead.cabinClass || 'Economy',
      adults: lead.adults || lead.passengers || 1,
      children: lead.children || 0,
      infants: lead.infants || 0,
      budget: lead.budget || '',
      status: lead.status || 'New',
      leadTemperature: lead.leadTemperature || 'WARM',
      notes: lead.notes || '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    const now = dayjs().format('DD MMM YYYY, HH:mm');
    const actor = currentUser?.name || 'Agent';
    const prevActivities = Array.isArray(lead.activities) ? lead.activities : [];
    const updatedActivities = [
      {
        time: now,
        action: 'Lead Updated',
        notes: `Fields edited by ${actor}`,
        actor,
      },
      ...prevActivities,
    ];
    updateLeadMutation.mutate({
      ...lead,
      ...editForm,
      activities: updatedActivities,
    });
  };

  // CALL: Telnyx makeCall
  const handleCall = () => {
    const phone = lead.phone || lead.fullPhone;
    if (!phone) {
      showAlert('No phone number available for this lead', 'warning');
      return;
    }
    makeCall({
      toNumber: phone,
      toName: `${lead.firstName} ${lead.lastName}`.trim(),
    });
    showAlert(`📞 Calling ${lead.firstName} at ${phone}...`, 'success');
  };

  // EMAIL: open compose modal
  const handleOpenEmail = () => {
    const route = lead.origin && lead.destination ? `${lead.origin} → ${lead.destination}` : 'your trip';
    setEmailForm({
      subject: `Your Flight Inquiry – ${route} | Wow My Flight`,
      body: `Dear ${lead.firstName},\n\nThank you for your flight inquiry for ${route}.\n\nWe have exclusive deals available for your preferred dates. Please let us know a convenient time to connect.\n\nBest regards,\n${currentUser?.name || 'Flight Expert'}\nWow My Flight`,
    });
    setEmailOpen(true);
  };

  const handleSendEmail = () => {
    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
    window.open(mailtoUrl, '_blank');
    // Log activity
    const now = dayjs().format('DD MMM YYYY, HH:mm');
    const actor = currentUser?.name || 'Agent';
    const prevActivities = Array.isArray(lead.activities) ? lead.activities : [];
    addNoteMutation.mutate({
      ...lead,
      activities: [
        { time: now, action: 'Email Sent', notes: `Subject: ${emailForm.subject}`, actor },
        ...prevActivities,
      ],
    });
    setEmailOpen(false);
  };

  // NOTE: add note
  const handleSaveNote = () => {
    if (!noteText.trim()) {
      showAlert('Please enter a note', 'warning');
      return;
    }
    const now = dayjs().format('DD MMM YYYY, HH:mm');
    const actor = currentUser?.name || 'Agent';
    const prevActivities = Array.isArray(lead.activities) ? lead.activities : [];
    const prevNotes = lead.notes || '';
    addNoteMutation.mutate({
      ...lead,
      notes: prevNotes
        ? `${prevNotes}\n\n[${actor} – ${now}]: ${noteText}`
        : `[${actor} – ${now}]: ${noteText}`,
      activities: [
        { time: now, action: 'Note Added', notes: noteText, actor },
        ...prevActivities,
      ],
    });
  };

  // WhatsApp quick link
  const handleWhatsApp = () => {
    const phone = (lead.phone || '').replace(/\D/g, '');
    const route = lead.origin && lead.destination ? `${lead.origin} → ${lead.destination}` : 'your trip';
    const msg = `Hello ${lead.firstName} 👋, I'm from Wow My Flight. We received your flight request for ${route}. May we connect on a quick call to share the best discounted flight options?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const activities = Array.isArray(lead.activities) ? lead.activities : [];

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Box>
      <Button
        startIcon={<KeyboardArrowLeftIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back to Leads
      </Button>

      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        subtitle={`Lead ID: ${lead.id} | ${lead.leadTemperature || 'WARM'} | ${lead.status || 'New'}`}
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleOpenEdit}>
            Edit Lead
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* ── LEFT COLUMN ── */}
        <Grid item xs={12} md={8}>

          {/* Customer Info */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" /> Customer Information
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Full Name', value: `${lead.firstName} ${lead.lastName}` },
                { label: 'Phone', value: lead.phone || '—' },
                { label: 'Email', value: lead.email || '—' },
                { label: 'Source', value: lead.source || '—' },
                { label: 'Country', value: lead.country || lead.nationality || '—' },
                { label: 'City', value: lead.city || '—' },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Flight Request */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlightIcon color="secondary" /> Flight Request
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Origin', value: lead.origin || '—' },
                { label: 'Destination', value: lead.destination || '—' },
                { label: 'Cabin Class', value: lead.cabinClass || 'Economy' },
                { label: 'Departure Date', value: lead.travelDate ? dayjs(lead.travelDate).format('DD MMM YYYY') : '—' },
                { label: 'Return Date', value: lead.returnDate ? dayjs(lead.returnDate).format('DD MMM YYYY') : '—' },
                { label: 'Adults', value: lead.adults || lead.passengers || 1 },
                { label: 'Children', value: lead.children || 0 },
                { label: 'Infants', value: lead.infants || 0 },
                { label: 'Budget', value: lead.budget ? `$${lead.budget}` : '—' },
                { label: 'Flexibility', value: lead.flexibility || '—' },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={4} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Notes */}
          {lead.notes && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>📝 Notes</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</Typography>
            </Paper>
          )}

          {/* Activity Log */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📋 Activity History
            </Typography>
            {activities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No activity recorded yet.</Typography>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', bgcolor: 'divider' }} />
                {activities.map((a, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2.5, position: 'relative' }}>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, flexShrink: 0,
                    }}>
                      <CheckCircleIcon sx={{ color: 'white', fontSize: 14 }} />
                    </Box>
                    <Box sx={{ pt: 0.3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.action}</Typography>
                      {a.notes && (
                        <Typography variant="caption" color="text.secondary" display="block">{a.notes}</Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        <AccessTimeIcon sx={{ fontSize: 11, mr: 0.3, verticalAlign: 'middle' }} />
                        {a.time} {a.actor ? `• by ${a.actor}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ── RIGHT COLUMN ── */}
        <Grid item xs={12} md={4}>

          {/* Route Card */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Flight Route
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{lead.origin || '—'}</Typography>
              <FlightIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{lead.destination || '—'}</Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {lead.travelDate ? dayjs(lead.travelDate).format('DD MMM YYYY') : 'Flexible'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {(lead.passengers || lead.adults || 1)} PAX
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', opacity: 0.9 }}>
              {lead.cabinClass || 'Economy'}
            </Typography>
          </Paper>

          {/* Status & Temp */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Lead Status</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip
                label={lead.status || 'New'}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={lead.leadTemperature || 'WARM'}
                color={lead.leadTemperature === 'HOT' || lead.leadTemperature === 'VIP' ? 'error' : 'warning'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Actions
            </Typography>
            <Grid container spacing={1}>
              {/* CALL */}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<LocalPhoneIcon />}
                  onClick={handleCall}
                  sx={{ justifyContent: 'flex-start', fontWeight: 600 }}
                >
                  Call
                </Button>
              </Grid>
              {/* EMAIL */}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={handleOpenEmail}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Email
                </Button>
              </Grid>
              {/* WHATSAPP */}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  startIcon={<WhatsAppIcon />}
                  onClick={handleWhatsApp}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  WhatsApp
                </Button>
              </Grid>
              {/* ADD NOTE */}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<NoteAddIcon />}
                  onClick={() => setNoteOpen(true)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Add Note
                </Button>
              </Grid>
              {/* EDIT LEAD */}
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                  sx={{ mt: 1 }}
                >
                  Edit Lead Details
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* ═══════════════════════════════════════════════
          MODAL 1 — EDIT LEAD
      ═══════════════════════════════════════════════ */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
          ✏️ Edit Lead — {lead.firstName} {lead.lastName}
          <IconButton onClick={() => setEditOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Personal Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>👤 PERSONAL INFORMATION</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" size="small" value={editForm.firstName || ''} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" size="small" value={editForm.lastName || ''} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email Address" size="small" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" size="small" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </Grid>

            {/* Flight Request */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mt: 1.5, mb: 1 }}>✈️ FLIGHT REQUEST</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Origin Airport" size="small" value={editForm.origin || ''} onChange={e => setEditForm(f => ({ ...f, origin: e.target.value }))}>
                {AIRPORT_OPTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Destination Airport" size="small" value={editForm.destination || ''} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))}>
                {AIRPORT_OPTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Travel Date" size="small" type="date" InputLabelProps={{ shrink: true }} value={editForm.travelDate || ''} onChange={e => setEditForm(f => ({ ...f, travelDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Return Date" size="small" type="date" InputLabelProps={{ shrink: true }} value={editForm.returnDate || ''} onChange={e => setEditForm(f => ({ ...f, returnDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Cabin Class" size="small" value={editForm.cabinClass || 'Economy'} onChange={e => setEditForm(f => ({ ...f, cabinClass: e.target.value }))}>
                {CABIN_OPTIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Adults" size="small" type="number" inputProps={{ min: 1, max: 9 }} value={editForm.adults || 1} onChange={e => setEditForm(f => ({ ...f, adults: Number(e.target.value) }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Budget ($)" size="small" value={editForm.budget || ''} onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))} />
            </Grid>

            {/* Lead Info */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mt: 1.5, mb: 1 }}>🏷️ LEAD STATUS</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" size="small" value={editForm.status || 'New'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Temperature" size="small" value={editForm.leadTemperature || 'WARM'} onChange={e => setEditForm(f => ({ ...f, leadTemperature: e.target.value }))}>
                {TEMP_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Internal Notes" size="small" multiline rows={3} value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveEdit}
            disabled={updateLeadMutation.isPending}
          >
            {updateLeadMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          MODAL 2 — EMAIL COMPOSE
      ═══════════════════════════════════════════════ */}
      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
          📧 Compose Email — {lead.firstName} {lead.lastName}
          <IconButton onClick={() => setEmailOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="To"
              size="small"
              value={lead.email || ''}
              disabled
            />
            <TextField
              fullWidth
              label="Subject"
              size="small"
              value={emailForm.subject}
              onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={8}
              value={emailForm.body}
              onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))}
            />
            <Typography variant="caption" color="text.secondary">
              💡 This will open your default email client (Gmail / Outlook) with the message pre-filled.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEmailOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendEmail}>
            Open Email Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          MODAL 3 — ADD NOTE
      ═══════════════════════════════════════════════ */}
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
          📝 Add Note — {lead.firstName} {lead.lastName}
          <IconButton onClick={() => setNoteOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Your Note"
              multiline
              rows={5}
              placeholder="e.g. Customer called back — interested in Business class upgrade. Follow up Friday."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              autoFocus
            />
            <Typography variant="caption" color="text.secondary">
              Note will be saved with your name and timestamp in the activity log.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNoteOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<SaveIcon />}
            onClick={handleSaveNote}
            disabled={addNoteMutation.isPending}
          >
            {addNoteMutation.isPending ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentLeadDetails;
