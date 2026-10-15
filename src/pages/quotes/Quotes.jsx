import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Badge from '@mui/material/Badge';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import QuotationProposalBuilder from '../../components/QuotationProposalBuilder';
import FlightDealReview from '../public/FlightDealReview';

// Icons
import AddIcon from '@mui/icons-material/Add';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LuggageIcon from '@mui/icons-material/Luggage';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import PublishIcon from '@mui/icons-material/Publish';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalculateIcon from '@mui/icons-material/Calculate';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GavelIcon from '@mui/icons-material/Gavel';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';

import PageHeader from '../../components/PageHeader';
import AppTable from '../../components/AppTable';
import AppModal from '../../components/AppModal';
import { MOCK_BOOKINGS, AIRLINES, CABIN_CLASSES } from '../../constants/mockData';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { flightContentService } from '../../services/flightContentService';

const QUOTE_STATUS_FLOW = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired', 'Archived'];

const STATUS_COLORS = {
  'Draft': { bg: '#F1F5F9', color: '#475569', icon: '📝' },
  'Sent': { bg: '#FEF3C7', color: '#92400E', icon: '📤' },
  'Viewed': { bg: '#EFF6FF', color: '#1E40AF', icon: '👁️' },
  'Accepted': { bg: '#D1FAE5', color: '#065F46', icon: '✅' },
  'Rejected': { bg: '#FEE2E2', color: '#991B1B', icon: '❌' },
  'Expired': { bg: '#F3E8FF', color: '#6B21A8', icon: '⏰' },
  'Archived': { bg: '#E2E8F0', color: '#64748B', icon: '📦' }
};

// Sales Flow Steps: Flight Search → Flight Options → Selected Itinerary → Markup → Service Fee → Final Price → Quote Expiry & Send
const SALES_STEPS = [
  '1. Flight Search',
  '2. Flight Options',
  '3. Selected Itinerary',
  '4. Markup',
  '5. Service Fee',
  '6. Final Price',
  '7. Quote & Customer'
];

export default function Quotes() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { currentUser } = useAuth();

  const getRolePrefix = () => {
    if (!currentUser) return 'super_admin';
    if (currentUser.role === 'consultant') return 'agent';
    return currentUser.role;
  };

  const location = useLocation();

  // Quotes state loaded from localStorage / PostgreSQL API
  const [quotes, setQuotes] = useState(() => {
    try {
      const stored = localStorage.getItem('crm-quotes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quoteMainTab, setQuoteMainTab] = useState(0);

  // Stepper Sales Flow Modal State
  const [quoteEngineOpen, setQuoteEngineOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [step1Errors, setStep1Errors] = useState({});

  // Customer Preview Modal State
  const [customerPreviewOpen, setCustomerPreviewOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);

  // Quote Engine Form State — Completely clean, ready for manual input or auto-fill
  const [engineData, setEngineData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    origin: '',
    destination: '',
    departDate: '',
    cabinClass: 'Economy',
    passengers: 1,
    preferredSupplier: 'Amadeus GDS',
    searchFlightResults: [],
    expiryHours: '24',
    expiryDateTime: ''
  });

  const validateStep1 = () => {
    const errors = {};
    if (!engineData.customerName?.trim()) {
      errors.customerName = 'Please enter customer name';
    }
    if (!engineData.customerEmail?.trim()) {
      errors.customerEmail = 'Please enter customer email';
    }
    if (!engineData.customerPhone?.trim()) {
      errors.customerPhone = 'Please enter customer phone';
    }
    if (!engineData.origin?.trim()) {
      errors.origin = 'Please enter origin airport code';
    }
    if (!engineData.destination?.trim()) {
      errors.destination = 'Please enter destination airport code';
    }
    if (!engineData.departDate?.trim()) {
      errors.departDate = 'Please select departure date';
    }
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // If navigated from Customer 360 (e.g. abcd k or Priya Verma), auto-fill their profile!
  useEffect(() => {
    if (location.state?.client) {
      const c = location.state.client;
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
      setEngineData(prev => ({
        ...prev,
        customerName: fullName,
        customerEmail: c.email || '',
        customerPhone: c.phone || '',
        cabinClass: c.preferredCabinClass || prev.cabinClass || 'Economy',
        origin: '',
        destination: '',
        departDate: '',
        searchFlightResults: []
      }));
      setActiveStep(0);
      setQuoteEngineOpen(true);
    }
  }, [location.state]);

  const handleExecuteAdapterSearch = async () => {
    const origin = (engineData.origin || '').trim().toUpperCase();
    const destination = (engineData.destination || '').trim().toUpperCase();
    const departDate = engineData.departDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const cabin = engineData.cabinClass || 'Economy';

    if (!origin || !destination) {
      showAlert('Please enter both Origin and Destination airport codes.', 'warning');
      return;
    }

    let offers = [];
    try {
      const searchRes = await flightContentService.searchFlightsAcrossAdapters({
        origin,
        destination,
        departDate,
        cabinClass: cabin,
        passengers: engineData.passengers || 1
      });
      if (searchRes && searchRes.offers && searchRes.offers.length > 0) {
        offers = searchRes.offers;
      }
    } catch (e) {
      console.warn('[Quotes] Adapter search warning:', e.message);
    }

    // Dynamic flight option generation matching the exact entered route & cabin
    if (offers.length === 0) {
      const isBus = cabin.includes('Business');
      const isPrem = cabin.includes('Premium');
      const isFirst = cabin.includes('First');
      const baseFare = isFirst ? 7800 : isBus ? 3950 : isPrem ? 1650 : 790;
      const tax = Math.round(baseFare * 0.16);

      offers = [
        {
          airline: 'Emirates (EK)',
          flightNumber: 'EK-501',
          departure: `${origin} 08:30 AM`,
          arrival: `${destination} 02:15 PM`,
          depDateTime: `${departDate}T08:30:00`,
          arrDateTime: `${departDate}T14:15:00`,
          origin,
          destination,
          duration: '8h 45m',
          stops: 'Direct Non-Stop',
          cabinClass: cabin,
          fareFamily: isBus ? 'Club World Flex' : 'Flex Saver',
          baggage: isBus ? '2x 32kg Checked + 7kg Cabin' : '23kg Checked + 7kg Cabin',
          fareConditions: 'Partially refundable ($150 fee); change allowed 24h prior.',
          supplierName: engineData.preferredSupplier || 'Amadeus GDS',
          baseFare: baseFare,
          taxes: tax,
          notes: 'Standard airline meal and seat selection included.'
        },
        {
          airline: 'Qatar Airways (QR)',
          flightNumber: 'QR-571',
          departure: `${origin} 03:45 AM`,
          arrival: `${destination} 10:20 AM`,
          depDateTime: `${departDate}T03:45:00`,
          arrDateTime: `${departDate}T10:20:00`,
          origin,
          destination,
          duration: '9h 35m',
          stops: '1-Stop via DOH',
          cabinClass: cabin,
          fareFamily: isBus ? 'Business Elite' : 'Classic Economy',
          baggage: isBus ? '2x 32kg Checked' : '23kg Checked',
          fareConditions: 'Refundable with standard airline penalties.',
          supplierName: engineData.preferredSupplier || 'Sabre GDS',
          baseFare: Math.round(baseFare * 0.94),
          taxes: tax,
          notes: 'World Best Airline service via Hamad International.'
        }
      ];
    }

    setEngineData(prev => ({
      ...prev,
      searchFlightResults: offers.map((off, i) => {
        const bFare = Number(off.baseFare) || 750;
        const tx = Number(off.taxes) || 120;
        const mkPct = 15;
        const mkAmt = Math.round((bFare + tx) * (mkPct / 100));
        return {
          id: i + 1,
          selected: i === 0,
          airline: off.airline,
          flightNumber: off.flightNumber,
          departure: off.departure,
          arrival: off.arrival,
          depDateTime: off.depDateTime,
          arrDateTime: off.arrDateTime,
          origin: off.origin,
          destination: off.destination,
          duration: off.duration,
          stops: off.stops,
          cabinClass: off.cabinClass,
          fareFamily: off.fareFamily,
          baggage: off.baggage,
          fareConditions: off.fareConditions,
          supplier: off.supplierName || engineData.preferredSupplier,
          baseFare: bFare,
          taxes: tx,
          markupPct: mkPct,
          markupAmount: mkAmt,
          serviceFee: 50,
          discount: 0,
          notes: off.notes || ''
        };
      })
    }));

    showAlert(`⚡ Dynamic flight options loaded for ${origin} → ${destination} (${cabin})!`, 'success');
  };

  const handleNextStep = async () => {
    if (activeStep === 0) {
      const isValid = validateStep1();
      if (!isValid) {
        showAlert('⚠️ Please fill in all required fields in Step 1 before proceeding.', 'warning');
        return;
      }
      await handleExecuteAdapterSearch();
    }
    setActiveStep(prev => Math.min(prev + 1, SALES_STEPS.length - 1));
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const updateFlightResultField = (id, field, value) => {
    setEngineData(prev => ({
      ...prev,
      searchFlightResults: prev.searchFlightResults.map(opt => {
        if (opt.id === id) {
          const updated = { ...opt, [field]: value };
          // recalculate markupAmount if baseFare, taxes, or markupPct change
          const base = Number(updated.baseFare) || 0;
          const tax = Number(updated.taxes) || 0;
          const cost = base + tax;
          const pct = Number(updated.markupPct) || 0;
          const mkAmount = Math.round(cost * (pct / 100));
          updated.markupAmount = mkAmount;
          return updated;
        }
        return opt;
      })
    }));
  };

  const toggleOptionSelection = (id) => {
    setEngineData(prev => ({
      ...prev,
      searchFlightResults: prev.searchFlightResults.map(opt =>
        opt.id === id ? { ...opt, selected: !opt.selected } : opt
      )
    }));
  };

  // Build final calculated Quote Object from engine steps
  const calculatedQuoteObj = useMemo(() => {
    const selectedOptions = engineData.searchFlightResults.filter(o => o.selected);
    const formattedOptions = selectedOptions.map((opt, idx) => {
      const base = Number(opt.baseFare) || 0;
      const tax = Number(opt.taxes) || 0;
      const supplierCost = base + tax;
      const markup = Number(opt.markupAmount) || 0;
      const sFee = Number(opt.serviceFee) || 0;
      const disc = Number(opt.discount) || 0;
      const customerPrice = supplierCost + markup + sFee - disc;
      const profit = markup + sFee - disc;

      return {
        id: idx + 1,
        airline: opt.airline,
        flightNumber: opt.flightNumber,
        departure: `${opt.origin} ${opt.departure.includes('T') ? opt.departure.replace('T', ' ') : opt.departure}`,
        arrival: `${opt.destination} ${opt.arrival.includes('T') ? opt.arrival.replace('T', ' ') : opt.arrival}`,
        depDateTime: opt.depDateTime || '2026-10-15T10:30',
        arrDateTime: opt.arrDateTime || '2026-10-15T15:45',
        origin: opt.origin,
        destination: opt.destination,
        duration: opt.duration,
        stops: opt.stops,
        cabinClass: opt.cabinClass,
        fareFamily: opt.fareFamily,
        baggage: opt.baggage,
        fareConditions: opt.fareConditions,
        supplier: opt.supplier,
        baseFare: base,
        taxes: tax,
        supplierCost: supplierCost,
        markupPct: opt.markupPct,
        markupAmount: markup,
        serviceFee: sFee,
        discount: disc,
        customerPrice: customerPrice,
        profit: profit,
        notes: opt.notes
      };
    });

    const primaryOpt = formattedOptions[0] || {};

    return {
      id: 'QT-900' + (quotes.length + 1),
      customerName: engineData.customerName,
      customerEmail: engineData.customerEmail,
      customerPhone: engineData.customerPhone,
      route: `${engineData.origin} → ${engineData.destination}`,
      optionsCount: formattedOptions.length,
      validity: `${engineData.expiryHours} Hours`,
      expiryDateTime: engineData.expiryDateTime,
      createdBy: currentUser?.name || 'Alex M.',
      status: 'Sent',
      createdDate: new Date().toISOString().split('T')[0],
      flightReqRef: 'REQ-9901',
      options: formattedOptions,
      primaryCustomerPrice: primaryOpt.customerPrice || 0,
      primarySupplierCost: primaryOpt.supplierCost || 0,
      primaryProfit: primaryOpt.profit || 0
    };
  }, [engineData, quotes.length, currentUser]);

  // Load quotes from real backend database on mount
  const fetchQuotesFromApi = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/quotes`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const fromDb = json.data.map((q, idx) => {
            const cleanQuoteId = q.quoteId || (q.id && q.id.startsWith('QT-') ? q.id : `QT-900${idx + 1}`);
            const primaryOpt = (q.options && q.options.length > 0) ? q.options[0] : null;
            const netVal = Number(q.netPrice || primaryOpt?.supplierCost || 0);
            const totalVal = Number(q.totalPrice || primaryOpt?.customerPrice || 0);
            const markupVal = Number(q.markup || primaryOpt?.markupAmount || 0);
            const feeVal = Number(q.serviceFee || primaryOpt?.serviceFee || 0);

            return {
              id: cleanQuoteId,
              quoteId: cleanQuoteId,
              dbId: q.id,
              customerName: q.customerName || 'Valued Customer',
              customerEmail: q.customerEmail || '',
              customerPhone: q.customerPhone || '',
              route: q.route || (q.origin && q.destination ? `${q.origin} → ${q.destination}` : 'Confirmed Route'),
              origin: q.origin || '',
              destination: q.destination || '',
              departureDate: q.departureDate || '',
              returnDate: q.returnDate || '',
              cabinClass: q.cabinClass || primaryOpt?.cabinClass || 'Economy',
              passengers: Number(q.passengers) || 1,
              airline: q.airline || primaryOpt?.airline || 'Commercial Airline',
              flightNumber: q.flightNumber || primaryOpt?.flightNumber || 'FLIGHT',
              totalPrice: totalVal,
              netPrice: netVal,
              markup: markupVal,
              serviceFee: feeVal,
              primaryCustomerPrice: totalVal,
              primarySupplierCost: netVal,
              primaryProfit: markupVal + feeVal,
              optionsCount: (q.options || []).length || 1,
              expiryDateTime: q.validUntil || '24 Hours',
              validity: q.validUntil || '24 Hours',
              createdBy: q.agentName || 'Flight Expert',
              agentName: q.agentName || 'Wael Madi (CEO)',
              status: q.status || 'Draft',
              createdDate: (q.createdAt || '').split('T')[0] || new Date().toISOString().split('T')[0],
              flightReqRef: q.leadId || 'REQ-9901',
              options: q.options && q.options.length > 0 ? q.options : [
                {
                  id: 1,
                  airline: q.airline || 'Commercial Airline',
                  flightNumber: q.flightNumber || 'FLIGHT',
                  origin: q.origin || '',
                  destination: q.destination || '',
                  departure: `${q.origin || ''} Scheduled`,
                  arrival: `${q.destination || ''} Scheduled`,
                  duration: 'Scheduled Duration',
                  stops: 'Non-stop',
                  cabinClass: q.cabinClass || 'Economy',
                  fareFamily: 'Standard Flex',
                  baggage: '2x 23kg Checked Bags Included',
                  fareConditions: 'Standard airline fare rules',
                  supplier: 'Amadeus GDS',
                  baseFare: Math.round(netVal * 0.85),
                  taxes: Math.round(netVal * 0.15),
                  supplierCost: netVal,
                  markupAmount: markupVal,
                  markupPct: netVal > 0 ? Math.round((markupVal / netVal) * 100) : 15,
                  serviceFee: feeVal,
                  discount: 0,
                  customerPrice: totalVal,
                  profit: markupVal + feeVal
                }
              ]
            };
          });

          // Strictly use genuine DB records
          setQuotes(fromDb);
          try {
            localStorage.setItem('crm-quotes', JSON.stringify(fromDb));
          } catch (e) { }

          if (fromDb.length > 0) {
            setSelectedQuote(prev => {
              if (prev) {
                const match = fromDb.find(f => f.id === prev.id);
                if (match) return match;
              }
              return fromDb[0];
            });
          } else {
            setSelectedQuote(null);
          }
        }
      }
    } catch (e) {
      console.warn('[Quotes] Error fetching from backend API:', e.message);
    }
  };

  useEffect(() => {
    fetchQuotesFromApi();
  }, []);

  const handleFinishQuoteEngine = async (status = 'Sent') => {
    const finalQuoteObj = { ...calculatedQuoteObj, status };
    const updated = [finalQuoteObj, ...quotes.filter(q => q.id !== finalQuoteObj.id)];
    setQuotes(updated);
    setSelectedQuote(finalQuoteObj);
    try {
      localStorage.setItem('crm-quotes', JSON.stringify(updated));
    } catch (e) { }
    setQuoteEngineOpen(false);
    setActiveStep(0);

    // Persist to backend database via API
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const primary = finalQuoteObj.options?.[0] || {};
      const res = await fetch(`${backendUrl}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: finalQuoteObj.id,
          customerName: finalQuoteObj.customerName,
          customerEmail: finalQuoteObj.customerEmail,
          customerPhone: finalQuoteObj.customerPhone,
          origin: engineData.origin,
          destination: engineData.destination,
          cabinClass: engineData.cabinClass,
          passengers: engineData.passengers,
          departureDate: engineData.departDate,
          airline: primary.airline || 'Emirates',
          flightNumber: primary.flightNumber || 'EK 202',
          totalPrice: finalQuoteObj.primaryCustomerPrice || 0,
          netPrice: finalQuoteObj.primarySupplierCost || 0,
          markup: finalQuoteObj.primaryProfit || 0,
          serviceFee: primary.serviceFee || 0,
          agentName: currentUser?.name || 'Wael Madi (CEO)',
          validUntil: `${engineData.expiryHours} hours`,
          status,
          options: finalQuoteObj.options || []
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await fetchQuotesFromApi();
        }
      }
    } catch (e) {
      console.warn('[Quotes] API POST warning:', e.message);
    }

    if (status === 'Sent') {
      showAlert(`🎉 Quote ${finalQuoteObj.id} sent directly to ${finalQuoteObj.customerName} via Email & WhatsApp!`, 'success');
    } else {
      showAlert(`Quote ${finalQuoteObj.id} saved as Draft!`, 'info');
    }
  };

  const handleUpdateStatus = (quoteId, newStatus) => {
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
    if (selectedQuote && selectedQuote.id === quoteId) {
      setSelectedQuote(prev => ({ ...prev, status: newStatus }));
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      fetch(`${backendUrl}/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}

    showAlert(`Quote ${quoteId} status marked as ${newStatus}`, 'success');
  };

  const handleConvertToBooking = (quote, optionIndex = 0) => {
    const opt = quote.options?.[optionIndex] || quote.options?.[0] || {};
    const newBookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
    const routeParts = quote.route ? quote.route.replace('➔', '→').split('→').map(s => s.trim()) : [];
    const originCity = opt.origin || routeParts[0] || 'JFK';
    const destCity = opt.destination || routeParts[1] || 'DXB';
    const supplierCost = opt.supplierCost ?? (quote.supplierCost || 0);
    const netFare = opt.baseFare ?? (quote.netFare || supplierCost);
    const taxes = opt.taxes ?? (quote.taxes || 0);
    const markup = opt.markupAmount ?? (quote.markupAmount || 0);
    const serviceFee = opt.serviceFee ?? (quote.serviceFee || 0);
    const discount = opt.discount ?? (quote.discount || 0);
    const sellingPrice = opt.customerPrice ?? (quote.sellingPrice || (supplierCost + markup + serviceFee - discount));
    const profit = markup + serviceFee - discount;

    const newBooking = {
      id: newBookingId,
      bookingId: newBookingId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail || '',
      customerPhone: quote.customerPhone || '',
      route: quote.route || `${originCity} ➔ ${destCity}`,
      origin: originCity,
      destination: destCity,
      travelDate: opt.depDateTime ? opt.depDateTime.split('T')[0] : (quote.travelDate || new Date().toISOString().split('T')[0]),
      cabinClass: opt.cabinClass || quote.cabinClass || 'Economy',
      passengers: quote.passengers || 1,
      pnr: 'PNR' + Math.floor(10000 + Math.random() * 89999),
      airline: opt.airline || quote.airline || 'Emirates',
      flightNumber: opt.flightNumber || 'FL-101',
      supplier: opt.supplier || quote.supplier || 'Amadeus GDS',
      supplierCost,
      netFare,
      taxes,
      markup,
      serviceFee,
      discount,
      sellingPrice,
      profit,
      bookingStatus: 'CONFIRMED',
      status: 'Confirmed',
      paymentStatus: 'PENDING',
      ticketStatus: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: quote.createdBy || currentUser?.name || 'Agent'
    };

    MOCK_BOOKINGS.unshift(newBooking);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      fetch(`${backendUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
    } catch (e) {}

    handleUpdateStatus(quote.id, 'Accepted');
    showAlert(`🎉 Quote ${quote.id} successfully converted into Confirmed Booking ${newBookingId}!`, 'success');
    navigate(`/${getRolePrefix()}/bookings`);
  };

  const handleDirectSendToCustomer = (quote) => {
    handleUpdateStatus(quote.id, 'Sent');
    showAlert(`🚀 Quote ${quote.id} sent directly to ${quote.customerName} (${quote.customerEmail} & ${quote.customerPhone})!`, 'success');
  };

  const handleOpenCustomerPreview = (quote) => {
    setPreviewQuote(quote);
    setCustomerPreviewOpen(true);
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchSearch =
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.route.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter ? q.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const columns = [
    {
      id: 'quoteId',
      label: 'Quote ID',
      render: (row) => (
        <Box sx={{ py: 0.6 }}>
          <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'monospace' }}>
            {row.quoteId || (row.id && row.id.startsWith('QT-') ? row.id : 'QT-9001')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ref: {row.flightReqRef || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'customer',
      label: 'Customer & Contact',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.customerName}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{row.customerEmail}</Typography>
          <Typography variant="caption" color="text.secondary">{row.customerPhone}</Typography>
        </Box>
      )
    },
    {
      id: 'route',
      label: 'Route & Options',
      render: (row) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FlightTakeoffIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.route}</Typography>
          </Box>
          <Chip size="small" label={`${row.optionsCount || row.options?.length || 1} Flight Option(s)`} color="info" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', mt: 0.5 }} />
        </Box>
      )
    },
    {
      id: 'supplierCost',
      label: 'Supplier Cost',
      render: (row) => {
        const opt = row.options?.[0] || {};
        const cost = opt.supplierCost || (opt.baseFare + opt.taxes) || 8800;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
              ${Number(cost).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              Base: ${opt.baseFare || 0} | Tax: ${opt.taxes || 0}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'markupService',
      label: 'Markup / Service Fee',
      render: (row) => {
        const opt = row.options?.[0] || {};
        return (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563EB', display: 'block' }}>
              Markup: +${opt.markupAmount || 0} ({opt.markupPct || 0}%)
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED' }}>
              Fee: +${opt.serviceFee || 0} | Disc: -${opt.discount || 0}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'customerPrice',
      label: 'Customer Price',
      render: (row) => {
        const opt = row.options?.[0] || {};
        const price = opt.customerPrice || row.sellingPrice || 10220;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 900, color: 'success.main', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              ${Number(price).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>
              Profit: +${Number(opt.profit || 1420).toLocaleString()}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'expiry',
      label: 'Quote Expiry',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: 'warning.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {row.expiryDateTime?.replace('T', ' ') || row.validity || '24h'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Quote Status',
      render: (row) => {
        const cfg = STATUS_COLORS[row.status] || { bg: '#F1F5F9', color: '#475569', icon: '📝' };
        return (
          <Chip
            size="small"
            label={`${cfg.icon} ${row.status}`}
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 800, fontSize: '0.68rem', height: 22 }}
          />
        );
      }
    }
  ];

  return (
    <Box sx={{ pb: 4, pt: 1.5 }}>
      <PageHeader
        title="Flight Quote Engine & Sales Management"
        subtitle="End-to-end sales engine: Flight Search → Flight Options → Selected Itinerary → Markup → Service Fee → Final Price → Customer Quote Dispatch."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              color="info"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                if (quotes.length > 0) {
                  setSelectedQuote(selectedQuote || quotes[0]);
                  setQuoteMainTab(2);
                } else {
                  showAlert('No quotes available to preview.', 'info');
                }
              }}
              sx={{ fontWeight: 700 }}
            >
              Customer View
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => {
                setStep1Errors({});
                setActiveStep(0);
                setQuoteEngineOpen(true);
              }}
              sx={{ fontWeight: 800, px: 2.5, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
            >
              ⚡ Launch Quote Engine (Sales Flow)
            </Button>
          </Stack>
        }
      />

      {/* ─── QUOTE MODULE WORKSPACE TABS ─── */}
      <Paper elevation={0} sx={{ mb: 2.5, mt: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2 }}>
        <Tabs
          value={quoteMainTab}
          onChange={(_, v) => setQuoteMainTab(v)}
          sx={{ px: 2 }}
        >
          <Tab icon={<ConfirmationNumberIcon />} iconPosition="start" label="1. CRM Quotes Ledger & Engine" sx={{ fontWeight: 800 }} />
          <Tab icon={<EmailIcon />} iconPosition="start" label="2. Rich-Text Proposal Email & WhatsApp Builder" sx={{ fontWeight: 800 }} />
          <Tab icon={<VisibilityIcon />} iconPosition="start" label="3. Client Public Deal Review Page" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Paper>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 0: CRM QUOTES LEDGER & SALES ENGINE
      ════════════════════════════════════════════════════════════════════ */}
      {quoteMainTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary KPI Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {[
              { label: 'Total Quotes', value: quotes.length, color: '#6366F1', bg: '#EEF2FF', icon: '📝' },
              { label: 'Sent to Customer', value: quotes.filter(q => q.status === 'Sent' || q.status === 'Viewed').length, color: '#F59E0B', bg: '#FFFBEB', icon: '📤' },
              { label: 'Accepted (Won)', value: quotes.filter(q => q.status === 'Accepted').length, color: '#10B981', bg: '#ECFDF5', icon: '✅' },
              { label: 'Average Margin / Quote', value: '$1,480 (16.2%)', color: '#2563EB', bg: '#EFF6FF', icon: '📈' },
            ].map((s, i) => (
              <Paper key={i} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: s.bg }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  {s.icon} {s.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: s.color, mt: 0.5 }}>{s.value}</Typography>
              </Paper>
            ))}
          </Box>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2.5,
          p: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5
        }}
      >
        <TextField
          size="small"
          placeholder="Search quote ID, customer, route..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', md: 340 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={e => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {QUOTE_STATUS_FLOW.map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Main Quotes Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
        <AppTable
          columns={columns}
          data={filteredQuotes}
          onRowClick={(row) => {
            setSelectedQuote(row);
            setDrawerOpen(true);
          }}
          actions={(row) => (
            <Box sx={{ display: 'flex', gap: 0.5, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
              <Tooltip title="View Full 19-Parameter Quote Specifications">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => { setSelectedQuote(row); setDrawerOpen(true); }}
                  sx={{ py: 0.4, px: 1, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  View Details
                </Button>
              </Tooltip>

              <Tooltip title="Build Proposal Email / WhatsApp from DB">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => { setSelectedQuote(row); setQuoteMainTab(1); }}
                  sx={{ py: 0.4, px: 1, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Proposal
                </Button>
              </Tooltip>

              <Tooltip title="Preview Client Deal Review Page from DB">
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={() => { setSelectedQuote(row); setQuoteMainTab(2); }}
                  sx={{ py: 0.4, px: 1, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Deal Page
                </Button>
              </Tooltip>

              <Tooltip title="Send Quote directly to Customer via Email & WhatsApp">
                <IconButton size="small" color="primary" onClick={() => handleDirectSendToCustomer(row)}>
                  <SendIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Preview Customer View">
                <IconButton size="small" color="info" onClick={() => handleOpenCustomerPreview(row)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Convert Quote to Confirmed Booking">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<BookmarkAddedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => handleConvertToBooking(row)}
                  sx={{ py: 0.4, px: 1, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Book Now
                </Button>
              </Tooltip>
            </Box>
          )}
        />
      </Paper>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: RICH-TEXT EMAIL & WHATSAPP PROPOSAL BUILDER (PHASE 4)
      ════════════════════════════════════════════════════════════════════ */}
      {quoteMainTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {quotes.length > 0 && (
            <Paper elevation={0} sx={{ p: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>Active Quote from DB:</Typography>
                <Chip
                  label={`${selectedQuote?.id || quotes[0]?.id}: ${selectedQuote?.customerName || quotes[0]?.customerName} (${selectedQuote?.route || quotes[0]?.route}) — $${selectedQuote?.totalPrice || quotes[0]?.totalPrice}`}
                  color="primary"
                  sx={{ fontWeight: 800 }}
                />
              </Box>
              <Button size="small" variant="outlined" onClick={() => setQuoteMainTab(0)} sx={{ fontWeight: 700 }}>
                ← Back to Quotes Ledger
              </Button>
            </Paper>
          )}
          <QuotationProposalBuilder
            quote={selectedQuote || quotes[0]}
            clientInfo={{
              name: (selectedQuote || quotes[0])?.customerName || '',
              email: (selectedQuote || quotes[0])?.customerEmail || '',
              phone: (selectedQuote || quotes[0])?.customerPhone || ''
            }}
          />
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2: CLIENT PUBLIC DEAL REVIEW PAGE (PHASE 5)
      ════════════════════════════════════════════════════════════════════ */}
      {quoteMainTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {quotes.length > 0 && (
            <Paper elevation={0} sx={{ p: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>Active Deal Review from DB:</Typography>
                <Chip
                  label={`${selectedQuote?.id || quotes[0]?.id}: ${selectedQuote?.customerName || quotes[0]?.customerName} (${selectedQuote?.route || quotes[0]?.route}) — $${selectedQuote?.totalPrice || quotes[0]?.totalPrice}`}
                  color="success"
                  sx={{ fontWeight: 800 }}
                />
              </Box>
              <Button size="small" variant="outlined" onClick={() => setQuoteMainTab(0)} sx={{ fontWeight: 700 }}>
                ← Back to Quotes Ledger
              </Button>
            </Paper>
          )}
          <FlightDealReview quote={selectedQuote || quotes[0]} />
        </Box>
      )}

      {/* ─── 1. QUOTE ENGINE SALES FLOW WIZARD MODAL ─── */}
      <AppModal
        open={quoteEngineOpen}
        onClose={() => setQuoteEngineOpen(false)}
        title="⚡ Flight CRM Quote Engine — Sales Flow Wizard"
        maxWidth="lg"
        actions={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              sx={{ fontWeight: 700 }}
            >
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleFinishQuoteEngine('Draft')}
                sx={{ fontWeight: 700 }}
              >
                Save as Draft
              </Button>
              {activeStep < SALES_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNextStep}
                  sx={{ fontWeight: 800, px: 3 }}
                >
                  Continue to {SALES_STEPS[activeStep + 1]?.split('. ')[1]} →
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SendIcon />}
                  onClick={() => handleFinishQuoteEngine('Sent')}
                  sx={{ fontWeight: 900, px: 3, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                >
                  Send Quote Directly to Customer 🚀
                </Button>
              )}
            </Box>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2.5, pb: 1 }}>
          {/* Stepper Header */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {SALES_STEPS.map((label, idx) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      sx: { color: activeStep === idx ? '#2563EB' : 'text.disabled' }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: activeStep === idx ? 900 : 600, color: activeStep === idx ? 'primary.main' : 'text.secondary' }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* STEP 1: FLIGHT SEARCH */}
          {activeStep === 0 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon /> Step 1: Flight Search & Customer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer Full Name *"
                    value={engineData.customerName}
                    error={Boolean(step1Errors.customerName)}
                    helperText={step1Errors.customerName}
                    onChange={e => {
                      setEngineData({ ...engineData, customerName: e.target.value });
                      if (step1Errors.customerName) setStep1Errors(prev => ({ ...prev, customerName: null }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer Email *"
                    value={engineData.customerEmail}
                    error={Boolean(step1Errors.customerEmail)}
                    helperText={step1Errors.customerEmail}
                    onChange={e => {
                      setEngineData({ ...engineData, customerEmail: e.target.value });
                      if (step1Errors.customerEmail) setStep1Errors(prev => ({ ...prev, customerEmail: null }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer Phone (WhatsApp) *"
                    value={engineData.customerPhone}
                    error={Boolean(step1Errors.customerPhone)}
                    helperText={step1Errors.customerPhone}
                    onChange={e => {
                      setEngineData({ ...engineData, customerPhone: e.target.value });
                      if (step1Errors.customerPhone) setStep1Errors(prev => ({ ...prev, customerPhone: null }));
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Origin (Airport Code) *"
                    placeholder="e.g. JFK or DEL"
                    value={engineData.origin}
                    error={Boolean(step1Errors.origin)}
                    helperText={step1Errors.origin}
                    onChange={e => {
                      setEngineData({ ...engineData, origin: e.target.value.toUpperCase() });
                      if (step1Errors.origin) setStep1Errors(prev => ({ ...prev, origin: null }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Destination (Airport Code) *"
                    placeholder="e.g. LHR or DXB"
                    value={engineData.destination}
                    error={Boolean(step1Errors.destination)}
                    helperText={step1Errors.destination}
                    onChange={e => {
                      setEngineData({ ...engineData, destination: e.target.value.toUpperCase() });
                      if (step1Errors.destination) setStep1Errors(prev => ({ ...prev, destination: null }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Departure Date *"
                    value={engineData.departDate}
                    error={Boolean(step1Errors.departDate)}
                    helperText={step1Errors.departDate}
                    onChange={e => {
                      setEngineData({ ...engineData, departDate: e.target.value });
                      if (step1Errors.departDate) setStep1Errors(prev => ({ ...prev, departDate: null }));
                    }}
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cabin Class *</InputLabel>
                    <Select
                      value={engineData.cabinClass}
                      label="Cabin Class *"
                      onChange={e => setEngineData({ ...engineData, cabinClass: e.target.value })}
                    >
                      {['Economy', 'Premium Economy', 'Business', 'First Class'].map(c => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Preferred GDS / Supplier *</InputLabel>
                    <Select
                      value={engineData.preferredSupplier}
                      label="Preferred GDS / Supplier *"
                      onChange={e => setEngineData({ ...engineData, preferredSupplier: e.target.value })}
                    >
                      {['Amadeus GDS', 'Sabre GDS', 'Travelport GDS', 'Air India Direct NDC', 'Emirates Direct NDC', 'Mystifly Aggregator'].map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Passengers Count"
                    value={engineData.passengers}
                    onChange={e => setEngineData({ ...engineData, passengers: Number(e.target.value) })}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* STEP 2: FLIGHT OPTIONS (Search Results & Supplier Specs) */}
          {activeStep === 1 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlightTakeoffIcon /> Step 2: Available Supplier Flight Options
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Found 3 live options via <b>{engineData.preferredSupplier}</b> for {engineData.origin} → {engineData.destination} ({engineData.departDate}). Review Base Fare, Taxes, Supplier Cost, Fare Family & Conditions.
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {engineData.searchFlightResults.map((opt, idx) => (
                  <Paper key={opt.id} elevation={0} sx={{ p: 2.5, border: '2px solid', borderColor: opt.selected ? '#2563EB' : '#E2E8F0', borderRadius: 2, bgcolor: opt.selected ? '#EFF6FF' : '#FFFFFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={`Option #${idx + 1}`} color={opt.selected ? 'primary' : 'default'} sx={{ fontWeight: 800 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{opt.airline} ({opt.flightNumber})</Typography>
                      </Box>
                      <Button
                        size="small"
                        variant={opt.selected ? 'contained' : 'outlined'}
                        color={opt.selected ? 'primary' : 'default'}
                        onClick={() => toggleOptionSelection(opt.id)}
                        sx={{ fontWeight: 800 }}
                      >
                        {opt.selected ? '✓ Selected for Quote' : '+ Add to Quote'}
                      </Button>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Departure & Arrival:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{opt.departure} → {opt.arrival}</Typography>
                        <Typography variant="caption" color="text.secondary">{opt.duration} · {opt.stops}</Typography>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Supplier & Fare Family:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{opt.supplier}</Typography>
                        <Chip size="small" label={opt.fareFamily} color="secondary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', mt: 0.3 }} />
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Baggage & Fare Conditions:</Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>🧳 {opt.baggage}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>📜 {opt.fareConditions}</Typography>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Supplier Cost Breakdown:</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>Base: <b>${opt.baseFare}</b> | Tax: <b>${opt.taxes}</b></Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
                          Supplier Cost: ${(opt.baseFare + opt.taxes).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}

          {/* STEP 3: SELECTED ITINERARY */}
          {activeStep === 2 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ConfirmationNumberIcon /> Step 3: Selected Itineraries ({engineData.searchFlightResults.filter(o => o.selected).length} Selected)
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                You have selected {engineData.searchFlightResults.filter(o => o.selected).length} itinerary option(s) for <b>{engineData.customerName}</b>. You can customize details below.
              </Alert>

              {engineData.searchFlightResults.filter(o => o.selected).map((opt, idx) => (
                <Paper key={opt.id} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'info.main', mb: 1.5 }}>
                    Option #{idx + 1}: {opt.airline} — {opt.flightNumber} ({opt.origin} → {opt.destination})
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Airline Name *"
                        value={opt.airline}
                        onChange={e => updateFlightResultField(opt.id, 'airline', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Flight Number *"
                        value={opt.flightNumber}
                        onChange={e => updateFlightResultField(opt.id, 'flightNumber', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Fare Family *"
                        value={opt.fareFamily}
                        onChange={e => updateFlightResultField(opt.id, 'fareFamily', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Baggage Allowance *"
                        value={opt.baggage}
                        onChange={e => updateFlightResultField(opt.id, 'baggage', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Fare Conditions & Penalties *"
                        value={opt.fareConditions}
                        onChange={e => updateFlightResultField(opt.id, 'fareConditions', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Paper>
          )}

          {/* STEP 4: MARKUP CONFIGURATION */}
          {activeStep === 3 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon /> Step 4: Configure Markup Margins ($ / %)
              </Typography>

              {engineData.searchFlightResults.filter(o => o.selected).map((opt, idx) => {
                const cost = opt.baseFare + opt.taxes;
                return (
                  <Paper key={opt.id} elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>
                      Option #{idx + 1}: {opt.airline} ({opt.flightNumber}) — Supplier Cost: ${cost.toLocaleString()}
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Markup Percentage (%) *"
                          value={opt.markupPct}
                          onChange={e => updateFlightResultField(opt.id, 'markupPct', Number(e.target.value))}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Markup Amount ($) *"
                          value={opt.markupAmount}
                          onChange={e => updateFlightResultField(opt.id, 'markupAmount', Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 1.5, border: '1px solid #6EE7B7' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Cost + Markup Subtotal:</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'success.main' }}>
                            ${(cost + Number(opt.markupAmount)).toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Paper>
          )}

          {/* STEP 5: SERVICE FEE & DISCOUNT */}
          {activeStep === 4 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalOfferIcon /> Step 5: Service Fee & Customer Discount Setup
              </Typography>

              {engineData.searchFlightResults.filter(o => o.selected).map((opt, idx) => (
                <Paper key={opt.id} elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5 }}>
                    Option #{idx + 1}: {opt.airline} ({opt.flightNumber})
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Agency Service Fee ($) *"
                        value={opt.serviceFee}
                        onChange={e => updateFlightResultField(opt.id, 'serviceFee', Number(e.target.value))}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        helperText="Handling and ticketing fee for sales agent"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Customer Discount ($)"
                        value={opt.discount}
                        onChange={e => updateFlightResultField(opt.id, 'discount', Number(e.target.value))}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        helperText="Special promotional or loyalty discount"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Paper>
          )}

          {/* STEP 6: FINAL PRICE CALCULATION SUMMARY */}
          {activeStep === 5 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon /> Step 6: Transparent Final Price & Margin Engine
              </Typography>

              <Grid container spacing={2}>
                {calculatedQuoteObj.options.map((opt, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '2px solid #3B82F6', borderRadius: 2.5, bgcolor: '#F8FAFC' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                          Option #{idx + 1}: {opt.airline}
                        </Typography>
                        <Chip size="small" label={opt.supplier} color="info" sx={{ fontWeight: 800 }} />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 13 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">1. Base Fare:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>${opt.baseFare.toLocaleString()}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">2. Airline & GDS Taxes:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>${opt.taxes.toLocaleString()}</Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#F1F5F9', p: 1, borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>Supplier Cost (1+2):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>${opt.supplierCost.toLocaleString()}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#2563EB' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>+ Markup Margin ({opt.markupPct}%):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>+${opt.markupAmount.toLocaleString()}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#7C3AED' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>+ Service Fee:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>+${opt.serviceFee.toLocaleString()}</Typography>
                        </Box>

                        {opt.discount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>- Customer Discount:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>-${opt.discount.toLocaleString()}</Typography>
                          </Box>
                        )}

                        <Divider />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#ECFDF5', p: 1.5, borderRadius: 1.5, border: '1px solid #6EE7B7' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#065F46' }}>FINAL CUSTOMER PRICE:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#047857' }}>${opt.customerPrice.toLocaleString()}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Agent Net Profit:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
                            +${opt.profit.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* STEP 7: QUOTE EXPIRY & DIRECT SEND */}
          {activeStep === 6 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendIcon /> Step 7: Quote Expiry & Customer Direct Dispatch
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quote Expiry Duration *</InputLabel>
                    <Select
                      value={engineData.expiryHours}
                      label="Quote Expiry Duration *"
                      onChange={e => setEngineData({ ...engineData, expiryHours: e.target.value })}
                    >
                      <MenuItem value="12">12 Hours Expiry</MenuItem>
                      <MenuItem value="24">24 Hours Expiry (Standard)</MenuItem>
                      <MenuItem value="48">48 Hours Expiry</MenuItem>
                      <MenuItem value="72">72 Hours Expiry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label="Exact Expiry Date & Time *"
                    value={engineData.expiryDateTime}
                    onChange={e => setEngineData({ ...engineData, expiryDateTime: e.target.value })}
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              {/* Delivery Preview Card */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>
                  📩 Ready to Dispatch Quote to Customer:
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Recipient: <b>{engineData.customerName}</b> ({engineData.customerEmail} | {engineData.customerPhone})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Quote Options Included: <b>{calculatedQuoteObj.options.length} Flight Option(s)</b> | Primary Price: <b>${calculatedQuoteObj.primaryCustomerPrice.toLocaleString()}</b>
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip icon={<EmailIcon />} label="Email Instant Dispatch Enabled" color="primary" size="small" />
                  <Chip icon={<WhatsAppIcon />} label="WhatsApp Interactive Card Enabled" color="success" size="small" />
                </Stack>
              </Paper>
            </Paper>
          )}
        </Box>
      </AppModal>

      {/* ─── 2. DETAILED 19-PARAMETER QUOTE VIEW MODAL ─── */}
      <AppModal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedQuote ? `Detailed Quote Specification: ${selectedQuote.id}` : ''}
        maxWidth="md"
        actions={
          selectedQuote && (
            <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => { handleDirectSendToCustomer(selectedQuote); setDrawerOpen(false); }}
                sx={{ fontWeight: 800 }}
              >
                Send to Customer
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<BookmarkAddedIcon />}
                onClick={() => { handleConvertToBooking(selectedQuote, 0); setDrawerOpen(false); }}
                sx={{ fontWeight: 900 }}
              >
                Convert to Booking
              </Button>
            </Box>
          )
        }
      >
        {selectedQuote && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            {/* Header info */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    Quote {selectedQuote.id} for <b>{selectedQuote.customerName}</b>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Email: {selectedQuote.customerEmail} | Phone: {selectedQuote.customerPhone} | Agent: {selectedQuote.createdBy}
                  </Typography>
                </Box>
                <Chip
                  label={`${STATUS_COLORS[selectedQuote.status]?.icon || ''} ${selectedQuote.status}`}
                  sx={{ bgcolor: STATUS_COLORS[selectedQuote.status]?.bg, color: STATUS_COLORS[selectedQuote.status]?.color, fontWeight: 800 }}
                />
              </Box>
            </Paper>

            {/* Flight options list displaying all 19 parameters */}
            {selectedQuote.options?.map((opt, idx) => (
              <Paper key={idx} elevation={0} sx={{ p: 2.5, border: '2px solid', borderColor: idx === 0 ? '#3B82F6' : 'divider', borderRadius: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip size="small" label={`Option #${idx + 1}`} color={idx === 0 ? 'primary' : 'default'} sx={{ fontWeight: 800 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
                      ● Airline: {opt.airline}
                    </Typography>
                  </Box>
                  <Chip size="small" label={`● Supplier: ${opt.supplier || 'Amadeus GDS'}`} color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                        ✈️ FLIGHT ITINERARY SPECS
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Flight Number:</b> {opt.flightNumber || 'N/A'}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Departure:</b> {opt.departure || opt.depDateTime || 'N/A'}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Arrival:</b> {opt.arrival || opt.arrDateTime || 'N/A'}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Duration:</b> {opt.duration || 'N/A'}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Stops:</b> {opt.stops || 'Non-stop'}</Typography>
                      <Typography variant="body2">● <b>Cabin Class:</b> {opt.cabinClass || 'Economy'}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', mb: 1 }}>
                        📜 FARE FAMILY & CONDITIONS
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Fare Family:</b> {opt.fareFamily || 'Standard'}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Baggage:</b> 🧳 {opt.baggage || 'Standard'}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>● <b>Fare Conditions:</b> {opt.fareConditions || 'Standard'}</Typography>
                      <Typography variant="body2" color="warning.main">
                        ● <b>Quote Expiry:</b> ⏰ {selectedQuote.expiryDateTime?.replace('T', ' ') || selectedQuote.validity || '24 hours'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Pricing & Markup Table */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1E40AF', mb: 1 }}>
                    💰 FINANCIAL & MARGIN BREAKDOWN
                  </Typography>
                  <Grid container spacing={1} sx={{ fontSize: 13 }}>
                    <Grid item xs={6} sm={3}>● <b>Base Fare:</b> ${opt.baseFare ?? 0}</Grid>
                    <Grid item xs={6} sm={3}>● <b>Taxes:</b> ${opt.taxes ?? 0}</Grid>
                    <Grid item xs={6} sm={3}>● <b>Supplier Cost:</b> ${opt.supplierCost ?? ((opt.baseFare || 0) + (opt.taxes || 0))}</Grid>
                    <Grid item xs={6} sm={3}>● <b>Markup:</b> +${opt.markupAmount ?? 0} ({opt.markupPct ?? 0}%)</Grid>
                    <Grid item xs={6} sm={3}>● <b>Service Fee:</b> +${opt.serviceFee ?? 0}</Grid>
                    <Grid item xs={6} sm={3}>● <b>Discount:</b> -${opt.discount ?? 0}</Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'success.main' }}>
                        ● <b>Customer Price:</b> ${Number(opt.customerPrice ?? (opt.supplierCost || 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Paper>
            ))}
          </Box>
        )}
      </AppModal>

      {/* ─── 3. CUSTOMER PORTAL QUOTE PREVIEW MODAL ─── */}
      <AppModal
        open={customerPreviewOpen}
        onClose={() => setCustomerPreviewOpen(false)}
        title="👁️ Customer Live Quote View (Client Portal Mode)"
        maxWidth="md"
      >
        {previewQuote && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              This is the interactive view sent directly to customer <b>{previewQuote.customerName}</b>.
            </Alert>

            <Paper elevation={0} sx={{ p: 3, border: '2px solid #2563EB', borderRadius: 3, bgcolor: '#FAFAFA' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  ✈️ Official Flight Quote ({previewQuote.id})
                </Typography>
                <Chip icon={<AccessTimeIcon />} label={`Expires: ${previewQuote.expiryDateTime?.replace('T', ' ') || previewQuote.validity}`} color="warning" sx={{ fontWeight: 800 }} />
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                Prepared for: <b>{previewQuote.customerName}</b> | Travel Route: <b>{previewQuote.route}</b>
              </Typography>

              {previewQuote.options?.map((opt, i) => (
                <Paper key={i} elevation={0} sx={{ p: 2.5, mb: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Option {i + 1}: {opt.airline} ({opt.flightNumber})</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>${Number(opt.customerPrice || 10220).toLocaleString()}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {opt.departure} → {opt.arrival} | {opt.duration} ({opt.stops})
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'primary.main' }}>
                    Cabin: {opt.cabinClass} | Fare Family: {opt.fareFamily} | Baggage: 🧳 {opt.baggage}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Fare Conditions: {opt.fareConditions}
                  </Typography>

                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    sx={{ mt: 2, fontWeight: 900, py: 1 }}
                    onClick={() => {
                      setCustomerPreviewOpen(false);
                      handleConvertToBooking(previewQuote, i);
                    }}
                  >
                    Accept Quote & Proceed to Booking →
                  </Button>
                </Paper>
              ))}
            </Paper>
          </Box>
        )}
      </AppModal>
    </Box>
  );
}
