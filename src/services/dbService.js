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

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getBackendUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalhost) {
    return 'http://localhost:3001';
  }
  return import.meta.env.VITE_BACKEND_URL || 'https://wow-my-flight-backend-production.up.railway.app';
};

async function apiFetch(path, options = {}) {
  const primaryUrl = getBackendUrl();
  try {
    const res = await fetch(`${primaryUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) { }

  // Fallback if primary URL failed or was unreachable
  const fallbackUrl = primaryUrl.includes('localhost')
    ? (import.meta.env.VITE_BACKEND_URL || '')
    : 'http://localhost:3001';

  if (fallbackUrl && fallbackUrl !== primaryUrl) {
    try {
      const res = await fetch(`${fallbackUrl}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
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
    const keysToCheck = ['crm-leads', 'crm-clients', 'crm-consultations', 'crm-payments', 'crm-documents', 'crm-agents-list'];
    keysToCheck.forEach(k => {
      const val = localStorage.getItem(k);
      if (val && (val.includes('AAA Business') || val.includes('Golden Visa') || val.includes('Malaga') || val.includes('Autonomo'))) {
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
          item?.name?.includes('AAA Business')
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
    leadId: 'LD1001',
    name: 'Amelia Watson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    platform: 'whatsapp',
    unreadCount: 1,
    status: 'New Lead',
    email: 'amelia.w@example.com',
    phone: '+44 7911 123456',
    country: 'United Kingdom',
    preferredLanguage: 'English',
    serviceId: 'dnv',
    messages: [
      { sender: 'customer', text: 'Hello, I am interested in the Digital Nomad Visa for Spain. Can you guide me?', timestamp: '10:15 AM' },
      { sender: 'system', text: 'Hello Amelia! Thanks for reaching out to AAA Business Consultancy. One of our visa experts will be with you shortly. In the meantime, what is your current monthly remote income?', timestamp: '10:16 AM' },
      { sender: 'customer', text: 'It is about €3,800 per month, and I work for a UK tech company.', timestamp: '10:18 AM' },
      { sender: 'agent', text: "That is great! That exceeds the minimum requirement of €3,160. Let's schedule an expert consultation.", timestamp: '10:20 AM' },
      { sender: 'customer', text: 'Excellent, is there a booking link for the zoom call?', timestamp: '10:22 AM' }
    ]
  },
  {
    id: 'conv2',
    leadId: 'LD1003',
    name: 'Elena Petrova',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    platform: 'telegram',
    unreadCount: 0,
    status: 'Active',
    email: 'elena.p@example.com',
    phone: '+7 903 123-45-67',
    country: 'Russia',
    preferredLanguage: 'English',
    serviceId: 'study',
    messages: [
      { sender: 'customer', text: 'Spasibo, details sent via email.', timestamp: 'Yesterday' },
      { sender: 'agent', text: 'Thank you Elena, I will verify the translation.', timestamp: 'Yesterday' }
    ]
  },
  {
    id: 'conv3',
    leadId: 'LD1004',
    name: 'Markus Schmidt',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    platform: 'whatsapp',
    unreadCount: 0,
    status: 'New Lead',
    email: 'markus.s@example.com',
    phone: '+49 170 1234567',
    country: 'Germany',
    preferredLanguage: 'English',
    serviceId: 'self_employed',
    messages: [
      { sender: 'customer', text: 'Hey, can I set up an Autonomo business in Spain remotely?', timestamp: '3 days ago' },
      { sender: 'agent', text: 'Hi Markus! Yes, we can handle the registration of your self-employed residency remotely using a power of attorney.', timestamp: '3 days ago' },
      { sender: 'customer', text: 'Excellent, that sounds solid.', timestamp: '3 days ago' }
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
        if (remote.data.length > 0) {
          localStorage.setItem('crm-payments', JSON.stringify(remote.data));
          return remote.data;
        }
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
        if (remote.data.length > 0) {
          localStorage.setItem('crm-quotes', JSON.stringify(remote.data));
          return remote.data;
        }
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
        if (remote.data.length > 0) {
          localStorage.setItem('crm-bookings', JSON.stringify(remote.data));
          return remote.data;
        }
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

  // SETTINGS
  getSettings: async () => {
    await delay(50);
    return loadState('crm-settings-general', {
      companyName: 'WowMyFlight Air Concierge',
      phone: '+1 (800) 555-0199',
      email: 'support@wowmyflight.com',
      address: 'One World Trade Center, Suite 8500, New York, NY 10007, USA',
      vatRate: 5,
      autoAssignConsultant: true
    });
  },
  updateSettings: async (settings) => {
    await delay();
    saveState('crm-settings-general', settings);
    return settings;
  },
  getServices: async () => {
    await delay();
    return loadState('crm-services', SERVICES);
  },
  updateServices: async (services) => {
    await delay();
    saveState('crm-services', services);
    return services;
  },
  getPackages: async () => {
    await delay();
    return loadState('crm-packages', PACKAGES);
  },
  updatePackages: async (packages) => {
    await delay();
    saveState('crm-packages', packages);
    return packages;
  },
  getEmailTemplates: async () => {
    await delay();
    return loadState('crm-email-templates', EMAIL_TEMPLATES);
  },
  updateEmailTemplates: async (templates) => {
    await delay();
    saveState('crm-email-templates', templates);
    return templates;
  },
  getWhatsappTemplates: async () => {
    await delay();
    return loadState('crm-whatsapp-templates', WHATSAPP_TEMPLATES);
  },
  updateWhatsappTemplates: async (templates) => {
    await delay();
    saveState('crm-whatsapp-templates', templates);
    return templates;
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

  // NOTIFICATIONS
  getNotifications: async () => {
    await delay();
    return loadState('crm-notifications', NOTIFICATIONS);
  },
  addNotification: async (notif) => {
    await delay();
    const notifications = loadState('crm-notifications', NOTIFICATIONS);
    const newNotif = {
      id: 'notif_' + Date.now(),
      read: false,
      time: 'Just now',
      ...notif
    };
    notifications.unshift(newNotif);
    saveState('crm-notifications', notifications);
    return newNotif;
  },
  markNotificationRead: async (id) => {
    await delay();
    const notifications = loadState('crm-notifications', NOTIFICATIONS);
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveState('crm-notifications', updated);
    return id;
  },
  markAllNotificationsRead: async () => {
    await delay();
    const notifications = loadState('crm-notifications', NOTIFICATIONS);
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveState('crm-notifications', updated);
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
    return [];
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
    await delay();
    return loadState('crm-refund-requests', [
      {
        id: 'REF-001',
        clientId: 'CL2008',
        clientName: 'Olga Kuznetsova',
        category: 'Visa Rejection',
        amount: 900,
        reason: 'Spanish Consulate rejected visa application due to lack of local ties.',
        status: 'Approved',
        date: '2026-06-25',
        auditLogs: [
          { date: '2026-06-25T10:00:00Z', action: 'Refund requested automatically on visa rejection.', user: 'System' },
          { date: '2026-06-25T14:30:00Z', action: 'Refund reviewed and approved.', user: 'Wael Madi (CEO)' }
        ]
      }
    ]);
  },
  createRefundRequest: async (refund) => {
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
  }
};
