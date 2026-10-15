import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import LinkIcon from '@mui/icons-material/Link';

export default function PaymentLinkModal({ open, onClose, onSubmit, customerName, bookingRef, amount, currency, description, initialData }) {
  const [data, setData] = useState({
    customer: customerName || initialData?.customer || 'Customer',
    booking: bookingRef || initialData?.booking || 'BK-001',
    amount: amount || initialData?.amount || '474',
    currency: currency || initialData?.currency || 'USD',
    description: description || initialData?.description || 'Flight Booking Payment',
    expiry: '24h',
    sendVia: ['email', 'whatsapp'],
  });

  React.useEffect(() => {
    if (open) {
      setData({
        customer: customerName || initialData?.customer || 'Tanu Patel',
        booking: bookingRef || initialData?.booking || 'BK-WMF-7788',
        amount: amount || initialData?.amount || '1500',
        currency: currency || initialData?.currency || 'USD',
        description: description || initialData?.description || (customerName ? `Flight Booking Payment for ${customerName}` : 'Flight Booking Payment JFK → LHR'),
        expiry: '24h',
        sendVia: ['email', 'whatsapp'],
      });
      setGenerated(false);
    }
  }, [open, customerName, bookingRef, amount, currency, description, initialData]);

  const [generated, setGenerated] = useState(false);
  const [mockLink, setMockLink] = useState('https://pay.wowmyflight.com/lnk/WMF-' + Math.random().toString(36).substring(4, 9).toUpperCase());

  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });

  const toggleSendVia = (method) => {
    setData(prev => ({
      ...prev,
      sendVia: prev.sendVia.includes(method)
        ? prev.sendVia.filter(m => m !== method)
        : [...prev.sendVia, method]
    }));
  };

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handleSend = () => {
    if (onSubmit) {
      onSubmit({ ...data, link: mockLink });
    } else {
      onClose();
    }
    setGenerated(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{
        sx: {
          mx: { xs: 1.5, sm: 'auto' },
          my: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 24px)', sm: 540 },
          maxHeight: { xs: 'calc(100dvh - 24px)', sm: '88vh' },
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 3 }, py: 1.75, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon color="success" sx={{ fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
            Generate Payment Link
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent
        className="modal-scroll"
        sx={{
          px: { xs: 2, sm: 3 },
          pt: '24px !important',
          pb: 2.5,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          flexGrow: 1,
        }}
      >
        <Box sx={{ display: 'grid', gap: 2, pt: 0.5 }}>
          <TextField 
            size="small" 
            label="Customer Name" 
            value={data.customer} 
            onChange={set('customer')} 
            fullWidth 
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField 
              size="small" 
              label="Booking Reference" 
              value={data.booking} 
              onChange={set('booking')} 
              fullWidth 
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField 
                size="small" 
                label="Amount" 
                type="number" 
                value={data.amount} 
                onChange={set('amount')} 
                sx={{ flex: 1 }} 
                InputLabelProps={{ shrink: true }}
              />
              <FormControl size="small" sx={{ minWidth: 85 }}>
                <InputLabel shrink>Currency</InputLabel>
                <Select value={data.currency} label="Currency" onChange={set('currency')} notched>
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="AED">AED</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TextField 
            size="small" 
            label="Payment Description" 
            value={data.description} 
            onChange={set('description')} 
            fullWidth 
            InputLabelProps={{ shrink: true }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel shrink>Link Expiry</InputLabel>
            <Select value={data.expiry} label="Link Expiry" onChange={set('expiry')} notched>
              <MenuItem value="24h">24 Hours (Standard)</MenuItem>
              <MenuItem value="48h">48 Hours (Extended)</MenuItem>
              <MenuItem value="7 days">7 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Send via */}
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.8, letterSpacing: '0.05em' }}>
              SEND LINK VIA
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { key: 'email', icon: <EmailIcon sx={{ fontSize: 16 }} />, label: 'Email' },
                { key: 'whatsapp', icon: <WhatsAppIcon sx={{ fontSize: 16 }} />, label: 'WhatsApp' },
                { key: 'sms', icon: <SmsIcon sx={{ fontSize: 16 }} />, label: 'SMS' },
              ].map(m => (
                <Chip
                  key={m.key}
                  icon={m.icon}
                  label={m.label}
                  onClick={() => toggleSendVia(m.key)}
                  color={data.sendVia.includes(m.key) ? 'primary' : 'default'}
                  variant={data.sendVia.includes(m.key) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              ))}
            </Box>
          </Box>

          {/* Generated link preview */}
          {generated && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                  ✅ SECURE PAYMENT LINK READY
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', p: 1, borderRadius: 1.5, border: '1px solid #BBF7D0' }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all', fontWeight: 700, color: 'primary.main' }}>
                    {mockLink}
                  </Typography>
                  <IconButton size="small" onClick={() => navigator.clipboard?.writeText(mockLink)}>
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'block', mt: 0.75, fontWeight: 500 }}>
                  Expires in {data.expiry} · Amount: {data.currency} {Number(data.amount).toLocaleString()}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.75, gap: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
        <Button onClick={onClose} variant="outlined" sx={{ minWidth: 90, minHeight: 38 }}>
          Cancel
        </Button>
        {!generated ? (
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleGenerate} 
            sx={{ minHeight: 38, fontWeight: 800, px: 2.5 }}
          >
            Generate Link
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSend} 
            sx={{ minHeight: 38, fontWeight: 800, px: 2.5 }}
          >
            Send & Record Payment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
