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

export const INITIAL_SUPPLIER_ADAPTERS = [
  {
    id: 'ADAPTER-TRAVELOPRO',
    name: 'TraveloPro (B2B Global Flights)',
    type: 'Consolidator B2B',
    protocol: 'REST / JSON API',
    endpoint: 'https://travelnext.works/api/aeroVE5/availability',
    status: 'Active',
    latency: '85ms',
    uptime: '99.98%',
    authType: 'API Credential Payload',
    supportedCabins: ['Economy', 'Premium Economy', 'Business', 'First Class'],
    features: ['Live Flight Search', 'Net Fare Rules', 'Instant PNR Hold', 'Ticket Order'],
    lastPing: new Date().toISOString(),
    description: 'TraveloPro global B2B consolidator connecting 700+ full-service airlines & GDS inventory.'
  },
  {
    id: 'ADAPTER-CONS-A',
    name: 'Consolidator A (Mystifly B2B)',
    type: 'Consolidator',
    protocol: 'REST / JSON API',
    endpoint: 'https://api.mystifly.com/v2/flight/search',
    status: 'Active',
    latency: '120ms',
    uptime: '99.9%',
    authType: 'OAuth 2.0 / Bearer',
    supportedCabins: ['Economy', 'Premium Economy', 'Business', 'First Class'],
    features: ['Net Fare Rules', 'Instant Ticket Issuance', 'B2B Fare Markup'],
    lastPing: '2026-08-20T12:00:00Z',
    description: 'Global flight content consolidator specializing in wholesale B2B fares.'
  },
  {
    id: 'ADAPTER-CONS-B',
    name: 'Consolidator B (Mondee Travel)',
    type: 'Consolidator',
    protocol: 'REST / JSON API',
    endpoint: 'https://api.mondee.com/v1/flights/avail',
    status: 'Active',
    latency: '145ms',
    uptime: '99.8%',
    authType: 'API Key + Secret',
    supportedCabins: ['Economy', 'Business'],
    features: ['Private Negotiated Fares', 'Tour Operator Tariffs'],
    lastPing: '2026-08-20T12:05:00Z',
    description: 'Americas and transatlantic flight content consolidator aggregator.'
  },
  {
    id: 'ADAPTER-GDS',
    name: 'GDS Adapter (Amadeus & Sabre GDS)',
    type: 'GDS Gateway',
    protocol: 'SOAP / XML / EDIFACT',
    endpoint: 'https://nodeD3.production.amadeus.com/1ASLWM',
    status: 'Active',
    latency: '95ms',
    uptime: '99.99%',
    authType: 'Session Token / WSS Security',
    supportedCabins: ['Economy', 'Premium Economy', 'Business', 'First Class'],
    features: ['Live PNR Build', 'Seat Maps', 'Interline Agreements', 'GDS Queue Sync'],
    lastPing: '2026-08-20T12:10:00Z',
    description: 'Core legacy GDS gateway for published, IT, and CAT35 private fares.'
  },
  {
    id: 'ADAPTER-NDC',
    name: 'NDC Supplier Adapter (Air India & Emirates Direct)',
    type: 'NDC Direct Connect',
    protocol: 'IATA NDC 21.3 XML',
    endpoint: 'https://ndc.airindia.in/ndc/v213/AirShopping',
    status: 'Active',
    latency: '110ms',
    uptime: '99.95%',
    authType: 'Digital Signature + Certificate',
    supportedCabins: ['Economy', 'Business', 'First Class'],
    features: ['Ancillary Dynamic Pricing', 'Free Seat Selection', 'Zero GDS Surcharge'],
    lastPing: '2026-08-20T12:12:00Z',
    description: 'Direct NDC connect API bypassing legacy GDS distribution fees.'
  }
];

class FlightContentService {
  constructor() {
    this.adapters = this.loadAdapters();
  }

  getBackendUrl() {
    return (
      import.meta.env?.VITE_BACKEND_URL ||
      'https://wow-my-flight-backend-production-2ef6.up.railway.app'
    );
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

    // Simulate network round-trip ping latency
    const pingTime = Math.floor(80 + Math.random() * 70);
    const updated = {
      ...adapter,
      latency: `${pingTime}ms`,
      lastPing: new Date().toISOString(),
      status: 'Active'
    };

    this.adapters = this.adapters.map(a => a.id === id ? updated : a);
    this.saveAdapters();

    return {
      success: true,
      adapterId: id,
      name: adapter.name,
      latency: `${pingTime}ms`,
      timestamp: updated.lastPing
    };
  }

  registerAdapter(newAdapterData) {
    const newId = `ADAPTER-SUP-${Math.floor(100 + Math.random() * 900)}`;
    const fullAdapter = {
      id: newId,
      name: newAdapterData.name || 'New Supplier Adapter',
      type: newAdapterData.type || 'Consolidator',
      protocol: newAdapterData.protocol || 'REST / JSON API',
      endpoint: newAdapterData.endpoint || 'https://api.supplier.com/v1/search',
      status: newAdapterData.status || 'Active',
      latency: '115ms',
      uptime: '100%',
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

    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let backendUrl = import.meta.env.VITE_BACKEND_URL || (isLocalhost ? 'http://localhost:3001' : 'http://localhost:3001');

    try {
      let response = await fetch(`${backendUrl}/api/travelopro/flights/search`, {
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

      // If initial URL failed (e.g. 404 on un-deployed Railway), fallback to alternate
      if (!response || !response.ok) {
        const altUrl = backendUrl.includes('3001') ? (import.meta.env.VITE_BACKEND_URL || '') : 'http://localhost:3001';
        if (altUrl) {
          const altResponse = await fetch(`${altUrl}/api/travelopro/flights/search`, {
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
          if (altResponse && altResponse.ok) {
            response = altResponse;
          }
        }
      }

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

  getBackendUrl() {
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
    return isLocalhost ? 'http://localhost:3001' : 'http://localhost:3001';
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
