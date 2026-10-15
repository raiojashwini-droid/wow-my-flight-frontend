import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import { MOCK_PAYMENTS_PHASE5, MOCK_REFUNDS_PHASE5, MOCK_BOOKINGS } from '../../constants/mockData';
import { useAlert } from '../../contexts/AlertContext';
import { dbService } from '../../services/dbService';

export default function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(() => MOCK_PAYMENTS_PHASE5?.find(p => p.id === id) || null);
  const [booking, setBooking] = useState(null);
  const [refunds, setRefunds] = useState([]);

  // ─── LIVE POSTGRESQL PAYMENT & BOOKING FETCH ───
  useEffect(() => {
    let isMounted = true;
    const fetchLivePayment = async () => {
      setLoading(true);
      try {
        const [paymentsList, bookingsList] = await Promise.all([
          dbService.getPayments(),
          dbService.getBookings()
        ]);

        if (isMounted && Array.isArray(paymentsList)) {
          const found = paymentsList.find(p => 
            String(p.id) === String(id) || 
            String(p.invoiceNumber) === String(id)
          );

          if (found) {
            const mappedPayment = {
              id: found.id || found.invoiceNumber,
              invoiceNumber: found.invoiceNumber || found.id,
              bookingId: found.bookingId || 'BK-10892',
              customerName: found.customerName || 'Customer',
              customerEmail: found.customerEmail || 'customer@wowmyflight.com',
              customerPhone: found.customerPhone || '+1 (555) 019-2831',
              amount: Number(found.amount) || 0,
              currency: found.currency || 'USD',
              status: (found.status || 'Pending').toUpperCase(),
              method: found.method || 'Online Payment Link',
              serviceName: found.serviceName || 'Flight Booking & Concierge',
              dueDate: found.dueDate || '2026-10-30',
              paymentLink: found.paymentLink || '',
              transactionId: found.transactionId || `TXN-DB-${String(found.id).slice(0, 8)}`,
              notes: found.notes || 'Payment processed via WowMyFlight gateway.'
            };
            setPayment(mappedPayment);
            setRefundAmount(String(mappedPayment.amount));

            if (Array.isArray(bookingsList)) {
              const matchedBooking = bookingsList.find(b => 
                String(b.id) === String(mappedPayment.bookingId) || 
                String(b.bookingId) === String(mappedPayment.bookingId)
              );
              if (matchedBooking) setBooking(matchedBooking);
            }
          }
        }
      } catch (err) {
        console.warn('[PaymentDetails] Live load error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLivePayment();
    return () => { isMounted = false; };
  }, [id]);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(payment ? payment.amount.toString() : '');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress size={42} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Fetching live payment record from database...</Typography>
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Payment Record Not Found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          No transaction exists with Reference/ID: {id}
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/super_admin/payments')} sx={{ mt: 2 }}>
          Back to Payments
        </Button>
      </Box>
    );
  }

  const handleRequestRefund = () => {
    setProcessing(true);
    setTimeout(() => {
      const newRefund = {
        id: 'REF-' + Math.floor(1000 + Math.random() * 9000),
        paymentId: payment.id,
        bookingId: payment.bookingId,
        customerName: payment.customerName,
        originalAmount: payment.amount,
        refundAmount: parseFloat(refundAmount),
        reason: refundReason,
        status: 'PROCESSING',
        requestedDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
        processedDate: ''
      };
      
      MOCK_REFUNDS_PHASE5.push(newRefund);
      
      const updatedPayment = { ...payment, status: 'REFUND_PENDING' };
      setPayment(updatedPayment);

      // Mutate mock array so list view sees it
      const pIdx = MOCK_PAYMENTS_PHASE5.findIndex(p => p.id === payment.id);
      if (pIdx > -1) MOCK_PAYMENTS_PHASE5[pIdx].status = 'REFUND_PENDING';
      
      showAlert('Refund requested successfully', 'success');
      setProcessing(false);
      setRefundModalOpen(false);
    }, 1000);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PAID': return <Chip label="PAID" sx={{ bgcolor: 'var(--wl-DEF7EC, #DEF7EC)', color: 'var(--wd-03543F, #03543F)', fontWeight: 700 }} />;
      case 'PENDING': return <Chip label="PENDING" sx={{ bgcolor: 'var(--wl-FEF3C7, #FEF3C7)', color: 'var(--wd-92400E, #92400E)', fontWeight: 700 }} />;
      case 'REFUND_PENDING': return <Chip label="REFUND PENDING" sx={{ bgcolor: 'var(--wl-FFEDD5, #FFEDD5)', color: 'var(--wd-9A3412, #9A3412)', fontWeight: 700 }} />;
      case 'REFUNDED': return <Chip label="REFUNDED" sx={{ bgcolor: 'var(--wl-E1EFFE, #E1EFFE)', color: 'var(--wd-1E429F, #1E429F)', fontWeight: 700 }} />;
      default: return <Chip label={status} />;
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/super_admin/payments')} sx={{ mb: 2 }}>
        Back to Payments
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--wd-111827, #111827)', display: 'flex', alignItems: 'center', gap: 2 }}>
            {payment.id} {getStatusChip(payment.status)}
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--wd-4B5563, #4B5563)', mt: 1 }}>Transaction Date: {payment.date}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {booking && (
            <Button variant="outlined" onClick={() => navigate('/super_admin/bookings/' + booking.id)}>
              View Booking
            </Button>
          )}
          {payment.status === 'PAID' && (
            <Button variant="contained" color="error" onClick={() => setRefundModalOpen(true)}>
              Request Refund
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid var(--wb-E5E7EB, #E5E7EB)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLongIcon color="primary" /> Payment Summary
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Amount</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--wd-10B981, #10B981)', mt: 0.5 }}>${payment.amount.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Method</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{payment.method}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Transaction ID</Typography>
                <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', fontWeight: 600, mt: 0.5 }}>{payment.transactionId || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Agent</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>{payment.assignedAgent}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {refunds.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #FCA5A5', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'var(--wd-991B1B, #991B1B)' }}>Refund History</Typography>
              {refunds.map(r => (
                <Box key={r.id} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid var(--wb-FCA5A5, #FCA5A5)', mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.id}</Typography>
                    <Chip label={r.status} size="small" color={r.status === 'REFUNDED' ? 'success' : 'warning'} />
                  </Box>
                  <Typography variant="body2"><strong>Amount:</strong> ${r.refundAmount}</Typography>
                  <Typography variant="body2"><strong>Reason:</strong> {r.reason}</Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Requested: {r.requestedDate}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid var(--wb-E5E7EB, #E5E7EB)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountCircleIcon color="primary" /> Customer Info
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{payment.customerName}</Typography>
            {booking && (
              <>
                <Typography variant="body2" sx={{ color: 'var(--wd-4B5563, #4B5563)', mb: 1 }}>{booking.customerEmail}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--wd-4B5563, #4B5563)' }}>{booking.customerPhone}</Typography>
              </>
            )}
          </Paper>

          {booking && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid var(--wb-E5E7EB, #E5E7EB)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlightTakeoffIcon color="primary" /> Booking Ref
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#6B7280', textTransform: 'uppercase' }}>Booking ID</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{booking.id}</Typography>
              
              <Typography variant="subtitle2" sx={{ color: '#6B7280', textTransform: 'uppercase' }}>PNR</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace', mb: 2 }}>{booking.pnr}</Typography>
              
              <Typography variant="subtitle2" sx={{ color: '#6B7280', textTransform: 'uppercase' }}>Route & Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{booking.origin} ✈ {booking.destination}</Typography>
              <Typography variant="body2" sx={{ color: 'var(--wd-4B5563, #4B5563)' }}>{booking.travelDate}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Refund Modal */}
      <Modal open={refundModalOpen} onClose={() => !processing && setRefundModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 24 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'var(--wd-991B1B, #991B1B)' }}>Request Refund</Typography>
          
          <TextField 
            fullWidth label="Refund Amount ($)" type="number" 
            value={refundAmount} onChange={e => setRefundAmount(e.target.value)} 
            sx={{ mb: 3 }}
          />
          
          <TextField 
            fullWidth label="Reason for Refund" multiline rows={3} 
            value={refundReason} onChange={e => setRefundReason(e.target.value)} 
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setRefundModalOpen(false)} disabled={processing}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleRequestRefund} disabled={processing || !refundAmount || !refundReason}>
              {processing ? <CircularProgress size={24} /> : 'Submit Refund'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
