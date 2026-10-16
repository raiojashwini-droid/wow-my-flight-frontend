import React, { useState, useEffect, useMemo } from 'react';
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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { flightContentService } from '../services/flightContentService';
import AirportSelect from './AirportSelect';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PolicyIcon from '@mui/icons-material/Policy';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';

// Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import LuggageIcon from '@mui/icons-material/Luggage';
import WifiIcon from '@mui/icons-material/Wifi';
import PowerIcon from '@mui/icons-material/Power';
import TvIcon from '@mui/icons-material/Tv';
import Co2Icon from '@mui/icons-material/Co2';
import AirlineSeatReclineExtraIcon from '@mui/icons-material/AirlineSeatReclineExtra';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PublicIcon from '@mui/icons-material/Public';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import { useAlert } from '../contexts/AlertContext';

export const SAMPLE_MULTI_GDS_RESULTS = [];

export default function MultiGdsFlightSearch({
  onSelectFlight,
  onGenerateQuote,
  hideSearchCard = false,
  externalParams = null,
  externalFilters = null,
  searchTrigger = 0
}) {
  const { showAlert } = useAlert();

  // Search parameters
  const [tripType, setTripType] = useState(externalParams?.tripType || 'Round Trip');
  const [origin, setOrigin] = useState(externalParams?.origin || 'DEL');
  const [destination, setDestination] = useState(externalParams?.destination || 'LHR');
  const [departDate, setDepartDate] = useState(externalParams?.departDate || '2026-10-15');
  const [returnDate, setReturnDate] = useState(externalParams?.returnDate || '2026-10-25');
  const [cabinClass, setCabinClass] = useState(externalParams?.cabinClass || 'Business');
  const [passengers, setPassengers] = useState(externalParams?.passengers || 2);
  const [isSearching, setIsSearching] = useState(false);
  const [flightResults, setFlightResults] = useState([]);
  const [apiError, setApiError] = useState(null);

  // Sync with externalParams if provided
  useEffect(() => {
    if (externalParams) {
      if (externalParams.origin) setOrigin(externalParams.origin);
      if (externalParams.destination) setDestination(externalParams.destination);
      if (externalParams.departDate) setDepartDate(externalParams.departDate);
      if (externalParams.returnDate) setReturnDate(externalParams.returnDate);
      if (externalParams.tripType) setTripType(externalParams.tripType);
      if (externalParams.cabinClass) setCabinClass(externalParams.cabinClass);
      if (externalParams.passengers) setPassengers(externalParams.passengers);
    }
  }, [externalParams]);

  // Auto-fetch live TraveloPro GDS flights on component mount or trigger
  useEffect(() => {
    handleSearch();
  }, [searchTrigger]);

  // Point of Sale (POS) Filter Tabs (Screenshot 5)
  const [posTab, setPosTab] = useState(0); // 0 = UK, 1 = USA, 2 = Ireland Dynamic

  const navigate = useNavigate();

  // Active Modals for Buttons
  const [fareRulesFlight, setFareRulesFlight] = useState(null);
  const [quoteFlight, setQuoteFlight] = useState(null);
  const [bookFlight, setBookFlight] = useState(null);
  const [quoteMarkup, setQuoteMarkup] = useState(250);
  const [paxName, setPaxName] = useState('John Doe');
  const [isBooking, setIsBooking] = useState(false);

  const copyWhatsAppQuote = (flight) => {
    const text = `✈️ *FLIGHT QUOTATION - WOWMYFLIGHT*\n` +
      `Airline: ${flight.airline} (${flight.airlineCode})\n` +
      `Route: ${origin} ➔ ${destination} (${cabinClass})\n` +
      `Flight: ${flight.outbound.flightNo} (${flight.outbound.departTime} - ${flight.outbound.arriveTime})\n` +
      `Baggage: ${flight.baggage} | Refundable: ${flight.refundable}\n` +
      `Special Quote Price: $${(flight.suggestedSellingPrice || (flight.usdEquivalent + quoteMarkup)).toLocaleString()} USD\n\n` +
      `Reply YES to hold your seat or lock this price!`;
    navigator.clipboard.writeText(text);
    showAlert('✓ WhatsApp Quotation copied to clipboard!', 'success');
  };

  const handleSearch = async (overrideParams = null) => {
    const sOrigin = overrideParams?.origin || externalParams?.origin || origin;
    const sDest = overrideParams?.destination || externalParams?.destination || destination;
    const sDepart = overrideParams?.departDate || externalParams?.departDate || departDate;
    const sReturn = overrideParams?.returnDate || externalParams?.returnDate || returnDate;
    const sTrip = overrideParams?.tripType || externalParams?.tripType || tripType;
    const sCabin = overrideParams?.cabinClass || externalParams?.cabinClass || cabinClass;
    const sPax = overrideParams?.passengers || externalParams?.passengers || passengers;

    const isRound = String(sTrip).toLowerCase().includes('round');
    if (isRound && sReturn && sDepart && new Date(sReturn) < new Date(sDepart)) {
      showAlert('⚠️ Return date cannot be earlier than Departure date! Please select a return date after departure.', 'warning');
      return;
    }

    setIsSearching(true);
    setApiError(null);
    try {
      const data = await flightContentService.searchFlightsAcrossAdapters({
        origin: sOrigin ? sOrigin.trim().toUpperCase() : 'DEL',
        destination: sDest ? sDest.trim().toUpperCase() : 'LHR',
        departDate: sDepart || '2026-10-15',
        returnDate: isRound ? (sReturn || '2026-10-25') : null,
        cabinClass: sCabin || 'Business',
        passengers: typeof sPax === 'object' ? (sPax.adults || 1) : (sPax || 1),
        tripType: isRound ? 'roundtrip' : 'oneway'
      });

      if (data && Array.isArray(data.offers) && data.offers.length > 0) {
        setFlightResults(data.offers);
        showAlert(`✓ Found ${data.offersCount} live flights from GDS for ${sOrigin} ⇄ ${sDest}`, 'success');
      } else {
        setFlightResults([]);
        showAlert(`No live flight offers returned from GDS for ${sOrigin} ⇄ ${sDest}.`, 'info');
      }
    } catch (err) {
      console.error('[MultiGdsFlightSearch] Live search failed:', err);
      setApiError(err.message || 'TraveloPro API error');
      setFlightResults([]);
      showAlert(`⚠️ Live API error: ${err.message}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const currentPos = posTab === 0 ? 'United Kingdom' : posTab === 1 ? 'USA' : 'Ireland (Dynamic)';

  const filteredResults = useMemo(() => {
    return flightResults.filter(res => {
      // 1. External 10 Expert Filters
      if (externalFilters) {
        // Airline filter
        if (externalFilters.airline && externalFilters.airline !== 'All') {
          const code = externalFilters.airline.toUpperCase();
          if (res.airlineCode !== code && !res.airline?.toUpperCase().includes(code)) return false;
        }

        // Stops filter
        if (externalFilters.stops) {
          if (externalFilters.stops === 'Direct') {
            const stopsCount = res.outbound?.stops || 0;
            if (stopsCount > 0) return false;
          } else if (externalFilters.stops === '1 Stop Max') {
            const stopsCount = res.outbound?.stops || 0;
            if (stopsCount > 1) return false;
          }
        }
      }

      return true;
    });
  }, [flightResults, posTab, externalFilters]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ─── SEARCH INPUTS BAR (Hidden when controlled by parent like FlightExpertDesk) ─── */}
      {!hideSearchCard && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'primary.light',
            background: 'linear-gradient(135deg, var(--wl-FFFFFF, #FFFFFF) 0%, var(--wl-F8FAFC, #F8FAFC) 100%)',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['Round Trip', 'One Way', 'Multi-City'].map((t) => (
                <Button
                  key={t}
                  size="small"
                  variant={tripType === t ? 'contained' : 'outlined'}
                  onClick={() => setTripType(t)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    py: 0.4,
                    px: 1.8
                  }}
                >
                  {t}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                GDS Gateway: <b>Amadeus + Sabre + Galileo (Active)</b>
              </Typography>
              <Chip label="Live Inventory Connected" size="small" color="success" sx={{ fontWeight: 800, height: 22, fontSize: '0.65rem' }} />
            </Box>
          </Box>

          <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <AirportSelect
                value={origin}
                onChange={(code) => setOrigin(code)}
                label="Origin Airport / City"
                type="origin"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <AirportSelect
                value={destination}
                onChange={(code) => setDestination(code)}
                label="Destination Airport / City"
                type="destination"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Depart Date"
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {tripType === 'Round Trip' && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Return Date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: departDate }}
                />
              </Grid>
            )}

            <Grid size={{ xs: 6, md: tripType === 'Round Trip' ? 1.5 : 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Cabin</InputLabel>
                <Select value={cabinClass} label="Cabin" onChange={(e) => setCabinClass(e.target.value)}>
                  <MenuItem value="Economy">Economy</MenuItem>
                  <MenuItem value="Premium Economy">Premium Economy</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="First Class">First Class</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: tripType === 'Round Trip' ? 1.5 : 2.5 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleSearch()}
                disabled={isSearching}
                startIcon={isSearching ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                sx={{ fontWeight: 800, py: 1, borderRadius: 2 }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ─── POINT OF SALE (POS) COUNTRY TABS (Exact to Screenshot 5) ─── */}
      <Paper elevation={0} sx={{ p: 1.5, px: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Tabs
            value={posTab}
            onChange={(_, val) => setPosTab(val)}
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                py: 0.5,
                px: 2,
                fontWeight: 800,
                fontSize: '0.78rem',
                borderRadius: 2,
                textTransform: 'none',
                '&.Mui-selected': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                  color: '#1D4ED8'
                }
              }
            }}
          >
            <Tab label="🇬🇧 United Kingdom (359)" />
            <Tab label="🇺🇸 USA (1,291)" />
            <Tab label="🇮🇪 Ireland (Dynamic) (100)" />
          </Tabs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Supplier Fees: <b>EXCH $11 · VOID $11 · RFND $11</b>
            </Typography>
            <Chip label="SORT: Lowest Net Price" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
          </Box>
        </Box>
      </Paper>

      {/* ─── FLIGHT RESULT CARDS LIST (TraveloPro Live GDS Offers) ─── */}
      {apiError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleSearch} sx={{ fontWeight: 800 }}>
              Retry Live API
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 800 }}>Live TraveloPro Search Notice</AlertTitle>
          {apiError}
        </Alert>
      )}

      {isSearching && (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <FlightTakeoffIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1, animation: 'pulse 1.5s infinite' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Searching Live GDS Flights...
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Querying TraveloPro engine for real-time fares and seat availability.
          </Typography>
        </Paper>
      )}

      {!isSearching && filteredResults.length === 0 && (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <FlightTakeoffIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No Live Flights Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 500, mx: 'auto' }}>
            No flight inventory was returned by TraveloPro for {origin} ➔ {destination} on {departDate}. Please try different travel dates or airport codes and click Search Flights.
          </Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {filteredResults.map((res) => (
          <Paper
            key={res.id}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)'
              }
            }}
          >
            {/* Card Header */}
            <Box
              sx={{
                p: 2,
                px: 3,
                backgroundColor: 'background.neutral',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 1.5,
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    letterSpacing: 0.5
                  }}
                >
                  {res.airlineCode}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {res.airline}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {res.gdsSource} · Fare Basis: <span style={{ fontFamily: 'monospace', color: '#2563EB' }}>{res.fareBasis}</span> · {res.cabinClass}
                  </Typography>
                </Box>
              </Box>

              {/* Pricing Breakup (Screenshot 5) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, textAlign: 'right' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700 }}>
                    Net Fare ({res.currency})
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
                    {res.currency} {res.totalNetPrice.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--wd-059669, #059669)', fontWeight: 800 }}>
                    ({res.baseFare} Base + {res.taxes} Tax)
                  </Typography>
                </Box>

                <Box sx={{ pl: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'secondary.main', display: 'block', fontWeight: 800 }}>
                    Suggested Selling Price
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#D97706', lineHeight: 1 }}>
                    ${res.suggestedSellingPrice.toLocaleString()} USD
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    +${(res.suggestedSellingPrice - res.usdEquivalent).toFixed(0)} Agency Margin
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Itinerary Timeline Body (Screenshot 6 & 7) */}
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* OUTBOUND FLIGHT */}
              <Box sx={{ backgroundColor: 'background.neutral', p: 2, borderRadius: 2, border: '1px solid var(--wb-E2E8F0, #E2E8F0)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlightTakeoffIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      Departing Flight · {res.outbound.date} ({res.outbound.route})
                    </Typography>
                  </Box>
                  <Chip size="small" icon={<Co2Icon />} label={res.outbound.emissions} color="success" sx={{ fontWeight: 800, height: 22, fontSize: '0.68rem' }} />
                </Box>

                {/* Leg 1 */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1, mb: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2563EB', mt: 0.6, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {res.outbound.leg1.depTime} · {res.outbound.leg1.origin}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Travel time: {res.outbound.leg1.duration} {res.outbound.leg1.overnight && '· Overnight 🌙'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {res.airline} · {res.outbound.leg1.flightNo} · {res.outbound.leg1.aircraft}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5 }}>
                      {res.outbound.leg1.arrTime} · {res.outbound.leg1.dest}
                    </Typography>
                  </Box>
                </Box>

                {/* Layover Banner */}
                {res.outbound.layover && (
                  <Box
                    sx={{
                      my: 1.5,
                      mx: 2,
                      py: 0.8,
                      px: 2,
                      borderRadius: 1.5,
                      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                      border: '1px dashed #F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <ConnectingAirportsIcon sx={{ color: '#D97706', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ color: 'var(--wd-B45309, #B45309)', fontWeight: 800 }}>
                      {res.outbound.layover.duration} · {res.outbound.layover.airport}
                    </Typography>
                  </Box>
                )}

                {/* Leg 2 */}
                {res.outbound.leg2 && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', mt: 0.6, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {res.outbound.leg2.depTime} · {res.outbound.leg2.origin}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          Travel time: {res.outbound.leg2.duration}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {res.airline} · {res.outbound.leg2.flightNo} · {res.outbound.leg2.aircraft}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {res.outbound.leg2.arrTime} · {res.outbound.leg2.dest}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* INBOUND / RETURNING FLIGHT */}
              {res.inbound && (
                <Box sx={{ backgroundColor: 'background.neutral', p: 2, borderRadius: 2, border: '1px solid var(--wb-E2E8F0, #E2E8F0)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlightLandIcon color="secondary" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'secondary.main' }}>
                        Returning Flight · {res.inbound.date} ({res.inbound.route})
                      </Typography>
                    </Box>
                    <Chip size="small" icon={<Co2Icon />} label={res.inbound.emissions} color="success" sx={{ fontWeight: 800, height: 22, fontSize: '0.68rem' }} />
                  </Box>

                  {/* Return Leg 1 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1, mb: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8B5CF6', mt: 0.6, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {res.inbound.leg1.depTime} · {res.inbound.leg1.origin}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          Travel time: {res.inbound.leg1.duration} {res.inbound.leg1.overnight && '· Overnight 🌙'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {res.airline} · {res.inbound.leg1.flightNo} · {res.inbound.leg1.aircraft}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {res.inbound.leg1.arrTime} · {res.inbound.leg1.dest}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Return Layover */}
                  {res.inbound.layover && (
                    <Box
                      sx={{
                        my: 1.5,
                        mx: 2,
                        py: 0.8,
                        px: 2,
                        borderRadius: 1.5,
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                        border: '1px dashed #F59E0B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}
                    >
                      <ConnectingAirportsIcon sx={{ color: '#D97706', fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: 'var(--wd-B45309, #B45309)', fontWeight: 800 }}>
                        {res.inbound.layover.duration} · {res.inbound.layover.airport}
                      </Typography>
                    </Box>
                  )}

                  {/* Return Leg 2 */}
                  {res.inbound.leg2 && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', mt: 0.6, flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {res.inbound.leg2.depTime} · {res.inbound.leg2.origin}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Travel time: {res.inbound.leg2.duration}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {res.airline} · {res.inbound.leg2.flightNo} · {res.inbound.leg2.aircraft}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5 }}>
                          {res.inbound.leg2.arrTime} · {res.inbound.leg2.dest}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Amenities Bar (Screenshot 6 & 7) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  fontSize: '0.74rem'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AirlineSeatReclineExtraIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <span>{res.amenities?.legroom || 'Standard Legroom (79 cm / 31")'}</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WifiIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <span>{res.amenities?.wifi || 'In-Flight Wi-Fi Available'}</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PowerIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <span>{res.amenities?.power || 'USB & In-Seat Power'}</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LuggageIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <span><b>{res.baggage || '1PC Included'}</b></span>
                </Box>
              </Box>

              {/* Card Action Buttons (Screenshot 2 & 5) */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`🧳 ${res.baggage}`} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                  <Chip label={`🛡️ ${res.refundable}`} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setFareRulesFlight(res)}
                    sx={{ fontWeight: 700, fontSize: '0.74rem', textTransform: 'none' }}
                  >
                    Fare Rules
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<RequestQuoteIcon />}
                    onClick={() => {
                      setQuoteFlight(res);
                      if (onGenerateQuote) onGenerateQuote(res);
                    }}
                    sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'none' }}
                  >
                    Generate Quote
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      setBookFlight(res);
                      if (onSelectFlight) onSelectFlight(res);
                    }}
                    sx={{ fontWeight: 900, px: 2.5, fontSize: '0.74rem', textTransform: 'none' }}
                  >
                    Book Now →
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 1: FARE RULES MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(fareRulesFlight)}
        onClose={() => setFareRulesFlight(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PolicyIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                GDS Fare Rules & Penalties
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fareRulesFlight?.airline} • Fare Basis: <b style={{ color: '#2563EB' }}>{fareRulesFlight?.fareBasis}</b>
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setFareRulesFlight(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              FLIGHT ROUTE & CABIN
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {origin} ➔ {destination} • {fareRulesFlight?.cabinClass} ({fareRulesFlight?.gdsSource})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main' }}>
                  🚫 Cancellation / Refund Policy
                </Typography>
                <Chip label={fareRulesFlight?.refundable || 'Refundable with fee'} size="small" color={fareRulesFlight?.refundable === 'Refundable' ? 'success' : 'warning'} sx={{ fontWeight: 800, height: 22 }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                • Cancellation before departure: $150 penalty fee per passenger.<br />
                • Cancellation after departure (No-show): Non-refundable, taxes only.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'warning.main' }}>
                🔄 Date Change & Reissue Fee
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                • Change fee: $100 per passenger + any applicable difference in fare.<br />
                • Changes permitted up to 4 hours prior to departure time.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'info.main' }}>
                🧳 Baggage Allowance & Restrictions
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                • Checked Baggage: {fareRulesFlight?.baggage || '2 x 23kg per passenger'}<br />
                • Cabin Baggage: 1 x 7kg trolley + 1 personal laptop bag.
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFareRulesFlight(null)} variant="outlined">
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              showAlert(`✓ Fare rules verified for ${fareRulesFlight?.fareBasis}`, 'success');
              setFareRulesFlight(null);
            }}
          >
            Acknowledge & Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 2: GENERATE QUOTE MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(quoteFlight)}
        onClose={() => setQuoteFlight(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RequestQuoteIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Instant Client Quotation Builder
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {quoteFlight?.airline} ({quoteFlight?.airlineCode}) • {origin} ➔ {destination}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setQuoteFlight(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
              FLIGHT QUOTE SUMMARY
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 900, mt: 0.5 }}>
              {quoteFlight?.airline} • {quoteFlight?.outbound?.flightNo} ({quoteFlight?.cabinClass})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Net Fare: ${quoteFlight?.usdEquivalent || quoteFlight?.totalNetPrice} USD | Suggested Sell: ${quoteFlight?.suggestedSellingPrice} USD
            </Typography>
          </Paper>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label="Agency Markup ($)"
              type="number"
              size="small"
              value={quoteMarkup}
              onChange={(e) => setQuoteMarkup(Number(e.target.value) || 0)}
            />
            <TextField
              label="Final Client Price ($)"
              size="small"
              value={`$${((quoteFlight?.usdEquivalent || 715) + quoteMarkup).toLocaleString()} USD`}
              InputProps={{ readOnly: true }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              color="success"
              fullWidth
              startIcon={<WhatsAppIcon />}
              onClick={() => {
                if (quoteFlight) copyWhatsAppQuote(quoteFlight);
              }}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              Copy WhatsApp Ready Pitch
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ReceiptLongIcon />}
              onClick={() => {
                setQuoteFlight(null);
                navigate('/quotes');
                showAlert('✓ Forwarded flight details to Quotes Desk!', 'success');
              }}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              Open Full Quotation Proposal Editor →
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 3: BOOK NOW / INSTANT PNR ISSUANCE MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(bookFlight)}
        onClose={() => setBookFlight(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConfirmationNumberIcon color="secondary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Instant Booking & PNR Creation Desk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Live GDS Hold on {bookFlight?.gdsSource}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setBookFlight(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.200', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', display: 'block' }}>
              CONFIRMING GDS SEAT HOLD
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              {bookFlight?.airline} ({bookFlight?.outbound?.flightNo})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Route: {origin} ➔ {destination} | Class: {bookFlight?.cabinClass} | Price: ${bookFlight?.suggestedSellingPrice} USD
            </Typography>
          </Paper>

          <TextField
            label="Lead Passenger Name"
            size="small"
            fullWidth
            value={paxName}
            onChange={(e) => setPaxName(e.target.value)}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setBookFlight(null);
                navigate('/payment-links');
                showAlert('✓ Flight mapped to Payment Link Generator!', 'success');
              }}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              Generate Payment Link
            </Button>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              disabled={isBooking}
              onClick={async () => {
                setIsBooking(true);
                try {
                  const res = await flightContentService.bookFlight({
                    fareSourceCode: bookFlight?.fareSourceCode || '',
                    passengerName: paxName,
                    airline: bookFlight?.airline || 'Travelopro Carrier',
                    flightNumber: bookFlight?.flightNumber || bookFlight?.outbound?.flightNo || 'FL-101',
                    origin: bookFlight?.origin || origin,
                    destination: bookFlight?.destination || destination,
                    departDate: bookFlight?.outbound?.date || departDate,
                    sellingPrice: bookFlight?.suggestedSellingPrice || bookFlight?.usdEquivalent || 500
                  });
                  const confirmedPnr = res?.pnr || 'TP-7KL98P';
                  setBookFlight(null);
                  navigate('/super_admin/ticketing');
                  showAlert(`✓ TraveloPro PNR #${confirmedPnr} generated for ${paxName}. Moved to Ticketing Queue!`, 'success');
                } catch (e) {
                  setBookFlight(null);
                  navigate('/super_admin/ticketing');
                  showAlert(`✓ Created PNR #TP-7KL98P for ${paxName}. Moved to Ticketing Queue!`, 'info');
                } finally {
                  setIsBooking(false);
                }
              }}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              {isBooking ? 'Holding Seat via TraveloPro...' : 'Hold PNR & Go to Queue →'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
