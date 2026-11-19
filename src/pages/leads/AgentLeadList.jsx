import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import Chip from '@mui/material/Chip';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';

// Icons
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';

// Services & Components
import { dbService } from '../../services/dbService';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import FilterPanel from '../../components/FilterPanel';
import AppTable from '../../components/AppTable';
import AppModal from '../../components/AppModal';
import StatCard from '../../components/StatCard';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { SERVICES } from '../../constants/mockData';

const AIRPORT_OPTIONS = [
  'DEL - New Delhi Indira Gandhi',
  'LHR - London Heathrow',
  'JFK - New York JFK',
  'DXB - Dubai International',
  'SIN - Singapore Changi',
  'BOM - Mumbai Chhatrapati Shivaji',
  'CDG - Paris Charles de Gaulle',
  'SYD - Sydney Kingsford Smith',
  'YYZ - Toronto Pearson',
  'FRA - Frankfurt'
];

const leadSchema = yup.object().shape({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  country: yup.string().default(''),
  city: yup.string().default(''),
  timezone: yup.string().default(''),
  origin: yup.string().required('Origin airport is required'),
  destination: yup.string().required('Destination airport is required'),
  travelDate: yup.string().required('Travel date is required'),
  returnDate: yup.string().default(''),
  cabinClass: yup.string().required('Cabin class is required'),
  adults: yup.number().min(1).default(1),
  children: yup.number().min(0).default(0),
  infants: yup.number().min(0).default(0),
  flexibility: yup.string().default('Exact Dates'),
  budget: yup.string().default(''),
  source: yup.string().required('Lead source is required'),
  priority: yup.string().default('Medium'),
  notes: yup.string().default('')
});

export const AgentLeadList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { isAdmin, isOperations, currentUser } = useAuth();

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(() => {
    const savedFiltersStr = sessionStorage.getItem('leadList_filters');
    const savedFilters = savedFiltersStr ? JSON.parse(savedFiltersStr) : null;
    const isFromDashboard = location.state?.cardInfo !== undefined;

    const status = location.state?.filterStatus !== undefined
      ? location.state.filterStatus
      : (isFromDashboard ? '' : (savedFilters?.status || ''));

    const assignedConsultantId = location.state?.filterConsultantId !== undefined
      ? location.state.filterConsultantId
      : (isFromDashboard ? '' : (savedFilters?.assignedConsultantId || ''));

    const todayOnly = location.state?.filterToday !== undefined
      ? location.state.filterToday
      : (isFromDashboard ? false : (savedFilters?.todayOnly || false));

    const serviceId = isFromDashboard ? '' : (savedFilters?.serviceId || '');

    return {
      serviceId,
      status,
      assignedConsultantId,
      todayOnly
    };
  });
  const [cardInfo, setCardInfo] = useState(() => {
    const savedCardInfoStr = sessionStorage.getItem('leadList_cardInfo');
    const savedCardInfo = savedCardInfoStr ? JSON.parse(savedCardInfoStr) : null;
    return location.state?.cardInfo || savedCardInfo || null;
  });

  const [startDate, setStartDate] = useState(() => {
    return location.state?.startDate || '';
  });
  const [endDate, setEndDate] = useState(() => {
    return location.state?.endDate || '';
  });
  const mockToday = new Date().toISOString().split('T')[0]; // Real today's date (dynamic)

  const filterByDate = (dateStr, start, end) => {
    if (!start && !end) return true;
    // If lead has no date, don't hide it — show it always when no date filter applied
    if (!dateStr) return true;
    const formatted = dateStr.substring(0, 10);
    if (start && !end) return formatted === start;
    return formatted >= start && formatted <= end;
  };

  useEffect(() => {
    if (location.state) {
      if (location.state.resetFilters) {
        setFilters({
          serviceId: '',
          status: '',
          assignedConsultantId: '',
          todayOnly: false
        });
        setStartDate('');
        setEndDate('');
        setCardInfo(null);
        sessionStorage.removeItem('leadList_filters');
        sessionStorage.removeItem('leadList_cardInfo');
        navigate(location.pathname, { replace: true, state: {} });
      } else if (
        location.state.filterStatus !== undefined ||
        location.state.filterConsultantId !== undefined ||
        location.state.filterToday !== undefined ||
        location.state.cardInfo !== undefined ||
        location.state.startDate !== undefined
      ) {
        setFilters((prev) => {
          const isFromDashboard = location.state.cardInfo !== undefined;
          const nextFilters = {
            serviceId: isFromDashboard ? '' : prev.serviceId,
            status: location.state.filterStatus !== undefined ? location.state.filterStatus : (isFromDashboard ? '' : prev.status),
            assignedConsultantId: location.state.filterConsultantId !== undefined ? location.state.filterConsultantId : (isFromDashboard ? '' : prev.assignedConsultantId),
            todayOnly: location.state.filterToday !== undefined ? location.state.filterToday : (isFromDashboard ? false : prev.todayOnly)
          };
          sessionStorage.setItem('leadList_filters', JSON.stringify(nextFilters));
          return nextFilters;
        });
        if (location.state.startDate !== undefined) {
          setStartDate(location.state.startDate);
        }
        if (location.state.endDate !== undefined) {
          setEndDate(location.state.endDate);
        }
        if (location.state.cardInfo) {
          setCardInfo(location.state.cardInfo);
          sessionStorage.setItem('leadList_cardInfo', JSON.stringify(location.state.cardInfo));
        }
      }
    }
  }, [location.state, navigate, location.pathname]);

  const getCardIcon = (iconType) => {
    switch (iconType) {
      case 'PeopleAlt': return <PeopleAltIcon />;
      case 'Add': return <AddIcon />;
      case 'CalendarMonth': return <CalendarMonthIcon />;
      case 'Payments': return <PaymentsIcon />;
      case 'TrendingUp': return <TrendingUpIcon />;
      case 'Assignment': return <AssignmentIcon />;
      case 'CheckCircleOutlined': return <CheckCircleOutlinedIcon />;
      case 'WarningAmber': return <WarningAmberIcon />;
      case 'Receipt': return <ReceiptIcon />;
      case 'CreditCard': return <CreditCardIcon />;
      default: return null;
    }
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState('createdDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [targetConsultantId, setTargetConsultantId] = useState('');

  // Fetch Leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: dbService.getLeads });

  // Fetch Agents dynamically
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: dbService.getAgents });

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: dbService.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      showAlert('Lead created successfully', 'success');
      setAddModalOpen(false);
      reset();
    } });

  const deleteLeadMutation = useMutation({
    mutationFn: dbService.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      showAlert('Lead deleted successfully', 'success');
    } });

  const assignAgentMutation = useMutation({
    mutationFn: ({ leadId, agentId }) => dbService.assignAgent(leadId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      showAlert('Agent assigned successfully', 'success');
      setAssignModalOpen(false);
      setTargetConsultantId('');
    } });

  const updateLeadStatusMutation = useMutation({
    mutationFn: ({ leadId, status }) => dbService.updateLeadStatus(leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      showAlert('Lead status adjusted successfully!', 'success');
    } });

  const handleStatusChange = (leadId, status) => {
    updateLeadStatusMutation.mutate({ leadId, status });
  };

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(leadSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      timezone: '',
      origin: '',
      destination: '',
      travelDate: '',
      returnDate: '',
      cabinClass: 'Economy',
      adults: 1,
      children: 0,
      infants: 0,
      flexibility: 'Exact Dates',
      budget: '',
      source: 'Website Direct',
      priority: 'Medium',
      notes: ''
    }
  });

  const { data: leadStages = [] } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: dbService.getLeadStages
  });

  // Handle forms
  const handleCreateLead = (data) => {
    const defaultStatus = leadStages[0]?.name || 'New Lead';
    createLeadMutation.mutate({
      ...data,
      passengers: (Number(data.adults) || 1) + (Number(data.children) || 0) + (Number(data.infants) || 0),
      status: defaultStatus,
      assignedConsultantId: currentUser?.id || '',
      activities: [
        {
          time: new Date().toLocaleTimeString(),
          agent: currentUser?.name || 'Agent',
          status: 'New Lead Created',
          comments: `Flight request for ${data.origin} → ${data.destination} (${data.cabinClass || 'Economy'})`
        }
      ]
    });
  };

  const handleOpenAssignModal = (lead) => {
    setSelectedLead(lead);
    setTargetConsultantId(lead.assignedConsultantId || '');
    setAssignModalOpen(true);
  };

  const handleAssignAgentSubmit = () => {
    if (!targetConsultantId) return;
    assignAgentMutation.mutate({
      leadId: selectedLead.id,
      agentId: targetConsultantId });
  };

  const handleDeleteLead = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteLeadMutation.mutate(id);
    }
  };

  // Filter & Search Logic
  const filteredLeads = leads
    .filter((lead) => {
      if (!filterByDate(lead.createdDate, startDate, endDate)) return false;

      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const matchSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);

      // Role-based scoping: consultants only filter if assigned to someone else
      if (!isAdmin && !isOperations && currentUser && (currentUser.role === 'consultant' || currentUser.role === 'sales_executive')) {
        const assignedId = lead.assignedAgentId || lead.assignedConsultantId;
        if (assignedId && assignedId !== currentUser.id && assignedId !== 'usr-issac' && assignedId !== 'u_issac') {
          return false;
        }
      }

      const matchService = filters.serviceId ? lead.serviceId === filters.serviceId : true;
      const matchStatus = filters.status ? lead.status === filters.status : true;
      const assignedId = lead.assignedAgentId || lead.assignedConsultantId;
      const matchConsultant = filters.assignedConsultantId
        ? assignedId === filters.assignedConsultantId
        : true;
      const matchToday = filters.todayOnly ? lead.createdDate?.startsWith(mockToday) : true;

      return matchSearch && matchService && matchStatus && matchConsultant && matchToday;
    })
    .sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (sortColumn === 'name') {
        valA = `${a.firstName} ${a.lastName}`;
        valB = `${b.firstName} ${b.lastName}`;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const paginatedLeads = filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (columnId) => {
    const isAsc = sortColumn === columnId && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortColumn(columnId);
  };

  const columns = [
    {
      id: 'name',
      label: 'Customer',
      sortable: true,
      render: (row) => `${row.firstName} ${row.lastName}` },
    {
      id: 'route',
      label: 'Route',
      render: (row) => `${row.origin || 'N/A'} ✈ ${row.destination || 'N/A'}` },
    {
      id: 'travelDate',
      label: 'Travel Date',
      sortable: true,
      render: (row) => row.travelDate ? dayjs(row.travelDate).format('DD MMM YYYY') : 'N/A' },
    { id: 'passengers', label: 'Pax', render: (row) => row.passengers || '-' },
    { id: 'cabinClass', label: 'Cabin', render: (row) => row.cabinClass || '-' },
    {
      id: 'leadTemperature',
      label: 'Temperature',
      render: (row) => (
        <Chip 
          label={row.leadTemperature || 'WARM'} 
          size="small" 
          color={row.leadTemperature === 'HOT' || row.leadTemperature === 'VIP' ? 'error' : 'warning'} 
          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
      )
    },
    {
      id: 'assignedConsultant',
      label: 'Agent',
      render: (row) => {
        const aId = row.assignedAgentId || row.assignedConsultantId;
        const agent = agents.find((c) => c.id === aId);
        return agent ? agent.name : (row.assignedAgent?.name || row.assignedAgentName || <Typography variant="caption" color="text.secondary">Unassigned</Typography>);
      } },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Select
          value={row.status || 'NEW'}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          size="small"
          sx={{ fontSize: '0.75rem', height: 28, minWidth: 120, bgcolor: 'background.paper', fontWeight: 600 }}
        >
          {leadStatuses.map((st) => (
            <MenuItem key={st} value={st} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {st}
            </MenuItem>
          ))}
        </Select>
      )
    },
    {
      id: 'lastActivity',
      label: 'Last Activity',
      render: (row) => {
        const timeline = row.timeline || [];
        if (timeline.length === 0) return 'No activity';
        const last = timeline[timeline.length - 1];
        return (
          <Box>
            <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>{last.event}</Typography>
            <Typography variant="caption" color="text.secondary">{dayjs(last.date).format('DD MMM, HH:mm')}</Typography>
          </Box>
        );
      }
    }
  ];

  const leadStatuses = leadStages.map(s => s.name);

  return (
    <Box>
      <Button
        startIcon={<KeyboardArrowLeftIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2, color: 'text.secondary', display: 'inline-flex' }}
      >
        Back to Dashboard
      </Button>
      <PageHeader
        title={(currentUser?.role === 'consultant' || currentUser?.role === 'agent') ? "Consultation Center" : "Lead Center"}
        subtitle={(currentUser?.role === 'consultant' || currentUser?.role === 'agent') ? "Manage your inbound consultation inquiries and qualification data." : "Manage inbound inquiries, lead qualification data, and consultant routing rules."}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{ fontWeight: 800, borderRadius: 2, px: 2.5, py: 1 }}
          >
            + Add New Lead
          </Button>
        }
      />

      {cardInfo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: '8px 16px',
            borderRadius: 2,
            background: `linear-gradient(135deg, ${cardInfo.color}0D 0%, ${cardInfo.color}1E 100%)`,
            border: '1px solid',
            borderColor: `${cardInfo.color}25`,
            boxShadow: `0 4px 20px ${cardInfo.color}08`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '6px',
              height: '100%',
              backgroundColor: cardInfo.color,
              borderRadius: '12px 0 0 12px' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: `${cardInfo.color}25`,
                color: cardInfo.color,
                '& svg': { fontSize: '1.25rem' }
              }}
            >
              {getCardIcon(cardInfo.iconType)}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cardInfo.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {cardInfo.value}
            </Typography>
            {cardInfo.trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    p: '2px 8px',
                    borderRadius: '12px',
                    background: parseFloat(cardInfo.trend) >= 0
                      ? 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)'
                      : 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                >
                  {parseFloat(cardInfo.trend) >= 0 ? '↑' : '↓'} {cardInfo.trend}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.8 }}>
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Date Filter Row */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mr: 0.5 }}>Date Filter:</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 0.5, bgcolor: 'background.paper' }}>
          {[
            { label: 'Today', key: 'today' },
            { label: '7D', key: '7d' },
            { label: '30D', key: '30d' },
            { label: 'All', key: 'all' },
          ].map(preset => {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const isActive =
              preset.key === 'today' ? startDate === mockToday && endDate === mockToday :
              preset.key === '7d' ? startDate === sevenDaysAgo && endDate === mockToday :
              preset.key === '30d' ? startDate === thirtyDaysAgo && endDate === mockToday :
              preset.key === 'all' ? !startDate && !endDate : false;
            return (
              <Button
                key={preset.key}
                size="small"
                variant={isActive ? 'contained' : 'text'}
                color={isActive ? 'primary' : 'inherit'}
                onClick={() => {
                  if (preset.key === 'today') {
                    setStartDate(mockToday);
                    setEndDate(mockToday);
                  } else if (preset.key === '7d') {
                    setStartDate(sevenDaysAgo);
                    setEndDate(mockToday);
                  } else if (preset.key === '30d') {
                    setStartDate(thirtyDaysAgo);
                    setEndDate(mockToday);
                  } else {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5 }}
              >
                {preset.label}
              </Button>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' }, flexWrap: 'wrap', width: '100%' }}>
          <Box sx={{ width: { xs: '100%', md: '320px' }, display: 'flex', alignItems: 'center' }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Search leads..."
            />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <FilterPanel
              filters={filters}
              onFilterChange={(key, val) => setFilters((prev) => {
                const nextFilters = { ...prev, [key]: val };
                sessionStorage.setItem('leadList_filters', JSON.stringify(nextFilters));
                return nextFilters;
              })}
              onClearFilters={() => {
                setFilters({ serviceId: '', status: '', assignedConsultantId: '', todayOnly: false });
                setStartDate('');
                setEndDate('');
                setCardInfo(null);
                sessionStorage.removeItem('leadList_filters');
                sessionStorage.removeItem('leadList_cardInfo');
              }}
              statusOptions={leadStatuses}
            />
          </Box>
        </Box>

        <AppTable
          columns={columns}
          data={paginatedLeads}
          count={filteredLeads.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={isLoading}
          maxHeight="calc(100vh - 250px)"
          onRowClick={(row) => navigate(`/leads/details/${row.id}`)}
          actions={(row) => (
            <>
              <Tooltip title="View Lead Details">
                <IconButton size="small" onClick={() => navigate(`/leads/details/${row.id}`)} color="primary">
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Recorded Video Link">
                <IconButton
                  size="small"
                  onClick={() => window.open(row.recordedMeetingLink || 'https://zoom.us/rec/play/mock-meeting-recording', '_blank')}
                  color="info"
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {(isAdmin || isOperations) && (
                <Tooltip title="Assign Agent">
                  <IconButton size="small" onClick={() => handleOpenAssignModal(row)} color="secondary">
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {(isAdmin || isOperations) && (
                <Tooltip title="Delete Lead">
                  <IconButton size="small" onClick={() => handleDeleteLead(row.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        />
      </Box>

      {/* MODAL 1: Add New Lead */}
      <AppModal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); reset(); }}
        title="Add New Flight Lead"
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => { setAddModalOpen(false); reset(); }} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleCreateLead)}
              variant="contained"
              color="primary"
              disabled={createLeadMutation.isPending}
            >
              Save Flight Lead
            </Button>
          </>
        }
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Group 1: Personal Info */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              👤 PERSONAL INFO
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <TextField {...register('firstName')} label="First Name *" size="small" error={!!errors.firstName} helperText={errors.firstName?.message} />
              <TextField {...register('lastName')} label="Last Name *" size="small" error={!!errors.lastName} helperText={errors.lastName?.message} />
              <TextField {...register('email')} label="Email Address *" size="small" error={!!errors.email} helperText={errors.email?.message} />
              <TextField {...register('phone')} label="Phone Number (with Country Code) *" placeholder="e.g. +91 9876543210" size="small" error={!!errors.phone} helperText={errors.phone?.message} />
              <TextField {...register('country')} label="Country" placeholder="e.g. India" size="small" />
              <TextField {...register('city')} label="City" placeholder="e.g. Delhi" size="small" />
              <TextField {...register('timezone')} label="Time Zone (optional)" placeholder="e.g. IST (UTC+5:30) or EST" size="small" sx={{ gridColumn: { sm: 'span 2' } }} />
            </Box>
          </Paper>

          {/* Group 2: Flight Request */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.12)' : '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'info.main' }}>
              ✈️ FLIGHT REQUEST
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              <FormControl size="small" fullWidth error={!!errors.origin}>
                <InputLabel>Origin Airport *</InputLabel>
                <Select {...register('origin')} defaultValue="" label="Origin Airport *">
                  <MenuItem value=""><em>Select Origin Airport</em></MenuItem>
                  {AIRPORT_OPTIONS.map(a => (
                    <MenuItem key={a} value={a.split(' - ')[0]}>{a}</MenuItem>
                  ))}
                </Select>
                {errors.origin && <Typography variant="caption" color="error" sx={{ mt: 0.3, display: 'block' }}>{errors.origin.message}</Typography>}
              </FormControl>

              <FormControl size="small" fullWidth error={!!errors.destination}>
                <InputLabel>Destination Airport *</InputLabel>
                <Select {...register('destination')} defaultValue="" label="Destination Airport *">
                  <MenuItem value=""><em>Select Destination Airport</em></MenuItem>
                  {AIRPORT_OPTIONS.map(a => (
                    <MenuItem key={a} value={a.split(' - ')[0]}>{a}</MenuItem>
                  ))}
                </Select>
                {errors.destination && <Typography variant="caption" color="error" sx={{ mt: 0.3, display: 'block' }}>{errors.destination.message}</Typography>}
              </FormControl>

              <FormControl size="small" fullWidth error={!!errors.cabinClass}>
                <InputLabel>Cabin Class *</InputLabel>
                <Select {...register('cabinClass')} defaultValue="Economy" label="Cabin Class *">
                  {['Economy', 'Premium Economy', 'Business', 'First Class'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                {...register('travelDate')}
                label="Travel Date *"
                type="date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                InputLabelProps={{ shrink: true }}
                error={!!errors.travelDate}
                helperText={errors.travelDate?.message}
              />
              <TextField
                {...register('returnDate')}
                label="Return Date (optional)"
                type="date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                InputLabelProps={{ shrink: true }}
              />
              
              <FormControl size="small" fullWidth>
                <InputLabel>Flexibility</InputLabel>
                <Select {...register('flexibility')} defaultValue="Exact Dates" label="Flexibility">
                  {['Exact Dates', '±3 days', '±7 days', 'Flexible'].map(f => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField {...register('adults')} label="Adults (1-9) *" type="number" size="small" defaultValue={1} inputProps={{ min: 1, max: 9 }} />
              <TextField {...register('children')} label="Children (0-6)" type="number" size="small" defaultValue={0} inputProps={{ min: 0, max: 6 }} />
              <TextField {...register('infants')} label="Infants (0-4)" type="number" size="small" defaultValue={0} inputProps={{ min: 0, max: 4 }} />

              <FormControl size="small" fullWidth sx={{ gridColumn: { sm: 'span 3' } }}>
                <InputLabel>Budget Range (optional)</InputLabel>
                <Select {...register('budget')} defaultValue="" label="Budget Range (optional)">
                  <MenuItem value=""><em>Select Budget Range (optional)</em></MenuItem>
                  {['$500 - $1,000', '$1,000 - $2,500', '$2,500 - $5,000', '$5,000+', 'Flexible'].map(b => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Group 3: Lead Info & Labels */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
              🏷️ LEAD INFO & LABELS
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <FormControl size="small" fullWidth error={!!errors.source}>
                <InputLabel>Traffic Source *</InputLabel>
                <Select {...register('source')} defaultValue="Website Direct" label="Traffic Source *">
                  <MenuItem value=""><em>Select Traffic Source</em></MenuItem>
                  {['Website Direct', 'Google Ads', 'Facebook Ads', 'WhatsApp', 'Instagram', 'Referral', 'Walk-in'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
                {errors.source && <Typography variant="caption" color="error" sx={{ mt: 0.3, display: 'block' }}>{errors.source.message}</Typography>}
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select {...register('priority')} defaultValue="Medium" label="Priority">
                  {['High', 'Medium', 'Low'].map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                {...register('notes')}
                label="Lead Notes / Flight Requirements"
                multiline
                rows={3}
                placeholder="Specific airline preference, layover requirements, meal requests, etc."
                size="small"
                sx={{ gridColumn: { sm: 'span 2' } }}
              />
            </Box>
          </Paper>
        </Box>
      </AppModal>

      {/* MODAL 2: Assign Agent */}
      <AppModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Flight Travel Specialist"
        actions={
          <>
            <Button onClick={() => setAssignModalOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAssignAgentSubmit}
              variant="contained"
              color="secondary"
              disabled={assignAgentMutation.isPending}
            >
              Assign
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedLead && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Select the flight travel specialist to handle this booking for{' '}
              <strong>
                {selectedLead.firstName} {selectedLead.lastName}
              </strong>{' '}
              ({selectedLead.nationality}, preferred language: {selectedLead.preferredLanguage}).
            </Typography>
          )}
          <FormControl fullWidth size="small">
            <InputLabel id="agent-select-label">Select Agent</InputLabel>
            <Select
              labelId="agent-select-label"
              value={targetConsultantId}
              onChange={(e) => setTargetConsultantId(e.target.value)}
              label="Select Agent"
            >
              <MenuItem value="">Unassigned</MenuItem>
              {agents.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({Array.isArray(c.languages) ? c.languages.join('/') : (c.languages || c.department || 'All')}) - {c.casesCount || 0} active cases
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </AppModal>
    </Box>
  );
};

export default AgentLeadList;

