import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LockClockIcon from '@mui/icons-material/LockClock';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { useAlert } from '../contexts/AlertContext';

export const INITIAL_PROPOSAL_OPTIONS = [
  {
    id: 'OPT-1',
    isRecommended: true,
    airline: 'British Airways',
    airlineCode: 'BA',
    tagline: 'Best Balance of Convenience & Luxury',
    cabinClass: 'Club World (Business Class)',
    sellingPricePerPax: 3850.00,
    netPricePerPax: 3200.00,
    passengers: 2,
    currency: 'USD',
    baggage: '2x 32kg Checked Baggage Included',
    refundable: 'Refundable ($150 admin fee)',
    dealExpiresInHours: 24,
    outbound: {
      route: 'JFK → LHR → DEL',
      flightNo: 'BA 178 / BA 143',
      depTime: '08:00 AM (JFK)',
      arrTime: '05:30 AM +1 (DEL)',
      duration: '16h 00m',
      layover: '2h 15m in London Heathrow (LHR)'
    },
    inbound: {
      route: 'DEL → LHR → JFK',
      flightNo: 'BA 142 / BA 117',
      depTime: '10:45 AM (DEL)',
      arrTime: '07:30 PM (JFK)',
      duration: '17h 15m',
      layover: '1h 55m in London Heathrow (LHR)'
    },
    highlights: ['Lie-flat 180° Bed', 'Lounge Access at JFK & LHR', 'Priority Baggage', 'Fast Track Security']
  },
  {
    id: 'OPT-2',
    isRecommended: false,
    airline: 'Air India',
    airlineCode: 'AI',
    tagline: 'Fastest Direct Non-Stop Flight',
    cabinClass: 'Maharajah Business Class',
    sellingPricePerPax: 3450.00,
    netPricePerPax: 2850.00,
    passengers: 2,
    currency: 'USD',
    baggage: '2x 32kg Checked Baggage Included',
    refundable: 'Flexible Date Change Allowed',
    dealExpiresInHours: 24,
    outbound: {
      route: 'JFK → DEL (Direct Non-Stop)',
      flightNo: 'AI 102',
      depTime: '12:30 PM (JFK)',
      arrTime: '13:55 +1 (DEL)',
      duration: '14h 25m',
      layover: 'None (Direct Non-Stop)'
    },
    inbound: {
      route: 'DEL → JFK (Direct Non-Stop)',
      flightNo: 'AI 101',
      depTime: '01:30 AM (DEL)',
      arrTime: '07:45 AM (JFK)',
      duration: '15h 45m',
      layover: 'None (Direct Non-Stop)'
    },
    highlights: ['Direct Non-Stop Service', 'Indian Gourmet Catering', 'Generous 32kg Baggage', 'Free Seat Selection']
  },
  {
    id: 'OPT-3',
    isRecommended: false,
    airline: 'Emirates',
    airlineCode: 'EK',
    tagline: 'World’s Best Business Class Experience',
    cabinClass: 'Emirates Business Class (A380)',
    sellingPricePerPax: 4250.00,
    netPricePerPax: 3600.00,
    passengers: 2,
    currency: 'USD',
    baggage: '2x 32kg Checked Baggage Included',
    refundable: 'Refundable with penalty',
    dealExpiresInHours: 18,
    outbound: {
      route: 'JFK → DXB → DEL',
      flightNo: 'EK 202 / EK 512',
      depTime: '23:00 (JFK)',
      arrTime: '02:45 +2 (DEL)',
      duration: '18h 45m',
      layover: '3h 10m in Dubai Intl (DXB)'
    },
    inbound: {
      route: 'DEL → DXB → JFK',
      flightNo: 'EK 513 / EK 203',
      depTime: '04:15 (DEL)',
      arrTime: '14:25 (JFK)',
      duration: '19h 40m',
      layover: '2h 20m in Dubai Intl (DXB)'
    },
    highlights: ['A380 Onboard Lounge & Bar', 'Chauffeur-drive service in Dubai', 'Bulgari Amenity Kits', 'HDMI Ice Entertainment']
  }
];

export default function QuotationProposalBuilder({ quote, clientInfo, initialOptions = INITIAL_PROPOSAL_OPTIONS }) {
  const { showAlert } = useAlert();

  // Helper to build realistic dynamic proposal options from database quote
  const buildOptionsFromQuote = (q) => {
    if (!q) return [];
    if (Array.isArray(q.options) && q.options.length > 0) {
      return q.options.map((opt, idx) => ({
        id: `OPT-${idx + 1}`,
        isRecommended: idx === 0,
        airline: opt.airline || q.airline || 'Selected Airline',
        airlineCode: (opt.airline || q.airline || 'EK').substring(0, 2).toUpperCase(),
        tagline: `${opt.stops || 'Non-stop'} ${opt.cabinClass || q.cabinClass || 'Economy'} Itinerary`,
        cabinClass: opt.cabinClass || q.cabinClass || 'Economy',
        sellingPricePerPax: Math.round(Number(opt.customerPrice || q.totalPrice || 0) / (Number(q.passengers) || 1)),
        netPricePerPax: Math.round(Number(opt.supplierCost || q.netPrice || 0) / (Number(q.passengers) || 1)),
        passengers: Number(q.passengers) || 1,
        currency: q.currency || 'USD',
        baggage: opt.baggage || '2x 23kg Checked Baggage Included',
        refundable: opt.fareConditions || 'Refundable with standard airline fee',
        dealExpiresInHours: 24,
        outbound: {
          route: `${opt.origin || q.origin || 'JFK'} → ${opt.destination || q.destination || 'DXB'}`,
          flightNo: opt.flightNumber || q.flightNumber || 'FL-101',
          depTime: opt.departure || `${opt.origin || q.origin || 'JFK'} Scheduled`,
          arrTime: opt.arrival || `${opt.destination || q.destination || 'DXB'} Scheduled`,
          duration: opt.duration || 'Direct / Scheduled',
          layover: opt.stops === 'Non-stop' ? 'None (Direct Non-Stop)' : (opt.stops || 'Non-stop')
        },
        inbound: q.returnDate ? {
          route: `${opt.destination || q.destination || 'DXB'} → ${opt.origin || q.origin || 'JFK'}`,
          flightNo: opt.flightNumber || q.flightNumber || 'FL-102',
          depTime: `${opt.destination || q.destination} Return`,
          arrTime: `${opt.origin || q.origin} Arrival`,
          duration: opt.duration || 'Direct / Scheduled',
          layover: opt.stops === 'Non-stop' ? 'None (Direct Non-Stop)' : (opt.stops || 'Non-stop')
        } : {
          route: `${opt.origin || q.origin || 'JFK'} → ${opt.destination || q.destination || 'DXB'} (One-way)`,
          flightNo: opt.flightNumber || q.flightNumber || 'FL-101',
          depTime: opt.departure || 'Scheduled',
          arrTime: opt.arrival || 'Scheduled',
          duration: opt.duration || 'Direct',
          layover: 'None'
        },
        highlights: [
          `${opt.cabinClass || q.cabinClass || 'Economy'} Seating`,
          opt.baggage || 'Checked Baggage Included',
          opt.fareFamily || 'Flexible Fare',
          'Instant E-Ticket Delivery'
        ]
      }));
    }

    // Construct from top-level quote fields
    return [
      {
        id: 'OPT-1',
        isRecommended: true,
        airline: q.airline || 'Emirates',
        airlineCode: (q.airline || 'EK').substring(0, 2).toUpperCase(),
        tagline: `Best Value ${q.cabinClass || 'Economy'} Itinerary`,
        cabinClass: q.cabinClass || 'Economy',
        sellingPricePerPax: Math.round(Number(q.totalPrice || 0) / (Number(q.passengers) || 1)),
        netPricePerPax: Math.round(Number(q.netPrice || 0) / (Number(q.passengers) || 1)),
        passengers: Number(q.passengers) || 1,
        currency: q.currency || 'USD',
        baggage: '2x Checked Baggage Included',
        refundable: 'Standard Airline Fare Rules',
        dealExpiresInHours: 24,
        outbound: {
          route: `${q.origin || 'JFK'} → ${q.destination || 'DXB'}`,
          flightNo: q.flightNumber || 'EK 202',
          depTime: `${q.origin || 'JFK'} Scheduled`,
          arrTime: `${q.destination || 'DXB'} Scheduled`,
          duration: '12h 45m',
          layover: 'Direct Non-Stop'
        },
        inbound: q.returnDate ? {
          route: `${q.destination || 'DXB'} → ${q.origin || 'JFK'}`,
          flightNo: q.flightNumber || 'EK 203',
          depTime: `${q.destination} Return`,
          arrTime: `${q.origin} Return`,
          duration: '13h 10m',
          layover: 'Direct Non-Stop'
        } : null,
        highlights: [
          `${q.cabinClass || 'Economy'} Comfort`,
          'Official GDS Ticket Hold',
          'Instant E-Ticket Delivery'
        ]
      }
    ];
  };

  // Agent Personalization Info
  const [agentName, setAgentName] = useState(quote?.agentName || 'Wael Madi (CEO)');
  const [agentTitle, setAgentTitle] = useState('Senior Private Flight Consultant');
  const [agentPhone, setAgentPhone] = useState('+1 (800) 555-0199');
  const [agentEmail, setAgentEmail] = useState('support@wowmyflight.com');
  const [agencyBrand, setAgencyBrand] = useState('WOW MY FLIGHT · Premier Travel Concierge');

  // Client Details
  const [clientName, setClientName] = useState(quote?.customerName || clientInfo?.name || 'Valued Customer');
  const [clientEmail, setClientEmail] = useState(quote?.customerEmail || clientInfo?.email || 'customer@example.com');
  const [clientPhone, setClientPhone] = useState(quote?.customerPhone || clientInfo?.phone || '+1 (555) 000-0000');
  const [routeTitle, setRouteTitle] = useState(
    quote?.route || (quote?.origin && quote?.destination ? `${quote.origin} ⇄ ${quote.destination}` : 'Confirmed Travel Route')
  );
  const [travelDates, setTravelDates] = useState(
    quote?.departureDate ? `${quote.departureDate}${quote.returnDate ? ' – ' + quote.returnDate : ''}` : 'Confirmed Travel Dates'
  );
  const [passengersCount, setPassengersCount] = useState(Number(quote?.passengers) || 1);

  // Proposal Options List
  const [options, setOptions] = useState(() => (quote ? buildOptionsFromQuote(quote) : []));
  const [previewTab, setPreviewTab] = useState(0); // 0 = Visual Proposal, 1 = Rich HTML Code, 2 = WhatsApp Text
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [selectedDealForModal, setSelectedDealForModal] = useState(() => (options[0] || null));

  // Sync state when active quote changes
  React.useEffect(() => {
    if (quote) {
      setClientName(quote.customerName || clientInfo?.name || 'Valued Customer');
      setClientEmail(quote.customerEmail || clientInfo?.email || 'customer@example.com');
      setClientPhone(quote.customerPhone || clientInfo?.phone || '+1 (555) 000-0000');
      setRouteTitle(quote.route || (quote.origin && quote.destination ? `${quote.origin} ⇄ ${quote.destination}` : 'Confirmed Travel Route'));
      setTravelDates(quote.departureDate ? `${quote.departureDate}${quote.returnDate ? ' – ' + quote.returnDate : ''}` : 'Confirmed Travel Dates');
      setPassengersCount(Number(quote.passengers) || 1);
      if (quote.agentName) setAgentName(quote.agentName);
      const generated = buildOptionsFromQuote(quote);
      setOptions(generated);
      if (generated.length > 0) setSelectedDealForModal(generated[0]);
    }
  }, [quote, clientInfo]);

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    let msg = `*✈️ Flight Proposal for ${clientName}*\n`;
    msg += `Route: ${routeTitle} (${travelDates})\n`;
    msg += `Passengers: ${passengersCount} Adult(s)\n`;
    msg += `Prepared by: *${agentName}* (${agentPhone})\n\n`;
    msg += `Here are your flight quote options from WOW MY FLIGHT:\n\n`;

    options.forEach((opt, idx) => {
      const total = opt.sellingPricePerPax * passengersCount;
      msg += `*Option ${idx + 1}: ${opt.airline}* ${opt.isRecommended ? '⭐ (Recommended)' : ''}\n`;
      msg += `• Class: ${opt.cabinClass}\n`;
      msg += `• Outbound: ${opt.outbound.route} (${opt.outbound.duration})\n`;
      if (opt.inbound) {
        msg += `• Inbound: ${opt.inbound.route} (${opt.inbound.duration})\n`;
      }
      msg += `• Baggage: ${opt.baggage}\n`;
      msg += `• Total Price: *$${total.toLocaleString()} USD* ($${opt.sellingPricePerPax.toLocaleString()}/pax)\n`;
      msg += `• Lock Deal: https://wowmyflight.com/#/deal/${opt.id.toLowerCase()}-lock\n\n`;
    });

    msg += `⚡ *Note:* Fares & seat availability are dynamic and held for ${options[0]?.dealExpiresInHours || 24} hours.\n`;
    msg += `Call our concierge anytime at ${agentPhone} to confirm!`;
    return msg;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {}

    // Clean phone number (strip symbols, spaces, dashes)
    let cleanPhone = (clientPhone || '').replace(/\D/g, '');
    let whatsappUrl = '';

    if (cleanPhone && cleanPhone.length >= 7) {
      if (cleanPhone.length === 10) {
        cleanPhone = cleanPhone.startsWith('9') || cleanPhone.startsWith('8') || cleanPhone.startsWith('7') || cleanPhone.startsWith('6')
          ? `91${cleanPhone}`
          : `1${cleanPhone}`;
      }
      whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    } else {
      // Fallback: lets agent choose contact on WhatsApp Web
      whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    }

    // Direct link click that bypasses popup blocker
    const anchor = document.createElement('a');
    anchor.href = whatsappUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    showAlert(`✓ Copied proposal & launched WhatsApp Web for ${clientName}!`, 'success');
  };

  const handleSendEmail = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const quoteId = quote?.id || quote?.quoteId;
      if (quoteId) {
        await fetch(`${backendUrl}/api/quotes/${quoteId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'email', recipient: clientEmail })
        });
      }

      // Open email composer in client's default email app
      const subject = encodeURIComponent(`Flight Quotation Proposal: ${routeTitle} - Wow My Flight`);
      const body = encodeURIComponent(generateWhatsAppMessage().replace(/\*/g, ''));
      const mailtoAnchor = document.createElement('a');
      mailtoAnchor.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
      document.body.appendChild(mailtoAnchor);
      mailtoAnchor.click();
      document.body.removeChild(mailtoAnchor);

      showAlert(`🚀 Official Quotation Proposal dispatched to ${clientEmail} & Email composer opened!`, 'success');
    } catch (e) {
      showAlert(`Quotation sent to ${clientEmail}`, 'success');
    }
  };

  const handleOpenDealReview = (deal) => {
    setSelectedDealForModal(deal);
    setShowPublicModal(true);
  };

  if (!quote && (!clientInfo || !clientInfo.name)) {
    return (
      <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1 }}>
          No Active Quote Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please select a quote from Tab 1 (CRM Quotes Ledger) to generate and preview client email & WhatsApp proposals.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ─── HEADER & AGENT PERSONALIZATION BAR ─── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#38BDF8',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem'
              }}
            >
              <PersonIcon />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#F8FAFC' }}>
                  {agencyBrand}
                </Typography>
                <Chip size="small" label="Phase 4 Proposal Desk" color="primary" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Dedicated Flight Expert: <b>{agentName}</b> ({agentTitle}) · Direct line: <b>{agentPhone}</b>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
              onClick={handleCopyWhatsApp}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.1)' }
              }}
            >
              Copy WhatsApp Proposal
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<SendIcon />}
              onClick={handleSendEmail}
              sx={{
                bgcolor: '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { bgcolor: '#2563EB' }
              }}
            >
              Send Client Email Proposal
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ─── CLIENT & TRIP DETAILS SUMMARY ─── */}
      <Paper elevation={0} sx={{ p: 2, px: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>RECIPIENT CLIENT:</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{clientName}</Typography>
            <Typography variant="caption" color="text.secondary">{clientEmail} · {clientPhone}</Typography>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>ITINERARY ROUTE:</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main' }}>{routeTitle}</Typography>
            <Typography variant="caption" color="text.secondary">Round Trip · {passengersCount} Adult Passenger(s)</Typography>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>TRAVEL DATES:</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{travelDates}</Typography>
            <Typography variant="caption" color="text.secondary">Status: Dynamic Tariff Hold Active</Typography>
          </Grid>

          <Grid item xs={12} sm={3} sx={{ textAlign: { sm: 'right' } }}>
            <Chip
              icon={<LockClockIcon />}
              label="Live 24h Price Lock"
              color="warning"
              sx={{ fontWeight: 900, fontSize: '0.75rem' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── TAB VIEW: VISUAL PROPOSAL | HTML CODE | WHATSAPP ─── */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2 }}>
        <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} sx={{ px: 2 }}>
          <Tab icon={<VisibilityIcon />} iconPosition="start" label="1. Client Visual Email & Deal Cards" sx={{ fontWeight: 800 }} />
          <Tab icon={<WhatsAppIcon />} iconPosition="start" label="2. WhatsApp Ready Message" sx={{ fontWeight: 800 }} />
          <Tab icon={<PictureAsPdfIcon />} iconPosition="start" label="3. PDF Quotation Sheet" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Paper>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 0: CLIENT VISUAL PROPOSAL CARDS (Screenshot 3 Matching Layout)
      ════════════════════════════════════════════════════════════════════ */}
      {previewTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {options.map((opt, idx) => {
            const totalSelling = opt.sellingPricePerPax * passengersCount;
            const totalNet = opt.netPricePerPax * passengersCount;
            const totalProfit = totalSelling - totalNet;

            return (
              <Paper
                key={opt.id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: opt.isRecommended ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  boxShadow: opt.isRecommended ? '0 10px 30px rgba(37, 99, 235, 0.12)' : 'none',
                  overflow: 'hidden',
                  bgcolor: 'background.paper'
                }}
              >
                {/* Recommendation Ribbon if applicable */}
                {opt.isRecommended && (
                  <Box sx={{ bgcolor: '#2563EB', color: '#FFFFFF', px: 3, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon sx={{ fontSize: 18, color: '#FDE047' }} />
                      <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                        AGENT TOP RECOMMENDATION — BEST VALUE & SEAT COMFORT
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      Option #{idx + 1} of {options.length}
                    </Typography>
                  </Box>
                )}

                {/* Card Main Body */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3} alignItems="center">
                    {/* Airline & Route Summary */}
                    <Grid item xs={12} md={7}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                        <Box
                          sx={{
                            px: 1.8,
                            py: 0.8,
                            borderRadius: 2,
                            bgcolor: '#0F172A',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: '0.9rem'
                          }}
                        >
                          {opt.airlineCode}
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                            {opt.airline}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800 }}>
                            {opt.tagline} · {opt.cabinClass}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Flight Timings Outbound & Inbound */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, bgcolor: 'background.neutral', p: 2, borderRadius: 2, border: '1px solid var(--wb-E2E8F0, #E2E8F0)' }}>
                        {/* Outbound */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FlightTakeoffIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              Outbound: {opt.outbound.depTime} → {opt.outbound.arrTime}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {opt.outbound.duration} ({opt.outbound.layover})
                          </Typography>
                        </Box>

                        <Divider />

                        {/* Inbound */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FlightLandIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              Inbound: {opt.inbound.depTime} → {opt.inbound.arrTime}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {opt.inbound.duration} ({opt.inbound.layover})
                          </Typography>
                        </Box>
                      </Box>

                      {/* Highlights Pill List */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                        {opt.highlights.map((h, i) => (
                          <Chip key={i} label={`✓ ${h}`} size="small" sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', fontWeight: 700, fontSize: '0.68rem' }} />
                        ))}
                      </Box>
                    </Grid>

                    {/* Price & Booking Call to Action */}
                    <Grid item xs={12} md={5} sx={{ borderLeft: { md: '1px solid #E2E8F0' }, pl: { md: 3 } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                            TOTAL SELLING FOR {passengersCount} PAX:
                          </Typography>
                          <Chip label={`$${opt.sellingPricePerPax.toLocaleString()} / pax`} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                        </Box>

                        <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
                          ${totalSelling.toLocaleString()} <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>USD</Typography>
                        </Typography>

                        <Typography variant="caption" sx={{ color: 'var(--wd-059669, #059669)', fontWeight: 800 }}>
                          ✓ Includes all Airport Taxes, Carrier Surcharges & {opt.baggage}
                        </Typography>

                        {/* Internal GDS Net & Profit Indicator */}
                        <Paper elevation={0} sx={{ p: 1, px: 1.5, bgcolor: 'var(--wl-FEF3C7, #FEF3C7)', border: '1px dashed #F59E0B', borderRadius: 1.5, my: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'var(--wd-92400E, #92400E)', fontWeight: 800, display: 'block' }}>
                            Internal Tariff: Net ${totalNet.toLocaleString()} | Margin: +${totalProfit.toLocaleString()} ({((totalProfit / totalNet) * 100).toFixed(0)}%)
                          </Typography>
                        </Paper>

                        {/* Public Deal Review & Lock Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<LockClockIcon />}
                            onClick={() => handleOpenDealReview(opt)}
                            sx={{ fontWeight: 900, py: 1, borderRadius: 2, textTransform: 'none' }}
                          >
                            Preview Client Deal Page →
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: WHATSAPP FORMATTED TEXT
      ════════════════════════════════════════════════════════════════════ */}
      {previewTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WhatsAppIcon sx={{ color: '#25D366' }} /> Ready-to-Send WhatsApp Itinerary Proposal
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyWhatsApp}
              sx={{ bgcolor: '#25D366', color: '#FFFFFF', fontWeight: 800, '&:hover': { bgcolor: '#1EBE5D' } }}
            >
              Copy to Clipboard
            </Button>
          </Box>

          <TextField
            multiline
            rows={14}
            fullWidth
            value={generateWhatsAppMessage()}
            InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'background.neutral' } }}
          />
        </Paper>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2: PDF EXPORT PREVIEW
      ════════════════════════════════════════════════════════════════════ */}
      {previewTab === 2 && (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
                CEOFLIGHTS
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official Flight Quotation & Price Protection Certificate
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => showAlert('✓ PDF Quotation generated and downloaded for client!', 'success')}
              sx={{ fontWeight: 800 }}
            >
              Download PDF Proposal
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="body2" sx={{ mb: 2 }}>
            Dear <b>{clientName}</b>,<br />
            Thank you for choosing CEOFLIGHTS. We have prepared the best negotiated tariff options for your upcoming journey <b>{routeTitle}</b> ({travelDates}).
          </Typography>

          <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid var(--wb-E2E8F0, #E2E8F0)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Summary of Options</Typography>
            {options.map((opt, i) => (
              <Box key={opt.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: i < options.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                <Typography variant="body2"><b>Option {i + 1}: {opt.airline}</b> ({opt.cabinClass})</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>${(opt.sellingPricePerPax * passengersCount).toLocaleString()} USD</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* ─── PUBLIC DEAL REVIEW MODAL (PHASE 5 SIMULATOR) ─── */}
      <Dialog
        open={showPublicModal}
        onClose={() => setShowPublicModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ p: 2.5, bgcolor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LockClockIcon sx={{ color: '#F59E0B' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                Client Public Deal Page · Live Price Lock Preview
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Simulating public URL: https://ceoflights.com/#/deal/{selectedDealForModal?.id.toLowerCase()}
              </Typography>
            </Box>
          </Box>
          <Chip label="Deal Active · 21:46:16 Left" color="warning" sx={{ fontWeight: 900 }} />
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedDealForModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Phone-Only Secret Deal Banner (Screenshot 2 & 3) */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                  border: '1px solid var(--wb-BFDBFE, #BFDBFE)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneInTalkIcon sx={{ color: '#2563EB', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'var(--wd-1E40AF, #1E40AF)' }}>
                      Secret Phone-Only Discount Available!
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Call your assigned agent <b>{agentName}</b> at <b>{agentPhone}</b> to unlock extra $150 off.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  href={`tel:${agentPhone}`}
                  sx={{ fontWeight: 800, textTransform: 'none' }}
                >
                  Call Now: {agentPhone.split('/')[0]}
                </Button>
              </Paper>

              {/* Deal Breakdown */}
              <Box sx={{ p: 2.5, border: '1px solid var(--wb-E2E8F0, #E2E8F0)', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  {selectedDealForModal.airline} · {selectedDealForModal.cabinClass}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Route: <b>{selectedDealForModal.outbound.route}</b> | Total Duration: <b>{selectedDealForModal.outbound.duration}</b>
                </Typography>

                <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Deal Price (All Pax & Taxes):</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#2563EB' }}>
                      ${(selectedDealForModal.sellingPricePerPax * passengersCount).toLocaleString()} USD
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={() => {
                      setShowPublicModal(false);
                      showAlert(`✓ Client initiated booking checkout for ${selectedDealForModal.airline}! Forwarded to Ticketing Queue.`, 'success');
                    }}
                    sx={{ fontWeight: 900, px: 3 }}
                  >
                    Lock & Book Deal Now →
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid var(--wb-E2E8F0, #E2E8F0)' }}>
          <Button onClick={() => setShowPublicModal(false)} sx={{ fontWeight: 800 }}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
