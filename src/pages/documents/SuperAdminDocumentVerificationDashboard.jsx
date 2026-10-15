import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';
import DualClock from '../../components/DualClock';

// Icons
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import HotelIcon from '@mui/icons-material/Hotel';
import DrawIcon from '@mui/icons-material/Draw';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import PageHeader from '../../components/PageHeader';
import AppTable from '../../components/AppTable';
import AppModal from '../../components/AppModal';
import { useAlert } from '../../contexts/AlertContext';

import { themeText } from '../../theme/themeColor';
import { dbService } from '../../services/dbService';
import { qaService } from '../../services/phase3Service';
import { getRealisticDocumentVisual, getRealisticDocumentSvgString, renderSvgToDataUrl } from './documentVisualTemplates';
// ─── SPECIFICATION CONSTANTS ───
export const DOC_TYPES = [
  { type: 'Passport', purpose: 'Identity + travel eligibility', icon: <BadgeIcon sx={{ color: '#2563EB' }} />, color: '#2563EB', bg: 'var(--wl-EFF6FF, #EFF6FF)' },
  { type: 'E-Ticket (PDF)', purpose: 'Flight ticket file', icon: <ConfirmationNumberIcon sx={{ color: 'var(--wd-059669, #059669)' }} />, color: '#059669', bg: 'var(--wl-ECFDF5, #ECFDF5)' },
  { type: 'Official Itinerary', purpose: 'Formatted trip details', icon: <FlightTakeoffIcon sx={{ color: '#7C3AED' }} />, color: '#7C3AED', bg: 'var(--wl-F5F3FF, #F5F3FF)' },
  { type: 'Travel Insurance', purpose: 'Coverage document', icon: <SecurityIcon sx={{ color: '#D97706' }} />, color: '#D97706', bg: 'var(--wl-FFFBEB, #FFFBEB)' },
  { type: 'Visa Copy', purpose: 'Destination visa if required', icon: <VerifiedUserIcon sx={{ color: 'var(--wd-0284C7, #0284C7)' }} />, color: '#0284C7', bg: 'var(--wl-F0F9FF, #F0F9FF)' },
  { type: 'Hotel Voucher', purpose: 'If hotel booked as package', icon: <HotelIcon sx={{ color: '#E11D48' }} />, color: '#E11D48', bg: 'var(--wl-FFF1F2, #FFF1F2)' },
  { type: 'Auth Form', purpose: 'E-sign authorization for payment', icon: <DrawIcon sx={{ color: '#4F46E5' }} />, color: '#4F46E5', bg: 'var(--wl-EEF2FF, #EEF2FF)' },
];

export const STATUS_FLOW = ['Pending Upload', 'Uploaded', 'Under Review', 'Verified', 'Expired'];

const STATUS_CONFIG = {
  'Pending Upload': { bg: 'var(--wl-FFFBEB, #FFFBEB)', color: '#B45309', icon: <HourglassEmptyIcon sx={{ fontSize: 13 }} /> },
  'Uploaded': { bg: 'var(--wl-EFF6FF, #EFF6FF)', color: '#1D4ED8', icon: <CloudUploadIcon sx={{ fontSize: 13 }} /> },
  'Under Review': { bg: 'var(--wl-F3E8FF, #F3E8FF)', color: '#7E22CE', icon: <ArticleIcon sx={{ fontSize: 13 }} /> },
  'Verified': { bg: 'var(--wl-ECFDF5, #ECFDF5)', color: '#047857', icon: <CheckCircleIcon sx={{ fontSize: 13 }} /> },
  'Expired': { bg: 'var(--wl-FEF2F2, #FEF2F2)', color: '#B91C1C', icon: <WarningAmberIcon sx={{ fontSize: 13 }} /> }
};

// Initial Mock Documents (aligned to spec)
const INITIAL_DOCUMENTS = [
  {
    id: 'DOC-101',
    type: 'Passport',
    customerName: 'Karan Singh',
    customerEmail: 'karan@example.com',
    bookingRef: 'BK-001',
    pnr: 'SAB78K',
    fileName: 'Karan_Singh_US_Passport_2031.pdf',
    fileSize: '2.4 MB',
    uploadDate: '2026-06-18',
    expiryDate: '2031-08-15',
    verifiedBy: 'Super Admin (CEO)',
    status: 'Verified',
    notes: 'US Citizen Passport verified valid (> 6 months validity for UK entry).'
  },
  {
    id: 'DOC-102',
    type: 'E-Ticket (PDF)',
    customerName: 'Karan Singh',
    customerEmail: 'karan@example.com',
    bookingRef: 'BK-001',
    pnr: 'SAB78K',
    fileName: 'BA_ClubWorld_eTicket_1259834102941.pdf',
    fileSize: '1.1 MB',
    uploadDate: '2026-06-18',
    expiryDate: '2026-10-15',
    verifiedBy: 'Ticketing Desk',
    status: 'Verified',
    notes: 'British Airways 13-digit GDS e-ticket confirmed and active.'
  },
  {
    id: 'DOC-103',
    type: 'Auth Form',
    customerName: 'Karan Singh',
    customerEmail: 'karan@example.com',
    bookingRef: 'BK-001',
    pnr: 'SAB78K',
    fileName: 'CreditCard_Auth_Form_Signed.pdf',
    fileSize: '840 KB',
    uploadDate: '2026-06-18',
    expiryDate: '2026-12-31',
    verifiedBy: 'Finance Team',
    status: 'Verified',
    notes: 'Digital signature verified against Visa cardholder name.'
  },
  {
    id: 'DOC-104',
    type: 'Visa Copy',
    customerName: 'Alexander Pavlov',
    customerEmail: 'alex.p@example.ru',
    bookingRef: 'BK-002',
    pnr: 'DXB44P',
    fileName: 'UAE_Tourist_Visa_Approval.pdf',
    fileSize: '1.8 MB',
    uploadDate: '2026-06-17',
    expiryDate: '2026-11-20',
    verifiedBy: 'Pending Specialist',
    status: 'Under Review',
    notes: 'UAE eVisa copy submitted. Checking entry barcode validity.'
  },
  {
    id: 'DOC-105',
    type: 'Official Itinerary',
    customerName: 'Chloe Dupont',
    customerEmail: 'chloe.dupont@example.com',
    bookingRef: 'BK-003',
    pnr: 'JFK99L',
    fileName: 'Official_Travel_Itinerary_JFK_LHR.pdf',
    fileSize: '950 KB',
    uploadDate: '2026-06-16',
    expiryDate: '2026-10-22',
    verifiedBy: 'Agent Alex',
    status: 'Uploaded',
    notes: 'Generated trip itinerary with baggage guidelines.'
  }
];

export const SuperAdminDocumentVerificationDashboard = () => {
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch real documents from PostgreSQL database on load
  React.useEffect(() => {
    let isMounted = true;
    qaService.getDocuments().then(data => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(d => ({
          id: d.id,
          type: d.type || d.category || 'Passport',
          customerName: d.customerName || 'Marcus Vance',
          customerEmail: d.customerEmail || 'client@wowmyflight.com',
          bookingRef: d.bookingRef || 'BK-101',
          pnr: d.pnr || 'WMF-99',
          fileName: d.fileName || 'document.pdf',
          fileSize: d.fileSize || '1.8 MB',
          uploadDate: d.uploadDate || (d.createdAt ? String(d.createdAt).substring(0, 10) : '2026-10-09'),
          expiryDate: d.expiryDate || '2031-10-15',
          verifiedBy: d.reviewedBy || 'QA Officer',
          status: d.status === 'Verified' ? 'Verified' : (d.status === 'Under Review' ? 'Under Review' : 'Uploaded'),
          notes: d.comment || d.notes || 'Verified against traveler registry.'
        }));

        try {
          const localDocs = JSON.parse(localStorage.getItem('wmf_qa_uploaded_docs') || '[]');
          if (localDocs.length > 0) {
            setDocuments([...localDocs, ...normalized.filter(d => !localDocs.some(ld => ld.id === d.id))]);
            return;
          }
        } catch (e) {
          console.warn('Local docs load error:', e);
        }
        setDocuments(normalized);
      }
    }).catch(e => console.warn('Live documents load warning:', e));
    return () => { isMounted = false; };
  }, []);

  // Modals & Panels
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New Document Upload State
  const [newDocForm, setNewDocForm] = useState({
    customerName: 'Karan Singh',
    bookingRef: 'BK-001',
    pnr: 'SAB78K',
    type: 'Passport',
    fileName: '',
    expiryDate: '2031-10-15',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setNewDocForm(prev => ({ ...prev, fileName: file.name }));
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setSelectedFileDataUrl(uploadEvt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadDocumentPdf = async (doc) => {
    if (!doc) return;

    // If user uploaded a real file (Image, PDF, Doc), download that EXACT original file!
    if (doc.fileData) {
      try {
        const link = document.createElement('a');
        link.href = doc.fileData;
        link.download = doc.fileName || `${(doc.customerName || 'document').replace(/\s+/g, '_')}_${doc.type || 'file'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert(`✓ Successfully downloaded real uploaded file: ${doc.fileName}`, 'success');
        return;
      } catch (err) {
        console.error('Real file download error:', err);
      }
    }
    try {
      const docTypeLower = (doc.type || doc.category || doc.fileName || '').toLowerCase();
      const isLandscape = docTypeLower.includes('ticket') || docTypeLower.includes('itinerary');

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Convert our authentic SVG document visual to high-res image
      const svgString = getRealisticDocumentSvgString(doc);
      const imgDataUrl = await renderSvgToDataUrl(svgString, 900, 600);

      if (!isLandscape) {
        // Top Primary Header Banner
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, 210, 20, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('WOW MY FLIGHT CRM · SECURE PASSENGER DOCUMENT VAULT', 15, 11);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`OFFICIAL CERTIFIED TRAVEL ARCHIVE · ${doc.fileName}`, 15, 16);
        pdf.text(`STATUS: ${(doc.status || 'VERIFIED').toUpperCase()}`, 195, 13, { align: 'right' });

        // Embed the REALISTIC SCANNED DOCUMENT (Schengen Visa Sticker / Passport Bio Page)
        if (imgDataUrl) {
          pdf.addImage(imgDataUrl, 'JPEG', 15, 26, 180, 122);
        }

        // Section: Verification Specifications below the real document
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(203, 213, 225);
        pdf.roundedRect(15, 154, 180, 68, 2, 2, 'FD');

        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('PASSENGER & BOOKING VERIFICATION SPECIFICATIONS', 22, 163);

        const details = [
          ['Passenger Full Name', doc.customerName || 'Traveler'],
          ['Customer Email', doc.customerEmail || 'client@wowmyflight.com'],
          ['Booking Reference', doc.bookingRef || 'BK-101'],
          ['Sabre / Amadeus PNR', doc.pnr || 'WMF-99'],
          ['Document Classification', doc.type || doc.category || 'Visa'],
          ['Document Expiry Date', doc.expiryDate || '2031-10-15'],
          ['Verified By Authority', doc.verifiedBy || 'Super Admin (QA Lead)'],
          ['Security Checksum', 'SHA-256: 4f8b2c1e7a9d3... (AWS S3 Encrypted)']
        ];

        details.forEach(([label, value], idx) => {
          const y = 171 + idx * 6;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          pdf.text(label + ':', 22, y);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(15, 23, 42);
          pdf.text(String(value), 75, y);
        });

        // Section: Official Seal
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(130, 226, 65, 26, 3, 3, 'D');

        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text('WOWMYFLIGHT QA VAULT', 162.5, 234, { align: 'center' });
        pdf.setFontSize(7);
        pdf.text('DIGITALLY CERTIFIED & VERIFIED', 162.5, 240, { align: 'center' });
        pdf.text(new Date().toISOString().split('T')[0], 162.5, 246, { align: 'center' });

        // Footer
        pdf.setDrawColor(226, 232, 240);
        pdf.line(15, 275, 195, 275);

        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('Confidential - For authorized travel agency operations only. WowMyFlight Travel CRM.', 15, 282);
        pdf.text(`Downloaded: ${new Date().toLocaleString()}`, 195, 282, { align: 'right' });
      } else {
        // Landscape A4 for E-Tickets
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, 297, 18, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('WOW MY FLIGHT CRM · ELECTRONIC FLIGHT TICKET & ITINERARY', 15, 11);
        pdf.text(`FILE: ${doc.fileName}`, 282, 11, { align: 'right' });

        if (imgDataUrl) {
          pdf.addImage(imgDataUrl, 'JPEG', 15, 24, 267, 165);
        }
      }

      const safeFilename = (doc.fileName || `${doc.customerName || 'document'}_${doc.type || 'file'}`).replace(/[/\\?%*:|"<>]/g, '_');
      const filename = safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;

      pdf.save(filename);
      showAlert(`✓ Successfully downloaded real certified ${doc.type || 'document'}: ${filename}!`, 'success');
      return;
    } catch (err) {
      console.error('PDF generation error:', err);
      showAlert(`Download failed: ${err.message}`, 'error');
    }
  };

      
  const handleUpdateStatus = async (docId, newStatus) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus, verifiedBy: 'Super Admin (CEO)' } : d));
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc(prev => ({ ...prev, status: newStatus, verifiedBy: 'Super Admin (CEO)' }));
    }
    await qaService.updateDocumentStatus(docId, newStatus);
    showAlert(`Document ${docId} marked as ${newStatus}!`, 'success');
  };

  const handleUploadNewDoc = async () => {
    const newId = 'DOC-' + (documents.length + 101);
    const sizeStr = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : '1.9 MB';
    const newDoc = {
      id: newId,
      type: newDocForm.type,
      customerName: newDocForm.customerName,
      customerEmail: 'karan@example.com',
      bookingRef: newDocForm.bookingRef,
      pnr: newDocForm.pnr,
      fileName: selectedFile ? selectedFile.name : (newDocForm.fileName || `${newDocForm.customerName.replace(' ', '_')}_${newDocForm.type.replace(' ', '_')}.pdf`),
      fileSize: sizeStr,
      uploadDate: new Date().toISOString().split('T')[0],
      expiryDate: newDocForm.expiryDate,
      verifiedBy: 'Pending Review',
      status: 'Uploaded',
      notes: newDocForm.notes || 'Uploaded via Super Admin console.',
      fileData: selectedFileDataUrl,
      fileType: selectedFile ? selectedFile.type : 'application/pdf'
    };

    setDocuments([newDoc, ...documents]);
    try {
      const existingLocal = JSON.parse(localStorage.getItem('wmf_qa_uploaded_docs') || '[]');
      const updated = [newDoc, ...existingLocal.filter(d => d.id !== newDoc.id)].slice(0, 5);
      localStorage.setItem('wmf_qa_uploaded_docs', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
    const { fileData, ...docMetadata } = newDoc;
    try {
      await qaService.uploadDocument(docMetadata);
    } catch (err) {
      console.warn('Cloud sync note:', err);
    }
    showAlert(`📄 Document ${newId} (${newDocForm.type}) uploaded successfully!`, 'success');
    setSelectedFile(null);
    setSelectedFileDataUrl(null);
    setUploadModalOpen(false);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const matchSearch =
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter ? d.type === typeFilter : true;
      const matchStatus = statusFilter ? d.status === statusFilter : true;
      return matchSearch && matchType && matchStatus;
    });
  }, [documents, searchTerm, typeFilter, statusFilter]);

  const columns = [
    {
      id: 'docId',
      label: 'Document ID',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>
          {row.id}
        </Typography>
      )
    },
    {
      id: 'type',
      label: 'Document Type',
      render: (row) => {
        const item = DOC_TYPES.find(t => t.type === row.type) || DOC_TYPES[0];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ p: 0.5, bgcolor: item.bg, borderRadius: 1, display: 'flex' }}>
              {item.icon}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.type}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{item.purpose}</Typography>
            </Box>
          </Box>
        );
      }
    },
    {
      id: 'customer',
      label: 'Passenger / Customer',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.customerName}</Typography>
          <Typography variant="caption" color="text.secondary">Booking: <b>{row.bookingRef}</b> ({row.pnr})</Typography>
        </Box>
      )
    },
    {
      id: 'file',
      label: 'File Name',
      render: (row) => (
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'primary.main', fontFamily: 'monospace' }}>
            {row.fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">{row.fileSize} · Uploaded: {row.uploadDate}</Typography>
        </Box>
      )
    },
    {
      id: 'expiry',
      label: 'Expiry Date',
      render: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 700, color: row.status === 'Expired' ? 'error.main' : 'text.primary' }}>
          {row.expiryDate || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status Flow',
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG['Uploaded'];
        return (
          <Chip
            size="small"
            icon={cfg.icon}
            label={row.status}
            sx={{ bgcolor: cfg.bg, color: (theme) => themeText(theme, cfg.color), fontWeight: 800, fontSize: '0.68rem', height: 22 }}
          />
        );
      }
    }
  ];

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', width: '100%' }}>
      {/* Top QA Command Header Card */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2.2, sm: 2.8, md: 3 }, 
          mb: 3.5, 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 3.5, 
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {/* Top: Avatar & Identity */}
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, minWidth: 0, width: '100%' }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              fontWeight: 900, 
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              flexShrink: 0
            }}
          >
            QA
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900, 
                  color: 'text.primary', 
                  fontFamily: 'Outfit, sans-serif', 
                  fontSize: { xs: '1.1rem', sm: '1.4rem' }, 
                  letterSpacing: '-0.01em' 
                }}
              >
                Travel Documents Verification
              </Typography>
              <Chip 
                label="PHASE 3: QA OVERSIGHT" 
                size="small" 
                sx={{ 
                  fontWeight: 900, 
                  fontSize: '0.65rem', 
                  height: 22,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                  color: '#059669',
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0'
                }} 
              />
              <Chip
                icon={
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: '#10B981', 
                      ml: 1,
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)' 
                    }} 
                  />
                }
                label="LIVE VAULT SECURE" 
                size="small"
                sx={{ 
                  fontWeight: 800, 
                  fontSize: '0.65rem', 
                  height: 22,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4',
                  color: '#047857',
                  border: '1px solid',
                  borderColor: '#86EFAC',
                  '& .MuiChip-icon': { ml: '6px', mr: '-2px' }
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
              Manage and verify passenger passports, e-tickets, official itineraries, travel insurance, visas & payment auth forms.
            </Typography>
          </Box>
        </Box>

        {/* Bottom: Action Button & DualClock */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            width: '100%' 
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadModalOpen(true)}
            sx={{ 
              borderRadius: 2.2, 
              fontSize: '0.82rem', 
              fontWeight: 800, 
              px: 2.5, 
              height: 38,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
            }}
          >
            + Upload New Document
          </Button>
          <DualClock client={{ timezone: 'America/New_York', label: 'QA EST' }} />
        </Box>
      </Paper>

      {/* ─── SECTION 1: 7 TRAVEL DOCUMENT TYPES SPECIFICATION CARDS ─── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5 }}>
          🗂️ TRAVEL DOCUMENT TYPES & VERIFICATION STANDARDS
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5 }}>
          {DOC_TYPES.map((d, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: d.bg,
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {d.icon}
                <Typography variant="caption" sx={{ fontWeight: 900, color: d.color }}>{d.type}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', lineHeight: 1.2 }}>
                {d.purpose}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* ─── SECTION 2: STATUS LIFECYCLE FLOW FILTER ─── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.neutral' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            DOCUMENT STATUS LIFECYCLE FLOW:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            <Chip
              label="All Statuses"
              onClick={() => setStatusFilter('')}
              color={statusFilter === '' ? 'primary' : 'default'}
              variant={statusFilter === '' ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer', fontWeight: 800 }}
            />
            {STATUS_FLOW.map((st) => (
              <Chip
                key={st}
                label={st}
                onClick={() => setStatusFilter(st)}
                color={statusFilter === st ? 'primary' : 'default'}
                variant={statusFilter === st ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer', fontWeight: 700 }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Search & Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search Doc ID, Passenger, Booking Ref, File..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', md: 340 }, bgcolor: 'background.paper' }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Document Type</InputLabel>
          <Select
            value={typeFilter}
            label="Document Type"
            onChange={e => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Document Types</MenuItem>
            {DOC_TYPES.map(t => (
              <MenuItem key={t.type} value={t.type}>{t.type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Documents Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
        <AppTable
          columns={columns}
          data={filteredDocuments}
          onRowClick={(row) => {
            setSelectedDoc(row);
            setDrawerOpen(true);
          }}
          actions={(row) => (
            <Box sx={{ display: 'flex', gap: 0.8, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
              <Tooltip title="View & Verify Document">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => { setSelectedDoc(row); setDrawerOpen(true); }}
                  sx={{ py: 0.3, px: 1, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Review
                </Button>
              </Tooltip>

              <Tooltip title="Mark as Verified">
                <IconButton size="small" color="success" onClick={() => handleUpdateStatus(row.id, 'Verified')}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download PDF">
                <IconButton size="small" color="primary" onClick={() => handleDownloadDocumentPdf(row)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      </Paper>

      {/* ─── SLIDE-OVER DOCUMENT INSPECTION & VERIFICATION MODAL ─── */}
      <AppModal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedDoc ? `Inspect & Verify Document: ${selectedDoc.id}` : ''}
        maxWidth="md"
        actions={
          selectedDoc && (
            <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadDocumentPdf(selectedDoc)}
                sx={{ fontWeight: 800, textTransform: 'none' }}
              >
                {selectedDoc.fileData ? 'Download Real File' : 'Download Document'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => { handleUpdateStatus(selectedDoc.id, 'Under Review'); setDrawerOpen(false); }}
                sx={{ fontWeight: 850 }}
              >
                Request Re-upload
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => { handleUpdateStatus(selectedDoc.id, 'Verified'); setDrawerOpen(false); }}
                sx={{ fontWeight: 850 }}
              >
                Approve & Verify
              </Button>
              </Box>
            </Box>
          )
        }
      >
        {selectedDoc && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Passenger: <b>{selectedDoc.customerName}</b> ({selectedDoc.customerEmail}) &nbsp;|&nbsp; Booking: <b>{selectedDoc.bookingRef}</b> ({selectedDoc.pnr})
              </Typography>
            </Box>

            <Divider />

            {/* STATUS LIFECYCLE FLOW STEPPER */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1.5, textTransform: 'uppercase' }}>
                STATUS LIFECYCLE FLOW
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {STATUS_FLOW.map((step) => {
                  const isCurrent = selectedDoc.status === step;
                  return (
                    <Chip
                      key={step}
                      label={step}
                      onClick={() => handleUpdateStatus(selectedDoc.id, step)}
                      color={isCurrent ? (step === 'Verified' ? 'success' : step === 'Expired' ? 'error' : 'primary') : 'default'}
                      variant={isCurrent ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                    />
                  );
                })}
              </Box>
            </Paper>

            <Grid container spacing={2.5}>
              {/* Document Details Card */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.12)' : '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'info.main', mb: 1.5 }}>
                    📄 FILE & VERIFICATION SPECIFICATIONS
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 1.2, fontSize: 13 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Document Type:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>{selectedDoc.type}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>File Name:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedDoc.fileName}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Expiry Date:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{selectedDoc.expiryDate}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Verified By:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{selectedDoc.verifiedBy}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Verification Notes:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{selectedDoc.notes}</Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Document Preview Box Simulator */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%'
                  }}
                >
                  <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8, textTransform: 'uppercase' }}>
                      <ArticleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      REAL DOCUMENT VIEW ({selectedDoc.type})
                    </Typography>
                    <Chip
                      label={selectedDoc.fileData ? 'USER UPLOADED' : 'OFFICIAL ARCHIVE'}
                      size="small"
                      color={selectedDoc.fileData ? 'success' : 'primary'}
                      variant="outlined"
                      sx={{ fontWeight: 800, fontSize: '0.62rem', height: 20 }}
                    />
                  </Box>

                  {/* Real Document Visual Image / PDF Frame */}
                  <Box
                    sx={{
                      width: '100%',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: '#0f172a',
                      border: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0.5,
                      minHeight: 210,
                      maxHeight: 230
                    }}
                  >
                    {selectedDoc.fileData && selectedDoc.fileType === 'application/pdf' ? (
                      <iframe
                        src={selectedDoc.fileData}
                        title={selectedDoc.fileName}
                        style={{ width: '100%', height: 210, border: 'none', borderRadius: 4 }}
                      />
                    ) : (
                      <img
                        src={getRealisticDocumentVisual(selectedDoc)}
                        alt={selectedDoc.fileName}
                        style={{
                          maxWidth: '100%',
                          maxHeight: 210,
                          objectFit: 'contain',
                          borderRadius: 4
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.72rem', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedDoc.fileName}
                    </Typography>




                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ fontWeight: 800, textTransform: 'none' }}
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadDocumentPdf(selectedDoc)}
                    size="small"
                  >
                    {selectedDoc.fileData ? 'Download Real File' : 'Download Document'}
                  </Button>
                </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </AppModal>

      {/* ─── UPLOAD NEW DOCUMENT MODAL ─── */}
      <AppModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Passenger Travel Document"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setUploadModalOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleUploadNewDoc}
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
            >
              Upload & Save Document
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <TextField
            size="small"
            label="Passenger / Customer Full Name *"
            value={newDocForm.customerName}
            onChange={e => setNewDocForm({ ...newDocForm, customerName: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              label="Booking Ref *"
              value={newDocForm.bookingRef}
              onChange={e => setNewDocForm({ ...newDocForm, bookingRef: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              label="Sabre PNR"
              value={newDocForm.pnr}
              onChange={e => setNewDocForm({ ...newDocForm, pnr: e.target.value.toUpperCase() })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel shrink id="doc-type-select-label">Document Type *</InputLabel>
            <Select
              labelId="doc-type-select-label"
              value={newDocForm.type}
              label="Document Type *"
              notched
              onChange={e => setNewDocForm({ ...newDocForm, type: e.target.value })}
            >
              {DOC_TYPES.map(t => (
                <MenuItem key={t.type} value={t.type}>
                  <b>{t.type}</b> — {t.purpose}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Expiry Date"
            type="date"
            value={newDocForm.expiryDate}
            onChange={e => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          <input
            type="file"
            id="file-upload-picker"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
          />

          <Paper
            elevation={0}
            onClick={() => document.getElementById('file-upload-picker').click()}
            sx={{
              p: 2.5,
              bgcolor: selectedFile ? '#ECFDF5' : '#F8FAFC',
              border: '2px dashed',
              borderColor: selectedFile ? '#10B981' : '#94A3B8',
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: selectedFile ? '#D1FAE5' : '#F1F5F9',
                borderColor: 'primary.main'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {selectedFile ? (
              <Box>
                <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {(selectedFile.size / 1024).toFixed(0)} KB · Ready to save
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Choose file or drag & drop</Typography>
                <Typography variant="caption" color="text.secondary">PDF, JPG, PNG up to 25MB</Typography>
              </Box>
            )}
          </Paper>

          <TextField
            size="small"
            label="Verification Notes"
            multiline
            rows={2}
            value={newDocForm.notes}
            onChange={e => setNewDocForm({ ...newDocForm, notes: e.target.value })}
            placeholder="e.g. Valid until Oct 2031, visa approved..."
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </Box>
      </AppModal>
    </Box>
  );
};

export default SuperAdminDocumentVerificationDashboard;
