// Cabin classes for flight bookings
export const SERVICES = [];

export const CABIN_CLASSES = [
  { id: 'economy', name: 'Economy', code: 'Y', multiplier: 1.0 },
  { id: 'premium_eco', name: 'Premium Economy', code: 'W', multiplier: 1.5 },
  { id: 'business', name: 'Business Class', code: 'J', multiplier: 2.5 },
  { id: 'first', name: 'First Class', code: 'F', multiplier: 4.0 },
];

export const TRAVEL_ADDONS = [
  { id: 'seat_upgrade', name: 'Seat Upgrade', description: 'Extra legroom / Exit row' },
  { id: 'extra_baggage_23', name: 'Extra Baggage 23kg', description: '23kg add-on' },
  { id: 'extra_baggage_32', name: 'Extra Baggage 32kg', description: '32kg add-on' },
  { id: 'travel_insurance', name: 'Travel Insurance', description: 'Comprehensive coverage' },
  { id: 'airport_transfer', name: 'Airport Transfer', description: 'Private car service' },
  { id: 'hotel', name: 'Hotel', description: 'Partner hotel booking' },
  { id: 'priority_checkin', name: 'Priority Check-in & Boarding' },
  { id: 'lounge_access', name: 'Airport Lounge Access' },
  { id: 'fast_track', name: 'Fast Track Security' },
  { id: 'travel_sim', name: 'International Travel SIM' },
];

export const POPULAR_ROUTES = [
  { id: 'r1', origin: 'JFK', destination: 'LHR', originCity: 'New York', destCity: 'London' },
  { id: 'r2', origin: 'DEL', destination: 'LHR', originCity: 'Delhi', destCity: 'London' },
  { id: 'r3', origin: 'DXB', destination: 'JFK', originCity: 'Dubai', destCity: 'New York' },
  { id: 'r4', origin: 'DEL', destination: 'DXB', originCity: 'Delhi', destCity: 'Dubai' },
  { id: 'r5', origin: 'LHR', destination: 'CDG', originCity: 'London', destCity: 'Paris' },
  { id: 'r6', origin: 'JFK', destination: 'DXB', originCity: 'New York', destCity: 'Dubai' },
  { id: 'r7', origin: 'BOM', destination: 'LHR', originCity: 'Mumbai', destCity: 'London' },
  { id: 'r8', origin: 'SIN', destination: 'LHR', originCity: 'Singapore', destCity: 'London' },
];

export const AIRLINES = [
  { code: 'AA', name: 'American Airlines' },
  { code: 'BA', name: 'British Airways' },
  { code: 'AI', name: 'Air India' },
  { code: 'EK', name: 'Emirates' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'EY', name: 'Etihad Airways' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'DL', name: 'Delta Airlines' },
  { code: 'TK', name: 'Turkish Airlines' },
];

export const LEAD_LABELS = [
  { id: 'hot_lead', name: 'Hot Lead', emoji: '\uD83D\uDD25', color: '#FF6B35' },
  { id: 'vip', name: 'VIP', emoji: '\uD83C\uDDFA\uD83C\uDDF8', color: '#2563EB' },
  { id: 'price_sensitive', name: 'Price Sensitive', emoji: '\uD83D\uDCB2', color: '#6B7280' },
  { id: 'corporate', name: 'Corporate', emoji: '\uD83C\uDFE2', color: '#7C3AED' },
  { id: 'urgent', name: 'Urgent', emoji: '\uD83D\uDEA8', color: '#DC2626' },
];

export const BOOKING_STATUSES = [
  'Quoted', 'Confirmed', 'PNR Created',
  'Payment Received', 'Ticketed', 'Dispatched',
  'Completed', 'Cancelled', 'Refunded'
];

export const TICKETING_STATUSES = [
  'Pending Ticketing',
  'Pending Payment',
  'Payment Confirmed',
  'Ready to Issue',
  'Ticketing in Progress',
  'Ticketed',
  'Failed',
  'Manual Review'
];

export const PAYMENT_STATUSES = [
  'Payment Pending',
  'Payment Processing',
  'Payment Successful',
  'Payment Failed',
  'Payment Cancelled',
  'Partially Paid',
  'Refund Pending',
  'Refunded',
  'Partially Refunded',
  'Chargeback'
];

export const LEAD_STATUSES = [
  'New', 'Contacted', 'Qualified',
  'Quote Sent', 'Negotiating', 'Won',
  'Lost', 'Wasted'
];

export const DOCUMENT_TYPES = [
  'Passport', 'E-Ticket PDF', 'Official Itinerary',
  'Travel Insurance', 'Visa Copy', 'Hotel Voucher',
  'E-Sign Authorization'
];

export const PACKAGES = [];

export const RELOCATION_SERVICES = [
  { id: 'travel_insurance', name: 'Comprehensive Travel Insurance' },
  { id: 'airport_transfer', name: 'Airport Transfer Service' },
  { id: 'hotel_booking', name: 'Hotel Booking Assistance' },
  { id: 'visa_assistance', name: 'Destination Visa Assistance' },
  { id: 'forex', name: 'Foreign Exchange Guidance' },
  { id: 'sim_card', name: 'International SIM Card' },
  { id: 'lounge', name: 'Airport Lounge Access' },
  { id: 'fast_track', name: 'Fast Track Security Pass' },
  { id: 'chauffeur', name: 'Chauffeur / Limo Service' },
  { id: 'concierge', name: 'Destination Concierge Service' },
];

export const AGENTS = [];

export const MOCK_LEADS = [];

export const MOCK_CLIENTS = [];

export const MOCK_CONSULTATIONS = [];

export const MOCK_PAYMENTS = [];

export const MOCK_DOCUMENTS = [];

export const EMAIL_TEMPLATES = [
  {
    id: 'et1',
    name: 'Flight Booking Confirmation',
    subject: 'Your Flight Booking Confirmation with WowMyFlight - PNR: {pnr}',
    body: `Dear {clientName},

Thank you for booking with WowMyFlight Air Concierge. Your flight reservation is confirmed.

Booking Details:
- PNR / Booking Ref: {pnr}
- Route: {route}
- Departure: {departureTime}
- Airline: {airline}

Your e-ticket and boarding pass instructions are attached.

For 24/7 flight concierge assistance, reply to this email or call our priority desk.

Safe travels,
Air Concierge Team
WowMyFlight
concierge@wowmyflight.com`
  },
  {
    id: 'et2',
    name: 'Flight Quote & Itinerary Proposal',
    subject: 'Exclusive Flight Itinerary & Quote {quoteId} for {route}',
    body: `Dear {clientName},

We have customized the optimal flight options for your journey: {route}.

Quote Reference: {quoteId}
Selected Cabin: {cabinClass}
Total Fare: {amount}

Please review your flight schedule and confirm your booking here:
{bookingLink}

Best Regards,
Flight Sales Desk
WowMyFlight`
  },
  {
    id: 'et3',
    name: 'Flight Invoice & Payment Link',
    subject: 'Invoice {invoiceId} for Flight Reservation {pnr}',
    body: `Dear {clientName},

Thank you for choosing WowMyFlight. Please find attached Invoice {invoiceId} for your flight booking.
Total Amount: {amount}

Secure payment link:
{paymentLink}

Best Regards,
Finance & Ticketing Desk
WowMyFlight`
  }
];

export const WHATSAPP_TEMPLATES = [
  {
    id: 'wt1',
    name: 'Flight Quote Notification',
    body: `✈️ Hello {clientName}, greetings from WowMyFlight Air Concierge!
We have prepared your customized flight options for {route}.
Total Fare: {amount}.
Click to review & book: {bookingLink}`
  },
  {
    id: 'wt2',
    name: 'Flight Ticket & PNR Issuance',
    body: `🎉 Your flight ticket is confirmed!
PNR: {pnr} | Airline: {airline}
Route: {route}
Departure: {departureTime}
Have a wonderful trip with WowMyFlight!`
  },
  {
    id: 'wt3',
    name: 'Flight Schedule / Gate Alert',
    body: `✈️ Flight Alert for {pnr}:
Your flight {flightNo} departing {route} is on schedule.
Please check in online: {checkinLink}`
  }
];

export const ROLES = [
  { id: 'admin', name: 'Super Administrator', description: 'Full access to flight CRM, live revenue, staff management, and system configuration.' },
  { id: 'flight_agent', name: 'Flight Agent', description: 'Handle flight leads, quote generation, ticketing, and traveler communication.' },
  { id: 'finance', name: 'Finance Desk', description: 'Manage airline invoices, payment links, merchant settlements, and refunds.' },
  { id: 'operations', name: 'Operations & Concierge', description: 'Oversee live bookings, PNR status, traveler documents, and queue management.' }
];

export const NOTIFICATIONS = [];

export const MOCK_FLIGHT_REQUESTS = [];

export const MOCK_FLIGHT_OPTIONS = [];

export const MOCK_QUOTES = [];


export const MOCK_BOOKINGS = [];

export const MOCK_PAYMENTS_PHASE5 = [];

export const MOCK_REFUNDS_PHASE5 = [];

export const MOCK_PAYMENT_LINKS_PHASE5 = [];


// Truncate table data to 5 records for better UI visibility as requested
[
  MOCK_LEADS,
  MOCK_CLIENTS,
  MOCK_CONSULTATIONS,
  MOCK_PAYMENTS,
  MOCK_FLIGHT_REQUESTS,
  MOCK_QUOTES,
  MOCK_BOOKINGS,
  MOCK_PAYMENTS_PHASE5,
  MOCK_REFUNDS_PHASE5,
  MOCK_PAYMENT_LINKS_PHASE5,
  NOTIFICATIONS
].forEach(arr => {
  if (Array.isArray(arr) && arr.length > 5) {
    arr.length = 5;
  }
});
