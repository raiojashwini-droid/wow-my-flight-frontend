import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../../services/dbService';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Icons
import BusinessIcon from '@mui/icons-material/Business';
import FlightIcon from '@mui/icons-material/Flight';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import MessageIcon from '@mui/icons-material/Message';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WebIcon from '@mui/icons-material/Web';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LaptopIcon from '@mui/icons-material/Laptop';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import PaymentIcon from '@mui/icons-material/Payment';
import RouterIcon from '@mui/icons-material/Router';
import CellTowerIcon from '@mui/icons-material/CellTower';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

// Components & Services
import PageHeader from '../../components/PageHeader';
import AppCard from '../../components/AppCard';
import { useAlert } from '../../contexts/AlertContext';

// General Form Schema
const generalSchema = yup.object().shape({
  companyName: yup.string().required('Company legal name is required'),
  phone: yup.string().required('Support hotline phone is required'),
  email: yup.string().email('Invalid email').required('Client support email is required'),
  address: yup.string().required('Headquarters address is required'),
  vatRate: yup.number().typeError('Must be a number').min(0).max(100).required('Tax/Fee percentage is required'),
  vatId: yup.string().required('Tax ID / EIN is required'),
  website: yup.string().url('Must be a valid URL (starting with http/https)').required('Website link is required'),
  incorporationDate: yup.string().required('Incorporation Date is required')
});

const fieldStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    backgroundColor: 'rgba(244, 246, 249, 0.4)',
    transition: 'all 0.2s ease-in-out',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'primary.main',
    '&:hover': {
      backgroundColor: 'var(--ww-w85, rgba(244, 246, 249, 0.85))',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'primary.light'
      }
    },
    '&.Mui-focused': {
      backgroundColor: 'background.paper',
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
        borderColor: 'secondary.main'
      }
    }
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'text.secondary',
    '&.Mui-focused': {
      color: 'secondary.main'
    }
  },
  '& .MuiFormHelperText-root': {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.75rem'
  }
};

export const Settings = () => {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // REACT QUERY FETCHERS (Connected to Backend API with persistent storage)
  // ─────────────────────────────────────────────────────────────────────────────
  const { data: generalSettings = {}, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ['settings-general'],
    queryFn: dbService.getSettings
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: dbService.getServices
  });

  const { data: packages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ['packages'],
    queryFn: dbService.getPackages
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: dbService.getEmailTemplates
  });

  const { data: whatsappTemplates = [] } = useQuery({
    queryKey: ['whatsappTemplates'],
    queryFn: dbService.getWhatsappTemplates
  });

  const { data: channelSettings = {} } = useQuery({
    queryKey: ['settings-channels'],
    queryFn: dbService.getChannelSettings
  });

  const { data: stripeSettings = {} } = useQuery({
    queryKey: ['settings-stripe'],
    queryFn: dbService.getStripeSettings
  });

  const { data: routingRules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ['routing-rules'],
    queryFn: dbService.getRoutingRules
  });

  const [recordingStorage, setRecordingStorage] = useState('cloud');

  // ─────────────────────────────────────────────────────────────────────────────
  // MUTATIONS (Syncing to Backend & DB)
  // ─────────────────────────────────────────────────────────────────────────────
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: dbService.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-general'] })
  });

  const updateServicesMutation = useMutation({
    mutationFn: dbService.updateServices,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });

  const addServiceMutation = useMutation({
    mutationFn: dbService.addService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });

  const updatePackagesMutation = useMutation({
    mutationFn: dbService.updatePackages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] })
  });

  const updateEmailTemplatesMutation = useMutation({
    mutationFn: dbService.updateEmailTemplates,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
  });

  const updateWhatsappTemplatesMutation = useMutation({
    mutationFn: dbService.updateWhatsappTemplates,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] })
  });

  const updateChannelsMutation = useMutation({
    mutationFn: dbService.updateChannelSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-channels'] })
  });

  const updateStripeMutation = useMutation({
    mutationFn: dbService.updateStripeSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-stripe'] })
  });

  const updateRoutingRuleMutation = useMutation({
    mutationFn: ({ id, data }) => dbService.updateRoutingRule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routing-rules'] })
  });

  const createRoutingRuleMutation = useMutation({
    mutationFn: dbService.createRoutingRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routing-rules'] })
  });

  const deleteRoutingRuleMutation = useMutation({
    mutationFn: dbService.deleteRoutingRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routing-rules'] })
  });

  const handleToggleStorage = (e) => {
    const value = e.target.checked ? 'nas' : 'cloud';
    setRecordingStorage(value);
    updateGeneralSettingsMutation.mutate({ ...generalSettings, recordingStorage: value });
    showAlert(`Storage mode updated to ${value === 'nas' ? 'Local PC / NAS Auto-Download' : 'AWS S3 Cloud'} (Saved to Server)`, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 0: GENERAL FORM SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(generalSchema),
    defaultValues: {
      companyName: 'Wow My Flight Travel Agency Inc.',
      phone: '+1 (833) 395-5554',
      email: 'support@wowmyflight.com',
      address: 'One World Trade Center, Suite 8500, New York, NY 10007, USA',
      vatRate: 7.5,
      vatId: 'EIN-US-92-4819201',
      website: 'https://wowmyflight.com',
      incorporationDate: '2020-03-15',
      autoAssignConsultant: true
    }
  });

  useEffect(() => {
    if (generalSettings && Object.keys(generalSettings).length > 0) {
      reset({
        companyName: generalSettings.companyName || 'Wow My Flight Travel Agency Inc.',
        phone: generalSettings.phone || '+1 (833) 395-5554',
        email: generalSettings.email || 'support@wowmyflight.com',
        address: generalSettings.address || 'One World Trade Center, Suite 8500, New York, NY 10007, USA',
        vatRate: generalSettings.vatRate ?? 7.5,
        vatId: generalSettings.vatId || 'EIN-US-92-4819201',
        website: generalSettings.website || 'https://wowmyflight.com',
        incorporationDate: generalSettings.incorporationDate || '2020-03-15',
        autoAssignConsultant: generalSettings.autoAssignConsultant ?? true
      });
      setRecordingStorage(generalSettings.recordingStorage || 'cloud');
    }
  }, [generalSettings, reset]);

  const handleGeneralSubmit = (data) => {
    updateGeneralSettingsMutation.mutate(data);
    setIsEditModalOpen(false);
    showAlert('Corporate profile & billing settings saved to server', 'success');
  };

  const handleOpenEditModal = () => {
    reset({
      companyName: generalSettings.companyName || 'Wow My Flight Travel Agency Inc.',
      phone: generalSettings.phone || '+1 (833) 395-5554',
      email: generalSettings.email || 'support@wowmyflight.com',
      address: generalSettings.address || 'One World Trade Center, Suite 8500, New York, NY 10007, USA',
      vatRate: generalSettings.vatRate ?? 7.5,
      vatId: generalSettings.vatId || 'EIN-US-92-4819201',
      website: generalSettings.website || 'https://wowmyflight.com',
      incorporationDate: generalSettings.incorporationDate || '2020-03-15',
      autoAssignConsultant: generalSettings.autoAssignConsultant ?? true
    });
    setIsEditModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: FLIGHT SERVICES & CABIN PRICING
  // ─────────────────────────────────────────────────────────────────────────────
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceCategory, setEditServiceCategory] = useState('');
  const [editServicePrice, setEditServicePrice] = useState('');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Economy');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleStartEditService = (s) => {
    setEditingServiceId(s.id);
    setEditServiceName(s.name);
    setEditServiceCategory(s.category);
    setEditServicePrice(s.basePrice);
  };

  const handleSaveService = (id) => {
    if (!editServiceName.trim() || !editServicePrice) {
      showAlert('Flight service name and base price are required', 'error');
      return;
    }
    const updated = services.map((s) =>
      s.id === id ? { ...s, name: editServiceName, category: editServiceCategory, basePrice: Number(editServicePrice) || 0 } : s
    );
    updateServicesMutation.mutate(updated);
    setEditingServiceId(null);
    showAlert('Flight service tier updated and saved to server', 'success');
  };

  const handleToggleService = (id) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, active: s.active === undefined ? false : !s.active } : s
    );
    updateServicesMutation.mutate(updated);
    showAlert('Flight service visibility toggled', 'info');
  };

  const handleAddService = () => {
    if (!newServiceName.trim() || !newServicePrice) {
      showAlert('Flight service name and price are required', 'error');
      return;
    }
    const newService = {
      id: 'srv_' + Date.now(),
      name: newServiceName,
      category: newServiceCategory,
      basePrice: Number(newServicePrice) || 0,
      active: true
    };
    addServiceMutation.mutate(newService);
    setNewServiceName('');
    setNewServicePrice('');
    setShowAddForm(false);
    showAlert('New flight service tier created on server', 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: PACKAGES & DELIVERABLES
  // ─────────────────────────────────────────────────────────────────────────────
  const [selectedPkgToEdit, setSelectedPkgToEdit] = useState(null);
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editPkgPrice, setEditPkgPrice] = useState(0);
  const [editPkgDesc, setEditPkgDesc] = useState('');
  const [editPkgIncludes, setEditPkgIncludes] = useState([]);
  const [newDeliverableVal, setNewDeliverableVal] = useState('');

  const handleOpenPkgEditModal = (pkg) => {
    setSelectedPkgToEdit(pkg);
    setEditPkgPrice(pkg.price || 0);
    setEditPkgDesc(pkg.description || '');
    setEditPkgIncludes([...(pkg.includes || [])]);
    setNewDeliverableVal('');
    setIsPkgModalOpen(true);
  };

  const handleSavePkgModal = () => {
    if (!selectedPkgToEdit) return;
    const updated = packages.map((p) =>
      p.id === selectedPkgToEdit.id
        ? { ...p, price: Number(editPkgPrice) || 0, description: editPkgDesc, includes: editPkgIncludes }
        : p
    );
    updatePackagesMutation.mutate(updated);
    setIsPkgModalOpen(false);
    showAlert(`${selectedPkgToEdit.name} package updated and saved to server`, 'success');
  };

  const handleAddModalDeliverable = () => {
    const trimmed = newDeliverableVal.trim();
    if (!trimmed) return;
    if (editPkgIncludes.includes(trimmed)) {
      showAlert('Deliverable already exists in this package', 'warning');
      return;
    }
    setEditPkgIncludes([...editPkgIncludes, trimmed]);
    setNewDeliverableVal('');
  };

  const handleDeleteModalDeliverable = (itemToDelete) => {
    setEditPkgIncludes(editPkgIncludes.filter((item) => item !== itemToDelete));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 3: NOTIFICATION TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  const [activeTemplate, setActiveTemplate] = useState({ type: 'email', id: 'et1' });
  const textareaRef = React.useRef(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editTemplateSubject, setEditTemplateSubject] = useState('');
  const [editTemplateBody, setEditTemplateBody] = useState('');

  const handleSaveTemplateModal = () => {
    if (activeTemplate.type === 'email') {
      const updated = emailTemplates.map((et) =>
        et.id === activeTemplate.id ? { ...et, subject: editTemplateSubject, body: editTemplateBody } : et
      );
      updateEmailTemplatesMutation.mutate(updated);
      showAlert('Email template saved to server', 'success');
    } else {
      const updated = whatsappTemplates.map((wt) =>
        wt.id === activeTemplate.id ? { ...wt, body: editTemplateBody } : wt
      );
      updateWhatsappTemplatesMutation.mutate(updated);
      showAlert('WhatsApp template saved to server', 'success');
    }
    setIsTemplateModalOpen(false);
  };

  const handleInsertTagInModal = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setEditTemplateBody((prev) => prev + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setEditTemplateBody(before + tag + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  const renderBodyWithMockData = (bodyText) => {
    if (!bodyText) return '';
    return bodyText
      .replace(/{clientName}/g, 'Marcus Vance')
      .replace(/{pnr}/g, 'WMF-78921')
      .replace(/{route}/g, 'JFK ➔ LHR (New York to London)')
      .replace(/{airline}/g, 'Delta Air Lines (DL 402)')
      .replace(/{departureDate}/g, 'October 24, 2026')
      .replace(/{departureTime}/g, '18:45 EST')
      .replace(/{cabinClass}/g, 'Business Class')
      .replace(/{quoteId}/g, 'QT-8821')
      .replace(/{invoiceId}/g, 'INV-2026-004')
      .replace(/{packageName}/g, 'Executive Business VIP Concierge')
      .replace(/{amount}/g, '$3,450.00')
      .replace(/{dueDate}/g, 'October 20, 2026')
      .replace(/{consultantName}/g, 'Sofia Rodriguez')
      .replace(/{bookingLink}/g, 'https://wowmyflight.com/itinerary/WMF-78921')
      .replace(/{paymentLink}/g, 'https://wowmyflight.com/checkout/INV-2026-004')
      .replace(/\n/g, '<br />');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 4: STRIPE PAYMENT ACCOUNTS
  // ─────────────────────────────────────────────────────────────────────────────
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [stripeForm, setStripeForm] = useState({
    targetId: 'stripe_primary',
    publishableKey: '',
    secretKey: '',
    currency: 'USD'
  });

  const handleOpenStripeModal = (account) => {
    setStripeForm({
      targetId: account.id,
      publishableKey: account.publishableKey || '',
      secretKey: '',
      currency: account.currency || 'USD'
    });
    setIsStripeModalOpen(true);
  };

  const handleSaveStripeModal = () => {
    const isPrimary = stripeForm.targetId === 'stripe_primary';
    const currentPrimary = stripeSettings.primaryAccount || {};
    const currentSecondary = stripeSettings.secondaryAccount || {};

    const updated = {
      ...stripeSettings,
      primaryAccount: isPrimary
        ? {
            ...currentPrimary,
            publishableKey: stripeForm.publishableKey || currentPrimary.publishableKey,
            secretKeyMasked: stripeForm.secretKey ? stripeForm.secretKey.slice(0, 7) + '...' + stripeForm.secretKey.slice(-4) : currentPrimary.secretKeyMasked,
            currency: stripeForm.currency
          }
        : currentPrimary,
      secondaryAccount: !isPrimary
        ? {
            ...currentSecondary,
            publishableKey: stripeForm.publishableKey || currentSecondary.publishableKey,
            secretKeyMasked: stripeForm.secretKey ? stripeForm.secretKey.slice(0, 7) + '...' + stripeForm.secretKey.slice(-4) : currentSecondary.secretKeyMasked,
            currency: stripeForm.currency
          }
        : currentSecondary
    };

    updateStripeMutation.mutate(updated);
    setIsStripeModalOpen(false);
    showAlert('Stripe credentials updated & synced to server', 'success');
  };

  const handleToggleStripeStatus = (accountId) => {
    const updated = {
      ...stripeSettings,
      primaryAccount: {
        ...stripeSettings.primaryAccount,
        status: accountId === 'stripe_primary' ? 'Active' : 'Standby'
      },
      secondaryAccount: {
        ...stripeSettings.secondaryAccount,
        status: accountId === 'stripe_secondary' ? 'Active' : 'Standby'
      }
    };
    updateStripeMutation.mutate(updated);
    showAlert(`Switched active processing gateway to ${accountId === 'stripe_primary' ? 'Primary' : 'Secondary'} account`, 'info');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 5: MULTI-CHANNEL FORM STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [channelForm, setChannelForm] = useState({
    primaryPhone: '+1 (833) 395-5554',
    secondaryPhone: '+1 (850) 332-9680',
    whatsappSales: '+1 (833) 395-5554',
    whatsappSupport: '+1 (850) 332-9680',
    facebookPage1: 'https://facebook.com/WowMyFlight',
    facebookPage2: 'https://facebook.com/WowMyFlightVIP',
    instagramAccount1: '@wowmyflight',
    instagramAccount2: '@wowmyflight_deals'
  });

  useEffect(() => {
    if (channelSettings && Object.keys(channelSettings).length > 0) {
      setChannelForm({
        primaryPhone: channelSettings.primaryPhone || '+1 (833) 395-5554',
        secondaryPhone: channelSettings.secondaryPhone || '+1 (850) 332-9680',
        whatsappSales: channelSettings.whatsappSales || '+1 (833) 395-5554',
        whatsappSupport: channelSettings.whatsappSupport || '+1 (850) 332-9680',
        facebookPage1: channelSettings.facebookPage1 || 'https://facebook.com/WowMyFlight',
        facebookPage2: channelSettings.facebookPage2 || 'https://facebook.com/WowMyFlightVIP',
        instagramAccount1: channelSettings.instagramAccount1 || '@wowmyflight',
        instagramAccount2: channelSettings.instagramAccount2 || '@wowmyflight_deals'
      });
    }
  }, [channelSettings]);

  const handleSaveChannels = () => {
    updateChannelsMutation.mutate(channelForm);
    showAlert('Multi-channel communication accounts saved to server', 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 6: AUTO-ROUTING RULES STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    priority: 1,
    type: 'Skill-Based',
    condition: '',
    action: ''
  });

  const handleCreateRule = () => {
    if (!newRuleForm.name.trim() || !newRuleForm.condition.trim()) {
      showAlert('Rule name and matching condition are required', 'error');
      return;
    }
    createRoutingRuleMutation.mutate({
      ...newRuleForm,
      priority: Number(newRuleForm.priority) || 1,
      enabled: true
    });
    setIsRuleModalOpen(false);
    setNewRuleForm({ name: '', priority: 1, type: 'Skill-Based', condition: '', action: '' });
    showAlert('New auto-routing rule deployed to live distribution engine', 'success');
  };

  const handleToggleRuleStatus = (rule) => {
    updateRoutingRuleMutation.mutate({
      id: rule.id,
      data: { enabled: !rule.enabled }
    });
    showAlert(`Rule #${rule.id} ${!rule.enabled ? 'activated' : 'deactivated'}`, 'info');
  };

  const handleDeleteRule = (ruleId) => {
    deleteRoutingRuleMutation.mutate(ruleId);
    showAlert(`Rule #${ruleId} deleted from server`, 'warning');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="CRM Settings & Agency Administration"
        subtitle="Manage official corporate identity, flight service tiers, travel bundles, live communication channels, and intelligent lead auto-routing rules."
      />

      {/* HORIZONTAL TABS SYSTEM */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 4, width: '100%' }}
      >
        <Tab icon={<BusinessIcon />} iconPosition="start" label="General Info" sx={{ fontWeight: 700, minHeight: 48 }} />
        <Tab icon={<FlightIcon />} iconPosition="start" label="Flight Services" sx={{ fontWeight: 700, minHeight: 48 }} />
        <Tab icon={<CardMembershipIcon />} iconPosition="start" label="Flight Packages" sx={{ fontWeight: 700, minHeight: 48 }} />
        <Tab icon={<MessageIcon />} iconPosition="start" label="Templates Editor" sx={{ fontWeight: 700, minHeight: 48 }} />
        <Tab icon={<PaymentIcon />} iconPosition="start" label="Stripe & Payments" sx={{ fontWeight: 700, minHeight: 48 }} />
        <Tab icon={<CellTowerIcon />} iconPosition="start" label="Multi-Channel" sx={{ fontWeight: 700, minHeight: 48 }} />
        <Tab icon={<RouterIcon />} iconPosition="start" label="Auto-Routing Rules" sx={{ fontWeight: 700, minHeight: 48 }} />
      </Tabs>

      {/* TAB 0: GENERAL INFO */}
      {activeTab === 0 && (
        <Box sx={{ width: '100%' }}>
          <AppCard
            title="Corporate Identity & Profile"
            subheader="Official branding credentials, contact channels, and headquarters registry stored in database."
            action={
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleOpenEditModal}
                size="small"
              >
                Edit Corporate Profile
              </Button>
            }
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, mt: 1 }}>
              {/* BRAND IDENTITY */}
              <Box>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Brand Identity & Logo
                </Typography>
                <Box className="grid grid-cols-12 gap-5 items-center">
                  <Box className="">
                    <Box sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #06B6D4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: '0 8px 20px rgba(37,99,235,0.35)'
                    }}>
                      <FlightIcon sx={{ fontSize: 40, color: '#FFFFFF' }} />
                    </Box>
                  </Box>
                  <Box className="col-span-12" sm>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {generalSettings.companyName || 'Wow My Flight Travel Agency Inc.'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Primary Brand: Royal Aviation Blue (#1E40AF) | Gold Accent: (#C59B27)
                    </Typography>
                    <Typography variant="caption" color="secondary.main" display="block" sx={{ fontWeight: 700, mt: 0.5, textTransform: 'uppercase' }}>
                      WOW MY FLIGHT — Premier Global Travel & Flight Booking Management
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* LEGAL CREDENTIALS DISPLAY */}
              <Box>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Organization Legal Credentials
                </Typography>
                <Box className="grid grid-cols-12 gap-2">
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <BusinessIcon color="secondary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Legal Entity Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {generalSettings.companyName || 'Wow My Flight Travel Agency Inc.'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <VpnKeyIcon color="secondary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Tax ID / US EIN</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {generalSettings.vatId || 'EIN-US-92-4819201'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarTodayIcon color="secondary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Incorporation Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {generalSettings.incorporationDate ? new Date(generalSettings.incorporationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'March 15, 2020'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', minWidth: 0 }}>
                      <WebIcon color="secondary" sx={{ flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Official Website URL</Typography>
                        <Typography
                          variant="body2"
                          component="a"
                          href={generalSettings.website || 'https://wowmyflight.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontWeight: 700,
                            color: 'secondary.main',
                            textDecoration: 'none',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {generalSettings.website || 'https://wowmyflight.com'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* CONTACTS AND HQ DISPLAY */}
              <Box>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contact Channels & Global Headquarters
                </Typography>
                <Box className="grid grid-cols-12 gap-2">
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PhoneIcon color="secondary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Toll-Free Support Hotline</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {generalSettings.phone || '+1 (833) 395-5554'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', minWidth: 0 }}>
                      <EmailIcon color="secondary" sx={{ flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Client Support Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {generalSettings.email || 'support@wowmyflight.com'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <LocationOnIcon color="secondary" sx={{ mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Corporate Headquarters Physical Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', whiteSpace: 'pre-line' }}>
                          {generalSettings.address || 'One World Trade Center, Suite 8500, New York, NY 10007, USA'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* FINANCIAL SETTINGS DISPLAY */}
              <Box>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Portal Billing Rules & Operations
                </Typography>
                <Box className="grid grid-cols-12 gap-2">
                  <Box className="col-span-12 sm:col-span-4">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '1.2rem', width: 24, textAlign: 'center' }}>%</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Default Tax / VAT Rate</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {generalSettings.vatRate || 7.5}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-4">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '1.2rem', width: 24, textAlign: 'center' }}>$</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Portal Currency</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          US Dollar (USD - $)
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-4">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '1.2rem', width: 24, textAlign: 'center' }}>⚙️</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Lead Auto-Assignment</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {generalSettings.autoAssignConsultant !== false ? 'Enabled (Skill & Load Match)' : 'Disabled (Manual)'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AppCard>

          {/* Meeting & Telephony Audio Recordings Storage Card */}
          <Box sx={{ mt: 3.5 }}>
            <AppCard
              title="Call & Consultation Recordings Storage"
              subheader="Configure how Telnyx softphone calls and virtual consultations are archived and streamed."
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Storage Target Mode
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 600 }}>
                      Choose between encrypted AWS S3 Cloud Storage or automatic local Network Attached Storage (NAS) archiving for customer calls.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={recordingStorage === 'nas'}
                        onChange={handleToggleStorage}
                        color="secondary"
                      />
                    }
                    label={
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {recordingStorage === 'nas' ? 'Local NAS Storage (Auto-Download)' : 'AWS S3 Cloud Storage'}
                      </Typography>
                    }
                  />
                </Box>
                <Divider />
                <Box className="grid grid-cols-12 gap-5">
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: recordingStorage === 'cloud' ? 'rgba(37, 99, 235, 0.04)' : 'background.neutral', transition: 'all 0.2s' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudDoneIcon color="primary" fontSize="small" /> AWS S3 Cloud Hosting
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        All softphone calls, voicemails, and virtual consultations are encrypted and hosted on AWS S3 with instant global streaming playback.
                      </Typography>
                    </Paper>
                  </Box>
                  <Box className="col-span-12 sm:col-span-6">
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: recordingStorage === 'nas' ? 'rgba(20, 184, 166, 0.04)' : 'background.neutral', transition: 'all 0.2s' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        💾 Local PC / NAS Auto-Download
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Automatically downloads Telnyx audio streams to local agency storage disks, lowering cloud bandwidth bills.
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </AppCard>
          </Box>
        </Box>
      )}

      {/* TAB 1: FLIGHT SERVICES & CABIN PRICING */}
      {activeTab === 1 && (
        <AppCard
          title="Flight Services & Cabin Class Pricing"
          subheader="Configure standard base airfare pricing and cabin class service tiers for flight inquiries and GDS quotes."
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(!showAddForm)}
              size="small"
            >
              {showAddForm ? 'Hide Add Form' : 'Add Flight Service Tier'}
            </Button>
          }
        >
          {/* Add New Service Pathway Collapse Area */}
          {showAddForm && (
            <Paper sx={{ p: 3, mb: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.neutral' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                Add New Flight Service Tier
              </Typography>
              <Box className="grid grid-cols-12 gap-5 items-center">
                <Box className="col-span-12 sm:col-span-4">
                  <TextField
                    label="Service Tier Name"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g. Ultra-Luxury Suites"
                    fullWidth
                  />
                </Box>
                <Box className="col-span-12 sm:col-span-3">
                  <FormControl fullWidth>
                    <InputLabel id="add-category-label">Category</InputLabel>
                    <Select
                      labelId="add-category-label"
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="Economy">Economy</MenuItem>
                      <MenuItem value="Business">Business</MenuItem>
                      <MenuItem value="First">First</MenuItem>
                      <MenuItem value="Charter">Charter</MenuItem>
                      <MenuItem value="Concierge">Concierge</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box className="col-span-12 sm:col-span-3">
                  <TextField
                    label="Base Airfare ($ USD)"
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="1200"
                    fullWidth
                  />
                </Box>
                <Box className="col-span-12 sm:col-span-2" sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="secondary" fullWidth onClick={handleAddService} sx={{ height: 40, fontWeight: 700 }}>
                    Add
                  </Button>
                  <Button variant="outlined" color="primary" onClick={() => setShowAddForm(false)} sx={{ height: 40 }}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Flight Services Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Service Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Flight Service / Cabin Tier</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Base Ticket Fare ($ USD)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Portal Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((s) => {
                  const isEditing = editingServiceId === s.id;
                  const isActive = s.active !== false;

                  return (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.id.toUpperCase()}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editServiceName}
                            onChange={(e) => setEditServiceName(e.target.value)}
                            fullWidth
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            size="small"
                            value={editServiceCategory}
                            onChange={(e) => setEditServiceCategory(e.target.value)}
                            sx={{ minWidth: 120 }}
                          >
                            <MenuItem value="Economy">Economy</MenuItem>
                            <MenuItem value="Business">Business</MenuItem>
                            <MenuItem value="First">First</MenuItem>
                            <MenuItem value="Charter">Charter</MenuItem>
                            <MenuItem value="Concierge">Concierge</MenuItem>
                          </Select>
                        ) : (
                          <Chip
                            label={s.category}
                            size="small"
                            color={s.category === 'Business' ? 'primary' : s.category === 'First' || s.category === 'Charter' ? 'secondary' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editServicePrice}
                            onChange={(e) => setEditServicePrice(e.target.value)}
                            sx={{ width: 110 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                            ${Number(s.basePrice || 0).toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Chip
                            label={isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={isActive ? 'success' : 'default'}
                          />
                          <Switch
                            size="small"
                            checked={isActive}
                            onChange={() => handleToggleService(s.id)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <IconButton color="secondary" size="small" onClick={() => handleSaveService(s.id)}>
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton color="error" size="small" onClick={() => setEditingServiceId(null)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton color="primary" size="small" onClick={() => handleStartEditService(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AppCard>
      )}

      {/* TAB 2: PACKAGES & DELIVERABLES */}
      {activeTab === 2 && (
        <AppCard
          title="Flight Packages & Travel Inclusions"
          subheader="Review airfare pricing and traveler inclusions in standard, bundle, and VIP executive flight packages. Click configure to update details."
        >
          <Box className="grid grid-cols-12 gap-7" sx={{ mt: 0.5 }}>
            {packages.map((pkg) => (
              <Box className="col-span-12 md:col-span-6" key={pkg.id}>
                <Paper sx={{
                  p: 4,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(180deg, var(--wl-FFFFFF, #FFFFFF) 0%, rgba(244, 246, 249, 0.4) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px -4px rgba(11, 27, 61, 0.1)',
                    borderColor: 'primary.light'
                  }
                }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(197, 155, 39, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'secondary.main'
                        }}>
                          <FlightIcon />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.25rem', fontFamily: "'Outfit', sans-serif" }}>
                            {pkg.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                            Code: {pkg.id.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText',
                        px: 2.5,
                        py: 1,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        boxShadow: '0 4px 10px rgba(197, 155, 39, 0.25)',
                        fontFamily: "'Outfit', sans-serif"
                      }}>
                        ${pkg.price?.toLocaleString() || 0}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, mt: 1.5, minHeight: 48, lineHeight: 1.6, fontSize: '0.92rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {pkg.description}
                    </Typography>

                    <Divider sx={{ mb: 2.5 }} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', color: 'secondary.main', letterSpacing: '0.05em', fontSize: '0.78rem' }}>
                      Included Passenger Deliverables Checklist:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3.5, flexGrow: 1 }}>
                      {(pkg.includes || []).map((deliverable, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18, mt: 0.25 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.88rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {deliverable}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenPkgEditModal(pkg)}
                    sx={{
                      borderRadius: 2.5,
                      py: 1.25,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        bgcolor: 'rgba(197, 155, 39, 0.05)',
                        color: 'secondary.main',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Configure Package Details
                  </Button>
                </Paper>
              </Box>
            ))}
          </Box>
        </AppCard>
      )}

      {/* TAB 3: NOTIFICATION TEMPLATES */}
      {activeTab === 3 && (() => {
        const allTemplates = [
          ...emailTemplates.map(et => ({ ...et, type: 'email' })),
          ...whatsappTemplates.map(wt => ({ ...wt, type: 'whatsapp' }))
        ];

        return (
          <AppCard
            title="Flight Notification & Ticketing Templates"
            subheader="Customize automated Email and WhatsApp flight confirmations, E-Ticket PNR notifications, and schedule alerts."
          >
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflowX: 'auto', mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Channel</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Template Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subject Line / Preview</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Dispatch Method</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allTemplates.map((temp) => {
                    const isEmail = temp.type === 'email';
                    return (
                      <TableRow key={temp.type + '-' + temp.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isEmail ? <EmailIcon color="primary" fontSize="small" /> : <WhatsAppIcon sx={{ color: '#25D366' }} fontSize="small" />}
                            <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                              {temp.type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{temp.name}</TableCell>
                        <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isEmail ? `Subject: ${temp.subject}` : temp.body}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: 'background.neutral', px: 1.5, py: 0.5, borderRadius: 1.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {isEmail ? 'Instant SMTP / SES' : 'Telnyx WhatsApp API'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setActiveTemplate({ type: temp.type, id: temp.id });
                              setEditTemplateSubject(isEmail ? temp.subject : '');
                              setEditTemplateBody(temp.body || '');
                              setIsTemplateModalOpen(true);
                            }}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              fontFamily: "'Outfit', sans-serif",
                              py: 0.5,
                              px: 1.5
                            }}
                          >
                            Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AppCard>
        );
      })()}

      {/* TAB 4: STRIPE PAYMENT ACCOUNTS CONFIG */}
      {activeTab === 4 && (
        <AppCard
          title="Stripe Payment Accounts Configuration"
          subheader="Manage primary and failover Stripe accounts for issuing flight quotes and processing client e-ticket payments."
        >
          <Box className="grid grid-cols-12 gap-5" sx={{ mt: 0.5 }}>
            {[
              {
                id: 'stripe_primary',
                account: stripeSettings.primaryAccount || {
                  label: 'Primary Stripe Account (USD Global)',
                  publishableKey: 'pk_live_51P...WMF_USD',
                  status: 'Active',
                  lastUsed: 'Today at 3:45 PM',
                  volume: '$184,520'
                },
                color: 'success'
              },
              {
                id: 'stripe_secondary',
                account: stripeSettings.secondaryAccount || {
                  label: 'Secondary Stripe Account (Backup / International)',
                  publishableKey: 'pk_live_51P...WMF_INTL',
                  status: 'Standby',
                  lastUsed: 'Yesterday at 6:10 PM',
                  volume: '$42,300'
                },
                color: 'warning'
              }
            ].map(({ id, account, color }) => (
              <Box className="col-span-12 md:col-span-6" key={id}>
                <Paper sx={{ p: 3, borderRadius: 3, border: '2px solid', borderColor: account.status === 'Active' ? 'success.main' : 'divider', bgcolor: account.status === 'Active' ? 'rgba(16,185,129,0.04)' : 'background.neutral' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{account.label}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={account.status === 'Active'}
                          onChange={() => handleToggleStripeStatus(id)}
                          color="success"
                        />
                      }
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>{account.status}</Typography>}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Publishable Key</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{account.publishableKey || 'pk_live_***'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Secret Key</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{account.secretKeyMasked || 'sk_live_••••••••••••'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Last Processed Booking</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{account.lastUsed || 'Today'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Flight Revenue Processed</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: '1.1rem' }}>{account.volume || '$0'}</Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2.5, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenStripeModal({ id, ...account })}
                  >
                    Update Credentials
                  </Button>
                </Paper>
              </Box>
            ))}
          </Box>
          <Paper sx={{ mt: 3, p: 2, borderRadius: 2.5, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.neutral' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              <strong>🔒 Payment Security:</strong> One Stripe account remains Active for client checkouts and e-ticket issuance. The secondary account operates as an automated instant failover gateway.
            </Typography>
          </Paper>
        </AppCard>
      )}

      {/* TAB 5: MULTI-CHANNEL CONTACT CONFIG */}
      {activeTab === 5 && (
        <AppCard
          title="Multi-Channel Telephony & Social Inboxes"
          subheader="Configure incoming Telnyx SIP trunks, WhatsApp Business numbers, and official social communication channels."
        >
          <Box className="grid grid-cols-12 gap-5" sx={{ mt: 0.5 }}>
            {/* Phone Numbers */}
            <Box className="col-span-12 md:col-span-6">
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhoneIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Telnyx Telephony Hotlines</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    value={channelForm.primaryPhone}
                    onChange={(e) => setChannelForm({ ...channelForm, primaryPhone: e.target.value })}
                    label="Primary Toll-Free Hotline (Toll-Free)"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    value={channelForm.secondaryPhone}
                    onChange={(e) => setChannelForm({ ...channelForm, secondaryPhone: e.target.value })}
                    label="Secondary Direct Outbound Dispatch"
                    fullWidth
                    size="small"
                  />
                </Box>
              </Paper>
            </Box>

            {/* WhatsApp Business */}
            <Box className="col-span-12 md:col-span-6">
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WhatsAppIcon sx={{ color: '#25D366' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>WhatsApp Business Numbers</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    value={channelForm.whatsappSales}
                    onChange={(e) => setChannelForm({ ...channelForm, whatsappSales: e.target.value })}
                    label="WhatsApp Business #1 (Flight Sales & Quotes)"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    value={channelForm.whatsappSupport}
                    onChange={(e) => setChannelForm({ ...channelForm, whatsappSupport: e.target.value })}
                    label="WhatsApp Business #2 (Post-Ticketing Support)"
                    fullWidth
                    size="small"
                  />
                </Box>
              </Paper>
            </Box>

            {/* Facebook Pages */}
            <Box className="col-span-12 md:col-span-6">
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FacebookIcon sx={{ color: '#1877F2' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Facebook Business Inboxes</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    value={channelForm.facebookPage1}
                    onChange={(e) => setChannelForm({ ...channelForm, facebookPage1: e.target.value })}
                    label="Official Facebook Page (Main Brand)"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    value={channelForm.facebookPage2}
                    onChange={(e) => setChannelForm({ ...channelForm, facebookPage2: e.target.value })}
                    label="VIP & Corporate Aviation Community"
                    fullWidth
                    size="small"
                  />
                </Box>
              </Paper>
            </Box>

            {/* Instagram Accounts */}
            <Box className="col-span-12 md:col-span-6">
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InstagramIcon sx={{ color: '#E4405F' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Instagram Business Accounts</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    value={channelForm.instagramAccount1}
                    onChange={(e) => setChannelForm({ ...channelForm, instagramAccount1: e.target.value })}
                    label="Official Instagram Handle"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    value={channelForm.instagramAccount2}
                    onChange={(e) => setChannelForm({ ...channelForm, instagramAccount2: e.target.value })}
                    label="Flight Deals & Flash Promo Handle"
                    fullWidth
                    size="small"
                  />
                </Box>
              </Paper>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SaveIcon />}
              onClick={handleSaveChannels}
              sx={{ borderRadius: 2.5, px: 4, textTransform: 'none', fontWeight: 700 }}
            >
              Save Channel Configuration
            </Button>
          </Box>
        </AppCard>
      )}

      {/* TAB 6: AUTO-ROUTING RULES (Live Backend API) */}
      {activeTab === 6 && (
        <AppCard
          title="Lead Distribution & Auto-Routing Rules"
          subheader="Deploy dynamic rules that inspect incoming flight inquiries, passenger destinations, or VIP budgets and assign them immediately to the right sales desk."
        >
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', mt: 1, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Rule #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rule Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trigger Condition</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assigned Action / Desk</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routingRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">No active routing rules found. Click below to create one.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  routingRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>#{rule.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{rule.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.type || 'Skill-Based'}
                          size="small"
                          color={rule.type === 'VIP Priority' ? 'secondary' : rule.type === 'Capacity-Based' ? 'info' : 'primary'}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.82rem' }}>
                          {rule.condition}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {rule.action}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={rule.enabled !== false ? 'Active' : 'Disabled'}
                          size="small"
                          color={rule.enabled !== false ? 'success' : 'default'}
                          onClick={() => handleToggleRuleStatus(rule)}
                          sx={{ cursor: 'pointer', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRule(rule.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, alignItems: 'center' }}>
            <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.neutral', flex: 1, mr: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>How it works:</strong> Inquiries coming via webhooks, WhatsApp, or phone calls match against these criteria in priority order and auto-assign to available ticketing agents.
              </Typography>
            </Paper>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsRuleModalOpen(true)}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Add Routing Rule
            </Button>
          </Box>
        </AppCard>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: EDIT CORPORATE PROFILE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            mx: { xs: 1.5, sm: 3 },
            my: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: '85vh' },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 48px -12px rgba(11, 27, 61, 0.18)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <form onSubmit={handleSubmit(handleGeneralSubmit)} style={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', overflow: 'hidden' }}>
          <Box sx={{ flexShrink: 0, py: 2, px: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <DialogTitle sx={{ p: 0, fontWeight: 800, color: 'primary.main', fontSize: '1.4rem', fontFamily: "'Outfit', sans-serif" }}>
              Edit Corporate Settings & Profile
            </DialogTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Modify legal agency profiles, support phone lines, headquarters address, and default billing tax rates.
            </Typography>
          </Box>

          <DialogContent
            className="modal-scroll"
            sx={{
              py: 2.5,
              px: { xs: 2, sm: 3 },
              maxHeight: { xs: '55vh', sm: '60vh', md: '65vh' },
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain',
              flexGrow: 1,
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
                py: 1
              }}
            >
              <TextField
                {...register('companyName')}
                label="Company Legal Name"
                error={!!errors.companyName}
                helperText={errors.companyName?.message}
                fullWidth
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <BusinessIcon color="primary" sx={{ fontSize: 20, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                {...register('vatId')}
                label="Tax ID / US EIN"
                error={!!errors.vatId}
                helperText={errors.vatId?.message}
                fullWidth
                placeholder="EIN-US-92-4819201"
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <VpnKeyIcon color="primary" sx={{ fontSize: 20, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                {...register('incorporationDate')}
                label="Incorporation Date"
                type="date"
                error={!!errors.incorporationDate}
                helperText={errors.incorporationDate?.message}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <CalendarTodayIcon color="primary" sx={{ fontSize: 18, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                {...register('website')}
                label="Corporate Website URL"
                error={!!errors.website}
                helperText={errors.website?.message}
                fullWidth
                placeholder="https://wowmyflight.com"
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <WebIcon color="primary" sx={{ fontSize: 20, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                {...register('phone')}
                label="Support Hotline Phone"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                fullWidth
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <PhoneIcon color="primary" sx={{ fontSize: 20, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                {...register('email')}
                label="Client Support Email"
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                sx={fieldStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <EmailIcon color="primary" sx={{ fontSize: 20, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                {...register('vatRate')}
                type="number"
                label="Default Invoiced Tax Rate"
                error={!!errors.vatRate}
                helperText={errors.vatRate?.message}
                fullWidth
                sx={fieldStyle}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ pr: 1 }}>
                      <span style={{ fontWeight: 700, color: '#C59B27', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif" }}>%</span>
                    </InputAdornment>
                  )
                }}
              />
              <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

              <TextField
                {...register('address')}
                label="Corporate Headquarters Physical Address"
                error={!!errors.address}
                helperText={errors.address?.message}
                fullWidth
                multiline
                rows={3}
                sx={{
                  ...fieldStyle,
                  gridColumn: { xs: 'span 1', sm: 'span 2' }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1, mr: 1 }}>
                      <LocationOnIcon color="primary" sx={{ fontSize: 20, opacity: 0.85 }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    {...register('autoAssignConsultant')}
                    checked={watch('autoAssignConsultant') ?? true}
                    color="secondary"
                  />
                }
                label="Enable automated lead routing (matches passenger origin & cabin skill level)"
                sx={{
                  gridColumn: { xs: 'span 1', sm: 'span 2' },
                  mt: 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ py: 2, px: { xs: 2, sm: 3 }, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setIsEditModalOpen(false)}
              sx={{ borderRadius: 2.5, px: 3.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              sx={{
                borderRadius: 2.5,
                px: 4,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #C59B27 0%, #A57F1E 100%)'
              }}
            >
              Save Corporate Settings
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CONFIGURE FLIGHT PACKAGE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={isPkgModalOpen}
        onClose={() => setIsPkgModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            boxShadow: '0 24px 48px -12px rgba(11, 27, 61, 0.18)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        {selectedPkgToEdit && (
          <form onSubmit={(e) => { e.preventDefault(); handleSavePkgModal(); }}>
            <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', pb: 1, fontSize: '1.5rem', fontFamily: "'Outfit', sans-serif" }}>
              Configure Flight Package
            </DialogTitle>
            <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Update the package base pricing, traveler description, and included deliverables for <strong>{selectedPkgToEdit.name}</strong>.
            </Typography>

            <DialogContent dividers sx={{ borderTop: '1px solid', borderColor: 'divider', borderBottom: '1px solid', px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    label="Package Name"
                    value={selectedPkgToEdit.name}
                    disabled
                    fullWidth
                    sx={fieldStyle}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 1 }}>
                          <FlightIcon color="disabled" sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    label="Base Fee ($ USD)"
                    type="number"
                    value={editPkgPrice}
                    onChange={(e) => setEditPkgPrice(e.target.value)}
                    fullWidth
                    sx={fieldStyle}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <span style={{ fontWeight: 700, color: '#C59B27', fontSize: '0.95rem' }}>$</span>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <TextField
                  label="Client-Facing Package Description"
                  multiline
                  rows={3}
                  value={editPkgDesc}
                  onChange={(e) => setEditPkgDesc(e.target.value)}
                  fullWidth
                  sx={fieldStyle}
                />

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', color: 'secondary.main', letterSpacing: '0.05em', fontSize: '0.78rem' }}>
                    Included Deliverables Checklist:
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 48, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(244, 246, 249, 0.2)' }}>
                    {editPkgIncludes.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', m: 'auto' }}>
                        No deliverables in this package yet. Add one below.
                      </Typography>
                    ) : (
                      editPkgIncludes.map((item, idx) => (
                        <Chip
                          key={idx}
                          label={item}
                          onDelete={() => handleDeleteModalDeliverable(item)}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1.5 }}
                        />
                      ))
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Add an inclusion (e.g. Excess Baggage 32kg, Lounge Pass)..."
                      value={newDeliverableVal}
                      onChange={(e) => setNewDeliverableVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddModalDeliverable();
                        }
                      }}
                      fullWidth
                      sx={fieldStyle}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddModalDeliverable}
                      sx={{ minWidth: 44, height: 40, borderRadius: 2.5 }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setIsPkgModalOpen(false)} sx={{ borderRadius: 2.5, px: 3.5, textTransform: 'none' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="secondary" sx={{ borderRadius: 2.5, px: 4, textTransform: 'none', fontWeight: 700 }}>
                Save Changes
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: EDIT NOTIFICATION TEMPLATE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            boxShadow: '0 24px 48px -12px rgba(11, 27, 61, 0.18)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplateModal(); }}>
          <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', pb: 1, fontSize: '1.5rem', fontFamily: "'Outfit', sans-serif" }}>
            Edit Flight Notification Template
          </DialogTitle>
          <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Configure template variables, subject lines, and passenger notifications. Device preview updates automatically.
          </Typography>

          <DialogContent dividers sx={{ borderTop: '1px solid', borderColor: 'divider', borderBottom: '1px solid', px: 3, py: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }, gap: 4, py: 1 }}>
              {/* Left Column: Editor */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {activeTemplate.type === 'email' && (
                  <TextField
                    label="Email Subject Line"
                    value={editTemplateSubject}
                    onChange={(e) => setEditTemplateSubject(e.target.value)}
                    fullWidth
                    sx={fieldStyle}
                  />
                )}

                <TextField
                  inputRef={textareaRef}
                  label="Template Body Message"
                  value={editTemplateBody}
                  onChange={(e) => setEditTemplateBody(e.target.value)}
                  multiline
                  rows={activeTemplate.type === 'email' ? 12 : 9}
                  fullWidth
                  sx={fieldStyle}
                />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1.5, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Click to Inject Placeholders at Cursor Position:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['{clientName}', '{pnr}', '{route}', '{airline}', '{departureDate}', '{cabinClass}', '{amount}', '{bookingLink}', '{quoteId}', '{invoiceId}'].map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => handleInsertTagInModal(tag)}
                        color="primary"
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          fontFamily: "'Courier New', Courier, monospace",
                          borderRadius: 1.5
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Right Column: Pre-visualization */}
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-start', pt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', color: 'secondary.main', letterSpacing: '0.05em', fontSize: '0.78rem', fontFamily: "'Outfit', sans-serif" }}>
                  Live Device Preview
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-start' }}>
                  {activeTemplate.type === 'email' ? (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <Box sx={{ px: 2, py: 1.2, bgcolor: 'background.neutral', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#EF4444' }} />
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22C55E' }} />
                        <Box sx={{ flexGrow: 1, mx: 1.5, py: 0.3, px: 1, bgcolor: 'background.paper', borderRadius: 1.2, fontSize: '0.65rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LaptopIcon sx={{ fontSize: 10 }} />
                          <span>mail.google.com/inbox</span>
                        </Box>
                      </Box>
                      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.8, borderBottom: '1px solid', borderColor: 'divider', fontSize: '0.75rem', bgcolor: 'background.paper' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <strong>Subject:</strong> {editTemplateSubject ? editTemplateSubject.replace(/{clientName}/g, 'Marcus Vance').replace(/{pnr}/g, 'WMF-78921') : '(No Subject)'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'background.paper', color: 'var(--wd-334155, #334155)', fontSize: '0.78rem', lineHeight: 1.5, minHeight: 220, maxHeight: 300, overflowY: 'auto' }}>
                        <div dangerouslySetInnerHTML={{ __html: renderBodyWithMockData(editTemplateBody) }} />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{
                      border: '8px solid #334155',
                      borderRadius: 5,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      maxWidth: 290,
                      mx: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }}>
                      <Box sx={{ py: 1, px: 2, bgcolor: '#075E54', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif" }}>
                          WowMyFlight Concierge Bot
                        </Typography>
                        <SmartphoneIcon sx={{ fontSize: 14 }} />
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: 'var(--wl-E5DDD5, #E5DDD5)', minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <Box sx={{
                          alignSelf: 'flex-start',
                          bgcolor: 'var(--wl-DCF8C6, #DCF8C6)',
                          color: 'var(--wd-303030, #303030)',
                          p: 1.5,
                          borderRadius: '0px 10px 10px 10px',
                          maxWidth: '90%',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                          mb: 1
                        }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line', lineHeight: 1.35, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {editTemplateBody ? editTemplateBody
                              .replace(/{clientName}/g, 'Marcus Vance')
                              .replace(/{pnr}/g, 'WMF-78921')
                              .replace(/{route}/g, 'JFK ➔ LHR')
                              .replace(/{bookingLink}/g, 'https://wowmyflight.com/itinerary/WMF-78921') : '(No body text)'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setIsTemplateModalOpen(false)} sx={{ borderRadius: 2.5, px: 3.5, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="secondary" sx={{ borderRadius: 2.5, px: 4, textTransform: 'none', fontWeight: 700 }}>
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: EDIT STRIPE GATEWAY CREDENTIALS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
          Update Stripe Credentials
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
          <TextField
            label="Publishable Key"
            placeholder="pk_live_..."
            value={stripeForm.publishableKey}
            onChange={(e) => setStripeForm({ ...stripeForm, publishableKey: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
          <TextField
            label="Secret Key"
            type="password"
            placeholder="sk_live_... (leave blank to keep current)"
            value={stripeForm.secretKey}
            onChange={(e) => setStripeForm({ ...stripeForm, secretKey: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
          <TextField
            label="Default Currency"
            value={stripeForm.currency}
            onChange={(e) => setStripeForm({ ...stripeForm, currency: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setIsStripeModalOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" color="secondary" onClick={handleSaveStripeModal} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Save Credentials
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: ADD ROUTING RULE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
          Add Intelligent Lead Routing Rule
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
          <TextField
            label="Rule Name"
            placeholder="e.g. Asia & Pacific Inquiries"
            value={newRuleForm.name}
            onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
          <FormControl fullWidth>
            <InputLabel id="rule-type-label">Routing Strategy</InputLabel>
            <Select
              labelId="rule-type-label"
              value={newRuleForm.type}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, type: e.target.value })}
              label="Routing Strategy"
            >
              <MenuItem value="Skill-Based">Skill-Based (Destination & Cabin Class)</MenuItem>
              <MenuItem value="VIP Priority">VIP Priority (High Budget / First Class)</MenuItem>
              <MenuItem value="Round Robin">Round Robin (Even Distribution)</MenuItem>
              <MenuItem value="Capacity-Based">Capacity-Based (Agent Active Leads Limit)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Trigger Condition"
            placeholder="e.g. Destination == USA / Canada OR CabinClass == First"
            value={newRuleForm.condition}
            onChange={(e) => setNewRuleForm({ ...newRuleForm, condition: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
          <TextField
            label="Assigned Action / Target Desk"
            placeholder="e.g. Assign to North America Sales Desk"
            value={newRuleForm.action}
            onChange={(e) => setNewRuleForm({ ...newRuleForm, action: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
          <TextField
            label="Evaluation Priority (1 = Highest)"
            type="number"
            value={newRuleForm.priority}
            onChange={(e) => setNewRuleForm({ ...newRuleForm, priority: e.target.value })}
            fullWidth
            sx={fieldStyle}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setIsRuleModalOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" color="secondary" onClick={handleCreateRule} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Deploy Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
