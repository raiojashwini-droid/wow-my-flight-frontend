import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import LuggageIcon from '@mui/icons-material/Luggage';
import WifiIcon from '@mui/icons-material/Wifi';
import PowerIcon from '@mui/icons-material/Power';
import Co2Icon from '@mui/icons-material/Co2';
import AirlineSeatReclineExtraIcon from '@mui/icons-material/AirlineSeatReclineExtra';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LockClockIcon from '@mui/icons-material/LockClock';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import AncillariesAndSSRHub from '../../components/AncillariesAndSSRHub';
import { useAlert } from '../../contexts/AlertContext';

export default function FlightDealReview({ quote: propQuote }) {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Resolve quote from props or fallback to cached quote
  const [activeQuote, setActiveQuote] = useState(() => {
    if (propQuote) return propQuote;
    try {
      const stored = localStorage.getItem('crm-quotes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    if (propQuote) {
      setActiveQuote(propQuote);
    }
  }, [propQuote]);

  // 24 Hour Countdown Timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 45
  });

  const [ancillaryAddonCost, setAncillaryAddonCost] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Passengers state derived dynamically from active quote
  const [passengers, setPassengers] = useState(() => {
    const name = activeQuote?.customerName || 'Valued Customer';
    const parts = name.trim().split(' ');
    const first = parts[0] || 'Valued';
    const last = parts.slice(1).join(' ') || 'Customer';
    return [
      {
        title: 'Mr',
        firstName: first,
        lastName: last,
        dob: '1990-05-15',
        passportNo: 'US9820194',
        nationality: 'United States',
        meal: 'Standard Meal'
      }
    ];
  });

  const [contactEmail, setContactEmail] = useState(activeQuote?.customerEmail || 'customer@example.com');
  const [contactPhone, setContactPhone] = useState(activeQuote?.customerPhone || '+1 (555) 000-0000');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [assignedPnr, setAssignedPnr] = useState('');

  // Sync passengers & contact whenever active quote updates
  useEffect(() => {
    if (activeQuote) {
      const name = activeQuote.customerName || 'Valued Customer';
      const parts = name.trim().split(' ');
      const first = parts[0] || 'Valued';
      const last = parts.slice(1).join(' ') || 'Customer';
      setPassengers([
        {
          title: 'Mr',
          firstName: first,
          lastName: last,
          dob: '1990-05-15',
          passportNo: 'US9820194',
          nationality: 'United States',
          meal: 'Standard Meal'
        }
      ]);
      setContactEmail(activeQuote.customerEmail || 'customer@example.com');
      setContactPhone(activeQuote.customerPhone || '+1 (555) 000-0000');
    }
  }, [activeQuote]);

  const formatTimer = () => {
    const h = String(timeLeft.hours).padStart(2, '0');
    const m = String(timeLeft.minutes).padStart(2, '0');
    const s = String(timeLeft.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleBookNow = async () => {
    const newPnr = 'PNR' + Math.floor(100000 + Math.random() * 900000);
    setAssignedPnr(newPnr);
    setBookingConfirmed(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      await fetch(`${backendUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: activeQuote?.id || activeQuote?.quoteId,
          customerName: activeQuote?.customerName || `${passengers[0].firstName} ${passengers[0].lastName}`,
          customerEmail: contactEmail,
          customerPhone: contactPhone,
          route: activeQuote?.route || `${activeQuote?.origin || 'JFK'} → ${activeQuote?.destination || 'DXB'}`,
          origin: activeQuote?.origin || 'JFK',
          destination: activeQuote?.destination || 'DXB',
          travelDate: activeQuote?.departureDate || '2026-10-16',
          cabinClass: activeQuote?.cabinClass || 'Economy',
          passengers: passengers.length,
          pnr: newPnr,
          airline: activeQuote?.airline || 'Emirates',
          flightNumber: activeQuote?.flightNumber || 'EK 202',
          supplier: activeQuote?.options?.[0]?.supplier || 'Amadeus GDS',
          sellingPrice: (activeQuote?.totalPrice || 474) + ancillaryAddonCost,
          bookingStatus: 'CONFIRMED'
        })
      });
    } catch (e) {
      console.warn('Booking API error:', e.message);
    }

    showAlert(`🎉 Booking successfully held under PNR #${newPnr}! E-ticket confirmed for ${activeQuote?.customerName || contactEmail}.`, 'success');
  };

  if (!activeQuote) {
    return (
      <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1 }}>
          No Active Quote Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please select a quote from Tab 1 (CRM Quotes Ledger) to preview the interactive client deal review page.
        </Typography>
      </Paper>
    );
  }

  // Derived values from genuine DB quote
  const primaryOpt = activeQuote.options?.[0] || {};
  const airlineName = activeQuote.airline || primaryOpt.airline || 'Commercial Airline';
  const airlineCode = (activeQuote.airline || primaryOpt.airline || 'EK').substring(0, 2).toUpperCase();
  const flightNumber = activeQuote.flightNumber || primaryOpt.flightNumber || 'FLIGHT';
  const cabinClass = activeQuote.cabinClass || primaryOpt.cabinClass || 'Economy';
  const origin = activeQuote.origin || 'JFK';
  const destination = activeQuote.destination || 'DXB';
  const departureDate = activeQuote.departureDate || '2026-10-16';
  const returnDate = activeQuote.returnDate || null;
  const agentName = activeQuote.agentName || 'Wael Madi (CEO)';

  const netPrice = Number(activeQuote.netPrice || primaryOpt.supplierCost || 372);
  const taxes = Number(primaryOpt.taxes || Math.round(netPrice * 0.15));
  const markup = Number(activeQuote.markup || primaryOpt.markupAmount || 56);
  const baseSellingPrice = Number(activeQuote.totalPrice || primaryOpt.customerPrice || 474);
  const totalSellingPrice = baseSellingPrice + ancillaryAddonCost;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.neutral', pb: 8 }}>
      {/* ─── TOP BRAND & EMERGENCY CALL HEADER ─── */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: '#FFFFFF',
          py: 1.5,
          px: 3,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 1, color: '#38BDF8' }}>
                WOW MY FLIGHT
              </Typography>
              <Chip label="PREMIER PRIVATE CONCIERGE" size="small" sx={{ bgcolor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontWeight: 800, fontSize: '0.65rem' }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1E293B', px: 2, py: 0.5, borderRadius: 2, border: '1px solid #334155' }}>
                <LockClockIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 900, color: '#F8FAFC' }}>
                  Price Locked: <span style={{ color: '#F59E0B' }}>{formatTimer()}</span>
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<PhoneInTalkIcon />}
                href="tel:+18005550199"
                sx={{
                  bgcolor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Call Concierge: +1 (800) 555-0199
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─── MAIN CONTAINER ─── */}
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {/* SUCCESS STATE */}
        {bookingConfirmed ? (
          <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #86EFAC', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'var(--wd-16A34A, #16A34A)', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--wd-14532D, #14532D)', mb: 1 }}>
              Booking Confirmed & PNR Generated!
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--wd-15803D, #15803D)', mb: 3 }}>
              GDS Record Locator: <span style={{ fontFamily: 'monospace', textDecoration: 'underline' }}>{assignedPnr}</span>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
              Your {airlineName} itinerary has been locked. Confirmation and official 13-digit E-Tickets are being issued by our ticketing desk and will be sent to <b>{contactEmail}</b>.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ fontWeight: 800, px: 4, py: 1.2 }}
            >
              Return to Flight Desk
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* LEFT COLUMN: ITINERARY & PASSENGERS */}
            <Grid item xs={12} lg={8}>
              {/* Phone-Only Banner */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                  border: '1px solid var(--wb-BFDBFE, #BFDBFE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.2, bgcolor: '#2563EB', color: '#FFFFFF', borderRadius: 2 }}>
                    <PhoneInTalkIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'var(--wd-1E40AF, #1E40AF)' }}>
                      Assigned Concierge Desk
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your quote was prepared by <b>{agentName}</b>. Direct support: <b>+1 (800) 555-0199</b>.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  href="tel:+18005550199"
                  sx={{ fontWeight: 800, textTransform: 'none' }}
                >
                  Call +1 (800) 555-0199
                </Button>
              </Paper>

              {/* FLIGHT ITINERARY CARD */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid var(--wb-E2E8F0, #E2E8F0)', mb: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ px: 2, py: 1, bgcolor: '#0F172A', color: '#FFFFFF', fontWeight: 900, borderRadius: 2 }}>
                      {airlineCode}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {airlineName} · {cabinClass}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {origin} ⇄ {destination} · {departureDate} {returnDate ? '– ' + returnDate : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label={`${cabinClass} Class`} color="primary" sx={{ fontWeight: 800 }} />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* OUTBOUND FLIGHT */}
                <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlightTakeoffIcon fontSize="small" /> Outbound Flight · {departureDate}
                  </Typography>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{origin} Departure</Typography>
                      <Typography variant="caption" color="text.secondary">{flightNumber} · {primaryOpt.departure || `${origin} Scheduled`}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>{primaryOpt.duration || '12h 45m'}</Typography>
                      <Chip label={primaryOpt.stops || 'Direct'} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ textAlign: { sm: 'right' } }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{destination} Arrival</Typography>
                      <Typography variant="caption" color="text.secondary">{primaryOpt.arrival || `${destination} Scheduled`}</Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 1.5, p: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', borderRadius: 1.5, border: '1px dashed #F59E0B', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConnectingAirportsIcon sx={{ color: '#D97706', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ color: 'var(--wd-B45309, #B45309)', fontWeight: 800 }}>
                      Baggage Allowance: {primaryOpt.baggage || '2x 23kg Checked Bags Included'} · Fare: {primaryOpt.fareFamily || 'Standard Flex'}
                    </Typography>
                  </Box>
                </Box>

                {/* INBOUND FLIGHT IF ROUND TRIP */}
                {returnDate && (
                  <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'secondary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlightLandIcon fontSize="small" /> Inbound Flight · {returnDate}
                    </Typography>

                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{destination} Return</Typography>
                        <Typography variant="caption" color="text.secondary">{flightNumber} Return Leg</Typography>
                      </Grid>
                      <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>{primaryOpt.duration || '13h 10m'}</Typography>
                        <Chip label={primaryOpt.stops || 'Direct'} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </Grid>
                      <Grid item xs={12} sm={5} sx={{ textAlign: { sm: 'right' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{origin} Arrival</Typography>
                        <Typography variant="caption" color="text.secondary">Return arrival</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>

              {/* PASSENGER DETAILS FORM */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid var(--wb-E2E8F0, #E2E8F0)', bgcolor: 'background.paper' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                  Passenger & Passport Information ({passengers.length} Adult Traveler{passengers.length > 1 ? 's' : ''})
                </Typography>

                {passengers.map((pax, idx) => (
                  <Box key={idx} sx={{ p: 2, mb: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid var(--wb-E2E8F0, #E2E8F0)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
                      Adult Passenger #{idx + 1}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={2}>
                        <TextField fullWidth size="small" label="Title" value={pax.title} onChange={e => {
                          const updated = [...passengers];
                          updated[idx].title = e.target.value;
                          setPassengers(updated);
                        }} />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField fullWidth size="small" label="First & Middle Name *" value={pax.firstName} onChange={e => {
                          const updated = [...passengers];
                          updated[idx].firstName = e.target.value;
                          setPassengers(updated);
                        }} />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField fullWidth size="small" label="Last Name / Surname *" value={pax.lastName} onChange={e => {
                          const updated = [...passengers];
                          updated[idx].lastName = e.target.value;
                          setPassengers(updated);
                        }} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" type="date" label="Date of Birth" value={pax.dob} InputLabelProps={{ shrink: true }} onChange={e => {
                          const updated = [...passengers];
                          updated[idx].dob = e.target.value;
                          setPassengers(updated);
                        }} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label="Passport Number *" value={pax.passportNo} onChange={e => {
                          const updated = [...passengers];
                          updated[idx].passportNo = e.target.value;
                          setPassengers(updated);
                        }} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label="Nationality" value={pax.nationality} onChange={e => {
                          const updated = [...passengers];
                          updated[idx].nationality = e.target.value;
                          setPassengers(updated);
                        }} />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Paper>

              {/* AIRLINE ANCILLARIES & SSR HUB */}
              <AncillariesAndSSRHub
                pnr="WFL9482"
                passengers={passengers.length}
                onUpdateTotal={(total) => setAncillaryAddonCost(total)}
              />
            </Grid>

            {/* RIGHT COLUMN: PRICE BREAKDOWN & BOOK BUTTON */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '2px solid #3B82F6', bgcolor: 'background.paper', position: 'sticky', top: 90 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                  Fare & Price Protection
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Net Base Fare:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>${netPrice.toLocaleString()}.00</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Airport Taxes & Carrier Fees:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>${taxes.toLocaleString()}.00</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Agency Markup / Fee:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>+${markup.toLocaleString()}.00</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Checked Baggage:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>FREE (Included)</Typography>
                  </Box>

                  {ancillaryAddonCost > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', p: 1, borderRadius: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'var(--wd-047857, #047857)' }}>Selected Ancillaries & SSR:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: 'var(--wd-047857, #047857)' }}>+${ancillaryAddonCost.toLocaleString()}.00</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total Selling Price:</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#2563EB' }}>
                      ${totalSellingPrice.toLocaleString()}.00
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'var(--wd-059669, #059669)', fontWeight: 800, textAlign: 'right' }}>
                    ✓ Guaranteed No Hidden Fees · Instant E-Ticket Delivery
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleBookNow}
                  sx={{
                    fontWeight: 900,
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  Confirm Booking & Issue Tickets →
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2, color: 'text.secondary' }}>
                  <VerifiedUserIcon sx={{ fontSize: 18, color: 'var(--wd-10B981, #10B981)' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    256-Bit SSL Encrypted & ARC/IATA Certified
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
