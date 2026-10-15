import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TerminalIcon from '@mui/icons-material/Terminal';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import PageHeader from '../../components/PageHeader';
import AppTable from '../../components/AppTable';
import AppModal from '../../components/AppModal';
import GDSTerminalModal from '../../components/GDSTerminalModal';
import MultiGdsFlightSearch from '../../components/MultiGdsFlightSearch';
import { useAlert } from '../../contexts/AlertContext';
import CircularProgress from '@mui/material/CircularProgress';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '../../services/dbService';

export const DEMO_ALL_FLIGHT_REQUESTS = [
  {
    id: 'FE-4591',
    route: 'JFK → LHR',
    origin: 'JFK',
    destination: 'LHR',
    region: 'Americas',
    travelDate: '2026-10-15',
    dateDisplay: '15OCT',
    cabinClass: 'Business',
    passengers: 2,
    salesAgent: 'Sara J.',
    status: 'In Progress',
    priority: 'Normal',
    notes: 'Client looking for lie-flat seats on AA/BA non-stop.'
  },
  {
    id: 'FE-4592',
    route: 'JFK → LHR',
    origin: 'JFK',
    destination: 'LHR',
    region: 'Americas',
    travelDate: '2026-10-15',
    dateDisplay: '15OCT',
    cabinClass: 'Business',
    passengers: 2,
    salesAgent: 'Sara J.',
    status: 'New',
    priority: 'Urgent',
    notes: 'Checking Virgin Atlantic vs British Airways pricing.'
  },
  {
    id: 'FE-4593',
    route: 'DEL → DXB',
    origin: 'DEL',
    destination: 'DXB',
    region: 'Middle East',
    travelDate: '2026-11-20',
    dateDisplay: '20NOV',
    cabinClass: 'Economy',
    passengers: 4,
    salesAgent: 'Alex R.',
    status: 'Completed',
    priority: 'Normal',
    notes: 'Emirates economy booking ticketed.'
  },
  {
    id: 'FE-4594',
    route: 'SFO → SIN',
    origin: 'SFO',
    destination: 'SIN',
    region: 'Asia',
    travelDate: '2026-12-05',
    dateDisplay: '05DEC',
    cabinClass: 'Business',
    passengers: 2,
    salesAgent: 'Maria C.',
    status: 'In Progress',
    priority: 'Normal',
    notes: 'Family business class booking on Singapore Airlines.'
  },
  {
    id: 'FE-4595',
    route: 'LHR → CDG',
    origin: 'LHR',
    destination: 'CDG',
    region: 'Europe',
    travelDate: '2026-11-12',
    dateDisplay: '12NOV',
    cabinClass: 'Economy',
    passengers: 1,
    salesAgent: 'David R.',
    status: 'Completed',
    priority: 'Normal',
    notes: 'Air France non-stop ticketing complete.'
  }
];

export default function FlightRequests() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cabinFilter, setCabinFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Detail Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ─── LIVE POSTGRESQL FLIGHT REQUESTS & QUOTES ───
  const { data: dbQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['flight-requests-quotes'],
    queryFn: dbService.getQuotes,
    refetchInterval: 15000,
  });

  const { data: dbLeads = [] } = useQuery({
    queryKey: ['flight-requests-leads'],
    queryFn: dbService.getLeads,
    refetchInterval: 20000,
  });

  // Dynamic requests transformed from real database quotes & leads
  const allRequests = useMemo(() => {
    const list = [];

    // Map real quotes
    (dbQuotes || []).forEach((q, idx) => {
      list.push({
        id: q.quoteId || q.id || `REQ-QT-${100 + idx}`,
        customerName: q.customerName || 'Flight Client',
        route: `${q.origin || 'JFK'} → ${q.destination || 'LHR'}`,
        origin: q.origin || 'JFK',
        destination: q.destination || 'LHR',
        region: (q.origin?.startsWith('L') || q.destination?.startsWith('L')) ? 'Europe' : 'Americas',
        travelDate: q.departureDate || '2026-10-25',
        dateDisplay: q.departureDate ? q.departureDate.slice(5) : '25OCT',
        cabinClass: q.cabinClass || 'Business',
        passengers: q.passengers || 2,
        salesAgent: q.agentName || 'Sara J.',
        status: (q.status === 'Sent' || q.status === 'Draft') ? 'New' : (q.status === 'Accepted' ? 'In Progress' : (q.status === 'Booked' ? 'Completed' : 'New')),
        priority: (q.totalPrice > 4000) ? 'Urgent' : 'Normal',
        notes: q.notes || `Direct flight request for ${q.customerName || 'client'}. Total Quote: $${q.totalPrice || 0}`
      });
    });

    // Map real leads that have origin/destination
    (dbLeads || []).forEach((ld, idx) => {
      if (ld.origin && ld.destination) {
        list.push({
          id: `REQ-LD-${String(ld.id).slice(0, 6)}`,
          customerName: `${ld.firstName || ''} ${ld.lastName || ''}`.trim() || 'Inquiry',
          route: `${ld.origin} → ${ld.destination}`,
          origin: ld.origin,
          destination: ld.destination,
          region: ld.origin?.startsWith('D') ? 'Middle East' : 'Americas',
          travelDate: ld.travelDate || '2026-11-01',
          dateDisplay: ld.travelDate ? String(ld.travelDate).slice(5) : '01NOV',
          cabinClass: ld.serviceId?.includes('business') ? 'Business' : 'Economy',
          passengers: ld.passengers || 1,
          salesAgent: ld.assignedAgent?.name || 'Unassigned',
          status: ld.status === 'New Lead' ? 'New' : 'In Progress',
          priority: (ld.budget && ld.budget > 5000) ? 'Urgent' : 'Normal',
          notes: ld.notes || 'Inbound customer flight request via CRM lead intake.'
        });
      }
    });

    return list.length > 0 ? list : DEMO_ALL_FLIGHT_REQUESTS;
  }, [dbQuotes, dbLeads]);

  // Filtered dataset calculation
  const filteredData = useMemo(() => {
    return allRequests.filter(r => {
      const q = search.toLowerCase();
      const matchSearch =
        r.id.toLowerCase().includes(q) ||
        r.route.toLowerCase().includes(q) ||
        r.salesAgent.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q);

      const matchStatus = statusFilter ? r.status === statusFilter : true;
      const matchCabin = cabinFilter ? r.cabinClass === cabinFilter : true;
      const matchRegion = regionFilter ? r.region === regionFilter : true;
      const matchPriority = priorityFilter ? r.priority === priorityFilter : true;

      let matchDate = true;
      if (dateFilter === 'Today') {
        matchDate = r.dateDisplay === '15OCT';
      } else if (dateFilter === 'This Week') {
        matchDate = r.dateDisplay === '15OCT' || r.dateDisplay === '20NOV';
      } else if (dateFilter === 'Custom') {
        matchDate = true;
      }

      return matchSearch && matchStatus && matchCabin && matchRegion && matchPriority && matchDate;
    });
  }, [allRequests, search, statusFilter, cabinFilter, regionFilter, priorityFilter, dateFilter]);

  const handleOpenRequest = (row) => {
    setSelectedReq(row);
    setModalOpen(true);
  };

  const handleOpenInDesk = (row) => {
    showAlert(`Opening Request #${row.id} in Flight Expert / GDS Desk...`, 'info');
    navigate('/flight_expert/dashboard');
  };

  const renderStatusChip = (status) => {
    if (status === 'New') {
      return (
        <Chip
          size="small"
          label="🔴 New"
          sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '0.72rem', height: 24 }}
        />
      );
    }
    if (status === 'In Progress') {
      return (
        <Chip
          size="small"
          label="🟡 In Progress"
          sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', color: '#D97706', fontWeight: 800, fontSize: '0.72rem', height: 24 }}
        />
      );
    }
    if (status === 'Completed') {
      return (
        <Chip
          size="small"
          label="🟢 Completed"
          sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4', color: '#16A34A', fontWeight: 800, fontSize: '0.72rem', height: 24 }}
        />
      );
    }
    return <Chip size="small" label={status} sx={{ fontWeight: 700 }} />;
  };

  const columns = [
    {
      id: 'reqId',
      label: 'Request ID',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'monospace' }}>
          #{row.id}
        </Typography>
      )
    },
    {
      id: 'route',
      label: 'Route',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <FlightTakeoffIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.route}</Typography>
        </Box>
      )
    },
    {
      id: 'date',
      label: 'Date',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {row.dateDisplay}
        </Typography>
      )
    },
    {
      id: 'cabin',
      label: 'Cabin Class',
      render: (row) => (
        <Chip size="small" label={row.cabinClass} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
      )
    },
    {
      id: 'pax',
      label: 'Passengers',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {row.passengers} Pax
        </Typography>
      )
    },
    {
      id: 'agent',
      label: 'Sales Agent',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {row.salesAgent}
        </Typography>
      )
    },
    {
      id: 'priority',
      label: 'Priority',
      render: (row) => (
        <Chip
          size="small"
          label={row.priority}
          color={row.priority === 'Urgent' ? 'error' : 'default'}
          sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }}
        />
      )
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => renderStatusChip(row.status)
    }
  ];

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [pageTab, setPageTab] = useState(0);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Executive Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              flexShrink: 0,
            }}
          >
            <FlightTakeoffIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.25rem', sm: '1.45rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: 'text.primary',
              }}
            >
              Flight Search & GDS Requests
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 500 }}
            >
              Search live multi-GDS flights (Amadeus/Sabre/Galileo), compare airline legs, and manage incoming requests.
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="contained"
            startIcon={<TerminalIcon sx={{ color: '#38BDF8' }} />}
            onClick={() => setTerminalOpen(true)}
            sx={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              px: 2.2,
              py: 1.1,
              borderRadius: 2.2,
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#1E293B',
                borderColor: '#38BDF8',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.25)',
              },
            }}
          >
            Launch GDS Cryptic Terminal
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate('/flight_expert/dashboard')}
            sx={{
              fontWeight: 800,
              fontSize: '0.82rem',
              px: 2.2,
              py: 1.1,
              borderRadius: 2.2,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
              },
            }}
          >
            Open Flight Expert / GDS Desk
          </Button>
        </Box>
      </Paper>

      {/* Primary Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          borderRadius: 2.5,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={pageTab}
          onChange={(_, val) => setPageTab(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 800,
              fontSize: '0.88rem',
              textTransform: 'none',
              letterSpacing: '-0.01em',
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab icon={<SearchIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="1. Multi-GDS Flight Search & Route Breakdown" />
          <Tab icon={<FormatListBulletedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="2. Incoming Flight Requests Queue" />
        </Tabs>
      </Paper>

      {pageTab === 0 ? (
        <MultiGdsFlightSearch
          onGenerateQuote={(flight) => {
            navigate('/quotes');
          }}
          onSelectFlight={(flight) => {
            showAlert(`✓ Flight ${flight.airline} selected. Ready for PNR & Booking issuance!`, 'success');
          }}
        />
      ) : (
        <Box>
          {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: '180px 150px 150px 150px 140px 140px 120px' }, gap: 1.5, alignItems: 'center' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search ID, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Status Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>

          {/* Cabin Class Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Cabin Class</InputLabel>
            <Select
              value={cabinFilter}
              label="Cabin Class"
              onChange={(e) => setCabinFilter(e.target.value)}
            >
              <MenuItem value="">All Cabins</MenuItem>
              <MenuItem value="Economy">Economy</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
              <MenuItem value="First">First</MenuItem>
            </Select>
          </FormControl>

          {/* Route Region Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Route Region</InputLabel>
            <Select
              value={regionFilter}
              label="Route Region"
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <MenuItem value="">All Regions</MenuItem>
              <MenuItem value="Americas">Americas</MenuItem>
              <MenuItem value="Europe">Europe</MenuItem>
              <MenuItem value="Middle East">Middle East</MenuItem>
              <MenuItem value="Asia">Asia</MenuItem>
            </Select>
          </FormControl>

          {/* Date Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Date</InputLabel>
            <Select
              value={dateFilter}
              label="Date"
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <MenuItem value="">All Dates</MenuItem>
              <MenuItem value="Today">Today</MenuItem>
              <MenuItem value="This Week">This Week</MenuItem>
              <MenuItem value="Custom">Custom</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
            </Select>
          </FormControl>

          {/* Reset Filters */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCabinFilter('');
              setRegionFilter('');
              setPriorityFilter('');
              setDateFilter('');
            }}
            sx={{ fontWeight: 700 }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Requests Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
        <AppTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => handleOpenRequest(row)}
          actions={(row) => (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={row.status === 'Completed' ? 'View Details' : 'Open in GDS Desk'}>
                <Button
                  size="small"
                  variant={row.status === 'Completed' ? 'outlined' : 'contained'}
                  color={row.status === 'Completed' ? 'inherit' : 'primary'}
                  onClick={() => {
                    if (row.status === 'Completed') {
                      handleOpenRequest(row);
                    } else {
                      handleOpenInDesk(row);
                    }
                  }}
                  sx={{ py: 0.4, px: 1.8, fontSize: '0.75rem', fontWeight: 800 }}
                >
                  {row.status === 'Completed' ? 'View' : 'Open'}
                </Button>
              </Tooltip>
            </Box>
          )}
        />
      </Paper>

      {/* Detail Modal */}
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedReq ? `Flight Request Details: #${selectedReq.id}` : ''}
        maxWidth="sm"
        actions={
          selectedReq && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setModalOpen(false)}>
                Close
              </Button>
              {selectedReq.status !== 'Completed' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => {
                    setModalOpen(false);
                    handleOpenInDesk(selectedReq);
                  }}
                >
                  Open in GDS Desk
                </Button>
              )}
            </Box>
          )
        }
      >
        {selectedReq && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                ✈️ {selectedReq.route} ({selectedReq.region})
              </Typography>
              {renderStatusChip(selectedReq.status)}
            </Box>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, fontSize: '0.85rem' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Travel Date:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedReq.dateDisplay}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Cabin & Pax:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedReq.cabinClass} ({selectedReq.passengers} Pax)</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Assigned Sales Agent:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedReq.salesAgent}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Priority:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: selectedReq.priority === 'Urgent' ? 'error.main' : 'text.primary' }}>{selectedReq.priority}</Typography>
                </Box>
              </Box>
            </Paper>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                AGENT NOTES & REQUIREMENTS
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 1.5, fontSize: '0.85rem' }}>
                💡 {selectedReq.notes}
              </Paper>
            </Box>
          </Box>
        )}
      </AppModal>
      </Box>
      )}

      {/* GDS Terminal Modal */}
      <GDSTerminalModal
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        initialData={{
          rawEdifact: selectedReq ? `1 AA 100 J ${selectedReq.dateDisplay} ${selectedReq.origin} ${selectedReq.destination} 1830 0730+1` : undefined,
          pax: selectedReq?.passengers || 2,
          netPrice: 1225.00,
          markup: 284.24
        }}
        onSave={(data) => {
          showAlert(`✓ Synced GDS PNR #${data.pnr} for Flight Request #${selectedReq?.id || 'FE-4591'}`, 'success');
        }}
      />
    </Box>
  );
}
