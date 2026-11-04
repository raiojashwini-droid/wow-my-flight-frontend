import { saveRecord } from './recordApi.js';
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
import { getBackendUrl } from '../config/backend.js';

export { getBackendUrl };

const delay = () => Promise.resolve();

export const getAuthToken = () => {
  try {
    const saved = localStorage.getItem('crm-auth-user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(getBackendUrl()+path, {...options, signal: AbortSignal.timeout(15000), headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.error || result.message || 'Request failed');
  return result;
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

const INITIAL_CONVERSATIONS = [];

// ─── CLIENTS METADATA STORE & CACHE ──────────────────────────────
const CLIENTS_META_STORAGE_KEY = 'crm-clients-meta-store';

const INITIAL_CLIENTS_META = {};

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
  createLead: async lead => saveRecord('/api/leads', 'POST', lead, 'crm-leads'),
  updateLead: async lead => saveRecord('/api/leads/' + lead.id, 'PUT', lead, 'crm-leads'),
  deleteLead: async id => saveRecord('/api/leads/' + id, 'DELETE', undefined, 'crm-leads', id),
  assignAgent: async (leadId, agentId) => saveRecord('/api/leads/' + leadId + '/assign', 'PATCH', { agentId }, 'crm-leads'),
  updateLeadStatus: async (leadId, status) => saveRecord('/api/leads/' + leadId, 'PUT', { status }, 'crm-leads'),

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
  createClient: async client => saveRecord('/api/clients', 'POST', client, 'crm-clients'),
  updateClient: async client => saveRecord('/api/clients/' + client.id, 'PUT', client, 'crm-clients'),
  deleteClient: async id => saveRecord('/api/clients/' + id, 'DELETE', undefined, 'crm-clients', id),
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
  createConsultation: async cons => saveRecord('/api/consultations', 'POST', cons, 'crm-consultations'),
  updateConsultationStatus: async (id, status) => saveRecord('/api/consultations/' + id, 'PUT', { status }, 'crm-consultations'),
  completeConsultation: async (id, outcome, notes) => saveRecord('/api/consultations/' + id, 'PUT', { status: 'Completed', outcome, notes }, 'crm-consultations'),

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
  createInvoice: async invoice => saveRecord('/api/payments', 'POST', invoice, 'crm-payments'),
  updatePaymentStatus: async (id, status, paymentMethod, transactionId) => saveRecord('/api/payments/' + id + '/status', 'PATCH', { status, method: paymentMethod, transactionId }, 'crm-payments'),

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
  createQuote: async quote => saveRecord('/api/quotes', 'POST', quote, 'crm-quotes'),
  updateQuote: async (id, updates) => saveRecord('/api/quotes/' + id, 'PUT', updates, 'crm-quotes'),

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
  createBooking: async booking => saveRecord('/api/bookings', 'POST', booking, 'crm-bookings'),

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
  uploadDocument: async doc => saveRecord('/api/documents', 'POST', doc, 'crm-documents'),
  reviewDocument: async (id, status, comment) => saveRecord('/api/documents/' + id + '/status', 'PATCH', { status, comment }, 'crm-documents'),
  deleteDocument: async id => saveRecord('/api/documents/' + id, 'DELETE', undefined, 'crm-documents', id),

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
    const defaultServices = [];
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
    const defaultPackages = [];
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
  createAgent: async (agent) => { const res = await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(agent) }); if (!res?.success) throw new Error('Account was not created. Check required fields and permissions.'); return res.data; },
  updateAgentRole: async (id, role) => { const res = await apiFetch('/api/users/' + id, { method: 'PUT', body: JSON.stringify({ role }) }); if (!res?.success) throw new Error('Role was not saved'); return res.data; },
  updateAgent: async (agent) => { const res = await apiFetch('/api/users/' + agent.id, { method: 'PUT', body: JSON.stringify(agent) }); if (!res?.success) throw new Error('Account was not saved'); return res.data; },
  deleteAgent: async (id) => { const res = await apiFetch('/api/users/' + id, { method: 'DELETE' }); if (!res?.success) throw new Error('Account was not deactivated'); return id; },
  resetAgentPassword: async (id, password) => { const res = await apiFetch('/api/users/' + id, { method: 'PUT', body: JSON.stringify({ password }) }); if (!res?.success) throw new Error('Password was not changed. Use at least 12 characters.'); return res.data; },
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
  updateRefundStatus: async (refundId, status, user = 'Parminder (Super Admin)') => {
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
    return loadState('crm-commission-rates', []);
  },
  updateCommissionRate: async (agentId, type, value) => {
    try {
      await apiFetch('/api/finance/commissions/rates', {
        method: 'PUT',
        body: JSON.stringify({ agentId, type, value })
      });
    } catch (e) {}
    await delay();
    const rates = loadState('crm-commission-rates', []);
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
    const rates = loadState('crm-commission-rates', []);

    // Find all paid payments (excluding refunds)
    const paidPayments = payments.filter(p => (p.status === 'Paid' || p.status === 'Payment Successful') && (p.amount > 0 || p.totalPaid > 0));

    const reports = paidPayments.map(pay => {
      // Find client
      const client = clients.find(c => c.id === pay.clientId);
      const agentId = client?.assignedConsultantId || client?.assignedAgentId || 'unassigned';
      const agent = agents.find(a => a.id === agentId);
      const agentName = agent ? agent.name : (pay.agentName || 'Parminder');

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
    return loadState('crm-aws-backups', []);
  },
  triggerAWSBackup: async () => { throw new Error('Cloud file backup is not configured. No backup was created.'); },

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
      sales_executive: {
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
    const DEFAULT_CAMPAIGNS = [];
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


