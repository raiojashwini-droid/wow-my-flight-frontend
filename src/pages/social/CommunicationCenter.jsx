import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

// Icons
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ForumIcon from '@mui/icons-material/Forum';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import useAuth from '../../hooks/useAuth';
import { useTelnyx } from '../../contexts/TelnyxContext';
import { dbService } from '../../services/dbService';
import { sendSMS, fetchCallHistory, toE164, formatCallDuration } from '../../services/telnyxService';
import SuperAdminSocialInbox from './SuperAdminSocialInbox';

const TIMELINE_STORAGE_KEY = 'crm_communication_timeline';
const DELETED_CALL_IDS_KEY = 'crm_deleted_call_ids';

const getDeletedCallIds = () => {
  try {
    const saved = localStorage.getItem(DELETED_CALL_IDS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

export default function CommunicationCenter() {
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();
  const {
    makeCall,
    hangup: webrtcHangup,
    sdkStatus,
    callState,
    callSeconds,
    isMuted,
    isOnHold,
    toggleMute,
    toggleHold,
    phoneNumbers: telnyxPhoneNumbers,
    selectedFromNumber: defaultFromNumber,
  } = useTelnyx();

  // State
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getInitialMasterTab = () => {
    if (tabParam === 'chat' || tabParam === 'whatsapp' || tabParam === 'social') return 1;
    if (tabParam === 'logs' || tabParam === 'history' || tabParam === 'activity') return 2;
    return 0; // default: 0 (Softphone & Calling)
  };

  const [masterTab, setMasterTab] = useState(getInitialMasterTab);

  useEffect(() => {
    if (tabParam === 'chat' || tabParam === 'whatsapp' || tabParam === 'social') {
      setMasterTab(1);
    } else if (tabParam === 'logs' || tabParam === 'history' || tabParam === 'activity') {
      setMasterTab(2);
    } else if (tabParam === 'calls' || tabParam === 'phone' || tabParam === 'softphone') {
      setMasterTab(0);
    }
  }, [tabParam]);

  const handleMasterTabChange = (event, newValue) => {
    setMasterTab(newValue);
    const tabKeys = ['calls', 'chat', 'logs'];
    const current = Object.fromEntries(searchParams.entries());
    current.tab = tabKeys[newValue];
    setSearchParams(current);
  };

  // Direct softphone dialer state (for Tab 0)
  const [dialerNumber, setDialerNumber] = useState('');
  const [dialerSelectedContact, setDialerSelectedContact] = useState(null);

  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [realLeads, setRealLeads] = useState([]);
  const [realClients, setRealClients] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('SMS');
  const [selectedContact, setSelectedContact] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFromNumber, setSelectedFromNumber] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Delete & Clear Confirmation State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // 1. Load real leads & clients from CRM store
  useEffect(() => {
    let isMounted = true;
    async function loadCRMData() {
      try {
        const [leadsData, clientsData] = await Promise.all([
          dbService.getLeads().catch(() => []),
          dbService.getClients().catch(() => []),
        ]);
        if (isMounted) {
          setRealLeads(Array.isArray(leadsData) ? leadsData : []);
          setRealClients(Array.isArray(clientsData) ? clientsData : []);
        }
      } catch (err) {
        console.warn('Could not load CRM contacts:', err);
      }
    }
    loadCRMData();
    return () => { isMounted = false; };
  }, []);

  // 2. Load real call history & persistent timeline from storage
  useEffect(() => {
    let isMounted = true;
    async function loadCommunications() {
      setLoading(true);
      try {
        const deletedIds = getDeletedCallIds();

        // Fetch real call logs from Telnyx backend
        const calls = await fetchCallHistory().catch(() => []);
        if (!isMounted) return;

        // Filter out any calls that the user previously deleted
        const activeCalls = (Array.isArray(calls) ? calls : []).filter(
          (c) => !deletedIds.has(String(c.id)) && !deletedIds.has(String(c.callControlId))
        );

        setCallHistory(activeCalls);

        // Load timeline events saved by real agent actions
        const savedTimeline = localStorage.getItem(TIMELINE_STORAGE_KEY);
        let parsedEvents = [];
        if (savedTimeline) {
          try {
            parsedEvents = JSON.parse(savedTimeline);
          } catch (e) {
            console.warn('Failed parsing timeline storage:', e);
          }
        }

        // Filter out deleted events from saved timeline
        parsedEvents = parsedEvents.filter((ev) => !deletedIds.has(String(ev.id)));

        // Map real calls from Telnyx into timeline events
        const mappedCallEvents = activeCalls.map((c) => ({
          id: c.id || `call_${c.callControlId}`,
          callControlId: c.callControlId,
          type: 'Call',
          channel: 'Call',
          title: c.direction === 'inbound' ? 'Inbound Call Received' : 'Outbound Call Placed',
          customer: c.toNumber || c.fromNumber || 'Unknown Customer',
          agent: c.agentName || 'Agent',
          time: c.startedAt ? new Date(c.startedAt).toLocaleString() : 'Recent',
          status: c.status === 'completed' ? `Completed (${c.durationSeconds || 0}s)` : c.status || 'Initiated',
          details: c.notes || (c.disposition ? `Outcome: ${c.disposition}` : 'Two-way voice session'),
          timestamp: c.startedAt || new Date().toISOString(),
        }));

        // Merge saved timeline with real call logs, avoid duplicate ids
        const existingIds = new Set(parsedEvents.map((e) => e.id));
        const merged = [...parsedEvents];
        mappedCallEvents.forEach((ev) => {
          if (!existingIds.has(ev.id) && !deletedIds.has(String(ev.id))) {
            merged.push(ev);
            existingIds.add(ev.id);
          }
        });

        // Sort newest first
        merged.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

        setTimelineEvents(merged);
      } catch (err) {
        console.error('Error loading communications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCommunications();
    return () => { isMounted = false; };
  }, []);

  // Set default sender phone number from Telnyx numbers
  useEffect(() => {
    if (telnyxPhoneNumbers && telnyxPhoneNumbers.length > 0 && !selectedFromNumber) {
      setSelectedFromNumber(defaultFromNumber || telnyxPhoneNumbers[0].number);
    }
  }, [telnyxPhoneNumbers, defaultFromNumber, selectedFromNumber]);

  // Combined list of real contacts for the Autocomplete
  const contactOptions = useMemo(() => {
    const list = [];
    realLeads.forEach((lead) => {
      if (lead) {
        const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name || 'Unnamed Lead';
        list.push({
          id: lead.id,
          name,
          phone: lead.phone || '',
          email: lead.email || '',
          category: 'Lead',
          label: `${name} (Lead: ${lead.phone || lead.email || 'No contact'})`,
        });
      }
    });

    realClients.forEach((client) => {
      if (client) {
        const name = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name || 'Unnamed Client';
        list.push({
          id: client.id,
          name,
          phone: client.phone || '',
          email: client.email || '',
          category: 'Client',
          label: `${name} (Client: ${client.phone || client.email || 'No contact'})`,
        });
      }
    });

    return list;
  }, [realLeads, realClients]);

  // Persist timeline helper
  const addTimelineEvent = (newEvent) => {
    setTimelineEvents((prev) => {
      const updated = [newEvent, ...prev];
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(updated.slice(0, 200)));
      return updated;
    });
  };

  // Delete an individual record
  const confirmDeleteEvent = (event) => {
    setItemToDelete(event);
  };

  const executeDeleteEvent = () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;

    // Track in deleted call IDs if it's a call record
    if (itemToDelete.channel === 'Call') {
      const deletedIds = getDeletedCallIds();
      deletedIds.add(String(targetId));
      if (itemToDelete.callControlId) deletedIds.add(String(itemToDelete.callControlId));
      localStorage.setItem(DELETED_CALL_IDS_KEY, JSON.stringify(Array.from(deletedIds)));
    }

    setTimelineEvents((prev) => {
      const updated = prev.filter((e) => e.id !== targetId);
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setItemToDelete(null);
    showAlert('✓ Communication record deleted', 'info');
  };

  // Clear All / Filtered records
  const executeClearHistory = () => {
    const deletedIds = getDeletedCallIds();

    setTimelineEvents((prev) => {
      const eventsToRemove = filter === 'ALL' ? prev : prev.filter((e) => e.channel === filter);
      eventsToRemove.forEach((ev) => {
        if (ev.channel === 'Call') {
          deletedIds.add(String(ev.id));
          if (ev.callControlId) deletedIds.add(String(ev.callControlId));
        }
      });
      localStorage.setItem(DELETED_CALL_IDS_KEY, JSON.stringify(Array.from(deletedIds)));

      const updated = filter === 'ALL' ? [] : prev.filter((e) => e.channel !== filter);
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setClearConfirmOpen(false);
    showAlert(
      filter === 'ALL'
        ? '✓ Entire communication timeline cleared'
        : `✓ All ${filter} records deleted`,
      'info'
    );
  };

  // Derive REAL Dynamic KPI Counts from actual records
  const kpiStats = useMemo(() => {
    const totalCalls = timelineEvents.filter((e) => e.channel === 'Call').length;
    const answeredCalls = timelineEvents.filter(
      (e) => e.channel === 'Call' && (e.status.includes('Completed') || e.status.includes('Answered'))
    ).length;

    const totalSeconds = callHistory.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
    const avgSeconds = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;

    const smsSent = timelineEvents.filter((e) => e.channel === 'SMS').length;
    const whatsappSent = timelineEvents.filter((e) => e.channel === 'WhatsApp').length;
    const emailsSent = timelineEvents.filter((e) => e.channel === 'Email').length;
    const callbacksCount = timelineEvents.filter((e) => e.channel === 'Callbacks').length;
    const notesCount = timelineEvents.filter((e) => e.channel === 'Notes').length;

    return {
      totalCalls,
      answeredCalls,
      avgTalkTime: formatCallDuration(avgSeconds),
      smsSent,
      whatsappSent,
      emailsSent,
      callbacksCount,
      notesCount,
    };
  }, [timelineEvents, callHistory]);

  // Channel counts for filter tabs
  const channelCounts = useMemo(() => {
    return {
      ALL: timelineEvents.length,
      Call: timelineEvents.filter((e) => e.channel === 'Call').length,
      Email: timelineEvents.filter((e) => e.channel === 'Email').length,
      SMS: timelineEvents.filter((e) => e.channel === 'SMS').length,
      WhatsApp: timelineEvents.filter((e) => e.channel === 'WhatsApp').length,
      Callbacks: timelineEvents.filter((e) => e.channel === 'Callbacks').length,
      Notes: timelineEvents.filter((e) => e.channel === 'Notes').length,
    };
  }, [timelineEvents]);

  // Filtered timeline
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter((e) => {
      const matchesFilter = filter === 'ALL' || e.channel === filter;
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (e.customer && e.customer.toLowerCase().includes(search)) ||
        (e.details && e.details.toLowerCase().includes(search)) ||
        (e.title && e.title.toLowerCase().includes(search));
      return matchesFilter && matchesSearch;
    });
  }, [timelineEvents, filter, searchQuery]);

  // Dedicated call & callback events for Tab 1 (Softphone & Calling)
  const callEvents = useMemo(() => {
    return timelineEvents.filter((e) => e.channel === 'Call' || e.channel === 'Callbacks');
  }, [timelineEvents]);

  // Open modal with preselected channel action
  const openActionModal = (type) => {
    setActionType(type);
    setSelectedContact(null);
    setRecipient('');
    setMessageText('');
    setEmailSubject('');
    setCallbackDate('');
    setActionModalOpen(true);
  };

  // Handle contact selection from autocomplete
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    if (contact) {
      if (actionType === 'Email') {
        setRecipient(contact.email || contact.phone || '');
      } else {
        setRecipient(contact.phone || contact.email || '');
      }
    }
  };

  // Execute Action Submit
  const handleActionSubmit = async () => {
    const agentName = currentUser?.name || 'Agent';

    if (actionType === 'Call') {
      if (!recipient) {
        showAlert('Please enter or select a customer phone number to call.', 'warning');
        return;
      }
      const cleanTo = toE164(recipient) || recipient;
      setActionModalOpen(false);
      try {
        showAlert(`📞 Placing WebRTC call to ${cleanTo}...`, 'info');
        await makeCall({ toNumber: cleanTo });
        addTimelineEvent({
          id: `call_${Date.now()}`,
          type: 'Call',
          channel: 'Call',
          title: `Outbound Call Initiated to ${cleanTo}`,
          customer: selectedContact ? `${selectedContact.name} (${cleanTo})` : cleanTo,
          agent: agentName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Connected',
          details: 'WebRTC outbound voice session started',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Call error:', err);
        showAlert(`Call failed: ${err.message}`, 'error');
      }
      return;
    }

    if (actionType === 'SMS') {
      if (!recipient || !messageText) {
        showAlert('Please enter both a recipient phone number and SMS text.', 'warning');
        return;
      }
      setIsSending(true);
      const cleanTo = toE164(recipient) || recipient;
      try {
        const res = await sendSMS({
          to: cleanTo,
          from: selectedFromNumber || defaultFromNumber || '+18503329681',
          text: messageText,
          agentId: currentUser?.id || 'agent-1',
        });

        addTimelineEvent({
          id: `sms_${Date.now()}`,
          type: 'SMS',
          channel: 'SMS',
          title: `SMS Sent to ${cleanTo}`,
          customer: selectedContact ? `${selectedContact.name} (${cleanTo})` : cleanTo,
          agent: agentName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: res?.status === 'queued' ? 'Queued' : 'Delivered',
          details: `"${messageText}"`,
          timestamp: new Date().toISOString(),
        });

        setActionModalOpen(false);
        setMessageText('');
        showAlert(`✓ Real SMS sent via Telnyx to ${cleanTo}!`, 'success');
      } catch (err) {
        console.error('SMS send error:', err);
        showAlert(`SMS delivery failed: ${err.response?.data?.error || err.message}`, 'error');
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (actionType === 'WhatsApp') {
      if (!recipient || !messageText) {
        showAlert('Please enter recipient phone number and WhatsApp message.', 'warning');
        return;
      }
      const cleanPhone = recipient.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(messageText);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      window.open(waUrl, '_blank', 'noopener,noreferrer');

      addTimelineEvent({
        id: `wa_${Date.now()}`,
        type: 'WhatsApp',
        channel: 'WhatsApp',
        title: `WhatsApp Message Dispatched to ${recipient}`,
        customer: selectedContact ? `${selectedContact.name} (${recipient})` : recipient,
        agent: agentName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Dispatched',
        details: `"${messageText}"`,
        timestamp: new Date().toISOString(),
      });

      setActionModalOpen(false);
      setMessageText('');
      showAlert(`✓ WhatsApp Web window launched & recorded to Timeline!`, 'success');
      return;
    }

    if (actionType === 'Email') {
      if (!recipient || !messageText) {
        showAlert('Please enter recipient email and message content.', 'warning');
        return;
      }
      addTimelineEvent({
        id: `email_${Date.now()}`,
        type: 'Email',
        channel: 'Email',
        title: emailSubject ? `Email: ${emailSubject}` : `Email Dispatched to ${recipient}`,
        customer: selectedContact ? `${selectedContact.name} (${recipient})` : recipient,
        agent: agentName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Sent',
        details: emailSubject ? `Subject: ${emailSubject} — "${messageText}"` : `"${messageText}"`,
        timestamp: new Date().toISOString(),
      });

      setActionModalOpen(false);
      setMessageText('');
      setEmailSubject('');
      showAlert(`✓ Email communication successfully logged to Customer Timeline!`, 'success');
      return;
    }

    if (actionType === 'Callback') {
      if (!recipient || !callbackDate) {
        showAlert('Please specify recipient and scheduled date/time.', 'warning');
        return;
      }
      addTimelineEvent({
        id: `cb_${Date.now()}`,
        type: 'Callback',
        channel: 'Callbacks',
        title: `Scheduled Courtesy Callback`,
        customer: selectedContact ? `${selectedContact.name} (${recipient})` : recipient,
        agent: agentName,
        time: callbackDate,
        status: 'Scheduled',
        details: messageText ? `Reminder: "${messageText}"` : 'Customer follow-up callback scheduled',
        timestamp: new Date().toISOString(),
      });

      setActionModalOpen(false);
      setMessageText('');
      setCallbackDate('');
      showAlert(`✓ Callback scheduled and added to Customer Timeline!`, 'success');
      return;
    }

    if (actionType === 'Note') {
      if (!messageText) {
        showAlert('Please enter note text.', 'warning');
        return;
      }
      addTimelineEvent({
        id: `note_${Date.now()}`,
        type: 'Note',
        channel: 'Notes',
        title: `Internal Staff Note Added`,
        customer: selectedContact ? `${selectedContact.name}` : recipient || 'General Account Note',
        agent: agentName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Internal Only',
        details: messageText,
        timestamp: new Date().toISOString(),
      });

      setActionModalOpen(false);
      setMessageText('');
      showAlert(`✓ Internal Note recorded to Customer Timeline!`, 'success');
    }
  };

  const handleDialerCall = async () => {
    const rawTo = dialerNumber || dialerSelectedContact?.phone;
    if (!rawTo) {
      showAlert('Please enter or select a customer phone number to dial.', 'warning');
      return;
    }
    const cleanTo = toE164(rawTo) || rawTo;
    try {
      showAlert(`📞 Placing WebRTC call to ${cleanTo}...`, 'info');
      await makeCall({ toNumber: cleanTo });
      addTimelineEvent({
        id: `call_${Date.now()}`,
        type: 'Call',
        channel: 'Call',
        title: `Outbound Call Initiated to ${cleanTo}`,
        customer: dialerSelectedContact ? `${dialerSelectedContact.name} (${cleanTo})` : cleanTo,
        agent: currentUser?.name || 'Agent',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Connected',
        details: 'WebRTC outbound voice session started via Softphone',
        timestamp: new Date().toISOString(),
      });
      setDialerNumber('');
      setDialerSelectedContact(null);
    } catch (err) {
      console.error('Dialer call error:', err);
      showAlert(`Call failed: ${err.message}`, 'error');
    }
  };

  const isCallActive = callState !== 'IDLE' && callState !== 'ENDED';

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', width: '100%', px: { xs: 1.5, sm: 2.5, md: 3 } }}>
      
      {/* ── Top Executive Header ─────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          px: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          bgcolor: 'background.paper',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#1E293B',
              width: 50,
              height: 50,
              boxShadow: '0 8px 16px rgba(30, 41, 59, 0.15)',
            }}
          >
            <ForumIcon sx={{ color: '#38BDF8', fontSize: '1.6rem' }} />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: 'text.primary',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '-0.3px',
                }}
              >
                Central Communication Center & Unified Hub
              </Typography>
              {sdkStatus === 'registered' ? (
                <Chip
                  icon={<CheckCircleIcon sx={{ color: '#FFF !important', fontSize: '0.85rem' }} />}
                  label="TELNYX WEBRTC ONLINE"
                  size="small"
                  sx={{ fontWeight: 900, fontSize: '0.65rem', bgcolor: '#059669', color: '#FFF' }}
                />
              ) : (
                <Chip
                  label="WEBRTC CONNECTING..."
                  size="small"
                  sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: 'var(--wl-E2E8F0, #E2E8F0)', color: 'var(--wd-475569, #475569)' }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.3 }}>
              Live omnichannel hub recording real Calls, SMS, WhatsApp, Emails, Callbacks, and Internal Notes
            </Typography>
          </Box>
        </Box>

        <DualClock client={{ timezone: 'America/New_York', label: 'Telecom EST' }} />
      </Paper>

      {/* ── Master Unified Tabs ──────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 0.8,
          px: 1.5,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <Tabs
          value={masterTab}
          onChange={handleMasterTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.86rem',
              textTransform: 'none',
              py: 1,
              px: 2.2,
              borderRadius: 2,
              minHeight: 42,
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              alignItems: 'center',
            },
            '& .Mui-selected': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.12)' : '#F0F9FF',
              color: '#0284C7 !important',
            }
          }}
        >
          <Tab
            icon={<PhoneInTalkIcon sx={{ fontSize: '1.15rem' }} />}
            label="Tab 1: Softphone & Calling"
            value={0}
          />
          <Tab
            icon={<WhatsAppIcon sx={{ fontSize: '1.15rem', color: '#16A34A' }} />}
            label="Tab 2: WhatsApp & Live Chats"
            value={1}
          />
          <Tab
            icon={<ForumIcon sx={{ fontSize: '1.15rem', color: '#7C3AED' }} />}
            label="Tab 3: SMS/Email Activity Logs"
            value={2}
          />
        </Tabs>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<PhoneInTalkIcon fontSize="small" />}
            onClick={() => openActionModal('Call')}
            sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem' }}
          >
            Quick Call
          </Button>
          <Button
            size="small"
            variant="contained"
            sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
            startIcon={<SmsIcon fontSize="small" />}
            onClick={() => openActionModal('SMS')}
          >
            Quick SMS
          </Button>
        </Box>
      </Paper>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: SOFTPHONE & VOICE CALLING (masterTab === 0)
      ════════════════════════════════════════════════════════════════════════ */}
      {masterTab === 0 && (
        <Box sx={{ width: '100%' }}>
          {/* Active WebRTC Call Banner (When in Call) */}
          {isCallActive && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                bgcolor: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #1E293B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                width: '100%',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#EF4444', width: 44, height: 44 }}>
                  <PhoneInTalkIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#38BDF8' }}>
                    Active WebRTC Call in Progress
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    Live Duration: <b style={{ color: '#22C55E' }}>{formatCallDuration(callSeconds)}</b> • State:{' '}
                    <b>{callState}</b> • HD Audio Live
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color={isMuted ? 'error' : 'inherit'}
                  onClick={toggleMute}
                  startIcon={isMuted ? <MicOffIcon /> : <MicIcon />}
                  sx={{ fontWeight: 800, borderColor: '#334155' }}
                >
                  {isMuted ? 'Unmute' : 'Mute Mic'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color={isOnHold ? 'warning' : 'inherit'}
                  onClick={toggleHold}
                  startIcon={<PauseIcon />}
                  sx={{ fontWeight: 800, borderColor: '#334155' }}
                >
                  {isOnHold ? 'Resume' : 'Hold'}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => webrtcHangup()}
                  startIcon={<CallEndIcon />}
                  sx={{ fontWeight: 900 }}
                >
                  End Call
                </Button>
              </Box>
            </Paper>
          )}

          {/* 4 Voice KPI Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 3,
              width: '100%',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#3F51B5' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  Calls Connected
                </Typography>
                <Avatar sx={{ width: 28, height: 28, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF', color: '#3F51B5' }}>
                  <PhoneInTalkIcon sx={{ fontSize: '0.95rem' }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
                {kpiStats.totalCalls}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Answered: <b>{kpiStats.answeredCalls}</b> • Avg: <b>{kpiStats.avgTalkTime}</b>
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#0284C7' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  WebRTC Line Status
                </Typography>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
                  <CheckCircleIcon sx={{ fontSize: '0.95rem' }} />
                </Avatar>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: sdkStatus === 'registered' ? '#059669' : '#D97706', my: 0.8 }}>
                {sdkStatus === 'registered' ? 'ONLINE & READY' : 'CONNECTING...'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Codec: <b>Opus HD Audio</b> • Telnyx SIP
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#D97706' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  Scheduled Callbacks
                </Typography>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }}>
                  <CalendarMonthIcon sx={{ fontSize: '0.95rem' }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
                {kpiStats.callbacksCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Pending Courtesy Follow-ups
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#059669' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  Outbound Direct Lines
                </Typography>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                  <PhoneInTalkIcon sx={{ fontSize: '0.95rem' }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
                {telnyxPhoneNumbers?.length || 1}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Active DIDs: <b>{defaultFromNumber || '+18503329681'}</b>
              </Typography>
            </Paper>
          </Box>

          {/* Direct Softphone Dialer & Call Launcher Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#0284C7', width: 40, height: 40 }}>
                  <PhoneInTalkIcon sx={{ fontSize: '1.25rem', color: '#FFF' }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Telnyx WebRTC Softphone Dialer
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Direct browser-to-phone outbound dialing with crystal-clear Opus HD audio
                  </Typography>
                </Box>
              </Box>

              <Chip
                label={sdkStatus === 'registered' ? 'WebRTC SIP Registered' : 'Connecting SIP Trunk...'}
                size="small"
                color={sdkStatus === 'registered' ? 'success' : 'default'}
                sx={{ fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 2.5, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Caller ID selector */}
                <TextField
                  select
                  size="small"
                  label="Caller ID (Telnyx Outbound Number)"
                  value={selectedFromNumber || defaultFromNumber || (telnyxPhoneNumbers[0]?.number || '+18503329681')}
                  onChange={(e) => setSelectedFromNumber(e.target.value)}
                  fullWidth
                >
                  {(telnyxPhoneNumbers || []).map((num) => (
                    <MenuItem key={num.number} value={num.number}>
                      {num.friendlyName || num.number} ({num.number})
                    </MenuItem>
                  ))}
                  {(!telnyxPhoneNumbers || telnyxPhoneNumbers.length === 0) && (
                    <MenuItem value="+18503329681">+1 (850) 332-9681 (Primary US DID)</MenuItem>
                  )}
                </TextField>

                {/* Recipient Contact or Number */}
                <Autocomplete
                  freeSolo
                  options={contactOptions}
                  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label || '')}
                  value={dialerSelectedContact}
                  onChange={(e, val) => {
                    setDialerSelectedContact(val);
                    if (val && typeof val !== 'string') {
                      setDialerNumber(val.phone || '');
                    }
                  }}
                  onInputChange={(e, val) => {
                    setDialerNumber(val);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer Phone Number (E.164) or Search CRM Contact"
                      size="small"
                      placeholder="+12025550199 or Search Lead/Client..."
                      fullWidth
                    />
                  )}
                />

                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<PhoneInTalkIcon />}
                    onClick={handleDialerCall}
                    disabled={isCallActive}
                    sx={{ fontWeight: 800, px: 3, py: 1.1, borderRadius: 2, flexGrow: 1 }}
                  >
                    {isCallActive ? 'Call in Progress...' : 'Start Voice Call'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="large"
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => {
                      setRecipient(dialerNumber || dialerSelectedContact?.phone || '');
                      openActionModal('Callback');
                    }}
                    sx={{ fontWeight: 800, px: 2.5, borderRadius: 2 }}
                  >
                    Schedule Callback
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    startIcon={<NoteAltIcon />}
                    onClick={() => {
                      setRecipient(dialerNumber || dialerSelectedContact?.name || '');
                      openActionModal('Note');
                    }}
                    sx={{ fontWeight: 800, px: 2, borderRadius: 2 }}
                  >
                    Note
                  </Button>
                </Box>
              </Box>

              {/* Quick instructions / features box */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                  🎙️ Softphone Features & Telephony Controls
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                  • <b>WebRTC Audio:</b> High-fidelity voice connection directly inside your browser. No external hardware or PBX setup required.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                  • <b>Live Controls:</b> Hold, Mute, Audio Duration, and Disconnect controls appear automatically in the Active Call Banner above.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  • <b>CRM Auto-Logging:</b> Every voice call and callback is instantly recorded with timestamp and agent attribution into the timeline feed.
                </Typography>
              </Paper>
            </Box>
          </Paper>

          {/* Voice Call Activity Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                📞 Call Log & Scheduled Follow-ups ({callEvents.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Historical phone interactions, inbound inquiries, callbacks, and voice recordings
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<PhoneInTalkIcon fontSize="small" />}
              onClick={() => openActionModal('Call')}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
            >
              Dial New Number
            </Button>
          </Box>

          {callEvents.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'background.neutral',
              }}
            >
              <Avatar sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#0284C7', width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                <PhoneInTalkIcon sx={{ fontSize: '1.8rem' }} />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No Voice Calls Logged Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 2 }}>
                Place a call using the Softphone Dialer above or schedule a customer callback. All voice calls will be automatically archived here.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              {callEvents.map((ev) => {
                const isCall = ev.channel === 'Call';
                return (
                  <Paper
                    key={ev.id}
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: isCall ? '#EEF2FF' : '#FFFBEB',
                            color: isCall ? '#3F51B5' : '#D97706',
                            fontWeight: 900,
                            width: 38,
                            height: 38,
                          }}
                        >
                          {isCall ? <PhoneInTalkIcon fontSize="small" /> : <CalendarMonthIcon fontSize="small" />}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                            {ev.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Customer: <b style={{ color: 'text.primary' }}>{ev.customer}</b> • Rep:{' '}
                            <b style={{ color: 'text.primary' }}>{ev.agent}</b>
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={ev.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              height: 22,
                              fontSize: '0.66rem',
                              bgcolor: isCall ? '#EEF2FF' : '#FFFBEB',
                              color: isCall ? '#3F51B5' : '#D97706',
                              mb: 0.3,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, fontFamily: 'monospace' }}>
                            {ev.time}
                          </Typography>
                        </Box>

                        <Tooltip title="Delete call record">
                          <IconButton size="small" onClick={() => confirmDeleteEvent(ev)} sx={{ color: '#94A3B8' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        bgcolor: 'background.neutral',
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1.2,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', flexGrow: 1 }}>
                        {ev.details}
                      </Typography>

                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<PhoneInTalkIcon fontSize="small" />}
                        onClick={() => {
                          const num = ev.customer.match(/\+?\d[\d -]{7,}/)?.[0] || ev.customer;
                          setDialerNumber(num);
                          setRecipient(num);
                          openActionModal('Call');
                        }}
                        sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                      >
                        Call Back
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: WHATSAPP & SOCIAL LIVE CHATS (masterTab === 1)
      ════════════════════════════════════════════════════════════════════════ */}
      {masterTab === 1 && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <SuperAdminSocialInbox hideHeader={true} />
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: SMS/EMAIL ACTIVITY LOGS & OMNICHANNEL TIMELINE (masterTab === 2)
      ════════════════════════════════════════════════════════════════════════ */}
      {masterTab === 2 && (
        <Box sx={{ width: '100%' }}>
          {/* 4 Spacious, Responsive 100% Width KPI Cards (Real Data Only) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
          width: '100%',
        }}
      >
        {/* Card 1: Voice Calling */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#3F51B5' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
              Voice & Calls
            </Typography>
            <Avatar sx={{ width: 28, height: 28, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF', color: '#3F51B5' }}>
              <PhoneInTalkIcon sx={{ fontSize: '0.95rem' }} />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
            {kpiStats.totalCalls}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Answered: <b>{kpiStats.answeredCalls}</b> • Avg: <b>{kpiStats.avgTalkTime}</b>
          </Typography>
        </Paper>

        {/* Card 2: Messaging (SMS & WhatsApp) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#7C3AED' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
              Direct Messaging
            </Typography>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'var(--wl-F5F3FF, #F5F3FF)', color: '#7C3AED' }}>
              <SmsIcon sx={{ fontSize: '0.95rem' }} />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
            {kpiStats.smsSent + kpiStats.whatsappSent}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Telnyx SMS: <b>{kpiStats.smsSent}</b> • WhatsApp: <b>{kpiStats.whatsappSent}</b>
          </Typography>
        </Paper>

        {/* Card 3: Email Communications */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#0284C7' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
              Email Activity
            </Typography>
            <Avatar sx={{ width: 28, height: 28, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.12)' : '#F0F9FF', color: '#0284C7' }}>
              <EmailIcon sx={{ fontSize: '0.95rem' }} />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
            {kpiStats.emailsSent}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Logged Quotes & Correspondence
          </Typography>
        </Paper>

        {/* Card 4: Callbacks & Internal Notes */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#059669' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
              Follow-ups & Notes
            </Typography>
            <Avatar sx={{ width: 28, height: 28, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', color: '#059669' }}>
              <CalendarMonthIcon sx={{ fontSize: '0.95rem' }} />
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', my: 0.5 }}>
            {kpiStats.callbacksCount + kpiStats.notesCount}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Callbacks: <b>{kpiStats.callbacksCount}</b> • Notes: <b>{kpiStats.notesCount}</b>
          </Typography>
        </Paper>
      </Box>

      {/* ── Quick Channel Action Bar ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          px: 2.5,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
          display: 'flex',
          gap: 1.2,
          flexWrap: 'wrap',
          alignItems: 'center',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', mr: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚡ Quick Channel Actions:
        </Typography>

        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<PhoneInTalkIcon />}
          onClick={() => openActionModal('Call')}
          sx={{ fontWeight: 800, borderRadius: 2, px: 2, py: 0.8, textTransform: 'none' }}
        >
          Click-to-Call
        </Button>

        <Button
          size="small"
          variant="contained"
          sx={{ fontWeight: 800, borderRadius: 2, px: 2, py: 0.8, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
          startIcon={<SmsIcon />}
          onClick={() => openActionModal('SMS')}
        >
          Send SMS
        </Button>

        <Button
          size="small"
          variant="contained"
          sx={{ fontWeight: 800, borderRadius: 2, px: 2, py: 0.8, textTransform: 'none', bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
          startIcon={<WhatsAppIcon />}
          onClick={() => openActionModal('WhatsApp')}
        >
          WhatsApp Web
        </Button>

        <Button
          size="small"
          variant="contained"
          sx={{ fontWeight: 800, borderRadius: 2, px: 2, py: 0.8, textTransform: 'none', bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' } }}
          startIcon={<EmailIcon />}
          onClick={() => openActionModal('Email')}
        >
          Log Email
        </Button>

        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<CalendarMonthIcon />}
          onClick={() => openActionModal('Callback')}
          sx={{ fontWeight: 800, borderRadius: 2, px: 2, py: 0.8, textTransform: 'none' }}
        >
          Schedule Callback
        </Button>

        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<NoteAltIcon />}
          onClick={() => openActionModal('Note')}
          sx={{ fontWeight: 800, borderRadius: 2, px: 2, py: 0.8, textTransform: 'none', borderColor: 'var(--wb-CBD5E1, #CBD5E1)' }}
        >
          Add Internal Note
        </Button>
      </Paper>

      {/* ── Search Bar, Filter Tabs & Clear History Action ───────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.8,
          px: 2.2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search customer, phone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: 280, md: 340 } }}
          />

          <Tabs
            value={filter}
            onChange={(e, val) => setFilter(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 800,
                fontSize: '0.76rem',
                textTransform: 'none',
                minHeight: 38,
                borderRadius: 2,
              },
            }}
          >
            <Tab label={`All Activity (${channelCounts.ALL})`} value="ALL" />
            <Tab label={`📞 Calls (${channelCounts.Call})`} value="Call" />
            <Tab label={`💬 SMS (${channelCounts.SMS})`} value="SMS" />
            <Tab label={`🟢 WhatsApp (${channelCounts.WhatsApp})`} value="WhatsApp" />
            <Tab label={`✉️ Emails (${channelCounts.Email})`} value="Email" />
            <Tab label={`⏰ Callbacks (${channelCounts.Callbacks})`} value="Callbacks" />
            <Tab label={`📝 Notes (${channelCounts.Notes})`} value="Notes" />
          </Tabs>
        </Box>

        {timelineEvents.length > 0 && (
          <Tooltip title={filter === 'ALL' ? 'Clear entire timeline history' : `Clear all ${filter} history`}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon fontSize="small" />}
              onClick={() => setClearConfirmOpen(true)}
              sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.74rem', borderRadius: 2 }}
            >
              {filter === 'ALL' ? 'Clear History' : `Clear ${filter}`}
            </Button>
          </Tooltip>
        )}
      </Paper>

      {/* ── Unified Chronological Timeline Feed ──────────────────────────────── */}
      {filteredEvents.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3.5,
            border: '2px dashed var(--wb-E2E8F0, #E2E8F0)',
            bgcolor: 'background.neutral',
            width: '100%',
          }}
        >
          <Avatar sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', color: '#64748B', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <ForumIcon sx={{ fontSize: '2rem' }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            No Communication Records Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            {searchQuery
              ? `No communications matching "${searchQuery}". Try clearing search or choosing another filter.`
              : 'Your communication timeline is clean and ready. Click any button in the Quick Action Bar above to make a WebRTC call, dispatch an SMS, or record client activity.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PhoneInTalkIcon />}
              onClick={() => openActionModal('Call')}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              Start WebRTC Call
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, fontWeight: 800, textTransform: 'none' }}
              startIcon={<SmsIcon />}
              onClick={() => openActionModal('SMS')}
            >
              Send Telnyx SMS
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          {filteredEvents.map((ev) => {
            const isCall = ev.channel === 'Call';
            const isSms = ev.channel === 'SMS';
            const isWa = ev.channel === 'WhatsApp';
            const isEmail = ev.channel === 'Email';
            const isCb = ev.channel === 'Callbacks';

            const badgeBg = isCall
              ? '#EEF2FF'
              : isSms
              ? '#F5F3FF'
              : isWa
              ? '#ECFDF5'
              : isEmail
              ? '#F0F9FF'
              : isCb
              ? '#FFFBEB'
              : '#F8FAFC';

            const badgeColor = isCall
              ? '#3F51B5'
              : isSms
              ? '#7C3AED'
              : isWa
              ? '#16A34A'
              : isEmail
              ? '#0284C7'
              : isCb
              ? '#D97706'
              : '#475569';

            return (
              <Paper
                key={ev.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                    <Avatar
                      sx={{
                        bgcolor: badgeBg,
                        color: badgeColor,
                        fontWeight: 900,
                        width: 42,
                        height: 42,
                      }}
                    >
                      {isCall ? (
                        <PhoneInTalkIcon fontSize="small" />
                      ) : isSms ? (
                        <SmsIcon fontSize="small" />
                      ) : isWa ? (
                        <WhatsAppIcon fontSize="small" />
                      ) : isEmail ? (
                        <EmailIcon fontSize="small" />
                      ) : isCb ? (
                        <CalendarMonthIcon fontSize="small" />
                      ) : (
                        <NoteAltIcon fontSize="small" />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {ev.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Customer / Target: <b style={{ color: 'text.primary' }}>{ev.customer}</b> • Rep:{' '}
                        <b style={{ color: 'text.primary' }}>{ev.agent}</b>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={ev.status}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          height: 24,
                          fontSize: '0.68rem',
                          bgcolor: badgeBg,
                          color: badgeColor,
                          border: '1px solid',
                          borderColor: 'transparent',
                          mb: 0.3,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, fontFamily: 'monospace' }}>
                        {ev.time}
                      </Typography>
                    </Box>

                    {/* Delete Item Button */}
                    <Tooltip title="Delete this record">
                      <IconButton
                        size="small"
                        onClick={() => confirmDeleteEvent(ev)}
                        sx={{
                          color: '#94A3B8',
                          '&:hover': { color: '#EF4444', bgcolor: 'var(--wl-FEE2E2, #FEE2E2)' },
                          ml: 0.5,
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ my: 1.2 }} />

                <Box
                  sx={{
                    bgcolor: 'background.neutral',
                    p: 1.8,
                    borderRadius: 2,
                    border: '1px solid var(--wb-E2E8F0, #E2E8F0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--wd-334155, #334155)', flexGrow: 1 }}>
                    {ev.details}
                  </Typography>

                  {/* Contextual Action Button */}
                  {isCall && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<PhoneInTalkIcon fontSize="small" />}
                      onClick={() => {
                        const num = ev.customer.match(/\+?\d[\d -]{7,}/)?.[0] || ev.customer;
                        setRecipient(num);
                        openActionModal('Call');
                      }}
                      sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                    >
                      Call Back
                    </Button>
                  )}
                  {isSms && (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none', color: '#7C3AED', borderColor: 'var(--wb-DDD6FE, #DDD6FE)' }}
                      startIcon={<SmsIcon fontSize="small" />}
                      onClick={() => {
                        const num = ev.customer.match(/\+?\d[\d -]{7,}/)?.[0] || ev.customer;
                        setRecipient(num);
                        openActionModal('SMS');
                      }}
                    >
                      Reply SMS
                    </Button>
                  )}
                  {isWa && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => {
                        const clean = ev.customer.replace(/\D/g, '');
                        window.open(`https://wa.me/${clean}`, '_blank');
                      }}
                      sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                    >
                      Open WhatsApp
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
        </Box>
      )}

      {/* ── Confirmation Modal: Delete Single Item ──────────────────────────── */}
      <Dialog
        open={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#DC2626' }}>
          Delete Record?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--wd-334155, #334155)' }}>
            Are you sure you want to permanently delete this{' '}
            <b>{itemToDelete?.channel || 'communication'}</b> record for{' '}
            <b>{itemToDelete?.customer}</b>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setItemToDelete(null)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={executeDeleteEvent}
            sx={{ fontWeight: 800 }}
          >
            Delete Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmation Modal: Clear Entire History ────────────────────────── */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#DC2626' }}>
          {filter === 'ALL' ? 'Clear Entire Communication History?' : `Clear All ${filter} Records?`}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--wd-334155, #334155)' }}>
            {filter === 'ALL'
              ? 'This will permanently remove all call logs, SMS, emails, and notes from your timeline feed.'
              : `This will permanently remove all ${filter} entries from your communication timeline feed.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClearConfirmOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={executeClearHistory}
            sx={{ fontWeight: 800 }}
          >
            Yes, Clear Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Omnichannel Action Modal (Real Contact Selection & Telnyx Dispatch) ─ */}
      <Dialog
        open={actionModalOpen}
        onClose={() => !isSending && setActionModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3.5, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {actionType === 'Call' && <PhoneInTalkIcon sx={{ color: '#3F51B5' }} />}
          {actionType === 'SMS' && <SmsIcon sx={{ color: '#7C3AED' }} />}
          {actionType === 'WhatsApp' && <WhatsAppIcon sx={{ color: 'var(--wd-16A34A, #16A34A)' }} />}
          {actionType === 'Email' && <EmailIcon sx={{ color: 'var(--wd-0284C7, #0284C7)' }} />}
          {actionType === 'Callback' && <CalendarMonthIcon sx={{ color: '#D97706' }} />}
          {actionType === 'Note' && <NoteAltIcon sx={{ color: 'var(--wd-475569, #475569)' }} />}
          <span>
            {actionType === 'Call'
              ? 'Start WebRTC Outbound Call'
              : actionType === 'SMS'
              ? 'Dispatch Real SMS via Telnyx'
              : actionType === 'WhatsApp'
              ? 'Send Customer WhatsApp Message'
              : actionType === 'Email'
              ? 'Log Email Correspondence'
              : actionType === 'Callback'
              ? 'Schedule Customer Callback'
              : 'Add Internal Client Note'}
          </span>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            {/* Real Lead / Client Selector */}
            <Autocomplete
              options={contactOptions}
              getOptionLabel={(option) => option.label || option.name}
              onChange={(event, newValue) => handleSelectContact(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Customer from Real CRM Leads / Clients (Optional)"
                  size="small"
                  placeholder="Type to search lead or client name..."
                  helperText="Choose an existing CRM contact or type custom recipient below"
                />
              )}
            />

            {/* Outgoing Telnyx line selector for SMS */}
            {actionType === 'SMS' && telnyxPhoneNumbers && telnyxPhoneNumbers.length > 0 && (
              <TextField
                select
                label="Outgoing Telnyx SMS Line"
                size="small"
                value={selectedFromNumber || defaultFromNumber || telnyxPhoneNumbers[0]?.number}
                onChange={(e) => setSelectedFromNumber(e.target.value)}
                fullWidth
              >
                {telnyxPhoneNumbers.map((p) => (
                  <MenuItem key={p.id || p.number} value={p.number}>
                    📱 {p.number} {p.type ? `(${p.type.replace('_', ' ').toUpperCase()})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Recipient Phone / Email Input */}
            <TextField
              label={
                actionType === 'Email'
                  ? 'Recipient Email Address *'
                  : 'Customer Phone Number (E.164 with Country Code) *'
              }
              size="small"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={
                actionType === 'Email'
                  ? 'customer@example.com'
                  : '+18503329681 or +919876543210'
              }
              fullWidth
              helperText={
                actionType !== 'Email'
                  ? 'Format: +[country code][number], e.g. +917879442720 for India, +1 for US/Canada'
                  : ''
              }
            />

            {/* Email Subject (Only for Email) */}
            {actionType === 'Email' && (
              <TextField
                label="Email Subject *"
                size="small"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Flight Quote Q-102 Details & Seat Selection"
                fullWidth
              />
            )}

            {/* Callback Date/Time (Only for Callback) */}
            {actionType === 'Callback' && (
              <TextField
                label="Scheduled Callback Date & Time *"
                type="datetime-local"
                size="small"
                value={callbackDate}
                onChange={(e) => setCallbackDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            )}

            {/* Message / Details Text Area */}
            {actionType !== 'Call' && (
              <TextField
                label={
                  actionType === 'Note'
                    ? 'Internal Note Content *'
                    : actionType === 'Callback'
                    ? 'Callback Reason & Agenda'
                    : 'Message Content *'
                }
                multiline
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  actionType === 'SMS'
                    ? 'Type your SMS message here...'
                    : actionType === 'WhatsApp'
                    ? 'Type WhatsApp message. Clicking submit will open WhatsApp Web chat directly.'
                    : actionType === 'Note'
                    ? 'Write confidential note visible only to your agency team...'
                    : 'Enter details...'
                }
                fullWidth
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button disabled={isSending} onClick={() => setActionModalOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={isSending}
            onClick={handleActionSubmit}
            startIcon={
              actionType === 'Call' ? (
                <PhoneInTalkIcon />
              ) : actionType === 'WhatsApp' ? (
                <OpenInNewIcon />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              fontWeight: 800,
              px: 3,
              bgcolor:
                actionType === 'SMS'
                  ? '#7C3AED'
                  : actionType === 'WhatsApp'
                  ? '#16A34A'
                  : actionType === 'Email'
                  ? '#0284C7'
                  : '#3F51B5',
              '&:hover': {
                bgcolor:
                  actionType === 'SMS'
                    ? '#6D28D9'
                    : actionType === 'WhatsApp'
                    ? '#15803D'
                    : actionType === 'Email'
                    ? '#0369A1'
                    : '#303F9F',
              },
            }}
          >
            {isSending
              ? 'Sending...'
              : actionType === 'Call'
              ? 'Start WebRTC Call'
              : actionType === 'SMS'
              ? 'Send SMS via Telnyx'
              : actionType === 'WhatsApp'
              ? 'Open WhatsApp & Log'
              : actionType === 'Callback'
              ? 'Save Callback'
              : actionType === 'Note'
              ? 'Save Note'
              : 'Log Email'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
