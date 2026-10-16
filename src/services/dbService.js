import {
  MOCK_LEADS,
  MOCK_CLIENTS,
  MOCK_CONSULTATIONS,
  MOCK_PAYMENTS,
  MOCK_DOCUMENTS,
  NOTIFICATIONS,
  EMAIL_TEMPLATES,
  WHATSAPP_TEMPLATES,
  SERVICES,
  PACKAGES,
  AGENTS,
  MOCK_QUOTES
} from '../constants/mockData';
import { getMeetingUrl, generateMeetingRoom } from './jitsiService';

const delay = () => Promise.resolve();

export const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return 'https://wow-my-flight-backend-production.up.railway.app';
};

async function apiFetch(path, options = {}) {
  const primaryUrl = getBackendUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${primaryUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) { }

  // Fallback if primary URL failed
  const fallbackUrl = 'https://wow-my-flight-backend-production.up.railway.app';
  if (primaryUrl !== fallbackUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${fallbackUrl}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        ...options
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) { }
  }
  return null;
}

// Auto-sanitize legacy Spanish visa mock data from localStorage
if (typeof window !== 'undefined') {
  try {
    const keysToCheck = [
      'crm-leads',
      'crm-clients',
      'crm-consultations',
      'crm-payments',
      'crm-documents',
      'crm-agents-list',
      'crm-conversations'
    ];
    keysToCheck.forEach(k => {
      const val = localStorage.getItem(k);
      if (val && (
        val.includes('AAA Business') ||
        val.includes('Golden Visa') ||
        val.includes('Malaga') ||
        val.includes('Autonomo') ||
        val.includes('Digital Nomad Visa') ||
        val.includes('Spanish Consulate')
      )) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) { }
}

const loadState = (key, defaults) => {
  let saved = localStorage.getItem(key);
  if (!saved && key === 'crm-agents-list') {
    saved = localStorage.getItem('crm-consultants-list');
    if (saved) {
      localStorage.setItem('crm-agents-list', saved);
    }
  }
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Discard if containing legacy Spanish visa data
        const isLegacy = parsed.some(item => 
          item?.profileSummary?.includes('Golden Visa') || 
          item?.serviceId === 'property' || 
          item?.name?.includes('AAA Business') ||
          item?.messages?.some(m => m.text?.includes('AAA Business') || m.text?.includes('Digital Nomad Visa'))
        );
        if (!isLegacy) {
          return parsed;
        }
      } else {
        return parsed;
      }
    } catch (e) {
      console.warn('Error parsing state:', e);
    }
  }
  return defaults;
};

const saveState = (key, state) => {
  localStorage.setItem(key, JSON.stringify(state));
};

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv1',
    leadId: 'LD-8440',
    name: 'Rajesh Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    platform: 'whatsapp',
    unreadCount: 1,
    status: 'Ticketed',
    email: 'rajesh.sharma@example.com',
    phone: '+91 98112 34567',
    country: 'India',
    preferredLanguage: 'English',
    serviceId: 'flight_booking',
    messages: [
      { sender: 'customer', text: 'Hello, I have a confirmed booking BK-9169 for DEL → LHR on Air India (PNR: TP-ZOEFV1). Can you please confirm my baggage allowance?', timestamp: '10:15 AM' },
      { sender: 'system', text: 'Hello Rajesh! Welcome to Wow My Flight Air Concierge. An executive travel specialist is reviewing your booking reference.', timestamp: '10:16 AM' },
      { sender: 'agent', text: 'Hi Rajesh! Your ticketed booking allows 2 check-in pieces (23kg each) plus 7kg cabin baggage. Web check-in opens 24 hours prior to departure.', timestamp: '10:18 AM' },
      { sender: 'customer', text: 'Excellent! Could you please assign an aisle seat in row 18 for me?', timestamp: '10:20 AM' },
      { sender: 'agent', text: 'Done! Aisle seat 18C has been confirmed in Sabre GDS. E-ticket updated.', timestamp: '10:22 AM' }
    ]
  },
  {
    id: 'conv2',
    leadId: 'LD-9001',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    platform: 'whatsapp',
    unreadCount: 0,
    status: 'Quote Sent',
    email: 'marcus.vance@example.com',
    phone: '+1 415 555 2671',
    country: 'United States',
    preferredLanguage: 'English',
    serviceId: 'business_class',
    messages: [
      { sender: 'customer', text: 'Hi team, I received Quote QT-9001 for JFK ⇄ LHR Club World ($7,700). Does this include fast-track security and lounge access at Terminal 5?', timestamp: 'Yesterday' },
      { sender: 'agent', text: 'Hello Marcus! Yes, British Airways Club World includes dedicated fast-track security, Galleries Club lounge access, and 180° lie-flat beds.', timestamp: 'Yesterday' },
      { sender: 'customer', text: 'Great, I will complete the payment via Stripe link today.', timestamp: 'Yesterday' }
    ]
  },
  {
    id: 'conv3',
    leadId: 'LD-9002',
    name: 'Amina Al-Mansoor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    platform: 'instagram',
    unreadCount: 0,
    status: 'Payment Received',
    email: 'amina.m@example.ae',
    phone: '+971 50 123 4567',
    country: 'United Arab Emirates',
    preferredLanguage: 'Arabic / English',
    serviceId: 'first_class',
    messages: [
      { sender: 'customer', text: 'Salam! Can you verify if Emirates First Suite DXB ⇄ CDG has the shower spa available on EK-073?', timestamp: '2 days ago' },
      { sender: 'agent', text: 'Salam Amina! Yes, the A380 flight has the private enclosed First Suite with Onboard Shower Spa. Invoice INV-4402 has been marked as Paid.', timestamp: '2 days ago' },
      { sender: 'customer', text: 'Wonderful, thank you for the prompt assistance!', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'conv4',
    leadId: 'LD-9003',
    name: "Liam O'Connor",
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    platform: 'telegram',
    unreadCount: 0,
    status: 'Inquiry',
    email: 'liam.oc@example.ie',
    phone: '+353 87 987 6543',
    country: 'Ireland',
    preferredLanguage: 'English',
    serviceId: 'economy_flex',
    messages: [
      { sender: 'customer', text: 'Looking for 2 return tickets from Dublin (DUB) to Mumbai (BOM) in mid November. Flexible on dates.', timestamp: '3 days ago' },
      { sender: 'agent', text: 'Hi Liam! We have Qatar Airways via Doha and Etihad via Abu Dhabi with 2h layovers from $1,445 per person.', timestamp: '3 days ago' }
    ]
  }
];

// ─── CLIENTS METADATA STORE & CACHE ──────────────────────────────
const CLIENTS_META_STORAGE_KEY = 'crm-clients-meta-store';

const INITIAL_CLIENTS_META = {
  'CL-8853': {
    city: 'Bangalore',
    country: 'India',
    nationality: 'India',
    preferredCabinClass: 'Business Class',
    passportNumber: 'M9876543',
    passportExpiry: '2030-11-20',
    seatPreference: 'Window',
    mealPreference: 'Vegetarian (Asian)',
    timezone: 'IST (UTC+5:30)',
    preferredLanguage: 'Hindi',
    tier: 'Gold'
  },
  'CL-7737': {
    city: 'Delhi',
    country: 'India',
    nationality: 'India',
    preferredCabinClass: 'Business Class',
    seatPreference: 'Window',
    mealPreference: 'Vegetarian (Asian)',
    timezone: 'IST (UTC+5:30)',
    preferredLanguage: 'Hindi',
    tier: 'VIP Platinum'
  },
  'CL-9062': {
    city: 'Mumbai',
    country: 'India',
    nationality: 'India',
    preferredCabinClass: 'Economy',
    timezone: 'IST (UTC+5:30)',
    preferredLanguage: 'English',
    tier: 'Standard'
  },
  'CL-1513': {
    city: 'Mumbai',
    country: 'India',
    nationality: 'India',
    preferredCabinClass: 'Premium Economy',
    passportNumber: 'IND1234567',
    passportExpiry: '2032-05-15',
    seatPreference: 'Aisle',
    mealPreference: 'Vegetarian (Asian)',
    timezone: 'IST (UTC+5:30)',
    preferredLanguage: 'Hindi',
    tier: 'Standard'
  }
};

function getClientsMetaStore() {
  if (typeof window === 'undefined') return { ...INITIAL_CLIENTS_META };
  try {
    const raw = localStorage.getItem(CLIENTS_META_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...INITIAL_CLIENTS_META, ...parsed };
  } catch (e) {
    return { ...INITIAL_CLIENTS_META };
  }
}

function persistClientMeta(client) {
  if (!client || typeof window === 'undefined') return;
  try {
    const store = getClientsMetaStore();
    const metaToSave = {
      city: client.city || '',
      country: client.country || client.nationality || '',
      nationality: client.nationality || client.country || '',
      preferredCabinClass: client.preferredCabinClass || '',
      passportNumber: client.passportNumber || '',
      passportExpiry: client.passportExpiry || '',
      seatPreference: client.seatPreference || '',
      mealPreference: client.mealPreference || '',
      timezone: client.timezone || '',
      preferredLanguage: client.preferredLanguage || '',
      tier: client.tier || 'Standard'
    };

    if (client.id) store[client.id] = { ...(store[client.id] || {}), ...metaToSave };
    if (client.email) store[client.email.toLowerCase()] = { ...(store[client.email.toLowerCase()] || {}), ...metaToSave };
    if (client.phone) store[client.phone] = { ...(store[client.phone] || {}), ...metaToSave };
    localStorage.setItem(CLIENTS_META_STORAGE_KEY, JSON.stringify(store));
  } catch (e) { }
}

function enrichClientData(c) {
  if (!c) return c;
  const store = getClientsMetaStore();
  const meta = store[c.id] || (c.email ? store[c.email.toLowerCase()] : null) || (c.phone ? store[c.phone] : null) || {};

  return {
    ...c,
    city: c.city || meta.city || '',
    country: c.country || meta.country || c.nationality || '',
    nationality: c.nationality || meta.nationality || c.country || '',
    preferredCabinClass: c.preferredCabinClass || meta.preferredCabinClass || '',
    passportNumber: c.passportNumber || meta.passportNumber || '',
    passportExpiry: c.passportExpiry || meta.passportExpiry || '',
    seatPreference: c.seatPreference || meta.seatPreference || '',
    mealPreference: c.mealPreference || meta.mealPreference || '',
    timezone: c.timezone || meta.timezone || '',
    preferredLanguage: c.preferredLanguage || meta.preferredLanguage || '',
    tier: c.tier || meta.tier || 'Standard'
  };
}

export const dbService = {
  // SYSTEM HEALTH & DB STATUS
  getDbHealth: async () => {
    try {
      const remote = await apiFetch('/health');
      if (remote && remote.status === 'ok') {
        return remote;
      }
    } catch (e) { }
    return { status: 'offline', database: { connected: false } };
  },

  // CALL LOGS & TELEPHONY
  getCallLogs: async () => {
    try {
      const remote = await apiFetch('/api/telnyx/calls/logs');
      if (remote && remote.success && Array.isArray(remote.data)) {
        return remote.data;
      }
    } catch (e) { }
    return [];
  },

  // LEADS
  getLeads: async () => {
    try {
      const remote = await apiFetch('/api/leads');
      if (remote && remote.success && Array.isArray(remote.data)) {
        localStorage.setItem('crm-leads', JSON.stringify(remote.data));
        return remote.data;
      }
    } catch (e) { }

    await delay(50);
    return loadState('crm-leads', []);
  },
  getLeadById: async (id) => {
    try {
      const remote = await apiFetch(`/api/leads/${id}`);
      if (remote && remote.success && remote.data) {
        return remote.data;
      }
    } catch (e) { }

    await delay(50);
    const leads = await dbService.getLeads();
    return leads.find(l => l.id === id);
  },
  createLead: async (lead) => {
    // 1. Auto-sync to Customer 360 (Clients) so the customer immediately appears in Customer Directory
    try {
      const clientPayload = {
        firstName: lead.firstName || 'Traveler',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        city: lead.city || '',
        country: lead.country || lead.nationality || '',
        nationality: lead.country || lead.nationality || '',
        preferredCabinClass: lead.cabinClass || (lead.serviceId ? lead.serviceId.charAt(0).toUpperCase() + lead.serviceId.slice(1) : 'Economy'),
        tier: 'Standard',
        totalSpent: 0,
        status: 'Active'
      };

      // Create client via API (non-blocking)
      apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(clientPayload)
      }).catch(() => {});

      // Immediate local sync so Customer 360 reflects the new traveler right away
      const cachedClients = loadState('crm-clients', []);
      const exists = cachedClients.some(c =>
        (c.email && lead.email && c.email.toLowerCase() === lead.email.toLowerCase()) ||
        (c.phone && lead.phone && c.phone === lead.phone)
      );
      if (!exists) {
        const autoClient = enrichClientData({
          id: 'CL-' + Math.floor(1000 + Math.random() * 9000),
          onboardingDate: new Date().toISOString(),
          ...clientPayload
        });
        persistClientMeta(autoClient);
        cachedClients.unshift(autoClient);
        saveState('crm-clients', cachedClients);
      }
    } catch (syncErr) {
      console.warn('[dbService] Auto client sync warning:', syncErr);
    }

    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(lead)
      });
      if (res && res.success && res.data) {
        const leads = loadState('crm-leads', []);
        leads.unshift(res.data);
        saveState('crm-leads', leads);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] createLead API warning:', e.message);
    }

    await delay(50);
    const leads = loadState('crm-leads', []);
    const newLead = {
      id: lead.id || ('LD' + (1000 + leads.length + 1)),
      createdDate: new Date().toISOString(),
      status: lead.status || 'New Lead',
      timeline: [
        { date: new Date().toISOString(), event: 'Lead created in CRM', user: 'System' }
      ],
      ...lead
    };
    leads.unshift(newLead);
    saveState('crm-leads', leads);
    return newLead;
  },
  updateLead: async (lead) => {
    try {
      const res = await apiFetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        body: JSON.stringify(lead)
      });
      if (res && res.success && res.data) {
        const leads = loadState('crm-leads', []);
        const updated = leads.map(l => l.id === lead.id ? { ...l, ...res.data } : l);
        saveState('crm-leads', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updateLead API warning:', e.message);
    }

    await delay(50);
    const leads = loadState('crm-leads', []);
    const updated = leads.map(l => l.id === lead.id ? { ...l, ...lead } : l);
    saveState('crm-leads', updated);
    return lead;
  },
  deleteLead: async (id) => {
    try {
      await apiFetch(`/api/leads/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('[dbService] deleteLead API warning:', e.message);
    }

    await delay(50);
    const leads = loadState('crm-leads', []);
    const filtered = leads.filter(l => l.id !== id);
    saveState('crm-leads', filtered);
    return id;
  },
  assignAgent: async (leadId, agentId) => {
    try {
      const res = await apiFetch(`/api/leads/${leadId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ agentId })
      });
      if (res && res.success && res.data) {
        const leads = loadState('crm-leads', []);
        const updated = leads.map(l => l.id === leadId ? { ...l, assignedAgentId: agentId, assignedConsultantId: agentId } : l);
        saveState('crm-leads', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] assignAgent API warning:', e.message);
    }

    await delay(50);
    const leads = loadState('crm-leads', []);
    const updated = leads.map(l => l.id === leadId ? {
      ...l,
      assignedConsultantId: agentId,
      assignedAgentId: agentId,
      timeline: [{ date: new Date().toISOString(), event: 'Agent reassigned.', user: 'System' }, ...(l.timeline || [])]
    } : l);
    saveState('crm-leads', updated);
    return { leadId, agentId };
  },
  updateLeadStatus: async (leadId, status) => {
    try {
      const res = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res && res.success && res.data) {
        const leads = loadState('crm-leads', []);
        const updated = leads.map(l => l.id === leadId ? { ...l, status } : l);
        saveState('crm-leads', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updateLeadStatus API warning:', e.message);
    }

    await delay(50);
    const leads = loadState('crm-leads', []);
    const updated = leads.map(l => l.id === leadId ? {
      ...l,
      status,
      timeline: [{ date: new Date().toISOString(), event: `Status changed to ${status}`, user: 'System' }, ...(l.timeline || [])]
    } : l);
    saveState('crm-leads', updated);
    return { leadId, status };
  },

  // CLIENTS METADATA & PERSISTENCE
  // Ensures city, country, preferredCabinClass and preferences are never lost
  getClients: async () => {
    try {
      const remote = await apiFetch('/api/clients');
      if (remote && remote.success && Array.isArray(remote.data)) {
        const enriched = remote.data.map(enrichClientData);
        localStorage.setItem('crm-clients', JSON.stringify(enriched));
        return enriched;
      }
    } catch (e) {
      console.warn('[dbService] getClients API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-clients');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.map(enrichClientData);
      } catch (e) { }
    }
    return [];
  },
  getClientById: async (id) => {
    try {
      const remote = await apiFetch(`/api/clients/${id}`);
      if (remote && remote.success && remote.data) {
        return enrichClientData(remote.data);
      }
    } catch (e) { }

    await delay(50);
    const clients = await dbService.getClients();
    const found = clients.find(c => c.id === id);
    return found ? enrichClientData(found) : null;
  },
  createClient: async (client) => {
    persistClientMeta(client);
    try {
      const res = await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(client)
      });
      if (res && res.success && res.data) {
        persistClientMeta({ ...client, id: res.data.id });
        const enriched = enrichClientData(res.data);
        const clients = loadState('crm-clients', []);
        clients.unshift(enriched);
        saveState('crm-clients', clients);
        return enriched;
      }
    } catch (e) {
      console.warn('[dbService] createClient API warning:', e.message);
    }

    await delay(50);
    const clients = loadState('crm-clients', []);
    const newClient = enrichClientData({
      id: client.id || ('CL-' + Math.floor(1000 + Math.random() * 9000)),
      onboardingDate: new Date().toISOString(),
      ...client
    });
    persistClientMeta(newClient);
    clients.unshift(newClient);
    saveState('crm-clients', clients);
    return newClient;
  },
  updateClient: async (client) => {
    persistClientMeta(client);
    try {
      const res = await apiFetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        body: JSON.stringify(client)
      });
      if (res && res.success && res.data) {
        const enriched = enrichClientData({ ...client, ...res.data });
        persistClientMeta(enriched);
        const clients = loadState('crm-clients', []);
        const updated = clients.map(c => c.id === client.id ? { ...c, ...enriched } : c);
        saveState('crm-clients', updated);
        return enriched;
      }
    } catch (e) {
      console.warn('[dbService] updateClient API warning:', e.message);
    }

    await delay(50);
    const clients = loadState('crm-clients', []);
    const enriched = enrichClientData(client);
    const updated = clients.map(c => c.id === client.id ? { ...c, ...enriched } : c);
    saveState('crm-clients', updated);
    return enriched;
  },
  deleteClient: async (id) => {
    try {
      const res = await apiFetch(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        const clients = loadState('crm-clients', []);
        const filtered = clients.filter(c => c.id !== id);
        saveState('crm-clients', filtered);
        return true;
      }
    } catch (e) {
      console.warn('[dbService] deleteClient API warning:', e.message);
    }

    await delay(50);
    const clients = loadState('crm-clients', []);
    const filtered = clients.filter(c => c.id !== id);
    saveState('crm-clients', filtered);
    return true;
  },
  updateClientVisaStatus: async (clientId, visaStatus, status) => {
    await delay(50);
    const clients = loadState('crm-clients', []);
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const updatedObj = { ...c };
        if (visaStatus) updatedObj.visaStatus = visaStatus;
        if (status) updatedObj.status = status;
        return updatedObj;
      }
      return c;
    });
    saveState('crm-clients', updated);
    return { clientId, visaStatus, status };
  },

  // CONSULTATIONS & APPOINTMENTS
  getConsultations: async () => {
    try {
      const remote = await apiFetch('/api/consultations');
      if (remote && remote.success && Array.isArray(remote.data)) {
        if (remote.data.length > 0) {
          localStorage.setItem('crm-consultations', JSON.stringify(remote.data));
          return remote.data;
        }
      }
    } catch (e) {
      console.warn('[dbService] getConsultations API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-consultations');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [];
  },
  createConsultation: async (cons) => {
    try {
      const res = await apiFetch('/api/consultations', {
        method: 'POST',
        body: JSON.stringify(cons)
      });
      if (res && res.success && res.data) {
        const consultations = loadState('crm-consultations', []);
        consultations.unshift(res.data);
        saveState('crm-consultations', consultations);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] createConsultation API warning:', e.message);
    }

    await delay(50);
    const consultations = loadState('crm-consultations', []);
    const newCons = {
      id: 'CS' + (3000 + consultations.length + 1),
      status: 'Scheduled',
      recordingUrl: '',
      outcome: null,
      meetingLink: getMeetingUrl(generateMeetingRoom(cons.leadId || 'cons', cons.clientName || 'Client')),
      ...cons
    };
    consultations.unshift(newCons);
    saveState('crm-consultations', consultations);
    return newCons;
  },
  updateConsultationStatus: async (consultationId, status) => {
    try {
      const res = await apiFetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res && res.success && res.data) {
        const consultations = loadState('crm-consultations', []);
        const updated = consultations.map(c => c.id === consultationId ? { ...c, ...res.data } : c);
        saveState('crm-consultations', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updateConsultationStatus API warning:', e.message);
    }

    await delay(50);
    const consultations = loadState('crm-consultations', []);
    const updated = consultations.map(c => c.id === consultationId ? { ...c, status } : c);
    saveState('crm-consultations', updated);
    return { consultationId, status };
  },
  completeConsultation: async (consultationId, outcome, notes) => {
    try {
      const res = await apiFetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Completed', outcome, notes })
      });
      if (res && res.success && res.data) {
        const consultations = loadState('crm-consultations', []);
        const updated = consultations.map(c => c.id === consultationId ? { ...c, ...res.data } : c);
        saveState('crm-consultations', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] completeConsultation API warning:', e.message);
    }

    await delay(50);
    const consultations = loadState('crm-consultations', []);
    const updated = consultations.map(c => c.id === consultationId ? {
      ...c,
      status: 'Completed',
      outcome,
      notes,
    } : c);
    saveState('crm-consultations', updated);
    return { consultationId, outcome, notes };
  },

  // PAYMENTS & INVOICES
  getPayments: async () => {
    try {
      const remote = await apiFetch('/api/payments');
      if (remote && remote.success && Array.isArray(remote.data)) {
        localStorage.setItem('crm-payments', JSON.stringify(remote.data));
        return remote.data;
      }
    } catch (e) {
      console.warn('[dbService] getPayments API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-payments');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [];
  },
  createInvoice: async (invoice) => {
    try {
      const res = await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(invoice)
      });
      if (res && res.success && res.data) {
        const payments = loadState('crm-payments', []);
        payments.unshift(res.data);
        saveState('crm-payments', payments);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] createInvoice API warning:', e.message);
    }

    await delay(50);
    const payments = loadState('crm-payments', []);
    const newInvoice = {
      id: 'INV-2026-' + String(payments.length + 1).padStart(3, '0'),
      billingDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalPaid: 0,
      paymentMethod: '-',
      transactionId: '-',
      ...invoice
    };
    payments.unshift(newInvoice);
    saveState('crm-payments', payments);
    return newInvoice;
  },
  updatePaymentStatus: async (paymentId, status, paymentMethod, transactionId) => {
    try {
      const res = await apiFetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, paymentMethod, transactionId })
      });
      if (res && res.success && res.data) {
        const payments = loadState('crm-payments', []);
        const updated = payments.map(p => p.id === paymentId ? { ...p, ...res.data } : p);
        saveState('crm-payments', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updatePaymentStatus API warning:', e.message);
    }

    await delay(50);
    const payments = loadState('crm-payments', []);
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        const updatedObj = { ...p, status };
        if (paymentMethod) updatedObj.paymentMethod = paymentMethod;
        if (transactionId) updatedObj.transactionId = transactionId;
        if (status === 'Paid') {
          updatedObj.totalPaid = p.amount - (p.discount || 0);
        }
        return updatedObj;
      }
      return p;
    });
    saveState('crm-payments', updated);
    return { paymentId, status };
  },

  // FLIGHT QUOTES
  getQuotes: async () => {
    try {
      const remote = await apiFetch('/api/quotes');
      if (remote && remote.success && Array.isArray(remote.data)) {
        localStorage.setItem('crm-quotes', JSON.stringify(remote.data));
        return remote.data;
      }
    } catch (e) { }

    await delay(50);
    const cached = localStorage.getItem('crm-quotes');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [];
  },
  getQuoteById: async (id) => {
    try {
      const remote = await apiFetch(`/api/quotes/${id}`);
      if (remote && remote.success && remote.data) {
        return remote.data;
      }
    } catch (e) { }

    await delay(50);
    const quotes = await dbService.getQuotes();
    return quotes.find(q => q.id === id);
  },
  createQuote: async (quote) => {
    try {
      const res = await apiFetch('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quote)
      });
      if (res && res.success && res.data) {
        const quotes = loadState('crm-quotes', []);
        quotes.unshift(res.data);
        saveState('crm-quotes', quotes);
        return res.data;
      }
    } catch (e) { }

    await delay(50);
    const quotes = loadState('crm-quotes', []);
    const newQuote = {
      ...quote,
      id: quote.id || `QT-${Date.now().toString().slice(-4)}`,
      createdAt: quote.createdAt || new Date().toISOString()
    };
    quotes.unshift(newQuote);
    saveState('crm-quotes', quotes);
    return newQuote;
  },
  updateQuote: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/quotes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res && res.success && res.data) {
        const quotes = loadState('crm-quotes', []);
        const updated = quotes.map(q => q.id === id ? { ...q, ...res.data } : q);
        saveState('crm-quotes', updated);
        return res.data;
      }
    } catch (e) { }

    await delay(50);
    const quotes = loadState('crm-quotes', []);
    const updated = quotes.map(q => q.id === id ? { ...q, ...updates } : q);
    saveState('crm-quotes', updated);
    return { id, ...updates };
  },

  // BOOKINGS & ISSUANCE
  getBookings: async () => {
    try {
      const remote = await apiFetch('/api/bookings');
      if (remote && remote.success && Array.isArray(remote.data)) {
        localStorage.setItem('crm-bookings', JSON.stringify(remote.data));
        return remote.data;
      }
    } catch (e) {
      console.warn('[dbService] getBookings API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-bookings');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [];
  },
  createBooking: async (booking) => {
    try {
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(booking)
      });
      if (res && res.success && res.data) {
        const bookings = loadState('crm-bookings', []);
        bookings.unshift(res.data);
        saveState('crm-bookings', bookings);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] createBooking API warning:', e.message);
    }

    await delay(50);
    const bookings = loadState('crm-bookings', []);
    const newBooking = {
      bookingId: booking.bookingId || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      pnr: booking.pnr || `WMF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      ...booking
    };
    bookings.unshift(newBooking);
    saveState('crm-bookings', bookings);
    return newBooking;
  },

  // AFTER-SALES
  getAfterSalesCases: async () => {
    try {
      const remote = await apiFetch('/api/after-sales');
      if (remote && remote.success && Array.isArray(remote.data)) {
        localStorage.setItem('crm-after-sales', JSON.stringify(remote.data));
        return remote.data;
      }
    } catch (e) {
      console.warn('[dbService] getAfterSalesCases API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-after-sales');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [];
  },

  addAfterSalesHistory: async (caseId, entry) => {
    try {
      const res = await apiFetch(`/api/after-sales/${caseId}/history`, {
        method: 'POST',
        body: JSON.stringify(entry)
      });
      if (res && res.success && res.data) {
        const cached = localStorage.getItem('crm-after-sales');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            const idx = list.findIndex(c => c.id === caseId);
            if (idx !== -1) {
              list[idx] = res.data;
              localStorage.setItem('crm-after-sales', JSON.stringify(list));
            }
          } catch (e) {}
        }
        return res;
      }
    } catch (e) {
      console.warn('[dbService] addAfterSalesHistory API warning:', e.message);
    }

    const cached = localStorage.getItem('crm-after-sales');
    if (cached) {
      try {
        const list = JSON.parse(cached);
        const idx = list.findIndex(c => c.id === caseId);
        if (idx !== -1) {
          const newEntry = {
            id: `h-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            author: entry.author || 'Current Agent',
            action: entry.action || 'Agent Note Added',
            notes: entry.notes || ''
          };
          list[idx].history = [...(list[idx].history || []), newEntry];
          localStorage.setItem('crm-after-sales', JSON.stringify(list));
          return { success: true, data: list[idx], newEntry };
        }
      } catch (e) {}
    }
    return null;
  },

  updateAfterSalesCase: async (caseId, updates) => {
    try {
      const res = await apiFetch(`/api/after-sales/${caseId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (res && res.success && res.data) {
        const cached = localStorage.getItem('crm-after-sales');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            const idx = list.findIndex(c => c.id === caseId);
            if (idx !== -1) {
              list[idx] = res.data;
              localStorage.setItem('crm-after-sales', JSON.stringify(list));
            }
          } catch (e) {}
        }
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updateAfterSalesCase API warning:', e.message);
    }
    return null;
  },

  createAfterSalesCase: async (caseData) => {
    try {
      const res = await apiFetch('/api/after-sales', {
        method: 'POST',
        body: JSON.stringify(caseData)
      });
      if (res && res.success && res.data) {
        const cached = localStorage.getItem('crm-after-sales');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            list.unshift(res.data);
            localStorage.setItem('crm-after-sales', JSON.stringify(list));
          } catch (e) {}
        }
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] createAfterSalesCase API warning:', e.message);
    }
    return caseData;
  },

  // DOCUMENTS
  getDocuments: async () => {
    try {
      const remote = await apiFetch('/api/documents');
      if (remote && remote.success && Array.isArray(remote.data)) {
        if (remote.data.length > 0) {
          localStorage.setItem('crm-documents', JSON.stringify(remote.data));
          return remote.data;
        }
      }
    } catch (e) {
      console.warn('[dbService] getDocuments API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-documents');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [];
  },
  uploadDocument: async (doc) => {
    try {
      const res = await apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(doc)
      });
      if (res && res.success && res.data) {
        const documents = loadState('crm-documents', []);
        documents.unshift(res.data);
        saveState('crm-documents', documents);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] uploadDocument API warning:', e.message);
    }

    await delay(50);
    const documents = loadState('crm-documents', []);
    const newDoc = {
      id: doc.id || ('DOC' + (4000 + documents.length + 1)),
      uploadedDate: new Date().toISOString(),
      status: 'Pending Review',
      comment: '',
      ...doc
    };
    documents.unshift(newDoc);
    saveState('crm-documents', documents);
    return newDoc;
  },
  reviewDocument: async (documentId, status, comment) => {
    try {
      const res = await apiFetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, comment })
      });
      if (res && res.success && res.data) {
        const documents = loadState('crm-documents', []);
        const updated = documents.map(d => d.id === documentId ? { ...d, ...res.data } : d);
        saveState('crm-documents', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] reviewDocument API warning:', e.message);
    }

    await delay(50);
    const documents = loadState('crm-documents', []);
    const updated = documents.map(d =>
      d.id === documentId ? { ...d, status, comment: comment !== undefined ? comment : d.comment } : d
    );
    saveState('crm-documents', updated);
    return { documentId, status, comment };
  },
  deleteDocument: async (id) => {
    try {
      await apiFetch(`/api/documents/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('[dbService] deleteDocument API warning:', e.message);
    }

    await delay(50);
    const documents = loadState('crm-documents', []);
    const filtered = documents.filter(d => d.id !== id);
    saveState('crm-documents', filtered);
    return id;
  },

  // SETTINGS (Connected to Backend API & Persistent Storage)
  getSettings: async () => {
    const res = await apiFetch('/api/settings/general');
    if (res && res.success && res.data) {
      saveState('crm-settings-general', res.data);
      return res.data;
    }
    return loadState('crm-settings-general', {
      companyName: 'Wow My Flight Travel Agency Inc.',
      brandTagline: 'Luxury Aviation & Worldwide Flight Booking Portal',
      phone: '+1 (833) 395-5554',
      email: 'support@wowmyflight.com',
      bookingEmail: 'bookings@wowmyflight.com',
      address: 'One World Trade Center, Suite 8500, New York, NY 10007, USA',
      vatRate: 7.5,
      vatId: 'EIN-US-92-4819201',
      currency: 'USD',
      currencySymbol: '$',
      website: 'https://wowmyflight.com',
      incorporationDate: '2020-03-15',
      autoAssignConsultant: true,
      recordingStorage: 'cloud'
    });
  },
  updateSettings: async (settings) => {
    saveState('crm-settings-general', settings);
    const res = await apiFetch('/api/settings/general', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (res && res.success && res.data) {
      saveState('crm-settings-general', res.data);
      return res.data;
    }
    return settings;
  },
  getServices: async () => {
    const res = await apiFetch('/api/settings/services');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      saveState('crm-services', res.data);
      return res.data;
    }
    const defaultServices = [
      { id: 'srv_eco', name: 'Economy Class', category: 'Economy', basePrice: 550, active: true },
      { id: 'srv_prem', name: 'Premium Economy', category: 'Economy', basePrice: 950, active: true },
      { id: 'srv_biz', name: 'Business Class', category: 'Business', basePrice: 3200, active: true },
      { id: 'srv_first', name: 'First Class & Suites', category: 'First', basePrice: 7500, active: true },
      { id: 'srv_charter', name: 'Private Jet Charter', category: 'Charter', basePrice: 22000, active: true },
      { id: 'srv_vip_concierge', name: 'VIP Airport Fast-Track & Lounge Escort', category: 'Concierge', basePrice: 350, active: true }
    ];
    return loadState('crm-services', defaultServices);
  },
  updateServices: async (services) => {
    saveState('crm-services', services);
    const res = await apiFetch('/api/settings/services', {
      method: 'PUT',
      body: JSON.stringify(services)
    });
    if (res && res.success && res.data) {
      saveState('crm-services', res.data);
      return res.data;
    }
    return services;
  },
  addService: async (service) => {
    const res = await apiFetch('/api/settings/services', {
      method: 'POST',
      body: JSON.stringify(service)
    });
    const current = await dbService.getServices();
    const updated = [...current, res?.data || service];
    saveState('crm-services', updated);
    return res?.data || service;
  },
  getPackages: async () => {
    const res = await apiFetch('/api/settings/packages');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      saveState('crm-packages', res.data);
      return res.data;
    }
    const defaultPackages = [
      {
        id: 'flight_saver',
        name: 'Flight Only Saver',
        price: 550,
        description: 'Instant GDS airfare booking with competitive markup, e-ticket issuance, and automated 24/7 flight schedule tracking.',
        includes: [
          'GDS Fare Search (Travelopro / Sabre / Amadeus)',
          'Instant PNR & Official Airline E-Ticket PDF',
          'Flight Status & Schedule Change Alerts',
          'Seat Selection & Online Check-In Guidance',
          'WhatsApp & Email Notification Alerts',
          'Dedicated Ticketing Helpdesk'
        ]
      },
      {
        id: 'travel_bundle',
        name: 'Full Travel & Flight Package',
        price: 1250,
        description: 'Complete end-to-end holiday and business travel package with flight, 4-star hotel vouchers, and private airport transfers.',
        includes: [
          'Round-Trip Flights with Baggage Included (2x 23kg)',
          'Partner Hotel Booking Vouchers (4★ / 5★)',
          'Private Airport Chauffeur Transfer',
          'Comprehensive Travel & Medical Insurance',
          'Priority Boarding & Airport Lounge Pass',
          'Dedicated Travel Concierge Agent'
        ]
      },
      {
        id: 'executive_vip',
        name: 'Executive Business Class VIP Concierge',
        price: 3450,
        description: 'Ultra-premium corporate travel package for C-level executives, featuring flatbed business class and meet-and-greet airport service.',
        includes: [
          'Lie-flat Business Class Cabin Guarantee',
          'Fast-Track Security Clearance & VIP Lounge Access',
          'Dedicated 24/7 Personal Flight Broker',
          'Flexible Date Changes & Free Refund Protection',
          'Excess Baggage Allowance (3x 32kg)',
          'Executive Chauffeur Sedan Pickup & Dropoff'
        ]
      },
      {
        id: 'jet_charter',
        name: 'Private Jet & Luxury Charter',
        price: 18500,
        description: 'Exclusive private charter solutions for VIP families, diplomatic delegations, and high-net-worth individuals.',
        includes: [
          'Private Jet Terminal (FBO) Access with Zero Waiting',
          'Custom Flight Schedule & Departure Times',
          'Gourmet In-Flight Dining & Champagne Service',
          'Pet In Cabin Accompaniment',
          'Bespoke Ground Limousine Fleet',
          'Discreet High-Security Flight Protocol'
        ]
      }
    ];
    return loadState('crm-packages', defaultPackages);
  },
  updatePackages: async (packages) => {
    saveState('crm-packages', packages);
    const res = await apiFetch('/api/settings/packages', {
      method: 'PUT',
      body: JSON.stringify(packages)
    });
    if (res && res.success && res.data) {
      saveState('crm-packages', res.data);
      return res.data;
    }
    return packages;
  },
  getEmailTemplates: async () => {
    const res = await apiFetch('/api/settings/templates');
    if (res && res.success && res.data?.emails) {
      saveState('crm-email-templates', res.data.emails);
      return res.data.emails;
    }
    return loadState('crm-email-templates', EMAIL_TEMPLATES);
  },
  updateEmailTemplates: async (templates) => {
    saveState('crm-email-templates', templates);
    const whatsapps = await dbService.getWhatsappTemplates();
    await apiFetch('/api/settings/templates', {
      method: 'PUT',
      body: JSON.stringify({ emails: templates, whatsapps })
    });
    return templates;
  },
  getWhatsappTemplates: async () => {
    const res = await apiFetch('/api/settings/templates');
    if (res && res.success && res.data?.whatsapps) {
      saveState('crm-whatsapp-templates', res.data.whatsapps);
      return res.data.whatsapps;
    }
    return loadState('crm-whatsapp-templates', WHATSAPP_TEMPLATES);
  },
  updateWhatsappTemplates: async (templates) => {
    saveState('crm-whatsapp-templates', templates);
    const emails = await dbService.getEmailTemplates();
    await apiFetch('/api/settings/templates', {
      method: 'PUT',
      body: JSON.stringify({ emails, whatsapps: templates })
    });
    return templates;
  },
  getChannelSettings: async () => {
    const res = await apiFetch('/api/settings/channels');
    if (res && res.success && res.data) {
      saveState('crm-channel-settings', res.data);
      return res.data;
    }
    return loadState('crm-channel-settings', {
      primaryPhone: '+1 (833) 395-5554',
      secondaryPhone: '+1 (850) 332-9680',
      whatsappSales: '+1 (833) 395-5554',
      whatsappSupport: '+1 (850) 332-9680',
      facebookPage1: 'https://facebook.com/WowMyFlight',
      facebookPage2: 'https://facebook.com/WowMyFlightVIP',
      instagramAccount1: '@wowmyflight',
      instagramAccount2: '@wowmyflight_deals'
    });
  },
  updateChannelSettings: async (channels) => {
    saveState('crm-channel-settings', channels);
    const res = await apiFetch('/api/settings/channels', {
      method: 'PUT',
      body: JSON.stringify(channels)
    });
    if (res && res.success && res.data) {
      saveState('crm-channel-settings', res.data);
      return res.data;
    }
    return channels;
  },
  getStripeSettings: async () => {
    const res = await apiFetch('/api/settings/stripe');
    if (res && res.success && res.data) {
      saveState('crm-stripe-settings', res.data);
      return res.data;
    }
    return loadState('crm-stripe-settings', {
      mode: 'live',
      primaryAccount: {
        id: 'stripe_primary',
        label: 'Primary Stripe Account (USD Global)',
        publishableKey: 'pk_live_51P...WMF_USD',
        secretKeyMasked: 'sk_live_51P...9921',
        status: 'Active',
        currency: 'USD',
        lastUsed: 'Today at 3:45 PM',
        volume: '$184,520'
      },
      secondaryAccount: {
        id: 'stripe_secondary',
        label: 'Secondary Stripe Account (Backup / International)',
        publishableKey: 'pk_live_51P...WMF_INTL',
        secretKeyMasked: 'sk_live_51P...3384',
        status: 'Standby',
        currency: 'USD',
        lastUsed: 'Yesterday at 6:10 PM',
        volume: '$42,300'
      }
    });
  },
  updateStripeSettings: async (stripe) => {
    saveState('crm-stripe-settings', stripe);
    const res = await apiFetch('/api/settings/stripe', {
      method: 'PUT',
      body: JSON.stringify(stripe)
    });
    if (res && res.success && res.data) {
      saveState('crm-stripe-settings', res.data);
      return res.data;
    }
    return stripe;
  },

  // SOCIAL CHAT INBOX
  getConversations: async () => {
    await delay();
    return loadState('crm-conversations', INITIAL_CONVERSATIONS);
  },
  markConversationRead: async (id) => {
    await delay();
    const conversations = loadState('crm-conversations', INITIAL_CONVERSATIONS);
    const updated = conversations.map(c => c.id === id ? { ...c, unreadCount: 0 } : c);
    saveState('crm-conversations', updated);
    return id;
  },
  sendSocialMessage: async (conversationId, message) => {
    await delay();
    const conversations = loadState('crm-conversations', INITIAL_CONVERSATIONS);
    const updated = conversations.map(c => c.id === conversationId ? {
      ...c,
      messages: [...c.messages, message]
    } : c);
    saveState('crm-conversations', updated);
    return { conversationId, message };
  },
  receiveSocialMessage: async (conversationId, message, isActive) => {
    await delay();
    const conversations = loadState('crm-conversations', INITIAL_CONVERSATIONS);
    const updated = conversations.map(c => c.id === conversationId ? {
      ...c,
      messages: [...c.messages, message],
      unreadCount: isActive ? c.unreadCount : c.unreadCount + 1
    } : c);
    saveState('crm-conversations', updated);
    return { conversationId, message, isActive };
  },
  addConversation: async (conv) => {
    await delay();
    const conversations = loadState('crm-conversations', INITIAL_CONVERSATIONS);
    const alreadyExists = conversations.some(c => c.id === conv.id || (conv.leadId && c.leadId === conv.leadId));
    if (alreadyExists) return conv;
    conversations.push(conv);
    saveState('crm-conversations', conversations);
    return conv;
  },

  // NOTIFICATIONS (Live PostgreSQL /api/notifications)
  getNotifications: async (role) => {
    try {
      const url = role ? `/api/notifications?role=${encodeURIComponent(role)}` : '/api/notifications';
      const res = await apiFetch(url);
      if (res && res.success && Array.isArray(res.data)) {
        const cacheKey = role ? `crm-notifications-${role}` : 'crm-notifications';
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] getNotifications API error:', e.message);
    }
    const cacheKey = role ? `crm-notifications-${role}` : 'crm-notifications';
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem('crm-notifications');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    await delay();
    return [];
  },
  addNotification: async (notif) => {
    try {
      const res = await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notif),
      });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] addNotification API error:', e.message);
    }
    const notifications = loadState('crm-notifications', []);
    const newNotif = {
      id: 'notif_' + Date.now(),
      read: false,
      time: 'Just now',
      ...notif,
    };
    notifications.unshift(newNotif);
    saveState('crm-notifications', notifications);
    return newNotif;
  },
  markNotificationRead: async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      console.warn('[dbService] markNotificationRead API error:', e.message);
    }
    const notifications = loadState('crm-notifications', []);
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveState('crm-notifications', updated);
    return id;
  },
  markAllNotificationsRead: async (role) => {
    try {
      await apiFetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
    } catch (e) {
      console.warn('[dbService] markAllNotificationsRead API error:', e.message);
    }
    const cacheKey = role ? `crm-notifications-${role}` : 'crm-notifications';
    const notifications = loadState(cacheKey, loadState('crm-notifications', []));
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveState(cacheKey, updated);
    return true;
  },

  // AGENTS & USERS
  getAgents: async () => {
    try {
      const remote = await apiFetch('/api/users');
      if (remote && remote.success && Array.isArray(remote.data)) {
        if (remote.data.length > 0) {
          localStorage.setItem('crm-agents-list', JSON.stringify(remote.data));
          return remote.data;
        }
      }
    } catch (e) {
      console.warn('[dbService] getAgents API warning:', e.message);
    }

    await delay(50);
    const cached = localStorage.getItem('crm-agents-list');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return loadState('crm-agents-list', AGENTS);
  },
  createAgent: async (agent) => {
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(agent)
      });
      if (res && res.success && res.data) {
        const agents = loadState('crm-agents-list', []);
        agents.unshift(res.data);
        saveState('crm-agents-list', agents);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] createAgent API warning:', e.message);
    }

    await delay(50);
    const agents = loadState('crm-agents-list', []);
    const newAgent = {
      ...agent,
      id: agent.id || ('usr-' + Math.floor(1000 + Math.random() * 9000)),
      joiningDate: agent.joiningDate || new Date().toISOString().split('T')[0]
    };
    agents.unshift(newAgent);
    saveState('crm-agents-list', agents);
    return newAgent;
  },
  updateAgentRole: async (id, role) => {
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      if (res && res.success && res.data) {
        const agents = loadState('crm-agents-list', []);
        const updated = agents.map(a => a.id === id ? { ...a, role } : a);
        saveState('crm-agents-list', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updateAgentRole API warning:', e.message);
    }

    await delay(50);
    const agents = loadState('crm-agents-list', []);
    const updated = agents.map(a => a.id === id ? { ...a, role } : a);
    saveState('crm-agents-list', updated);
    return updated.find(c => c.id === id);
  },
  updateAgent: async (agent) => {
    try {
      const res = await apiFetch(`/api/users/${agent.id}`, {
        method: 'PUT',
        body: JSON.stringify(agent)
      });
      if (res && res.success && res.data) {
        const agents = loadState('crm-agents-list', []);
        const updated = agents.map(a => a.id === agent.id ? { ...a, ...res.data } : a);
        saveState('crm-agents-list', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[dbService] updateAgent API warning:', e.message);
    }

    await delay(50);
    const agents = loadState('crm-agents-list', []);
    const updated = agents.map(a => a.id === agent.id ? { ...a, ...agent } : a);
    saveState('crm-agents-list', updated);
    return updated.find(c => c.id === agent.id);
  },
  deleteAgent: async (id) => {
    try {
      await apiFetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('[dbService] deleteAgent API warning:', e.message);
    }

    await delay(50);
    const agents = loadState('crm-agents-list', []);
    const filtered = agents.filter(a => a.id !== id);
    saveState('crm-agents-list', filtered);
    return id;
  },
  resetAgentPassword: async (id, newPassword) => {
    await delay();
    const agents = loadState('crm-agents-list', AGENTS);
    const updated = agents.map(a => a.id === id ? { ...a, password: newPassword } : a);
    saveState('crm-agents-list', updated);
    return { id, newPassword };
  },
  assignConsultation: async (consultationId, agentId) => {
    await delay();
    const consultations = loadState('crm-consultations', MOCK_CONSULTATIONS);
    const updated = consultations.map(c =>
      c.id === consultationId ? { ...c, assignedConsultantId: agentId } : c
    );
    saveState('crm-consultations', updated);
    return updated.find(c => c.id === consultationId);
  },
  getConsultants: async () => {
    return dbService.getAgents();
  },
  assignConsultant: async (leadId, agentId) => {
    return dbService.assignAgent(leadId, agentId);
  },
  createConsultant: async (agent) => {
    return dbService.createAgent(agent);
  },
  updateConsultantRole: async (id, role) => {
    return dbService.updateAgentRole(id, role);
  },

  // REFUNDS
  getRefundRequests: async () => {
    try {
      const res = await apiFetch('/api/finance/refunds');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Finance Refunds API load warning:', e.message);
    }
    await delay();
    return loadState('crm-refund-requests', []);
  },
  createRefundRequest: async (refund) => {
    try {
      const res = await apiFetch('/api/finance/refunds', {
        method: 'POST',
        body: JSON.stringify(refund)
      });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Finance createRefundRequest API warning:', e.message);
    }
    await delay();
    const refunds = loadState('crm-refund-requests', []);
    const payments = loadState('crm-payments', MOCK_PAYMENTS);
    const clients = loadState('crm-clients', MOCK_CLIENTS);

    const client = clients.find(c => c.id === refund.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';

    let refundAmount = Number(refund.amount) || 0;

    // Automatic 50% Refund Calculation for Visa Rejections Only
    if (refund.category === 'Visa Rejection') {
      const clientPayments = payments.filter(p => p.clientId === refund.clientId && p.status === 'Paid');
      const totalPaid = clientPayments.reduce((acc, curr) => acc + (curr.totalPaid || curr.amount), 0);
      refundAmount = totalPaid * 0.5;
    }

    const newRefund = {
      id: 'REF-' + String(refunds.length + 101),
      clientName,
      amount: refundAmount,
      status: 'Pending Review',
      date: new Date().toISOString().split('T')[0],
      auditLogs: [
        { date: new Date().toISOString(), action: `Refund requested for category ${refund.category || 'General'}. Calculated amount: €${refundAmount}.`, user: 'System' }
      ],
      ...refund
    };

    refunds.unshift(newRefund);
    saveState('crm-refund-requests', refunds);
    return newRefund;
  },
  updateRefundStatus: async (refundId, status, user = 'Wael Madi (CEO)') => {
    try {
      const res = await apiFetch(`/api/finance/refunds/${refundId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, user })
      });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Finance updateRefundStatus API warning:', e.message);
    }
    await delay();
    const refunds = loadState('crm-refund-requests', []);
    const payments = loadState('crm-payments', MOCK_PAYMENTS);

    const updated = refunds.map(r => {
      if (r.id === refundId) {
        const auditLogs = [...(r.auditLogs || [])];
        auditLogs.push({ date: new Date().toISOString(), action: `Refund status updated to ${status}.`, user });

        // If processed, create negative payment entry
        if (status === 'Processed' && r.status !== 'Processed') {
          const newPayment = {
            id: 'REF-PAY-' + Date.now(),
            clientId: r.clientId,
            clientName: r.clientName,
            serviceId: 'refund',
            packageId: '-',
            amount: -r.amount,
            discount: 0,
            totalPaid: -r.amount,
            status: 'Refunded (50%)',
            billingDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Bank Transfer',
            transactionId: 'REF-TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          };
          payments.unshift(newPayment);
          saveState('crm-payments', payments);
        }
        return { ...r, status, auditLogs };
      }
      return r;
    });

    saveState('crm-refund-requests', updated);
    return updated.find(r => r.id === refundId);
  },

  // COMMISSIONS
  getCommissionRates: async () => {
    try {
      const res = await apiFetch('/api/finance/commissions/rates');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {}
    await delay();
    return loadState('crm-commission-rates', [
      { agentId: 'c1', type: '10%', value: 10 },
      { agentId: 'c2', type: '5%', value: 5 },
      { agentId: 'c3', type: 'custom', value: 12 },
      { agentId: 'c4', type: 'fixed', value: 200 },
      { agentId: 'c5', type: '10%', value: 10 }
    ]);
  },
  updateCommissionRate: async (agentId, type, value) => {
    try {
      await apiFetch('/api/finance/commissions/rates', {
        method: 'PUT',
        body: JSON.stringify({ agentId, type, value })
      });
    } catch (e) {}
    await delay();
    const rates = loadState('crm-commission-rates', [
      { agentId: 'c1', type: '10%', value: 10 },
      { agentId: 'c2', type: '5%', value: 5 },
      { agentId: 'c3', type: 'custom', value: 12 },
      { agentId: 'c4', type: 'fixed', value: 200 },
      { agentId: 'c5', type: '10%', value: 10 }
    ]);
    const exists = rates.some(r => r.agentId === agentId);
    let updated;
    if (exists) {
      updated = rates.map(r => r.agentId === agentId ? { agentId, type, value: Number(value) } : r);
    } else {
      updated = [...rates, { agentId, type, value: Number(value) }];
    }
    saveState('crm-commission-rates', updated);
    return updated.find(r => r.agentId === agentId);
  },
  getCommissionsReport: async () => {
    try {
      const res = await apiFetch('/api/finance/commissions/report');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {}
    const payments = await dbService.getPayments();
    const clients = await dbService.getClients();
    const agents = await dbService.getAgents();
    const rates = loadState('crm-commission-rates', [
      { agentId: 'c1', type: '10%', value: 10 },
      { agentId: 'c2', type: '5%', value: 5 },
      { agentId: 'c3', type: 'custom', value: 12 },
      { agentId: 'c4', type: 'fixed', value: 200 },
      { agentId: 'c5', type: '10%', value: 10 }
    ]);

    // Find all paid payments (excluding refunds)
    const paidPayments = payments.filter(p => (p.status === 'Paid' || p.status === 'Payment Successful') && (p.amount > 0 || p.totalPaid > 0));

    const reports = paidPayments.map(pay => {
      // Find client
      const client = clients.find(c => c.id === pay.clientId);
      const agentId = client?.assignedConsultantId || client?.assignedAgentId || 'unassigned';
      const agent = agents.find(a => a.id === agentId);
      const agentName = agent ? agent.name : (pay.agentName || 'Wael Madi');

      // Find rate structure
      const rate = rates.find(r => r.agentId === agentId) || { type: '10%', value: 10 };

      let commissionEarned = 0;
      if (rate.type === '5%') {
        commissionEarned = pay.totalPaid * 0.05;
      } else if (rate.type === '10%') {
        commissionEarned = pay.totalPaid * 0.10;
      } else if (rate.type === 'custom') {
        commissionEarned = pay.totalPaid * (rate.value / 100);
      } else if (rate.type === 'fixed') {
        commissionEarned = rate.value;
      }

      // Mock payment tracking (e.g. invoices processed before June 15th are marked paid)
      const commissionPaid = new Date(pay.billingDate) < new Date('2026-06-15') ? commissionEarned : 0;

      return {
        id: 'COMM-' + pay.id,
        paymentId: pay.id,
        clientName: pay.clientName,
        serviceId: pay.serviceId,
        amountPaid: pay.totalPaid,
        agentId,
        agentName,
        structure: `${rate.type} (${rate.type === 'fixed' ? '€' + rate.value : rate.value + '%'})`,
        commissionEarned,
        commissionPaid,
        commissionPending: commissionEarned - commissionPaid,
        date: pay.billingDate
      };
    });

    return reports;
  },

  // AWS STORAGE BACKUPS
  getBackupLogs: async () => {
    await delay();
    return loadState('crm-aws-backups', [
      { id: 'BAK-001', name: 'INV-2026-001_receipt.pdf', size: '142 KB', category: 'Receipt Storage', status: 'Backed Up', timestamp: '2026-06-25T14:35:00Z' },
      { id: 'BAK-002', name: 'INV-2026-002_receipt.pdf', size: '138 KB', category: 'Receipt Storage', status: 'Backed Up', timestamp: '2026-06-25T14:35:00Z' },
      { id: 'BAK-003', name: 'financial_ledger_q2_2026.xlsx', size: '2.4 MB', category: 'Financial Document Storage', status: 'Backed Up', timestamp: '2026-06-26T08:00:00Z' }
    ]);
  },
  triggerAWSBackup: async (fileDetails) => {
    await delay();
    const backups = loadState('crm-aws-backups', []);
    const newBackup = {
      id: 'BAK-' + (backups.length + 101),
      status: 'Backed Up',
      timestamp: new Date().toISOString(),
      ...fileDetails
    };
    backups.unshift(newBackup);
    saveState('crm-aws-backups', backups);
    return newBackup;
  },

  // CLIENT PORTAL & MEETING SCHEDULER
  getAutoAssignSetting: async () => {
    await delay();
    const saved = localStorage.getItem('crm-settings-autoassign');
    return saved !== null ? JSON.parse(saved) : true;
  },
  toggleAutoAssignSetting: async () => {
    await delay();
    const current = localStorage.getItem('crm-settings-autoassign');
    const newVal = current !== null ? !JSON.parse(current) : false;
    localStorage.setItem('crm-settings-autoassign', JSON.stringify(newVal));
    return newVal;
  },
  bookClientConsultation: async ({ clientId, meetingDate, meetingTime, notes }) => {
    await delay();
    const consultations = loadState('crm-consultations', MOCK_CONSULTATIONS);
    const clients = loadState('crm-clients', MOCK_CLIENTS);
    const consultants = loadState('crm-agents-list', AGENTS);

    const client = clients.find(c => c.id === clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';

    // Check if auto assign setting is enabled
    const autoAssignSaved = localStorage.getItem('crm-settings-autoassign');
    const autoAssignEnabled = autoAssignSaved !== null ? JSON.parse(autoAssignSaved) : true;

    let assignedConsultantId = 'unassigned';
    let status = 'Pending Assignment';
    let meetingLink = '';

    if (autoAssignEnabled && consultants.length > 0) {
      // Find matching consultant by workload (lowest casesCount)
      const selected = consultants.reduce((min, curr) =>
        (curr.casesCount || 0) < (min.casesCount || 0) ? curr : min
        , consultants[0]);

      if (selected) {
        assignedConsultantId = selected.id;
        status = 'Scheduled';
        meetingLink = getMeetingUrl(generateMeetingRoom(clientId, clientName));

        // Increment workload
        const updatedAgents = consultants.map(c =>
          c.id === selected.id ? { ...c, casesCount: (c.casesCount || 0) + 1 } : c
        );
        saveState('crm-agents-list', updatedAgents);

        // Update client assigned manager too
        if (client) {
          client.assignedConsultantId = selected.id;
          saveState('crm-clients', clients);
        }
      }
    }

    const newConsultation = {
      id: 'CS' + (3000 + consultations.length + 1),
      leadId: clientId,
      clientName,
      meetingDate,
      meetingTime,
      durationMinutes: 45,
      assignedConsultantId,
      status,
      meetingLink,
      notes: notes || 'Client scheduled free consultation from portal.',
      outcome: null
    };

    consultations.unshift(newConsultation);
    saveState('crm-consultations', consultations);

    // Trigger agent notification if scheduled
    if (status === 'Scheduled' && assignedConsultantId !== 'unassigned') {
      const notifications = loadState('crm-notifications', NOTIFICATIONS);
      notifications.unshift({
        id: 'notif_' + Date.now(),
        title: 'New Booking Assigned',
        message: `Consultation with ${clientName} scheduled for ${meetingDate} at ${meetingTime}.`,
        type: 'consultation',
        read: false,
        time: 'Just now'
      });
      saveState('crm-notifications', notifications);
    }

    return newConsultation;
  },
  assignAgentToConsultation: async (consultationId, agentId) => {
    await delay();
    const consultations = loadState('crm-consultations', MOCK_CONSULTATIONS);
    const clients = loadState('crm-clients', MOCK_CLIENTS);
    const agents = loadState('crm-agents-list', AGENTS);

    const cons = consultations.find(c => c.id === consultationId);
    if (!cons) return null;

    const selectedAgent = agents.find(a => a.id === agentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Unknown';

    const updatedCons = consultations.map(c => {
      if (c.id === consultationId) {
        return {
          ...c,
          assignedConsultantId: agentId,
          status: 'Scheduled',
          meetingLink: getMeetingUrl(generateMeetingRoom(c.leadId || consultationId, c.clientName || agentName))
        };
      }
      return c;
    });
    saveState('crm-consultations', updatedCons);

    // Increment workload
    const updatedAgents = agents.map(a =>
      a.id === agentId ? { ...a, casesCount: (a.casesCount || 0) + 1 } : a
    );
    saveState('crm-agents-list', updatedAgents);

    // Update client record
    const updatedClients = clients.map(cl => {
      if (cl.id === cons.leadId) {
        return { ...cl, assignedConsultantId: agentId };
      }
      return cl;
    });
    saveState('crm-clients', updatedClients);

    // Trigger notification
    const notifications = loadState('crm-notifications', NOTIFICATIONS);
    notifications.unshift({
      id: 'notif_' + Date.now(),
      title: 'Consultation Assigned',
      message: `Meeting with ${cons.clientName} on ${cons.meetingDate} assigned to ${agentName}.`,
      type: 'consultation',
      read: false,
      time: 'Just now'
    });
    saveState('crm-notifications', notifications);

    return updatedCons.find(c => c.id === consultationId);
  },
  completeConsultationAndUnlockDocs: async (consultationId) => {
    await delay();
    const consultations = loadState('crm-consultations', MOCK_CONSULTATIONS);
    const clients = loadState('crm-clients', MOCK_CLIENTS);

    const cons = consultations.find(c => c.id === consultationId);
    if (!cons) return null;

    const updatedCons = consultations.map(c => {
      if (c.id === consultationId) {
        return {
          ...c,
          status: 'Completed',
          outcome: {
            clientRequestedService: 'Visa Relocation',
            aaaRecommendedService: 'Approved for Client onboarding',
            notes: 'Initial meeting successful. Client approved to upload documents.'
          }
        };
      }
      return c;
    });
    saveState('crm-consultations', updatedCons);

    // Unlock document upload permission for client
    const updatedClients = clients.map(cl => {
      if (cl.id === cons.leadId) {
        return {
          ...cl,
          status: 'Under Process',
          documentUploadAllowed: true
        };
      }
      return cl;
    });
    saveState('crm-clients', updatedClients);

    return updatedCons.find(c => c.id === consultationId);
  },

  // ROLE PERMISSIONS & UI CUSTOMIZATION
  getCustomizationSettings: async () => {
    await delay();
    const DEFAULT_CUSTOMIZATION = {
      allowAdminCustomOverrides: true,
      admin: {
        menus: ['Dashboard', 'Priority Roadmap', 'Leads', 'Customer 360', 'Calling System', 'Follow-ups', 'Quotes', 'Bookings', 'Payments', 'After-Sales', 'QA', 'Finance', 'Permission Control', 'Sales Dashboard', 'Social Inbox', 'Agents', 'Integrations'],
        cards: ['Total Clients', 'Today\'s Clients', 'Total Consultations', 'Today\'s Consultations', 'Upcoming Meetings', 'Pending Payments', 'Total Revenue', 'Active Cases', 'Completed Cases', 'Lost Consultations', 'Revenue Today', 'Outstanding Revenue', 'Refunded (50% Rejections)']
      },
      team_leader: {
        menus: ['Dashboard', 'Priority Roadmap', 'Leads', 'Customer 360', 'Calling System', 'Follow-ups', 'Quotes', 'Lead Distribution', 'Lead Lifecycle', 'Duplicate Protection', 'Communication Hub', 'Calling & Softphone', 'Call Dispositions', 'Sales Dashboard', 'Bookings', 'Team Leader Dashboard', 'QA', 'SLA Management', 'Automation', 'Management Reports', 'Permission Control', 'Audit Trail', 'Social Inbox'],
        cards: ['Total Clients', 'Today\'s Clients', 'Total Consultations', 'Today\'s Consultations', 'Upcoming Meetings', 'Active Cases', 'Completed Cases']
      },
      operations: {
        menus: ['Dashboard', 'Priority Roadmap', 'Leads', 'Customer 360', 'Calling System', 'Follow-ups', 'Lead Distribution', 'Lead Lifecycle', 'Duplicate Protection', 'Communication Hub', 'Calling & Softphone', 'Call Dispositions', 'After-Sales', 'Team Leader Dashboard', 'QA', 'SLA Management', 'Automation', 'Management Reports', 'Permission Control', 'Audit Trail', 'Social Inbox', 'Agents'],
        cards: ['Total Clients', 'Today\'s Clients', 'Total Consultations', 'Today\'s Consultations', 'Upcoming Meetings', 'Active Cases', 'Completed Cases']
      },
      finance: {
        menus: ['Dashboard', 'Priority Roadmap', 'Payments', 'Finance', 'SLA Management', 'Automation', 'Management Reports', 'Permission Control', 'Audit Trail'],
        cards: ['Total Revenue', 'Pending Payments']
      },
      consultant: {
        menus: ['Dashboard', 'Priority Roadmap', 'Leads', 'Customer 360', 'Calling System', 'Follow-ups', 'Quotes', 'Lead Distribution', 'Lead Lifecycle', 'Duplicate Protection', 'Communication Hub', 'Calling & Softphone', 'Call Dispositions', 'Sales Dashboard', 'Bookings', 'SLA Management', 'Automation', 'Management Reports', 'Permission Control', 'Audit Trail', 'Social Inbox'],
        cards: ['Upcoming Meetings', 'Active Cases']
      },
      marketing: {
        menus: ['Dashboard', 'Priority Roadmap', 'Leads', 'Lead Distribution', 'Lead Lifecycle', 'Duplicate Protection', 'Communication Hub', 'Calling & Softphone', 'Call Dispositions', 'SLA Management', 'Automation', 'Management Reports', 'Permission Control', 'Audit Trail', 'Marketing Dashboard', 'Social Inbox'],
        cards: ['Total Consultations', 'Today\'s Consultations']
      }
    };
    const saved = localStorage.getItem('crm-customization-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If missing new modules like 'Permission Control' or 'Management Reports', update cached settings
        if (parsed && parsed.admin && (!parsed.admin.menus?.includes('Permission Control') || !parsed.admin.menus?.includes('Management Reports'))) {
          const updated = {
            ...parsed,
            admin: {
              ...parsed.admin,
              menus: Array.from(new Set([...(parsed.admin.menus || []), 'Permission Control', 'Management Reports', 'Priority Roadmap', 'SLA Management', 'Automation', 'Audit Trail']))
            }
          };
          localStorage.setItem('crm-customization-settings', JSON.stringify(updated));
          return updated;
        }
        return parsed;
      } catch (e) {
        console.warn('Error parsing customization settings:', e);
      }
    }
    localStorage.setItem('crm-customization-settings', JSON.stringify(DEFAULT_CUSTOMIZATION));
    return DEFAULT_CUSTOMIZATION;
  },
  saveCustomizationSettings: async (settings) => {
    await delay();
    localStorage.setItem('crm-customization-settings', JSON.stringify(settings));
    return settings;
  },

  // LEAD & CLIENT CUSTOM LIFECYCLE STAGES
  getLeadStages: async () => {
    await delay();
    const DEFAULT_LEAD_STAGES = [
      { id: 'stage_new', name: 'NEW', type: 'lead', color: '#2196F3', emoji: '🆕' },
      { id: 'stage_contacted', name: 'CONTACTED', type: 'lead', color: '#03A9F4', emoji: '📞' },
      { id: 'stage_qualified', name: 'QUALIFIED', type: 'lead', color: '#00BCD4', emoji: '🎯' },
      { id: 'stage_quote_sent', name: 'QUOTE_SENT', type: 'lead', color: '#FF9800', emoji: '📄' },
      { id: 'stage_follow_up', name: 'FOLLOW_UP', type: 'lead', color: '#9C27B0', emoji: '📅' },
      { id: 'stage_booking_pending', name: 'BOOKING_PENDING', type: 'client', color: '#FF5722', emoji: '⏳' },
      { id: 'stage_converted', name: 'CONVERTED', type: 'client', color: '#4CAF50', emoji: '✅' },
      { id: 'stage_lost', name: 'LOST', type: 'lead', color: '#F44336', emoji: '❌' },
    ];
    let stages = loadState('crm-travel-lead-stages', DEFAULT_LEAD_STAGES);
    let migrated = false;
    stages = stages.map(s => {
      if (s.id === 'stage_waiting_payment' && s.type === 'universal') {
        s.type = 'client';
        migrated = true;
      }
      if (s.id === 'stage_cold_lead' && s.type === 'lost') {
        s.type = 'lead';
        migrated = true;
      }
      if (s.id === 'stage_lost_lead' && s.type === 'lost') {
        s.type = 'lead';
        migrated = true;
      }
      return s;
    });
    if (migrated) {
      saveState('crm-lead-stages', stages);
    }
    return stages;
  },
  saveLeadStages: async (stages) => {
    await delay();
    saveState('crm-lead-stages', stages);
    return stages;
  },

  // MARKETING CAMPAIGNS
  getCampaigns: async () => {
    await delay(30);
    const DEFAULT_CAMPAIGNS = [
      { id: 'CMP-001', name: 'Summer Europe Business Class Flight Sale', platform: 'Google Ads', status: 'Active', budget: 15000, spend: 12400, leads: 840, qualLeads: 580, bookings: 195, revenue: 268000, grossProfit: 48500, roi: 391.1, cpl: 14.76, cpb: 63.59, profitPerBkg: 248.71, utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'summer_europe_sale_2026', landingPage: '/flights/europe-summer-sale' },
      { id: 'CMP-002', name: 'Dubai Luxury First Class Concierge Promo', platform: 'Meta (FB/IG)', status: 'Active', budget: 12000, spend: 9800, leads: 620, qualLeads: 410, bookings: 140, revenue: 215000, grossProfit: 38200, roi: 389.7, cpl: 15.80, cpb: 70.00, profitPerBkg: 272.85, utmSource: 'facebook', utmMedium: 'paid_social', utmCampaign: 'dubai_luxury_first_class', landingPage: '/luxury-first-class' },
      { id: 'CMP-003', name: 'Manila & Asia Balikbayan Family Specials', platform: 'WhatsApp Ads', status: 'Active', budget: 8000, spend: 6400, leads: 590, qualLeads: 420, bookings: 160, revenue: 148000, grossProfit: 24600, roi: 384.3, cpl: 10.84, cpb: 40.00, profitPerBkg: 153.75, utmSource: 'whatsapp_api', utmMedium: 'direct_msg', utmCampaign: 'balikbayan_special_2026', landingPage: '/flights/asia-balikbayan' },
      { id: 'CMP-004', name: 'London Heathrow Flash Discount Code', platform: 'Instagram', status: 'Active', budget: 6000, spend: 5200, leads: 480, qualLeads: 290, bookings: 85, revenue: 94000, grossProfit: 15800, roi: 303.8, cpl: 10.83, cpb: 61.17, profitPerBkg: 185.88, utmSource: 'instagram', utmMedium: 'paid_social', utmCampaign: 'lhr_flash_discount', landingPage: '/flights/london-heathrow' },
      { id: 'CMP-005', name: 'TikTok Travel Influencer Deal Blast', platform: 'TikTok Ads', status: 'Paused', budget: 5000, spend: 4100, leads: 390, qualLeads: 180, bookings: 40, revenue: 42000, grossProfit: 6800, roi: 165.8, cpl: 10.51, cpb: 102.50, profitPerBkg: 170.00, utmSource: 'tiktok', utmMedium: 'influencer_video', utmCampaign: 'tiktok_travel_hacks', landingPage: '/flights/tiktok-deals' }
    ];
    return loadState('crm-marketing-campaigns', DEFAULT_CAMPAIGNS);
  },
  createCampaign: async (campaign) => {
    await delay(30);
    const campaigns = await dbService.getCampaigns();
    const newCamp = {
      id: campaign.id || `CMP-00${campaigns.length + 1}`,
      createdAt: new Date().toISOString(),
      status: 'Active',
      leads: 0,
      qualLeads: 0,
      bookings: 0,
      revenue: 0,
      grossProfit: 0,
      roi: 0,
      cpl: 0,
      cpb: 0,
      profitPerBkg: 0,
      ...campaign
    };
    campaigns.unshift(newCamp);
    saveState('crm-marketing-campaigns', campaigns);
    return newCamp;
  },
  updateCampaign: async (id, updates) => {
    await delay(30);
    const campaigns = await dbService.getCampaigns();
    const updated = campaigns.map(c => c.id === id ? { ...c, ...updates } : c);
    saveState('crm-marketing-campaigns', updated);
    return { id, ...updates };
  },

  // ─── LEAD DISTRIBUTION & ROUTING API ───
  getDistributionWorkload: async () => {
    const res = await apiFetch('/api/leads/distribution/workload');
    if (!res || !res.success) return null;
    const list = Array.isArray(res.data) ? res.data : [];
    list.stats = res.stats || {
      incomingLeads: 0,
      autoAssigned: 0,
      unassigned: 0,
      roundRobin: 0,
      skillBased: 0,
      capacityBased: 0,
      performanceBased: 0
    };
    return list;
  },
  getRoutingRules: async () => {
    const res = await apiFetch('/api/leads/distribution/rules');
    return res && res.success ? res.data : null;
  },
  updateRoutingRule: async (id, data) => {
    return await apiFetch(`/api/leads/distribution/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  createRoutingRule: async (data) => {
    return await apiFetch('/api/leads/distribution/rules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  deleteRoutingRule: async (id) => {
    return await apiFetch(`/api/leads/distribution/rules/${id}`, {
      method: 'DELETE'
    });
  },
  reassignLeadRoute: async (data) => {
    return await apiFetch('/api/leads/distribution/reassign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getDistributionHistory: async () => {
    const res = await apiFetch('/api/leads/distribution/history');
    return res && res.success ? res.data : null;
  },

  // ─── DUPLICATE LEAD PROTECTION API ───
  getDuplicateLeads: async () => {
    const res = await apiFetch('/api/leads/duplicates/detect');
    if (!res || !res.success) return [];
    const list = Array.isArray(res.data) ? res.data : [];
    list.stats = res.stats || null;
    return list;
  },
  mergeDuplicateLeads: async (data) => {
    return await apiFetch('/api/leads/duplicates/merge', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  dismissDuplicatePair: async (pairKey) => {
    return await apiFetch('/api/leads/duplicates/dismiss', {
      method: 'POST',
      body: JSON.stringify({ pairKey })
    });
  },

  // ─── LEAD LIFECYCLE & SLA AUDIT API ───
  getLifecycleOverview: async () => {
    const res = await apiFetch('/api/leads/lifecycle/overview');
    return res && res.success ? res.data : null;
  },
  getLeadLifecycle: async (id) => {
    const res = await apiFetch(`/api/leads/${id}/lifecycle`);
    return res && res.success ? res.data : null;
  },
  transitionLeadLifecycle: async (id, data) => {
    return await apiFetch(`/api/leads/${id}/lifecycle/transition`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // ─── CALL DISPOSITIONS API ───
  getCallDispositions: async () => {
    const res = await apiFetch('/api/telnyx/dispositions');
    if (res && res.success && Array.isArray(res.data)) {
      const cleanData = res.data.filter(l => l.customer !== 'Ambassador Harold Vance' && l.id !== 'LOG-771');
      return { ...res, data: cleanData };
    }
    return res && res.success ? res : null;
  },
  saveCallDisposition: async (data) => {
    return await apiFetch('/api/telnyx/dispositions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  deleteCallDisposition: async (id) => {
    return await apiFetch(`/api/telnyx/dispositions/${id}`, {
      method: 'DELETE'
    });
  }
};


