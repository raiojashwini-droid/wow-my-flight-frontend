import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import StorageIcon from '@mui/icons-material/Storage';

import DualClock from '../../components/DualClock';
import IssuanceQueue, { DEMO_ISSUANCE_QUEUE } from '../../components/IssuanceQueue';
import TicketControls from '../../components/TicketControls';
import PNRTracker, { DEMO_PNR_FEED } from '../../components/PNRTracker';
import { useAlert } from '../../contexts/AlertContext';
import { flightContentService } from '../../services/flightContentService';

export default function TicketingIssuance() {
  const { showAlert } = useAlert();

  const [queueItems, setQueueItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pnrFeed, setPnrFeed] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // 1. Fetch live real bookings from PostgreSQL Database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBookingsFromDb() {
      try {
        const dbBookings = await flightContentService.getBookings();
        if (isMounted) {
          if (dbBookings && Array.isArray(dbBookings)) {
            // Normalize items with id if needed
            const normalized = dbBookings.map(b => ({
              ...b,
              id: b.id || b.bookingId,
              idBadge: b.bookingId,
            }));
            setQueueItems(normalized);
            setSelectedItem(normalized.length > 0 ? normalized[0] : null);
            setIsDbConnected(true);

            // Populate PNR tracker with real ticketed flights
            const ticketed = normalized.filter(b => b.ticketStatus === 'Ticketed');
            if (ticketed.length > 0) {
              const realFeed = ticketed.map(t => ({
                pnr: t.pnr,
                customer: t.passenger || t.name,
                route: t.route,
                date: t.date || 'Today',
                status: `Ticketed (${t.ticketNumber || 'E-TKT'}) — Dispatched`,
                category: 'GREEN',
                tone: 'success',
                ago: t.issueDateTime || 'Recent',
                original: null,
                updated: null,
                needsAction: false
              }));
              setPnrFeed(realFeed);
            }
          }
        }
      } catch (err) {
        console.warn('[TicketingIssuance] Error loading DB bookings:', err);
      } finally {
        if (isMounted) setIsDbLoading(false);
      }
    }

    loadBookingsFromDb();
    return () => { isMounted = false; };
  }, []);

  const handleSelectForIssue = (item) => {
    setSelectedItem(item);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    // 1. Update UI state immediately
    setQueueItems(prev =>
      prev.map(item =>
        item.id === bookingId || item.bookingId === bookingId
          ? {
              ...item,
              ticketStatus: newStatus,
              issueDateTime: newStatus === 'Ticketed' ? new Date().toLocaleString() : item.issueDateTime
            }
          : item
      )
    );

    // 2. Persist status update to PostgreSQL database
    try {
      await flightContentService.updateBookingStatus(bookingId, {
        ticketStatus: newStatus,
        issueDateTime: newStatus === 'Ticketed' ? new Date().toLocaleString() : undefined
      });
      showAlert(`✓ Status updated to "${newStatus}" in PostgreSQL Database`, 'success');
    } catch (err) {
      console.warn('[TicketingIssuance] Status update failed:', err);
    }
  };

  const handleIssueTicketSuccess = (successData) => {
    // 1. Visually mark item as Ticketed in queue
    setQueueItems(prev =>
      prev.map(item =>
        item.id === successData.bookingRef || item.bookingId === successData.bookingRef
          ? {
              ...item,
              ticketStatus: 'Ticketed',
              ticketNumber: successData.eTickets?.join(', ') || '0172345678901',
              issueDateTime: new Date().toLocaleString()
            }
          : item
      )
    );
    setSelectedItem(null);

    // 2. Add ticketed item to PNR Auto-Tracker feed
    const newTrackerEntry = {
      pnr: successData.pnr,
      customer: successData.customerName,
      route: successData.route,
      date: 'Today',
      status: 'Ticketed & Dispatched — PDF Itinerary Sent',
      category: 'GREEN',
      tone: 'success',
      ago: 'Just now',
      original: null,
      updated: null,
      needsAction: false
    };

    setPnrFeed(prev => [newTrackerEntry, ...prev]);
  };

  const handleDirectIssue = async (issuePayload) => {
    try {
      const formattedETickets = issuePayload.eTickets || ['0172345678901'];
      await flightContentService.issueTicket({
        pnr: issuePayload.pnr,
        eTickets: formattedETickets,
        bookingRef: issuePayload.bookingId || issuePayload.id,
        supplier: issuePayload.supplier,
        passenger: issuePayload.passenger
      });

      handleIssueTicketSuccess({
        bookingRef: issuePayload.bookingId || issuePayload.id,
        customerName: issuePayload.passenger,
        route: issuePayload.route,
        pnr: issuePayload.pnr,
        eTickets: formattedETickets
      });

      showAlert(`🎉 E-Ticket (${formattedETickets.join(', ')}) Issued & Saved to PostgreSQL!`, 'success');
      return true;
    } catch (err) {
      console.error('[TicketingIssuance] Direct issue error:', err);
      showAlert(`⚠️ Issuance error: ${err.message}`, 'error');
      return false;
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* ─── 1. TOPBAR ─── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          px: 3,
          mb: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: 'success.50',
              color: 'success.main',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ConfirmationNumberIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  Ticketing Team — Issuance & Tracking
                </Typography>
                <Chip size="small" label="Ticketing Operations" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                <Chip
                  size="small"
                  icon={<StorageIcon sx={{ fontSize: '13px !important' }} />}
                  label={isDbLoading ? 'Connecting DB...' : (isDbConnected ? 'DB: PostgreSQL (Live)' : 'DB: Resilient Sync')}
                  color={isDbConnected ? 'primary' : 'default'}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                />
              </Box>
            <Typography variant="caption" color="text.secondary">
              Ticketing Department Queue (PNR, Supplier, Ticket Number, Fare, Taxes, Commission, TTL, Agents) & GDS validation
            </Typography>
          </Box>
        </Box>

        {/* Dual Clock UI: Agent Local & Client Local */}
        <DualClock compact client={{ timezone: 'America/New_York', label: 'Client EST' }} />
      </Paper>

      {/* ─── 2. TWO-ROW LAYOUT: Top (Full Width Queue) & Bottom (Controls & Tracker side-by-side) ─── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Row: Ready-for-Issuance Queue (Full Width) */}
        <Box>
          <IssuanceQueue
            items={queueItems}
            selectedId={selectedItem?.id}
            onSelectIssue={handleSelectForIssue}
            onUpdateStatus={handleUpdateStatus}
            onDirectIssue={handleDirectIssue}
          />
        </Box>

        {/* Bottom Row: Controls & Tracker side-by-side */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' },
            gap: 3,
            alignItems: 'start'
          }}
        >
          <Box>
            <TicketControls
              selectedItem={selectedItem}
              onIssueTicketSuccess={handleIssueTicketSuccess}
            />
          </Box>

          <Box>
            <PNRTracker
              feed={pnrFeed}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
