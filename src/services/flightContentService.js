/**
 * Flight Content Service & Supplier Adapter Architecture
 *
 * Decouples the CRM from direct GDS / Consolidator API dependencies.
 *
 * Architecture:
 *   CRM Application
 *        ↓
 *   Flight Content Service (Aggregator & Normalizer)
 *        ↓
 *   Supplier Adapter Manager
 *    ├── Consolidator A Adapter (e.g. Mystifly B2B API)
 *    ├── Consolidator B Adapter (e.g. Mondee / Picasso Travel)
 *    ├── GDS Adapter (Amadeus / Sabre / Travelport GDS)
 *    └── NDC Supplier Adapter (Air India NDC / Emirates Direct Connect)
 */

import { getBackendUrl } from '../config/backend.js';

export const INITIAL_SUPPLIER_ADAPTERS = [{id:'ADAPTER-TRAVELOPRO',name:'TraveloPro (B2B Global Flights)',type:'Consolidator B2B',protocol:'REST / JSON API',endpoint:'/api/travelopro',status:'Not verified',latency:'Not measured',uptime:'Not measured',authType:'Server credentials',supportedCabins:['Economy','Premium Economy','Business','First Class'],features:['Flight Search'],lastPing:null,description:'Provider availability is verified when a search is requested.'}];

class FlightContentService {
  constructor() {
    this.adapters = this.loadAdapters();
  }

  getBackendUrl() {
    return getBackendUrl();
  }

  loadAdapters() {
    try {
      const saved = localStorage.getItem('crm_supplier_adapters');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load supplier adapters from localStorage:', e);
    }
    return INITIAL_SUPPLIER_ADAPTERS;
  }

  saveAdapters() {
    try {
      localStorage.setItem('crm_supplier_adapters', JSON.stringify(this.adapters));
    } catch (e) {
      console.error('Failed to save supplier adapters to localStorage:', e);
    }
  }

  getAdapters() {
    return [...this.adapters];
  }

  getActiveAdapters() {
    return this.adapters.filter(a => a.status === 'Active');
  }

  toggleAdapterStatus(id, newStatus) {
    this.adapters = this.adapters.map(a =>
      a.id === id ? { ...a, status: newStatus, lastPing: new Date().toISOString() } : a
    );
    this.saveAdapters();
    return this.getAdapters();
  }

  async pingAdapter(id) {
    const adapter = this.adapters.find(a => a.id === id);
    if (!adapter) return { success: false, message: 'Adapter not found' };

    return {success:false, message:'Provider health check is not configured. Run a flight search to verify availability.'};
  }

  registerAdapter(newAdapterData) {
    const newId = `ADAPTER-SUP-${Math.floor(100 + Math.random() * 900)}`;
    const fullAdapter = {
      id: newId,
      name: newAdapterData.name || 'New Supplier Adapter',
      type: newAdapterData.type || 'Consolidator',
      protocol: newAdapterData.protocol || 'REST / JSON API',
      endpoint: newAdapterData.endpoint || 'https://api.supplier.com/v1/search',
      status: 'Not verified',
      latency: 'Not measured',
      uptime: 'Not measured',
      authType: newAdapterData.authType || 'API Key',
      supportedCabins: newAdapterData.supportedCabins || ['Economy', 'Business'],
      features: newAdapterData.features || ['Search', 'Booking'],
      lastPing: new Date().toISOString(),
      description: newAdapterData.description || 'Custom added flight content supplier adapter.'
    };

    this.adapters.unshift(fullAdapter);
    this.saveAdapters();
    return fullAdapter;
  }

  /**
   * Search flights across all active supplier adapters concurrently.
   * Calls the WowMyFlight backend proxy at /api/travelopro/flights/search,
   * returning normalized CRM Flight Offers.
   */
  async searchFlightsAcrossAdapters(params = {}) {
    const {
      origin = 'DEL',
      destination = 'LHR',
      departDate = '2026-11-21',
      returnDate = null,
      cabinClass = 'Economy',
      passengers = 1,
      tripType = 'oneway',
      adapterFilter = 'All'
    } = params;

    const backendUrl = this.getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/travelopro/flights/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departDate,
          returnDate,
          cabinClass,
          passengers,
          tripType
        })
      }).catch(() => null);

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errorData.error || errorData.message || 'Flight search failed');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[FlightContentService] Live TraveloPro search failed:', err);
      return {
        query: params,
        searchedAdaptersCount: 1,
        offersCount: 0,
        offers: [],
        error: err.message
      };
    }
  }

  /**
   * Create Booking / Hold PNR via TraveloPro API
   */
  async bookFlight(details = {}) {
    const response = await fetch(this.getBackendUrl() + '/api/travelopro/flights/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details)
    });
    const data = await response.json();
    const pnr = data.pnr || data.PNR || data.bookingReference || data.BookingReference;
    if (!response.ok || data.success === false || !pnr) throw new Error(data.message || data.error || 'Supplier did not confirm a booking. No booking was saved.');
    const saved = await this.createBooking({
      pnr, customerName: details.passengerName, origin: details.origin, destination: details.destination,
      sellingPrice: Number(details.sellingPrice || 0), paymentStatus: 'Payment Pending',
      ticketStatus: 'Pending Ticketing', supplier: 'Travelopro', flightNumber: details.flightNumber || ''
    });
    if (!saved?.success) throw new Error('Supplier confirmed PNR ' + pnr + ', but CRM save failed. Contact your administrator before retrying.');
    return { success: true, pnr, booking: saved.data, details: data };
  }

  /**
   * Fetch all bookings from PostgreSQL Database
   */
  async getBookings() {
    const backendUrl = this.getBackendUrl();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${backendUrl}/api/bookings`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          localStorage.setItem('crm-bookings', JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[FlightContentService] Fetch DB bookings warning:', err.message);
    }
    const cached = localStorage.getItem('crm-bookings');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }

  /**
   * Create a new booking in PostgreSQL Database
   */
  async createBooking(bookingData) {
    const backendUrl = this.getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[FlightContentService] Create DB booking warning:', err.message);
    }
    return null;
  }

  /**
   * Book Flight / Hold PNR & Persist to Database
   */


  /**
   * Update booking status in PostgreSQL Database
   */
  async updateBookingStatus(id, updates) {
    const backendUrl = this.getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[FlightContentService] Update DB booking warning:', err.message);
    }
    return null;
  }

  /**
   * Issue E-Ticket via TraveloPro API & Persist to PostgreSQL Database
   */
  async issueTicket(details = {}) {
    const ref = details.bookingRef || details.pnr;
    if (!ref) throw new Error('Booking reference is required');
    const response = await fetch(this.getBackendUrl() + '/api/travelopro/flights/issue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details)
    });
    const data = await response.json();
    const tickets = data.eTickets || data.ticketNumbers || data.ticketNumber;
    if (!response.ok || data.success === false || !tickets || (Array.isArray(tickets) && !tickets.length)) throw new Error(data.message || data.error || 'Supplier has not confirmed ticket issuance');
    const saved = await fetch(this.getBackendUrl() + '/api/bookings/' + encodeURIComponent(ref) + '/issue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eTickets: tickets })
    });
    if (!saved.ok) throw new Error('Supplier issued tickets but the CRM update failed. Reconcile the booking before retrying.');
    return { success: true, details: data };
  }
}

export const flightContentService = new FlightContentService();
