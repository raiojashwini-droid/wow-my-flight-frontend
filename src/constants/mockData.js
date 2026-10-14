// Cabin classes for flight bookings
export const SERVICES = [
  { id: 'economy', name: 'Economy Class', category: 'Economy', basePrice: 500 },
  { id: 'premium_eco', name: 'Premium Economy', category: 'Economy', basePrice: 900 },
  { id: 'business', name: 'Business Class', category: 'Business', basePrice: 3500 },
  { id: 'first', name: 'First Class', category: 'First', basePrice: 8000 },
  { id: 'charter', name: 'Private Charter', category: 'Charter', basePrice: 25000 },
];

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

export const PACKAGES = [
  {
    id: 'flight_only',
    name: 'Flight Only',
    description: 'Best airfare found from our GDS system with competitive markup pricing.',
    includes: [
      'GDS Fare Search (Sabre/Amadeus)',
      'Best Price Guarantee',
      'E-Ticket Issuance',
      'Official Itinerary PDF',
      'PNR Flight Tracking',
      'Schedule Change Alerts',
      'Email & WhatsApp Notifications',
    ]
  },
  {
    id: 'full_package',
    name: 'Full Travel Package',
    description: 'Complete end-to-end travel arrangement including flights, hotel, and transfers.',
    includes: [
      'All Flight Only features',
      'Hotel Booking (Partner Hotels)',
      'Airport Transfer (Private Car)',
      'Travel Insurance',
      'Priority Check-in Assistance',
      'Airport Lounge Access',
      'Dedicated Travel Consultant',
    ]
  }
];

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

export const AGENTS = [
  {
    id: 'usr-super-admin',
    name: 'Wael Madi (CEO)',
    email: 'wael.madi@wowmyflight.com',
    phone: '+18333955554',
    role: 'super_admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    status: 'active',
    department: 'Executive',
    languages: ['English', 'Arabic'],
    nationalities: ['American'],
    casesCount: 0,
    conversionRate: 0,
    revenueGenerated: 0,
  },
  {
    id: 'usr-admin',
    name: 'Alex Turner (GM)',
    email: 'admin@wowmyflight.com',
    phone: '+18503329680',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    status: 'active',
    department: 'Management',
    languages: ['English'],
    nationalities: ['American'],
    casesCount: 0,
    conversionRate: 0,
    revenueGenerated: 0,
  },
  {
    id: 'usr-consultant',
    name: 'Sofia Rodriguez (Sales)',
    email: 'sales@wowmyflight.com',
    phone: '+18503329681',
    role: 'consultant',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    status: 'active',
    department: 'Sales',
    languages: ['English', 'Spanish'],
    nationalities: ['American'],
    casesCount: 0,
    conversionRate: 0,
    revenueGenerated: 0,
  }
];

export const MOCK_LEADS = [
  {
    id: 'LD1001',
    firstName: 'Amelia',
    lastName: 'Watson',
    email: 'amelia.w@example.com',
    phone: '+44 7911 123456',
    nationality: 'British',
    preferredLanguage: 'English',
    serviceId: 'business',
    applicantsCount: 1, // Main Passenger
    status: 'New Lead',
    origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Business',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1',
    source: 'Google Ads',
    createdDate: '2026-06-17T09:30:00Z',
    qualificationData: {
      travelPurpose: 'Business Trip',
      budget: '$4,000',
      flexibility: '±3 Days'
    },
    notes: 'Inquired about Business Class to JFK. Prefers direct flight.',
    timeline: [
      { date: '2026-06-17T09:30:00Z', event: 'Lead Created via Google Ads form', user: 'System' },
      { date: '2026-06-17T09:31:00Z', event: 'Automated WhatsApp response sent', user: 'System' }
    ]
  },
  {
    id: 'LD1002',
    firstName: 'Tariq',
    lastName: 'Mahmood',
    email: 'tariq.m@example.com',
    phone: '+971 52 444 8899',
    nationality: 'Pakistani',
    preferredLanguage: 'Arabic',
    serviceId: 'business',
    applicantsCount: 3, // 3 passengers
    status: 'Under Consultation',
    origin: 'DXB',
    destination: 'CDG',
    travelDate: '2026-09-10',
    passengers: 3,
    cabinClass: 'Business',
    tripType: 'Round Trip',
    leadTemperature: 'WARM',
    priority: 'Medium',
    assignedConsultantId: 'c1',
    source: 'Facebook Ads',
    createdDate: '2026-06-16T11:20:00Z',
    qualificationData: {
      travelPurpose: 'Family Vacation',
      budget: '$12,000',
      flexibility: 'Fixed Dates'
    },
    notes: 'Family of 3 requesting Business Class flights DXB-CDG with seat preferences.',
    timeline: [
      { date: '2026-06-16T11:20:00Z', event: 'Lead Created', user: 'System' },
      { date: '2026-06-16T14:30:00Z', event: 'Assigned to Agent Lucas Gomez', user: 'System' },
      { date: '2026-06-17T10:00:00Z', event: 'Flight Request submitted to GDS Desk', user: 'Lucas Gomez' }
    ]
  },
  {
    id: 'LD1003',
    firstName: 'Chloe',
    lastName: 'Dupont',
    email: 'chloe.dupont@example.com',
    phone: '+33 6 1234 5678',
    nationality: 'French',
    preferredLanguage: 'English',
    serviceId: 'economy',
    applicantsCount: 1,
    status: 'Processing',
    origin: 'CDG',
    destination: 'MAD',
    travelDate: '2026-07-20',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'Round Trip',
    leadTemperature: 'COLD',
    priority: 'Low',
    assignedConsultantId: 'c1',
    source: 'Website Traffic',
    createdDate: '2026-06-15T15:40:00Z',
    qualificationData: {
      travelPurpose: 'Student Travel',
      budget: '$600',
      flexibility: 'Flexible'
    },
    notes: 'Economy round trip CDG to MAD. Student discount requested.',
    timeline: [
      { date: '2026-06-15T15:40:00Z', event: 'Lead Created via website form', user: 'System' },
      { date: '2026-06-16T09:00:00Z', event: 'Quote sent for Air France option', user: 'Elena Rostova' }
    ]
  },
  {
    id: 'LD1004',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'm.vance@example.com',
    phone: '+1 415 555 2671',
    nationality: 'American',
    preferredLanguage: 'English',
    serviceId: 'property',
    applicantsCount: 2,
    status: 'Waiting for Payment',
    origin: 'SFO',
    destination: 'AGP',
    travelDate: '2026-08-05',
    passengers: 2,
    cabinClass: 'First',
    tripType: 'Round Trip',
    leadTemperature: 'VIP',
    priority: 'High',
    assignedConsultantId: 'c5',
    source: 'Instagram Ads',
    createdDate: '2026-06-14T08:15:00Z',
    qualificationData: {
      budget: '€550,000',
      propertyLocation: 'Malaga'
    },
    notes: 'Wants Golden Visa. Selected Premium Package for main applicant + spouse. Waiting for deposit.',
    timeline: [
      { date: '2026-06-14T08:15:00Z', event: 'Lead Created', user: 'System' },
      { date: '2026-06-15T11:00:00Z', event: 'Consultation Completed. Selected Premium Package', user: 'David Vance' },
      { date: '2026-06-15T11:15:00Z', event: 'Invoice INV-2026-004 generated', user: 'Finance Bot' }
    ]
  },
  {
    id: 'LD1005',
    firstName: 'Ahmed',
    lastName: 'Al-Mansoori',
    email: 'ahmed.mansoori@example.ae',
    phone: '+971 50 777 1122',
    nationality: 'Emirati',
    preferredLanguage: 'Arabic',
    serviceId: 'self_employed',
    applicantsCount: 4,
    status: 'New Lead',
    origin: 'DXB',
    destination: 'BCN',
    travelDate: '2026-10-15',
    passengers: 4,
    cabinClass: 'Economy',
    tripType: 'Round Trip',
    leadTemperature: 'PRICE SENSITIVE',
    priority: 'Medium',
    assignedConsultantId: 'c3',
    source: 'WhatsApp Click Ads',
    createdDate: '2026-06-18T10:00:00Z',
    qualificationData: {
      businessSector: 'E-commerce logistics setup',
      investmentCapital: '€120,000'
    },
    notes: 'Very hot lead. High budget, wants business setup in Barcelona.',
    timeline: [
      { date: '2026-06-18T10:00:00Z', event: 'Lead created from WhatsApp Ads click', user: 'System' }
    ]
  },
  // Adding more mock leads to reach 20
  { id: 'LD1006', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '+1 555 123 4567', nationality: 'American', preferredLanguage: 'English', serviceId: 'dnv', applicantsCount: 1, status: 'Cold Lead', origin: 'JNB',
    destination: 'MAD',
    travelDate: '2026-11-01',
    passengers: 2,
    cabinClass: 'Business',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c5', source: 'Google Ads', createdDate: '2026-06-01T12:00:00Z', notes: 'No response to follow up emails.', timeline: [] },
  { id: 'LD1007', firstName: 'Maria', lastName: 'Ivanova', email: 'maria.i@example.ru', phone: '+7 901 222 3344', nationality: 'Russian', preferredLanguage: 'English', serviceId: 'nlv', applicantsCount: 2, status: 'Lost Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'Facebook Ads', createdDate: '2026-05-20T10:30:00Z', notes: 'Denied. Insufficient passive income statement.', timeline: [] },
  { id: 'LD1008', firstName: 'Yuki', lastName: 'Tanaka', email: 'y.tanaka@example.jp', phone: '+81 90 9999 8888', nationality: 'Japanese', preferredLanguage: 'English', serviceId: 'study', applicantsCount: 1, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'Website Traffic', createdDate: '2026-06-18T06:45:00Z', notes: 'Interested in Spanish language school visa.', timeline: [] },
  { id: 'LD1009', firstName: 'Fatima', lastName: 'Hassan', email: 'fatima.h@example.com', phone: '+971 52 333 4422', nationality: 'Egyptian', preferredLanguage: 'Arabic', serviceId: 'family', applicantsCount: 3, status: 'Under Consultation', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c2', source: 'WhatsApp Click Ads', createdDate: '2026-06-16T16:20:00Z', notes: 'Spouse of a Spanish resident. Wants family reunion assistance.', timeline: [] },
  { id: 'LD1010', firstName: 'William', lastName: 'Smith', email: 'w.smith@example.ca', phone: '+1 604 111 2222', nationality: 'Canadian', preferredLanguage: 'English', serviceId: 'dnv', applicantsCount: 1, status: 'Documents Pending', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c5', source: 'Organic Social Media Content', createdDate: '2026-06-10T14:00:00Z', notes: 'Needs FBI background check with Apostille.', timeline: [] },
  { id: 'LD1011', firstName: 'Rajesh', lastName: 'Kumar', email: 'r.kumar@example.in', phone: '+91 98765 43210', nationality: 'Indian', preferredLanguage: 'English', serviceId: 'self_employed', applicantsCount: 2, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c2', source: 'Google Ads', createdDate: '2026-06-18T08:15:00Z', notes: 'Consultant entrepreneur establishing SaaS office in Valencia.', timeline: [] },
  { id: 'LD1012', firstName: 'Carlos', lastName: 'Silva', email: 'carlos.silva@example.br', phone: '+55 11 98888 7777', nationality: 'Brazilian', preferredLanguage: 'English', serviceId: 'property', applicantsCount: 1, status: 'Under Consultation', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'Instagram DM', createdDate: '2026-06-17T11:45:00Z', notes: 'Buying flat in Madrid for Golden Visa.', timeline: [] },
  { id: 'LD1013', firstName: 'Zara', lastName: 'Ali', email: 'zara.ali@example.ae', phone: '+971 56 123 7890', nationality: 'Jordanian', preferredLanguage: 'Arabic', serviceId: 'tourism', applicantsCount: 2, status: 'Waiting for Payment', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c2', source: 'Website Forms', createdDate: '2026-06-15T09:12:00Z', notes: 'Schengen tourism visa guidance. Straightforward profile, no packages needed.', timeline: [] },
  { id: 'LD1014', firstName: 'Oliver', lastName: 'Brown', email: 'oliver.brown@example.co.uk', phone: '+44 7711 445566', nationality: 'British', preferredLanguage: 'English', serviceId: 'dnv', applicantsCount: 3, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c5', source: 'Google Ads', createdDate: '2026-06-18T11:00:00Z', notes: 'Applying for DNV with spouse and child.', timeline: [] },
  { id: 'LD1015', firstName: 'Sophia', lastName: 'Miller', email: 's.miller@example.com', phone: '+1 202 555 0192', nationality: 'American', preferredLanguage: 'English', serviceId: 'nlv', applicantsCount: 1, status: 'Under Process', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'TikTok Ads', createdDate: '2026-06-05T10:00:00Z', notes: 'NLV filed at consulate. Waiting for response.', timeline: [] },
  { id: 'LD1016', firstName: 'Hassan', lastName: 'El-Khoury', email: 'hassan.k@example.lb', phone: '+961 3 123 456', nationality: 'Lebanese', preferredLanguage: 'Arabic', serviceId: 'property', applicantsCount: 4, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c3', source: 'Telegram', createdDate: '2026-06-18T05:30:00Z', notes: 'Family looking to relocate, buying a villa in Marbella.', timeline: [] },
  { id: 'LD1017', firstName: 'Li', lastName: 'Wei', email: 'li.wei@example.cn', phone: '+86 139 0101 2345', nationality: 'Chinese', preferredLanguage: 'English', serviceId: 'study', applicantsCount: 1, status: 'Documents Pending', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'WeChat', createdDate: '2026-06-12T13:45:00Z', notes: 'Awaiting Spanish language center payment receipt.', timeline: [] },
  { id: 'LD1018', firstName: 'Emma', lastName: 'Nielsen', email: 'emma.n@example.dk', phone: '+45 30 40 50 60', nationality: 'Danish', preferredLanguage: 'English', serviceId: 'dnv', applicantsCount: 1, status: 'Under Consultation', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'Website Traffic', createdDate: '2026-06-17T15:20:00Z', notes: 'Software contractor, fully remote. Pre-qualified.', timeline: [] },
  { id: 'LD1019', firstName: 'Zuri', lastName: 'Adebayor', email: 'zuri.ade@example.ng', phone: '+234 803 111 2222', nationality: 'Nigerian', preferredLanguage: 'English', serviceId: 'study', applicantsCount: 1, status: 'Cold Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'Facebook Comments', createdDate: '2026-05-25T08:00:00Z', notes: 'Non-responsive to email scheduling.', timeline: [] },
  { id: 'LD1020', firstName: 'Nour', lastName: 'Dagher', email: 'nour.dagher@example.com', phone: '+971 54 443 2190', nationality: 'Syrian', preferredLanguage: 'Arabic', serviceId: 'family', applicantsCount: 2, status: 'Under Process', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c2', source: 'WhatsApp', createdDate: '2026-06-08T09:30:00Z', notes: 'Spouse residency renewal and child entry visa.', timeline: [] },
  { id: 'LD1021', firstName: 'Liam', lastName: "O'Connor", email: 'liam.oc@example.ie', phone: '+353 1 496 0123', nationality: 'Irish', preferredLanguage: 'English', serviceId: 'study', applicantsCount: 1, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'WeChat', createdDate: '2026-06-19T10:00:00Z', notes: 'Undergraduate student applying for Spain Study Visa.', timeline: [] },
  { id: 'LD1022', firstName: 'Noah', lastName: 'Weber', email: 'noah.w@example.de', phone: '+49 89 2019 8273', nationality: 'German', preferredLanguage: 'English', serviceId: 'dnv', applicantsCount: 2, status: 'Under Consultation', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c5', source: 'Google Ads', createdDate: '2026-06-19T11:00:00Z', notes: 'Remote consultant, DNV eligibility review.', timeline: [] },
  { id: 'LD1023', firstName: 'Isabella', lastName: 'Rossi', email: 'isabella.rossi@example.it', phone: '+39 02 8812 3456', nationality: 'Italian', preferredLanguage: 'English', serviceId: 'family', applicantsCount: 3, status: 'Processing', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'Facebook Ads', createdDate: '2026-06-19T12:00:00Z', notes: 'Husband is Spanish citizen. Family reunion visa.', timeline: [] },
  { id: 'LD1024', firstName: 'Lucas', lastName: 'Dubois', email: 'lucas.d@example.fr', phone: '+33 1 4720 9811', nationality: 'French', preferredLanguage: 'English', serviceId: 'self_employed', applicantsCount: 1, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c3', source: 'Website Forms', createdDate: '2026-06-19T13:00:00Z', notes: 'Autonomo registration in Barcelona.', timeline: [] },
  { id: 'LD1025', firstName: 'Emma', lastName: 'Novak', email: 'emma.n@example.pl', phone: '+48 22 555 0122', nationality: 'Polish', preferredLanguage: 'English', serviceId: 'nlv', applicantsCount: 1, status: 'Cold Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'Instagram Ads', createdDate: '2026-06-19T14:00:00Z', notes: 'Passive income review.', timeline: [] },
  { id: 'LD1026', firstName: 'Sophia', lastName: 'Lindqvist', email: 'sophia.l@example.se', phone: '+46 8 123 4567', nationality: 'Swedish', preferredLanguage: 'English', serviceId: 'dnv', applicantsCount: 2, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c5', source: 'WhatsApp', createdDate: '2026-06-19T15:00:00Z', notes: 'Tech company employee DNV.', timeline: [] },
  { id: 'LD1027', firstName: 'Alexander', lastName: 'Pavlov', email: 'alex.p@example.ru', phone: '+7 495 111 2233', nationality: 'Russian', preferredLanguage: 'English', serviceId: 'property', applicantsCount: 4, status: 'Under Consultation', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'Telegram', createdDate: '2026-06-19T16:00:00Z', notes: 'Golden Visa investment in Alicante.', timeline: [] },
  { id: 'LD1028', firstName: 'Daniel', lastName: 'Kim', email: 'daniel.k@example.kr', phone: '+82 2 999 8888', nationality: 'Korean', preferredLanguage: 'English', serviceId: 'study', applicantsCount: 1, status: 'Waiting for Payment', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c4', source: 'WeChat', createdDate: '2026-06-19T17:00:00Z', notes: 'Awaiting language school deposit confirmation.', timeline: [] },
  { id: 'LD1029', firstName: 'Gabriel', lastName: 'Martinez', email: 'gabriel.m@example.mx', phone: '+52 55 1234 5678', nationality: 'Mexican', preferredLanguage: 'Spanish', serviceId: 'self_employed', applicantsCount: 2, status: 'New Lead', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'Website Traffic', createdDate: '2026-06-19T18:00:00Z', notes: 'Wants to start a consultancy in Madrid.', timeline: [] },
  { id: 'LD1030', firstName: 'Mei', lastName: 'Chen', email: 'mei.chen@example.cn', phone: '+86 21 6666 8888', nationality: 'Chinese', preferredLanguage: 'English', serviceId: 'nlv', applicantsCount: 1, status: 'Under Process', origin: 'LHR',
    destination: 'JFK',
    travelDate: '2026-08-25',
    passengers: 1,
    cabinClass: 'Economy',
    tripType: 'One Way',
    leadTemperature: 'HOT',
    priority: 'High',
    assignedConsultantId: 'c1', source: 'WhatsApp Click Ads', createdDate: '2026-06-19T19:00:00Z', notes: 'NLV visa file submitted.', timeline: [] }
];

export const MOCK_CLIENTS = [
  {
    id: 'CL-101',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'm.vance@example.com',
    phone: '+1 415 555 2671',
    nationality: 'American',
    preferredLanguage: 'English',
    serviceId: 'business',
    packageId: 'premium',
    applicantsCount: 2,
    assignedConsultantId: 'c5',
    status: 'Confirmed',
    visaStatus: 'Ticketed',
    onboardingDate: '2026-06-15T11:00:00Z',
    profileSummary: 'VIP Business Class Traveler. Frequent flyer on JFK to DXB route. Enrolled in WowMyFlight Premium Concierge.'
  },
  {
    id: 'CL-102',
    firstName: 'Amina',
    lastName: 'Al-Mansoor',
    email: 'amina.m@example.ae',
    phone: '+971 50 123 4567',
    nationality: 'Emirati',
    preferredLanguage: 'Arabic',
    serviceId: 'first',
    packageId: 'full_process',
    applicantsCount: 3,
    assignedConsultantId: 'c4',
    status: 'Confirmed',
    visaStatus: 'Ticketed',
    onboardingDate: '2026-06-16T09:00:00Z',
    profileSummary: 'First Class Family Booking from Dubai (DXB) to London Heathrow (LHR) on British Airways.'
  },
  {
    id: 'CL-103',
    firstName: 'Liam',
    lastName: "O'Connor",
    email: 'liam.oc@example.ie',
    phone: '+353 1 496 0123',
    nationality: 'Irish',
    preferredLanguage: 'English',
    serviceId: 'economy',
    packageId: 'full_process',
    applicantsCount: 1,
    assignedConsultantId: 'c1',
    status: 'Under Process',
    visaStatus: 'Pending Payment',
    onboardingDate: '2026-06-05T10:00:00Z',
    profileSummary: 'Corporate flight booking from Dublin to New York on Qatar Airways. Awaiting invoice clearance.'
  },
  {
    id: 'CL-104',
    firstName: 'Tim',
    lastName: 'Cook',
    email: 'tim.c@example.com',
    phone: '+1 408 996 1010',
    nationality: 'American',
    preferredLanguage: 'English',
    serviceId: 'business',
    packageId: 'premium',
    applicantsCount: 1,
    assignedConsultantId: 'c2',
    status: 'New Lead',
    visaStatus: 'Quote Sent',
    onboardingDate: '2026-06-19T10:00:00Z',
    profileSummary: 'Executive flight inquiry for JFK to DXB round-trip. Budget $3,450.'
  }
];

export const MOCK_CONSULTATIONS = [
  {
    id: 'CS-301',
    leadId: 'LD1001',
    clientName: 'Marcus Vance',
    meetingDate: '2026-10-14',
    meetingTime: '15:00',
    durationMinutes: 45,
    assignedConsultantId: 'c5',
    status: 'Scheduled',
    meetingLink: 'https://meet.jit.si/WowMyFlight-VIP-Flight',
    notes: 'Discuss seat allocation and baggage allowance for Emirates EK-201.',
    recordingUrl: '',
    outcome: null
  },
  {
    id: 'CS-302',
    leadId: 'LD1002',
    clientName: 'Dr. Rahul Mehta',
    meetingDate: '2026-10-15',
    meetingTime: '11:00',
    durationMinutes: 30,
    assignedConsultantId: 'c4',
    status: 'Completed',
    meetingLink: 'https://meet.jit.si/WowMyFlight-Group-Quote',
    notes: 'Group flight booking from Delhi to London for medical symposium.',
    recordingUrl: 'https://storage.googleapis.com/wmf-recordings/CS302_call.mp3',
    outcome: {
      clientRequestedService: 'Group Booking',
      aaaRecommendedService: 'Business Class Group Tier',
      notes: 'Sent tailored proposal with British Airways multi-city options.'
    }
  }
];

export const MOCK_PAYMENTS = [
  {
    id: 'INV-4401',
    clientId: 'CL-101',
    clientName: 'Marcus Vance',
    serviceId: 'business',
    packageId: 'premium',
    amount: 7700,
    discount: 0,
    totalPaid: 7700,
    status: 'Paid',
    billingDate: '2026-10-10',
    dueDate: '2026-10-24',
    paymentMethod: 'Stripe Card',
    transactionId: 'TXN-ST-991201'
  },
  {
    id: 'INV-4402',
    clientId: 'CL-102',
    clientName: 'Amina Al-Mansoor',
    serviceId: 'first',
    packageId: 'premium',
    amount: 6250,
    discount: 0,
    totalPaid: 6250,
    status: 'Paid',
    billingDate: '2026-10-11',
    dueDate: '2026-10-25',
    paymentMethod: 'Tamara Buy Now Pay Later',
    transactionId: 'TXN-TM-441203'
  },
  {
    id: 'INV-4403',
    clientId: 'CL-103',
    clientName: "Liam O'Connor",
    serviceId: 'economy',
    packageId: 'full_process',
    amount: 2890,
    discount: 100,
    totalPaid: 0,
    status: 'Pending',
    billingDate: '2026-10-12',
    dueDate: '2026-10-26',
    paymentMethod: 'Wire Transfer',
    transactionId: 'TXN-WIRE-PENDING'
  }
];

export const MOCK_DOCUMENTS = [
  {
    id: 'DOC-501',
    clientId: 'CL-101',
    clientName: 'Marcus Vance',
    category: 'Passport',
    fileName: 'US_Passport_MarcusVance.pdf',
    fileSize: '2.4 MB',
    uploadedDate: '2026-06-15T10:00:00Z',
    status: 'Approved',
    comment: 'Valid until 2034. International flights approved.',
    fileUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800'
  },
  {
    id: 'DOC-502',
    clientId: 'CL-102',
    clientName: 'Amina Al-Mansoor',
    category: 'Visa',
    fileName: 'Schengen_Visa_Amina.pdf',
    fileSize: '3.1 MB',
    uploadedDate: '2026-06-16T11:30:00Z',
    status: 'Approved',
    comment: 'Multiple entry Schengen visa valid through 2027.',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800'
  },
  {
    id: 'DOC-503',
    clientId: 'CL-103',
    clientName: 'Liam O\'Connor',
    category: 'Passport',
    fileName: 'Irish_Passport_Liam.pdf',
    fileSize: '1.8 MB',
    uploadedDate: '2026-06-17T09:15:00Z',
    status: 'Pending Review',
    comment: 'Bio page uploaded, pending agent verification.',
    fileUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800'
  },
  {
    id: 'DOC-504',
    clientId: 'CL-104',
    clientName: 'Tim Cook',
    category: 'Passport',
    fileName: 'Passport_TimCook.pdf',
    fileSize: '2.0 MB',
    uploadedDate: '2026-06-18T14:20:00Z',
    status: 'Approved',
    comment: 'VIP Passenger passport validated.',
    fileUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800'
  }
];

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

export const NOTIFICATIONS = [
  { id: 'n1', title: 'New Flight Lead', message: 'Tim Cook requested JFK → DXB First Class flight quote.', type: 'lead', time: '5m ago', read: false },
  { id: 'n2', title: 'Payment Confirmed', message: 'Invoice INV-4401 for Marcus Vance ($12,450.00) paid via Stripe.', type: 'payment', time: '45m ago', read: false },
  { id: 'n3', title: 'Ticket Issued', message: 'Booking TP-37ENVS for Amina Al-Mansoor confirmed (DXB → LHR).', type: 'booking', time: '2h ago', read: false },
  { id: 'n4', title: 'Document Verified', message: 'US_Passport_MarcusVance.pdf verified and approved.', type: 'document', time: '3h ago', read: true },
];

export const MOCK_FLIGHT_REQUESTS = [
  {
    id: 'FR1001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 555 123 4567',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'LHR',
    destinationCity: 'London',
    travelDate: '2026-08-25',
    returnDate: '2026-09-05',
    passengers: 2,
    adults: 2,
    children: 0,
    infants: 0,
    cabinClass: 'Economy',
    tripType: 'Round Trip',
    priority: 'High',
    status: 'QUOTE_PENDING',
    assignedAgentId: 'c1'
  },
  {
    id: 'FR1002',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.c@example.com',
    phone: '+1 555 987 6543',
    origin: 'LAX',
    originCity: 'Los Angeles',
    destination: 'DXB',
    destinationCity: 'Dubai',
    travelDate: '2026-10-12',
    returnDate: '2026-10-25',
    passengers: 1,
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'Business',
    tripType: 'Round Trip',
    priority: 'Normal',
    status: 'NEW',
    assignedAgentId: 'c2'
  }
];

export const MOCK_FLIGHT_OPTIONS = [
  {
    id: 'FLOPT1',
    requestId: 'FR1001',
    airline: 'British Airways',
    flightNumber: 'BA112',
    departure: '2026-08-25 18:30',
    arrival: '2026-08-26 06:30',
    duration: '7h 00m',
    stops: 'Non-stop',
    cabin: 'Economy',
    baggage: '1x 23kg',
    netFare: 850,
    taxes: 120,
    markup: 15,
    sellingPrice: 1115.5
  }
];

export const MOCK_QUOTES = [
  {
    id: 'QT2001',
    requestId: 'FR1001',
    customerName: 'John Smith',
    route: 'JFK - LHR',
    travelDate: '2026-08-25',
    sellingPrice: 1115.5,
    profit: 145.5,
    status: 'SENT',
    createdBy: 'c1',
    createdDate: '2026-06-18'
  }
];


export const MOCK_BOOKINGS = [
  {
    id: 'BK-10231',
    bookingId: 'BK-10231',
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    customerPhone: '+1 555 123 4567',
    route: 'JFK → LHR',
    origin: 'JFK',
    destination: 'LHR',
    travelDate: '2026-08-25',
    returnDate: '2026-09-05',
    passengers: 2,
    cabinClass: 'Economy',
    tripType: 'Round Trip',
    pnr: 'ABC123',
    airline: 'British Airways',
    flightSegments: [
      { flightNo: 'BA112', origin: 'JFK', dest: 'LHR', dep: '2026-08-25 18:30', arr: '2026-08-26 06:30', seat: '12A' },
      { flightNo: 'BA113', origin: 'LHR', dest: 'JFK', dep: '2026-09-05 10:00', arr: '2026-09-05 13:00', seat: '14C' }
    ],
    netFare: 850,
    taxes: 120,
    serviceFee: 50,
    markup: 15,
    discount: 0,
    sellingPrice: 1173, // (850+120+50) = 1020 + (1020 * 0.15)
    profit: 203, // 50 + 153
    paymentStatus: 'PAID',
    bookingStatus: 'TICKETED',
    ticketStatus: 'ISSUED',
    eTicket: '125-9988776655',
    assignedAgent: 'c1',
    createdAt: '2026-06-20',
    timeline: [
      { date: '2026-06-18 10:00', event: 'Quote Accepted', user: 'System' },
      { date: '2026-06-18 10:15', event: 'Payment Link Sent', user: 'c1' },
      { date: '2026-06-19 14:30', event: 'Payment Received ($1173.00)', user: 'System' },
      { date: '2026-06-20 09:00', event: 'Ticket Issued', user: 'c1' }
    ]
  },
  {
    id: 'BK-10232',
    bookingId: 'BK-10232',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah.c@example.com',
    customerPhone: '+1 555 987 6543',
    route: 'LAX → DXB',
    origin: 'LAX',
    destination: 'DXB',
    travelDate: '2026-10-12',
    returnDate: '2026-10-25',
    passengers: 1,
    cabinClass: 'Business',
    tripType: 'Round Trip',
    pnr: 'XYZ987',
    airline: 'Emirates',
    flightSegments: [
      { flightNo: 'EK216', origin: 'LAX', dest: 'DXB', dep: '2026-10-12 16:40', arr: '2026-10-13 19:30', seat: '4A' }
    ],
    netFare: 4200,
    taxes: 450,
    serviceFee: 100,
    markup: 10,
    discount: 0,
    sellingPrice: 5225,
    profit: 575,
    paymentStatus: 'PENDING',
    bookingStatus: 'QUOTE_ACCEPTED',
    ticketStatus: 'NOT_ISSUED',
    eTicket: '',
    assignedAgent: 'c2',
    createdAt: '2026-08-01',
    timeline: [
      { date: '2026-08-01 11:00', event: 'Quote Accepted', user: 'System' },
      { date: '2026-08-01 11:30', event: 'Booking Created & Payment Pending', user: 'c2' }
    ]
  }
];

export const MOCK_PAYMENTS_PHASE5 = [
  {
    id: 'PAY-1001',
    bookingId: 'BK-10231',
    customerName: 'John Smith',
    pnr: 'ABC123',
    amount: 1173,
    method: 'CARD',
    status: 'PAID',
    transactionId: 'TXN-2026-10482',
    date: '2026-06-19 14:30',
    assignedAgent: 'c1'
  },
  {
    id: 'PAY-1002',
    bookingId: 'BK-10232',
    customerName: 'Sarah Connor',
    pnr: 'XYZ987',
    amount: 5225,
    method: 'PAYMENT_LINK',
    status: 'PENDING',
    transactionId: '',
    date: '2026-08-01 11:30',
    assignedAgent: 'c2'
  }
];

export const MOCK_REFUNDS_PHASE5 = [
  {
    id: 'REF-5001',
    paymentId: 'PAY-1001',
    bookingId: 'BK-10231',
    customerName: 'John Smith',
    originalAmount: 1173,
    refundAmount: 500,
    reason: 'Flight Cancellation',
    status: 'PROCESSING',
    requestedDate: '2026-08-02 09:00',
    processedDate: ''
  }
];

export const MOCK_PAYMENT_LINKS_PHASE5 = [
  {
    id: 'LNK-8F29K2',
    bookingId: 'BK-10232',
    customerName: 'Sarah Connor',
    amount: 5225,
    token: 'AAA-PAY-8F29K2',
    status: 'ACTIVE',
    expiresAt: '2026-08-03 11:30',
    createdAt: '2026-08-02 11:30'
  }
];


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
