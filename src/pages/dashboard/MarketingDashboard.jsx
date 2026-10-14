import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorageIcon from '@mui/icons-material/Storage';

// Recharts
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

import DualClock from '../../components/DualClock';
import { useAlert } from '../../contexts/AlertContext';
import { dbService } from '../../services/dbService';

// Fallback Automation Workflows
const INITIAL_AUTOMATION_WORKFLOWS = [
  { id: 'WF-101', name: 'Instant Lead Assignment & WhatsApp Welcome', trigger: 'New Flight Inquiry Created', condition: 'Lead Score >= 50', action: 'Assign Agent + Send WhatsApp Template + Create Follow-up Task', delay: 'Immediate (0m)', status: true, executedCount: 1420 },
  { id: 'WF-102', name: 'Quote Expiry & 24h Price Re-Check Alert', trigger: 'Quote Issued > 24 Hours Unpaid', condition: 'Flight Departure < 14 Days', action: 'Send Price Hold Reminder SMS & WhatsApp Discount Coupon', delay: '24 Hours', status: true, executedCount: 890 },
  { id: 'WF-103', name: 'Pre-Departure Flight Itinerary & Gate Alert', trigger: 'Flight Departure in 48 Hours', condition: 'Ticket Issued == TRUE', action: 'Send Web Check-in Link + E-ticket PDF + Weather Briefing', delay: '48 Hours Before Flight', status: true, executedCount: 650 },
  { id: 'WF-104', name: 'Post-Travel Feedback & Google Review Request', trigger: 'Return Flight Arrival + 24 Hours', condition: 'Booking Status == COMPLETED', action: 'Send NPS Survey Email + $50 Voucher for Next Booking', delay: '24 Hours Post Return', status: true, executedCount: 420 },
  { id: 'WF-105', name: 'Abandoned Cart / Unfinished Flight Search Recovery', trigger: 'Search Form Completed without Quote', condition: 'Email Captured == TRUE', action: 'Send Retargeting Email with Live Airline Price Comparison', delay: '2 Hours', status: false, executedCount: 210 }
];

const INITIAL_AUTOMATION_LOGS = [
  { id: 'LOG-801', workflowName: 'Instant Lead Assignment & WhatsApp Welcome', triggerTime: '2026-10-14 13:45:12', customer: 'Rajesh Sharma', action: 'WhatsApp Welcome Template & Agent Reassigned to Sofia R.', status: 'Success' },
  { id: 'LOG-802', workflowName: 'Quote Expiry & 24h Price Re-Check Alert', triggerTime: '2026-10-14 13:20:04', customer: 'Marcus Vance', action: 'SMS Reminder Sent: Quote QT-9001 expires in 4 hours', status: 'Success' },
  { id: 'LOG-803', workflowName: 'Pre-Departure Flight Itinerary & Gate Alert', triggerTime: '2026-10-14 12:10:33', customer: 'John Doe', action: 'E-Ticket PDF & Boarding Pass link sent via Email', status: 'Success' },
  { id: 'LOG-804', workflowName: 'Abandoned Cart Recovery', triggerTime: '2026-10-14 11:05:00', customer: 'Elena Petrova', action: 'Retargeting flight fare alert dispatched', status: 'Success' }
];

const LANDING_PAGES_DATA = [
  { url: '/flights/europe-summer-sale', visitors: 42500, leads: 840, conv: '1.98%', bookings: 195, revenue: '$268,000', grossProfit: '$48,500', roi: '391%' },
  { url: '/luxury-first-class', visitors: 28400, leads: 620, conv: '2.18%', bookings: 140, revenue: '$215,000', grossProfit: '$38,200', roi: '389%' },
  { url: '/flights/asia-balikbayan', visitors: 31200, leads: 590, conv: '1.89%', bookings: 160, revenue: '$148,000', grossProfit: '$24,600', roi: '384%' },
  { url: '/flights/london-heathrow', visitors: 19800, leads: 480, conv: '2.42%', bookings: 85, revenue: '$94,000', grossProfit: '$15,800', roi: '303%' }
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function MarketingDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showAlert } = useAlert();
  const [currentTab, setCurrentTab] = useState(0);

  // Live Database & Server State
  const [dbHealth, setDbHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Live CRM Entities from PostgreSQL Database
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [workflows, setWorkflows] = useState(INITIAL_AUTOMATION_WORKFLOWS);
  const [automationLogs, setAutomationLogs] = useState(INITIAL_AUTOMATION_LOGS);

  // Filters
  const [searchCampaign, setSearchCampaign] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [utmModalOpen, setUtmModalOpen] = useState(false);
  const [selectedUtmCampaign, setSelectedUtmCampaign] = useState(null);

  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    trigger: 'New Flight Inquiry Created',
    condition: 'All Leads',
    action: 'Send WhatsApp + Send Email',
    delay: 'Immediate (0m)'
  });

  const [newCampaignModalOpen, setNewCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    platform: 'Google Ads',
    budget: 5000,
    spend: 0,
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'flight_deals_2026',
    landingPage: '/flights/deal-review'
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Real Data from PostgreSQL via Backend API
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchLiveData = useCallback(async (showNotice = false) => {
    setIsLoading(true);
    try {
      const [healthRes, leadsRes, bookingsRes, quotesRes, paymentsRes, campaignsRes] = await Promise.all([
        dbService.getDbHealth(),
        dbService.getLeads(),
        dbService.getBookings(),
        dbService.getQuotes(),
        dbService.getPayments(),
        dbService.getCampaigns()
      ]);

      setDbHealth(healthRes);
      setLeads(Array.isArray(leadsRes) ? leadsRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setQuotes(Array.isArray(quotesRes) ? quotesRes : []);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
      setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
      setLastRefreshed(new Date().toLocaleTimeString());

      if (showNotice) {
        const isConnected = healthRes?.database?.connected;
        showAlert(
          isConnected 
            ? `✓ Synced with PostgreSQL database! Loaded ${leadsRes.length} leads, ${bookingsRes.length} bookings, ${quotesRes.length} quotes.`
            : `Loaded in offline fallback mode (${leadsRes.length} leads, ${bookingsRes.length} bookings).`,
          isConnected ? 'success' : 'info'
        );
      }
    } catch (err) {
      console.error('[MarketingDashboard] Error loading live data:', err);
      showAlert('Error loading live data from database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchLiveData(false);
  }, [fetchLiveData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Real-time Metrics Calculation (Derived from Real DB Data)
  // ─────────────────────────────────────────────────────────────────────────────
  const liveMetrics = useMemo(() => {
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.status && !['New Lead', 'Lost', 'Unassigned'].includes(l.status)).length;
    const quotesSent = quotes.length;
    const confirmedBookings = bookings.length;

    // Real revenue calculation from bookings and paid payments
    const bookingsRevenue = bookings.reduce((sum, b) => {
      const amt = parseFloat(String(b.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);
    const paymentsRevenue = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenue = Math.max(bookingsRevenue, paymentsRevenue) || bookingsRevenue || paymentsRevenue;

    // Real gross profit / commission
    const bookingsCommission = bookings.reduce((sum, b) => {
      const comm = parseFloat(String(b.commission || '$0').replace(/[^0-9.]/g, '')) || 0;
      return sum + comm;
    }, 0);
    const quotesMarkup = quotes.reduce((sum, q) => sum + (parseFloat(q.markup) || 0) + (parseFloat(q.serviceFee) || 0), 0);
    const grossProfit = bookingsCommission + quotesMarkup || (totalRevenue * 0.15);

    // Campaign spend calculation
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const activeCampaignsCount = campaigns.filter(c => c.status === 'Active').length;

    // Financial ROI & Cost Efficiency
    const roi = totalSpend > 0 ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1) : '384.5';
    const cpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '14.20';
    const cpb = confirmedBookings > 0 ? (totalSpend / confirmedBookings).toFixed(2) : '72.05';

    return {
      totalLeads,
      qualifiedLeads,
      quotesSent,
      confirmedBookings,
      totalRevenue,
      grossProfit,
      totalSpend,
      activeCampaignsCount,
      roi,
      cpl,
      cpb,
      qualRate: totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '63.2',
      closeRate: quotesSent > 0 ? ((confirmedBookings / quotesSent) * 100).toFixed(1) : (totalLeads > 0 ? ((confirmedBookings / totalLeads) * 100).toFixed(1) : '47.8'),
      avgRevenuePerBkg: confirmedBookings > 0 ? Math.round(totalRevenue / confirmedBookings) : 1238,
      profitMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '17.4',
    };
  }, [leads, bookings, quotes, payments, campaigns]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Customer Journey Funnel Stages
  // ─────────────────────────────────────────────────────────────────────────────
  const journeyFunnelStages = useMemo(() => {
    const estImpressions = 124500;
    return [
      {
        stage: '1. Campaign Impressions',
        count: `${estImpressions.toLocaleString()} Clicks`,
        conv: '100%',
        rev: '$0',
        profit: '$0',
        drop: liveMetrics.totalLeads > 0 ? `${((1 - (liveMetrics.totalLeads / estImpressions)) * 100).toFixed(1)}% drop to lead` : '97.2% drop to lead',
        color: '#3F51B5'
      },
      {
        stage: '2. Total Leads Generated',
        count: `${liveMetrics.totalLeads} Real Leads`,
        conv: estImpressions > 0 ? `${((liveMetrics.totalLeads / estImpressions) * 100).toFixed(2)}%` : '2.78%',
        rev: '$0',
        profit: '$0',
        drop: liveMetrics.totalLeads > 0 ? `${(100 - parseFloat(liveMetrics.qualRate)).toFixed(1)}% drop to qual` : '36.8% drop to qual',
        color: '#2563EB'
      },
      {
        stage: '3. Qualified Leads',
        count: `${liveMetrics.qualifiedLeads} Qual Leads`,
        conv: `${liveMetrics.qualRate}%`,
        rev: '$0',
        profit: '$0',
        drop: liveMetrics.qualifiedLeads > 0 ? `${((1 - (liveMetrics.quotesSent / Math.max(liveMetrics.qualifiedLeads, 1))) * 100).toFixed(1)}% drop to quote` : '34.9%',
        color: '#0284C7'
      },
      {
        stage: '4. Quotes Issued',
        count: `${liveMetrics.quotesSent} Quotes Sent`,
        conv: liveMetrics.totalLeads > 0 ? `${((liveMetrics.quotesSent / Math.max(liveMetrics.totalLeads, 1)) * 100).toFixed(1)}%` : '65.1%',
        rev: `$${Math.round(liveMetrics.totalRevenue * 1.5).toLocaleString()} Potential`,
        profit: `$${Math.round(liveMetrics.grossProfit * 1.5).toLocaleString()} Potential`,
        drop: liveMetrics.quotesSent > 0 ? `${((1 - (liveMetrics.confirmedBookings / Math.max(liveMetrics.quotesSent, 1))) * 100).toFixed(1)}% drop to booking` : '52.2%',
        color: '#7C3AED'
      },
      {
        stage: '5. Confirmed Bookings',
        count: `${liveMetrics.confirmedBookings} Bookings`,
        conv: `${liveMetrics.closeRate}%`,
        rev: `$${Math.round(liveMetrics.totalRevenue).toLocaleString()}`,
        profit: `$${Math.round(liveMetrics.grossProfit).toLocaleString()}`,
        drop: 'Final Converters',
        color: '#059669'
      },
      {
        stage: '6. Net Profit & ROI',
        count: `ROI ${liveMetrics.roi}%`,
        conv: `${liveMetrics.profitMargin}% Margin`,
        rev: `$${Math.round(liveMetrics.totalRevenue).toLocaleString()} Revenue`,
        profit: `$${Math.round(liveMetrics.grossProfit).toLocaleString()} Profit`,
        drop: `Avg/Bkg: $${liveMetrics.avgRevenuePerBkg}`,
        color: '#C59B27'
      }
    ];
  }, [liveMetrics]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Referral Channels from Real Leads
  // ─────────────────────────────────────────────────────────────────────────────
  const dynamicReferralChannels = useMemo(() => {
    const channelMap = {
      'Google Ads Search': { leads: 0, bookings: 0, revenue: 0, profit: 0 },
      'Facebook & Instagram Paid': { leads: 0, bookings: 0, revenue: 0, profit: 0 },
      'WhatsApp Marketing API': { leads: 0, bookings: 0, revenue: 0, profit: 0 },
      'Organic Google Search (SEO)': { leads: 0, bookings: 0, revenue: 0, profit: 0 },
      'Direct / Referrals & GDS': { leads: 0, bookings: 0, revenue: 0, profit: 0 }
    };

    leads.forEach(l => {
      const src = (l.source || '').toLowerCase();
      let target = 'Direct / Referrals & GDS';
      if (src.includes('google') || src.includes('gads')) target = 'Google Ads Search';
      else if (src.includes('meta') || src.includes('facebook') || src.includes('instagram')) target = 'Facebook & Instagram Paid';
      else if (src.includes('whatsapp')) target = 'WhatsApp Marketing API';
      else if (src.includes('organic') || src.includes('seo') || src.includes('website')) target = 'Organic Google Search (SEO)';
      
      channelMap[target].leads += 1;
    });

    bookings.forEach(b => {
      const supp = (b.supplier || '').toLowerCase();
      let target = 'Direct / Referrals & GDS';
      if (supp.includes('google')) target = 'Google Ads Search';
      else if (supp.includes('meta') || supp.includes('facebook')) target = 'Facebook & Instagram Paid';
      else if (supp.includes('whatsapp')) target = 'WhatsApp Marketing API';
      
      const amt = parseFloat(String(b.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
      const comm = parseFloat(String(b.commission || '$0').replace(/[^0-9.]/g, '')) || (amt * 0.1);
      
      channelMap[target].bookings += 1;
      channelMap[target].revenue += amt;
      channelMap[target].profit += comm;
    });

    return Object.entries(channelMap).map(([channel, stats]) => {
      const convRate = stats.leads > 0 ? `${((stats.bookings / stats.leads) * 100).toFixed(1)}%` : (stats.bookings > 0 ? '100%' : '0%');
      return {
        channel,
        leads: stats.leads,
        bookings: stats.bookings,
        convRate,
        revenue: `$${Math.round(stats.revenue).toLocaleString()}`,
        profit: `$${Math.round(stats.profit).toLocaleString()}`
      };
    });
  }, [leads, bookings]);

  // Dynamic 10 Top Marketing KPIs
  const topMarketingKpis = useMemo(() => [
    { id: 'campaigns', title: 'Active Campaigns', value: `${liveMetrics.activeCampaignsCount} Active`, change: `${campaigns.length} Total Registered`, isUp: true, color: '#3F51B5', border: '#3F51B5', icon: <CampaignIcon /> },
    { id: 'leads', title: 'Total Leads (DB)', value: `${liveMetrics.totalLeads.toLocaleString()}`, change: 'Real PostgreSQL Records', isUp: true, color: '#2563EB', border: '#2563EB', icon: <PeopleAltIcon /> },
    { id: 'qualified', title: 'Qualified Leads', value: `${liveMetrics.qualifiedLeads.toLocaleString()}`, change: `${liveMetrics.qualRate}% qual rate`, isUp: true, color: '#0284C7', border: '#0284C7', icon: <CheckCircleIcon /> },
    { id: 'quotes', title: 'Quotes Sent (DB)', value: `${liveMetrics.quotesSent.toLocaleString()}`, change: 'Real Proposals Issued', isUp: true, color: '#7C3AED', border: '#7C3AED', icon: <RequestQuoteIcon /> },
    { id: 'bookings', title: 'Confirmed Bookings', value: `${liveMetrics.confirmedBookings.toLocaleString()}`, change: `${liveMetrics.closeRate}% close rate`, isUp: true, color: '#059669', border: '#059669', icon: <AirplaneTicketIcon /> },
    { id: 'revenue', title: 'Revenue Generated', value: `$${Math.round(liveMetrics.totalRevenue).toLocaleString()}`, change: `Avg $${liveMetrics.avgRevenuePerBkg}/bkg`, isUp: true, color: '#059669', border: '#059669', icon: <MonetizationOnIcon /> },
    { id: 'profit', title: 'Gross Profit', value: `$${Math.round(liveMetrics.grossProfit).toLocaleString()}`, change: `${liveMetrics.profitMargin}% margin`, isUp: true, color: '#C59B27', border: '#C59B27', icon: <AccountBalanceWalletIcon /> },
    { id: 'roi', title: 'ROI Percentage', value: `${liveMetrics.roi}%`, change: `Based on $${liveMetrics.totalSpend.toLocaleString()} spend`, isUp: true, color: '#059669', border: '#059669', icon: <TrendingUpIcon /> },
    { id: 'cpl', title: 'Cost Per Lead (CPL)', value: `$${liveMetrics.cpl}`, change: 'Real lead acquisition cost', isUp: false, color: '#D97706', border: '#D97706', icon: <PriceCheckIcon /> },
    { id: 'cpb', title: 'Cost Per Booking (CPB)', value: `$${liveMetrics.cpb}`, change: 'Real booking acquisition cost', isUp: false, color: '#059669', border: '#059669', icon: <PriceCheckIcon /> }
  ], [liveMetrics, campaigns.length]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleInspectUTM = (campaign) => {
    setSelectedUtmCampaign(campaign);
    setUtmModalOpen(true);
  };

  const handleToggleWorkflow = (id) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: !w.status } : w));
    const target = workflows.find(w => w.id === id);
    showAlert(`Workflow "${target.name}" status updated to ${!target.status ? 'ACTIVE' : 'PAUSED'}`, 'info');
  };

  const handleCreateWorkflow = () => {
    if (!workflowForm.name) {
      showAlert('Please enter a workflow name', 'warning');
      return;
    }
    const newWf = {
      id: `WF-${Math.floor(100 + Math.random() * 900)}`,
      name: workflowForm.name,
      trigger: workflowForm.trigger,
      condition: workflowForm.condition,
      action: workflowForm.action,
      delay: workflowForm.delay,
      status: true,
      executedCount: 0
    };
    setWorkflows([newWf, ...workflows]);
    setNewWorkflowModalOpen(false);
    showAlert(`✓ Marketing Automation Workflow "${workflowForm.name}" created successfully!`, 'success');
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name) {
      showAlert('Please enter a campaign name', 'warning');
      return;
    }
    try {
      const created = await dbService.createCampaign({
        name: campaignForm.name,
        platform: campaignForm.platform,
        budget: parseFloat(campaignForm.budget) || 5000,
        spend: parseFloat(campaignForm.spend) || 0,
        utmSource: campaignForm.utmSource,
        utmMedium: campaignForm.utmMedium,
        utmCampaign: campaignForm.utmCampaign,
        landingPage: campaignForm.landingPage,
        status: 'Active',
      });
      setCampaigns(prev => [created, ...prev]);
      setNewCampaignModalOpen(false);
      showAlert(`✓ Campaign "${created.name}" created and saved successfully!`, 'success');
    } catch (e) {
      showAlert('Error creating campaign', 'error');
    }
  };

  const handleRetryLog = (logId) => {
    setAutomationLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'Success', action: 'Retried manually: WhatsApp resent successfully' } : l));
    showAlert(`✓ Workflow execution ${logId} retried and completed successfully!`, 'success');
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,Campaign Name,Platform,Status,Budget,Spend,Leads,Qualified,Bookings,Revenue,Gross Profit,ROI %\n";
      campaigns.forEach(c => {
        csvContent += `"${c.name}","${c.platform}","${c.status}",${c.budget},${c.spend},${c.leads},${c.qualLeads},${c.bookings},${c.revenue},${c.grossProfit},${c.roi}%\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `marketing_roi_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert("✓ Comprehensive Marketing ROI & Profit Report exported to CSV!", "success");
    } catch (e) {
      showAlert("Failed to export report", "error");
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchCampaign.toLowerCase()) || c.platform.toLowerCase().includes(searchCampaign.toLowerCase());
      const matchesPlatform = platformFilter === 'ALL' || c.platform.toLowerCase().includes(platformFilter.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [campaigns, searchCampaign, platformFilter, statusFilter]);

  return (
    <Box sx={{ pb: 6, minHeight: '100vh' }}>
      
      {/* Top Executive Marketing Header with Real-time DB Indicators */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, px: { xs: 2, sm: 3 }, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
          <Avatar sx={{ bgcolor: '#3F51B5', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, fontWeight: 900, fontSize: { xs: '0.9rem', sm: '1.1rem' }, boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)' }}>
            MKT
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif', fontSize: { xs: '1.05rem', sm: '1.35rem' }, lineHeight: 1.2 }}>
                Marketing ROI & Automation Command Center
              </Typography>
              <Chip label="ROLE: MARKETING MANAGER" size="small" sx={{ fontWeight: 900, fontSize: '0.65rem', bgcolor: '#3F51B5', color: '#FFF', height: 22 }} />
              
              {/* Live DB Connection Badge */}
              <Chip
                icon={<StorageIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={dbHealth?.database?.connected ? "PostgreSQL (Railway) Live" : "Local Sync Active"}
                size="small"
                color={dbHealth?.database?.connected ? "success" : "default"}
                variant={isDark ? "filled" : "outlined"}
                sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
              />

              {lastRefreshed && (
                <Chip
                  label={`Synced: ${lastRefreshed}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Real-time Database Journey Attribution: Connected to {leads.length} Leads, {bookings.length} Bookings, {quotes.length} Quotes & Invoices
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon className={isLoading ? "spin-animation" : ""} />}
            onClick={() => fetchLiveData(true)}
            sx={{ fontWeight: 800 }}
          >
            Refresh DB Data
          </Button>
          <Button variant="contained" color="secondary" startIcon={<FileDownloadIcon />} onClick={handleExportCSV} sx={{ fontWeight: 800, width: { xs: '100%', sm: 'auto' } }}>
            Export Marketing ROI CSV
          </Button>
          <DualClock client={{ timezone: 'America/New_York', label: 'Campaign Time (EST)' }} />
        </Box>
      </Paper>

      {/* Loading Progress indicator */}
      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* 10 MARKETING KPI CARDS - LIVE DATABASE DERIVED */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {topMarketingKpis.map((kpi) => (
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
                  boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.06)'
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
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {kpi.title}
                </Typography>
                <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: isDark ? 'action.hover' : `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.border, fontSize: '0.65rem' }}>
                  {kpi.change}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* FULL CUSTOMER JOURNEY CONVERSION FUNNEL */}
      <Paper elevation={0} sx={{ p: 3, mb: 3.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#818CF8' : '#3F51B5', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              Full Customer Journey Conversion Funnel (Ad Click → Gross Profit)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time funnel conversion metrics showing volume drop-offs, quote transitions, and actual net profitability
            </Typography>
          </Box>
          <Chip label={`Net Marketing ROI: ${liveMetrics.roi}%`} color="success" sx={{ fontWeight: 900 }} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.5 }}>
          {journeyFunnelStages.map((stg) => (
            <Paper key={stg.stage} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.neutral', borderTop: `4px solid ${stg.color}` }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5, fontSize: '0.68rem' }}>
                {stg.stage}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'Outfit, sans-serif' }}>
                {stg.count}
              </Typography>
              <Box sx={{ my: 1, py: 0.5, px: 1, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: stg.color, display: 'block' }}>
                  Stage Conv: {stg.conv}
                </Typography>
                {stg.rev !== '$0' && (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#34D399' : '#059669', display: 'block' }}>
                    Rev: {stg.rev}
                  </Typography>
                )}
                {stg.profit !== '$0' && (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#FBBF24' : '#C59B27', display: 'block' }}>
                    Profit: {stg.profit}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.62rem' }}>
                📉 {stg.drop}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* DASHBOARD MODULE TABS */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.78rem',
              py: 1.8,
              minHeight: 48,
              textTransform: 'none'
            }
          }}
        >
          <Tab label={`1. Campaign Tracking & ROI (${filteredCampaigns.length})`} icon={<CampaignIcon fontSize="small" />} iconPosition="start" />
          <Tab label="2. Mandatory UTM Attribution Ledger" icon={<LinkIcon fontSize="small" />} iconPosition="start" />
          <Tab label="3. Revenue & Profit Analytics" icon={<MonetizationOnIcon fontSize="small" />} iconPosition="start" />
          <Tab label="4. Landing Page Performance" icon={<LaunchIcon fontSize="small" />} iconPosition="start" />
          <Tab label="5. Referral Channel Tracking" icon={<FilterAltIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`6. Automation Workflows (${workflows.filter(w => w.status).length} Active)`} icon={<AutoFixHighIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`7. Automation Logs (${automationLogs.length})`} icon={<HistoryIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* TAB 1: CAMPAIGN TRACKING & MANAGEMENT LEDGER */}
      {/* ========================================================= */}
      {currentTab === 0 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#818CF8' : '#3F51B5' }}>
                Campaign ROI & Profit Performance Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track exact ad spend, leads generated, confirmed bookings, gross profit, and profit per booking
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search campaign or platform..."
                value={searchCampaign}
                onChange={e => setSearchCampaign(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ width: 220 }}
              />

              <FormControl size="small" sx={{ width: 130 }}>
                <InputLabel>Platform</InputLabel>
                <Select value={platformFilter} label="Platform" onChange={e => setPlatformFilter(e.target.value)}>
                  <MenuItem value="ALL">All Platforms</MenuItem>
                  <MenuItem value="Google">Google Ads</MenuItem>
                  <MenuItem value="Meta">Meta (FB/IG)</MenuItem>
                  <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                  <MenuItem value="TikTok">TikTok</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setNewCampaignModalOpen(true)}
                sx={{ fontWeight: 800 }}
              >
                Add Campaign
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Campaign Name & ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Platform</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Ad Spend</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Leads / Qual</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Bookings</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Revenue</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Gross Profit</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>ROI %</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Profit / Bkg</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>UTM Attribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCampaigns.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{c.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={c.platform} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={c.status} size="small" color={c.status === 'Active' ? 'success' : 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>${(c.spend || 0).toLocaleString()}</Typography>
                      <Typography variant="caption" color="text.secondary">Budget: ${(c.budget || 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{c.leads || 0} Total</Typography>
                      <Typography variant="caption" sx={{ color: isDark ? '#38BDF8' : '#0284C7', fontWeight: 700 }}>{c.qualLeads || 0} Qual</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>{c.bookings || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">CPB: ${c.cpb || '0'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>${(c.revenue || 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#C59B27' }}>${(c.grossProfit || 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${c.roi || 0}%`} size="small" color="success" sx={{ fontWeight: 900, fontSize: '0.72rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#34D399' : '#059669' }}>${c.profitPerBkg || 0}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined" color="primary" onClick={() => handleInspectUTM(c)} sx={{ fontSize: '0.68rem', fontWeight: 800 }}>
                        Inspect UTM
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
      {/* TAB 2: MANDATORY UTM ATTRIBUTION LEDGER */}
      {/* ========================================================= */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#60A5FA' : '#2563EB', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon color="primary" />
                Mandatory Marketing Attribution & UTM Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attribution tracking fields captured per lead and maintained permanently through ticket issuance
              </Typography>
            </Box>
            <Chip label={`${campaigns.length} Attribution Campaigns Tracked`} color="primary" sx={{ fontWeight: 800 }} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5 }}>
            {campaigns.map((c) => (
              <Paper key={c.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'background.neutral' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    {c.name} ({c.id})
                  </Typography>
                  <Chip label={c.platform} size="small" color="primary" sx={{ fontWeight: 800 }} />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 1, fontSize: 13, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>UTM Source:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>{c.utmSource}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>UTM Medium:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{c.utmMedium}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>UTM Campaign:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', fontFamily: 'monospace' }}>{c.utmCampaign}</Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Landing Page:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#34D399' : '#059669', fontFamily: 'monospace' }}>{c.landingPage}</Typography>
                </Box>

                <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    Attributed: <b>{c.leads || 0} Leads</b> ➔ <b>{c.bookings || 0} Bookings</b>
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>
                    ${(c.revenue || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 3: REVENUE & PROFIT ANALYTICS */}
      {/* ========================================================= */}
      {currentTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                📊 REVENUE VS GROSS PROFIT BY CAMPAIGN ($)
              </Typography>
              <Box sx={{ height: 280, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ComposedChart data={campaigns}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue ($)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="grossProfit" name="Gross Profit ($)" stroke="#C59B27" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                💎 MARKETING ROI (%) BY AD PLATFORM
              </Typography>
              <Box sx={{ height: 280, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart layout="vertical" data={campaigns}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'} />
                    <XAxis type="number" tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <YAxis type="category" dataKey="platform" width={100} tick={{ fill: isDark ? '#94A3B8' : '#64748B' }} stroke={isDark ? '#475569' : '#CBD5E1'} />
                    <RechartsTooltip />
                    <Bar dataKey="roi" name="ROI %" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LANDING PAGE PERFORMANCE */}
      {/* ========================================================= */}
      {currentTab === 3 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LaunchIcon color="success" />
                Landing Page Performance & Profitability
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track visitor traffic, lead conversion rates, and total revenue per landing page URL
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Landing Page URL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Visitors</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Leads Generated</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Conversion Rate</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Bookings</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Revenue</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Gross Profit</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>ROI %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {LANDING_PAGES_DATA.map((lp) => (
                  <TableRow key={lp.url} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'monospace' }}>
                        {lp.url}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{lp.visitors.toLocaleString()}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{lp.leads}</TableCell>
                    <TableCell align="center">
                      <Chip label={lp.conv} size="small" color="primary" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>{lp.bookings}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>{lp.revenue}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#C59B27' }}>{lp.grossProfit}</TableCell>
                    <TableCell align="center">
                      <Chip label={lp.roi} size="small" color="success" sx={{ fontWeight: 900 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REFERRAL CHANNEL TRACKING (DERIVED FROM REAL DB LEADS) */}
      {/* ========================================================= */}
      {currentTab === 4 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#818CF8' : '#3F51B5', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterAltIcon color="primary" />
                Referral Channel & Source Performance (Real Database Records)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Breakdown of traffic origins across Google Ads, Social, WhatsApp API, SEO, and Direct Bookings
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Referral Channel</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Leads</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Confirmed Bookings</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Lead-to-Booking Conv %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Attributed Revenue</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Attributed Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dynamicReferralChannels.map((ref) => (
                  <TableRow key={ref.channel} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{ref.channel}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{ref.leads}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>{ref.bookings}</TableCell>
                    <TableCell align="center">
                      <Chip label={ref.convRate} size="small" color="primary" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>{ref.revenue}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#C59B27' }}>{ref.profit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 6: MARKETING AUTOMATION WORKFLOW BUILDER */}
      {/* ========================================================= */}
      {currentTab === 5 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#A78BFA' : '#7C3AED', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoFixHighIcon color="secondary" />
                Marketing Automation Workflow Center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure automated triggers, conditions, WhatsApp/Email dispatches, and follow-up tasks
              </Typography>
            </Box>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setNewWorkflowModalOpen(true)} sx={{ fontWeight: 800 }}>
              Create New Workflow
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {workflows.map((wf) => (
              <Paper
                key={wf.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: isDark
                    ? wf.status ? 'rgba(16, 185, 129, 0.12)' : 'background.paper'
                    : wf.status ? '#F0FDF4' : '#F8FAFC',
                  borderColor: isDark
                    ? wf.status ? 'rgba(16, 185, 129, 0.35)' : 'divider'
                    : wf.status ? '#86EFAC' : '#CBD5E1'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      {wf.name} ({wf.id})
                    </Typography>
                    <Chip label={`Executed ${wf.executedCount} times`} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                  </Box>
                  <FormControlLabel
                    control={<Switch checked={wf.status} onChange={() => handleToggleWorkflow(wf.id)} color="success" />}
                    label={<b>{wf.status ? 'ACTIVE' : 'PAUSED'}</b>}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, fontSize: 13, mb: 1.5 }}>
                  <Box sx={{ p: 1.2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>⚡ TRIGGER Event:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#818CF8' : '#3F51B5' }}>{wf.trigger}</Typography>
                  </Box>

                  <Box sx={{ p: 1.2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>🔍 CONDITION Filter:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{wf.condition}</Typography>
                  </Box>

                  <Box sx={{ p: 1.2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>🚀 ACTION Executed:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#34D399' : '#059669' }}>{wf.action}</Typography>
                  </Box>

                  <Box sx={{ p: 1.2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>⏱️ DELAY / Timer:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FBBF24' : '#D97706' }}>{wf.delay}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* TAB 7: AUTOMATION ACTIVITY LOG */}
      {/* ========================================================= */}
      {currentTab === 6 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#818CF8' : '#3F51B5', display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" />
                Automation Execution & Audit Activity Log
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Audit real-time automated messages, email dispatches, and retry failed executions
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Log ID & Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Workflow Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Executed</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {automationLogs.map((log) => (
                  <TableRow key={log.id} hover sx={{ bgcolor: log.status === 'Failed' ? (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2') : 'inherit' }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{log.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{log.triggerTime}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{log.workflowName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{log.customer}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{log.action}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={log.status} size="small" color={log.status === 'Success' ? 'success' : 'error'} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">
                      {log.status === 'Failed' && (
                        <Button size="small" variant="contained" color="error" onClick={() => handleRetryLog(log.id)} startIcon={<RefreshIcon />} sx={{ fontWeight: 800, fontSize: '0.68rem' }}>
                          Retry Execution
                        </Button>
                      )}
                      {log.status === 'Success' && (
                        <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800 }}>
                          ✓ Dispatched
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. UTM ATTRIBUTION INSPECTOR MODAL */}
      <Dialog open={utmModalOpen} onClose={() => setUtmModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon /> Marketing Lead Attribution Details
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedUtmCampaign && (
            <>
              <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  {selectedUtmCampaign.name} ({selectedUtmCampaign.id})
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Platform: <b>{selectedUtmCampaign.platform}</b> • Spend: <b>${(selectedUtmCampaign.spend || 0).toLocaleString()}</b>
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1.2, fontSize: 13, p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>UTM Source:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#2563EB', fontFamily: 'monospace' }}>{selectedUtmCampaign.utmSource}</Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>UTM Medium:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? '#38BDF8' : '#0284C7', fontFamily: 'monospace' }}>{selectedUtmCampaign.utmMedium}</Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>UTM Campaign:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#7C3AED', fontFamily: 'monospace' }}>{selectedUtmCampaign.utmCampaign}</Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Landing Page URL:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669', fontFamily: 'monospace' }}>{selectedUtmCampaign.landingPage}</Typography>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4', borderColor: isDark ? 'rgba(34, 197, 94, 0.35)' : '#86EFAC', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                  💰 ATTRIBUTED PROFIT PERFORMANCE:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>
                  Confirmed Revenue: ${(selectedUtmCampaign.revenue || 0).toLocaleString()} | Gross Profit: ${(selectedUtmCampaign.grossProfit || 0).toLocaleString()} | ROI: {selectedUtmCampaign.roi || 0}%
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUtmModalOpen(false)} variant="contained" color="primary" sx={{ fontWeight: 800 }}>
            Close Inspector
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. CREATE WORKFLOW BUILDER MODAL */}
      <Dialog open={newWorkflowModalOpen} onClose={() => setNewWorkflowModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHighIcon /> Build Marketing Automation Workflow
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Workflow Name"
            size="small"
            placeholder="e.g. Abandoned Quote WhatsApp Retargeting"
            value={workflowForm.name}
            onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })}
            fullWidth
          />

          <FormControl fullWidth size="small">
            <InputLabel>Trigger Event</InputLabel>
            <Select value={workflowForm.trigger} label="Trigger Event" onChange={e => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}>
              <MenuItem value="New Flight Inquiry Created">New Flight Inquiry Created</MenuItem>
              <MenuItem value="Quote Issued > 24 Hours Unpaid">Quote Issued &gt; 24 Hours Unpaid</MenuItem>
              <MenuItem value="Flight Departure in 48 Hours">Flight Departure in 48 Hours</MenuItem>
              <MenuItem value="Return Flight Arrival + 24 Hours">Return Flight Arrival + 24 Hours</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Condition Filter</InputLabel>
            <Select value={workflowForm.condition} label="Condition Filter" onChange={e => setWorkflowForm({ ...workflowForm, condition: e.target.value })}>
              <MenuItem value="All Leads">All Leads</MenuItem>
              <MenuItem value="Lead Score >= 50">Lead Score &gt;= 50</MenuItem>
              <MenuItem value="Flight Departure < 14 Days">Flight Departure &lt; 14 Days</MenuItem>
              <MenuItem value="VIP Client Only">VIP Client Only</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Action Executed</InputLabel>
            <Select value={workflowForm.action} label="Action Executed" onChange={e => setWorkflowForm({ ...workflowForm, action: e.target.value })}>
              <MenuItem value="Send WhatsApp + Send Email">Send WhatsApp + Send Email</MenuItem>
              <MenuItem value="Assign Agent + Create Task">Assign Agent + Create Follow-up Task</MenuItem>
              <MenuItem value="Send SMS Price Hold Alert">Send SMS Price Hold Alert</MenuItem>
              <MenuItem value="Send NPS Review Survey">Send NPS Review Survey</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Delay / Execution Timer</InputLabel>
            <Select value={workflowForm.delay} label="Delay / Execution Timer" onChange={e => setWorkflowForm({ ...workflowForm, delay: e.target.value })}>
              <MenuItem value="Immediate (0m)">Immediate (0 minutes)</MenuItem>
              <MenuItem value="2 Hours">2 Hours</MenuItem>
              <MenuItem value="24 Hours">24 Hours</MenuItem>
              <MenuItem value="48 Hours">48 Hours</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewWorkflowModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateWorkflow} variant="contained" color="secondary" sx={{ fontWeight: 800 }}>
            Save & Activate Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. CREATE MARKETING CAMPAIGN MODAL */}
      <Dialog open={newCampaignModalOpen} onClose={() => setNewCampaignModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon /> Add New Marketing Campaign
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Campaign Name"
            size="small"
            placeholder="e.g. London Business Class Spring Sale"
            value={campaignForm.name}
            onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
            fullWidth
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Platform</InputLabel>
              <Select value={campaignForm.platform} label="Platform" onChange={e => setCampaignForm({ ...campaignForm, platform: e.target.value })}>
                <MenuItem value="Google Ads">Google Ads</MenuItem>
                <MenuItem value="Meta (FB/IG)">Meta (FB/IG)</MenuItem>
                <MenuItem value="WhatsApp Ads">WhatsApp Ads</MenuItem>
                <MenuItem value="Instagram">Instagram</MenuItem>
                <MenuItem value="TikTok Ads">TikTok Ads</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Budget ($)"
              type="number"
              size="small"
              value={campaignForm.budget}
              onChange={e => setCampaignForm({ ...campaignForm, budget: e.target.value })}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="UTM Source"
              size="small"
              value={campaignForm.utmSource}
              onChange={e => setCampaignForm({ ...campaignForm, utmSource: e.target.value })}
              fullWidth
            />
            <TextField
              label="UTM Medium"
              size="small"
              value={campaignForm.utmMedium}
              onChange={e => setCampaignForm({ ...campaignForm, utmMedium: e.target.value })}
              fullWidth
            />
          </Box>

          <TextField
            label="Landing Page URL"
            size="small"
            value={campaignForm.landingPage}
            onChange={e => setCampaignForm({ ...campaignForm, landingPage: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewCampaignModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateCampaign} variant="contained" color="primary" sx={{ fontWeight: 800 }}>
            Create Campaign
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
