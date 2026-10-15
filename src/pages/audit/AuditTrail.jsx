import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Drawer from '@mui/material/Drawer';

// Icons
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import DevicesIcon from '@mui/icons-material/Devices';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GavelIcon from '@mui/icons-material/Gavel';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import { auditTrailService } from '../../services/phase3Service';

// ==========================================
// MOCK AUDIT DATASETS
// ==========================================

const INITIAL_AUDIT_KPIS = [
  { id: 'total', title: 'Total Audit Records', value: '0 Logs', change: 'Live immutable log', isUp: true, color: '#3F51B5', border: '#3F51B5', icon: <HistoryIcon /> },
  { id: 'today', title: 'Today\'s Activities', value: '0 Events', change: 'Live system logs', isUp: true, color: '#0284C7', border: '#0284C7', icon: <SecurityIcon /> },
  { id: 'sensitive', title: 'Sensitive Changes', value: '0 Records', change: 'Zero flagged actions', isUp: false, color: '#DC2626', border: '#DC2626', icon: <ReportProblemIcon /> },
  { id: 'refund', title: 'Refund Audit Logs', value: '0 Actions', change: 'Zero refund alterations', isUp: true, color: '#D97706', border: '#D97706', icon: <CurrencyExchangeIcon /> },
  { id: 'price', title: 'Price Modifications', value: '0 Changes', change: 'Zero fare overrides', isUp: true, color: '#059669', border: '#059669', icon: <MonetizationOnIcon /> },
  { id: 'failedLogin', title: 'Failed Login Attempts', value: '0 Attempts', change: 'Security status clean', isUp: false, color: '#DC2626', border: '#DC2626', icon: <LockIcon /> }
];

const INITIAL_AUDIT_LOGS = [];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AuditTrail() {
  const { showAlert } = useAlert();
  const [currentTab, setCurrentTab] = useState(0);

  // States
  const [kpis, setKpis] = useState(INITIAL_AUDIT_KPIS);
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live Audit Trail Data from backend API (/api/audit-trail)
  React.useEffect(() => {
    let isMounted = true;
    auditTrailService.getAuditTrail().then(res => {
      if (!isMounted || !res) return;
      if (res.data && Array.isArray(res.data)) {
        setLogs(res.data);
      } else if (res.data && Array.isArray(res.data.logs)) {
        setLogs(res.data.logs);
      }
      if (res.kpis && Array.isArray(res.kpis)) {
        setKpis(res.kpis);
      }
    }).catch(err => console.warn('Audit Trail API load warning:', err.message));
    return () => { isMounted = false; };
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sensitiveOnly, setSensitiveOnly] = useState(false);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleInspectAudit = (audit) => {
    setSelectedAudit(audit);
    setDrawerOpen(true);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.auditId.toLowerCase().includes(searchQuery.toLowerCase()) || l.user.toLowerCase().includes(searchQuery.toLowerCase()) || l.action.toLowerCase().includes(searchQuery.toLowerCase()) || l.refId.toLowerCase().includes(searchQuery.toLowerCase()) || l.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
      const matchesRole = roleFilter === 'ALL' || l.role === roleFilter;
      const matchesSensitive = !sensitiveOnly || l.sensitive;
      return matchesSearch && matchesModule && matchesRole && matchesSensitive;
    });
  }, [logs, searchQuery, moduleFilter, roleFilter, sensitiveOnly]);

  return (
    <Box sx={{ pb: 6, minHeight: '100vh' }}>
      
      {/* Top Executive Header */}
      <Paper elevation={0} sx={{ p: 2.5, px: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#DC2626', width: 48, height: 48, fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
            📜
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                Enterprise Audit Trail & System Security Logs
              </Typography>
              <Chip label="IMMUTABLE AUDIT LOGS" size="small" sx={{ fontWeight: 900, fontSize: '0.68rem', bgcolor: '#DC2626', color: '#FFF', height: 24 }} />
              <Chip label="READ-ONLY COMPLIANCE" size="small" variant="outlined" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem', height: 24 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.2 }}>
              Permanent activity history logging Who, What, When, Old vs New values, IP addresses, and Reasons for all CRM actions
            </Typography>
          </Box>
        </Box>
        <DualClock client={{ timezone: 'America/New_York', label: 'Audit Timestamp (EST)' }} />
      </Paper>

      {/* 6 REAL-TIME AUDIT KPI CARDS */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.5 }}>
          {kpis.map((kpi) => (
            <Paper
              key={kpi.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  backgroundColor: kpi.border
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.62rem' }}>
                  {kpi.title}
                </Typography>
                <Box sx={{ p: 0.5, borderRadius: 1.5, bgcolor: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.border, fontSize: '0.62rem' }}>
                  {kpi.change}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ─── DASHBOARD MODULE NAVIGATION (NO-BOX 2-LINE GRID) ─── */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(1, 1fr)', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 1.5,
          mb: 3.5
        }}
      >
        {[
          { id: 0, label: '1. Audit Security Dashboard', icon: <SecurityIcon sx={{ fontSize: '1.1rem' }} /> },
          { id: 1, label: '2. Activity Timeline', badge: filteredLogs.length, icon: <HistoryIcon sx={{ fontSize: '1.1rem' }} /> },
          { 
            id: 2, 
            label: '3. Sensitive Changes (Alerts)', 
            badge: logs.filter(l => l.sensitive).length, 
            badgeColor: '#EF4444', 
            icon: <ReportProblemIcon sx={{ fontSize: '1.1rem' }} /> 
          },
          { id: 3, label: '4. Refund Audit Ledger', icon: <CurrencyExchangeIcon sx={{ fontSize: '1.1rem' }} /> },
          { id: 4, label: '5. Login & Session History', icon: <LockIcon sx={{ fontSize: '1.1rem' }} /> },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Box
              key={tab.id}
              component="button"
              onClick={() => setCurrentTab(tab.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                py: 1.2,
                px: 1.6,
                minHeight: 48,
                border: '1px solid',
                borderColor: isActive ? 'primary.main' : 'divider',
                borderRadius: 2.2,
                bgcolor: isActive 
                  ? (theme) => theme.palette.mode === 'dark' ? 'primary.main' : 'primary.main' 
                  : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                color: isActive ? '#FFFFFF' : 'text.primary',
                cursor: 'pointer',
                transition: 'all 0.18s ease-in-out',
                outline: 'none',
                textAlign: 'left',
                boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.22)' : 'none',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: isActive 
                    ? 'primary.dark' 
                    : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#EFF6FF',
                  color: isActive ? '#FFFFFF' : 'primary.main'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    color: isActive ? '#FFFFFF' : 'primary.main', 
                    display: 'flex', 
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  {tab.icon}
                </Box>
                <Typography 
                  variant="body2" 
                  noWrap
                  sx={{ 
                    fontWeight: isActive ? 800 : 700, 
                    fontSize: { xs: '0.74rem', sm: '0.78rem', md: '0.82rem' },
                    color: 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
              {tab.badge !== undefined && (
                <Chip 
                  label={tab.badge} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    minWidth: 20, 
                    px: 0.6, 
                    fontWeight: 900, 
                    fontSize: '0.65rem',
                    bgcolor: isActive 
                      ? 'rgba(255,255,255,0.25)' 
                      : (tab.badgeColor || (theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0')),
                    color: isActive ? '#FFFFFF' : (tab.badgeColor ? '#FFFFFF' : 'text.secondary'),
                    borderRadius: '10px',
                    flexShrink: 0
                  }} 
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* ========================================================= */}
      {/* TAB 1: AUDIT SECURITY DASHBOARD */}
      {/* ========================================================= */}
      {currentTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#3F51B5', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                Immutable System Activity Stream
              </Typography>
              <Chip label="100% Tamper-Proof Audit Vault" color="success" sx={{ fontWeight: 900 }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {logs.map((log) => (
                <Paper
                  key={log.auditId}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: (theme) =>
                      log.sensitive
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : '#FEF2F2'
                        : theme.palette.mode === 'dark'
                        ? 'background.paper'
                        : '#FFFFFF',
                    borderColor: (theme) =>
                      log.sensitive
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(239, 68, 68, 0.35)'
                          : '#FCA5A5'
                        : 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                        {log.action}
                      </Typography>
                      {log.sensitive && (
                        <Chip label="🔴 SENSITIVE CHANGE" size="small" color="error" sx={{ fontWeight: 900, fontSize: '0.62rem' }} />
                      )}
                      <Chip label={log.module} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.62rem' }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'text.secondary' }}>
                      {log.auditId} • {log.timestamp}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5 }}>
                    User: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{log.user}</Box> ({log.role}) • Customer/Ref: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{log.customer}</Box> ({log.refId}) • IP: <Box component="span" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>{log.ipAddress}</Box>
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 2, mb: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, borderColor: 'divider' }}>
                    <Box><Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>OLD VALUE:</Typography><Typography variant="body2" sx={{ fontWeight: 700, textDecoration: 'line-through', color: (theme) => theme.palette.mode === 'dark' ? '#FCA5A5' : 'text.primary' }}>{log.oldValue}</Typography></Box>
                    <Box><Typography variant="caption" color="success.main" sx={{ fontWeight: 800 }}>NEW VALUE:</Typography><Typography variant="body2" sx={{ fontWeight: 900, color: (theme) => theme.palette.mode === 'dark' ? '#86EFAC' : 'text.primary' }}>{log.newValue}</Typography></Box>
                  </Paper>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontStyle: 'italic', display: 'block', mb: 1.5 }}>
                    Reason: "{log.reason}"
                  </Typography>

                  <Button size="small" variant="outlined" color="primary" onClick={() => handleInspectAudit(log)} startIcon={<VisibilityIcon />} sx={{ fontWeight: 800, fontSize: '0.68rem' }}>
                    Inspect Full Audit Details
                  </Button>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACTIVITY TIMELINE */}
      {/* ========================================================= */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#3F51B5' }}>
                Chronological CRM Activity Audit Trail
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search and filter every action taken by Sales Agents, Team Leaders, Finance, and Admins
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search audit ID, user, action..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{ width: 240 }}
              />

              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Module</InputLabel>
                <Select value={moduleFilter} label="Module" onChange={e => setModuleFilter(e.target.value)}>
                  <MenuItem value="ALL">All Modules</MenuItem>
                  <MenuItem value="Pricing & Quotes">Pricing & Quotes</MenuItem>
                  <MenuItem value="Payments & Refunds">Payments & Refunds</MenuItem>
                  <MenuItem value="Ticketing GDS">Ticketing GDS</MenuItem>
                  <MenuItem value="Lead Management">Lead Management</MenuItem>
                  <MenuItem value="User Permissions">User Permissions</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 950 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Audit ID & Time</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>User & Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Performed</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Ref ID / Customer</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Type</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Inspect</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((l) => (
                  <TableRow
                    key={l.auditId}
                    hover
                    sx={{
                      bgcolor: l.sensitive
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'
                        : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{l.auditId}</Typography>
                      <Typography variant="caption" color="text.secondary">{l.timestamp}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{l.user}</Typography>
                      <Typography variant="caption" color="text.secondary">{l.role}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>{l.action}</Typography>
                      <Typography variant="caption" color="text.secondary">{l.module}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{l.customer}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{l.refId}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.ipAddress}</TableCell>
                    <TableCell align="center">
                      {l.sensitive ? (
                        <Chip label="🔴 Sensitive" size="small" color="error" sx={{ fontWeight: 900 }} />
                      ) : (
                        <Chip label="Normal" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined" onClick={() => handleInspectAudit(l)} sx={{ fontWeight: 800, fontSize: '0.68rem' }}>
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SENSITIVE CHANGES LEDGER */}
      {/* ========================================================= */}
      {currentTab === 2 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#DC2626', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblemIcon color="error" />
            Sensitive Financial & Permission Changes Ledger
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {logs.filter(l => l.sensitive).map((s) => (
              <Paper
                key={s.auditId}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'),
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5'),
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: (theme) => (theme.palette.mode === 'dark' ? '#F87171' : '#991B1B') }}>
                    {s.auditId} • {s.action} ({s.refId})
                  </Typography>
                  <Chip label="🔴 IMMUTABLE SENSITIVE LOG" size="small" color="error" sx={{ fontWeight: 900 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                  User: <Box component="span" sx={{ color: 'text.primary' }}>{s.user}</Box> ({s.role}) • Customer: <Box component="span" sx={{ color: 'text.primary' }}>{s.customer}</Box> • IP: <Box component="span" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>{s.ipAddress}</Box>
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, mb: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Reason Given:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: (theme) => (theme.palette.mode === 'dark' ? '#F87171' : '#DC2626') }}>"{s.reason}"</Typography>
                </Paper>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 4: REFUND AUDIT LEDGER */}
      {/* ========================================================= */}
      {currentTab === 3 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#D97706', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CurrencyExchangeIcon color="warning" />
            Financial Refund Request & Processing Audit Trail
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Audit ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer & Booking</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Refund Action</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.filter(l => l.module.includes('Payments')).map((r) => (
                  <TableRow key={r.auditId} hover>
                    <TableCell sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{r.auditId}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{r.user} ({r.role})</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{r.customer} ({r.refId})</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#D97706' }}>{r.action}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{r.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 5: LOGIN & SESSION HISTORY */}
      {/* ========================================================= */}
      {currentTab === 4 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#3F51B5', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="primary" />
            User Login & Device Session Audit History
          </Typography>
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Session ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>User & Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Browser & Device OS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((s) => (
                  <TableRow key={s.sessionId} hover>
                    <TableCell sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{s.sessionId}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{s.user} ({s.role})</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{s.ipAddress}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.device}</TableCell>
                    <TableCell align="center">
                      <Chip label="Authenticated Active" size="small" color="success" sx={{ fontWeight: 800 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* INSPECT AUDIT DETAILS DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none'
          }
        }}
      >
        <Box sx={{ width: 440, p: 3, bgcolor: 'background.paper', minHeight: '100%' }}>
          {selectedAudit && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'monospace' }}>
                  {selectedAudit.auditId}
                </Typography>
                <Chip label={selectedAudit.sensitive ? '🔴 Sensitive' : 'Normal'} color={selectedAudit.sensitive ? 'error' : 'default'} sx={{ fontWeight: 900 }} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Action Performed:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>{selectedAudit.action}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Who Performed Action:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedAudit.user} ({selectedAudit.role})</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>When Timestamp:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{selectedAudit.timestamp}</Typography>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', borderRadius: 2, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5' }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 900 }}>OLD VALUE:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, textDecoration: 'line-through', color: (theme) => theme.palette.mode === 'dark' ? '#FCA5A5' : 'text.primary' }}>{selectedAudit.oldValue}</Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4', borderRadius: 2, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.35)' : '#86EFAC' }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 900 }}>NEW VALUE:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: (theme) => theme.palette.mode === 'dark' ? '#86EFAC' : 'text.primary' }}>{selectedAudit.newValue}</Typography>
              </Paper>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Reason Given:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontStyle: 'italic' }}>"{selectedAudit.reason}"</Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>IP Address:</Typography><Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', display: 'block' }}>{selectedAudit.ipAddress}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Session ID:</Typography><Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', display: 'block' }}>{selectedAudit.sessionId}</Typography></Box>
              </Box>

              <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Device / Browser:</Typography><Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{selectedAudit.device}</Typography></Box>

              <Box sx={{ mt: 2 }}>
                <Button fullWidth variant="contained" color="primary" onClick={() => setDrawerOpen(false)} sx={{ fontWeight: 800 }}>
                  Close Audit Inspection
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

    </Box>
  );
}
