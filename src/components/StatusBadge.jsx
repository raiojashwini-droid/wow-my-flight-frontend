import React from 'react';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import BlockIcon from '@mui/icons-material/Block';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { themeText } from '../theme/themeColor';
export const StatusBadge = ({ status, size = 'small' }) => {
  const getBadgeConfig = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    switch (s) {
      // Leads & Clients
      case 'new lead':
      case 'new':
        return { label: statusStr, color: 'info', icon: <InfoIcon size={14} />, bg: 'var(--wl-E0F2FE, #E0F2FE)', text: '#0369A1' };
      case 'processing':
      case 'under consultation':
      case 'document preparation':
      case 'document review':
      case 'nie / local registration':
      case 'apostille & translations':
        return { label: statusStr, color: 'primary', icon: <AutorenewIcon size={14} />, bg: 'var(--wl-EEF2F6, #EEF2F6)', text: '#0F172A' };
      case 'documents pending':
      case 'waiting for payment':
        return { label: statusStr, color: 'warning', icon: <HourglassEmptyIcon size={14} />, bg: 'var(--wl-FEF3C7, #FEF3C7)', text: '#D97706' };
      case 'under process':
      case 'submitted - pending decision':
        return { label: statusStr, color: 'secondary', icon: <HourglassEmptyIcon size={14} />, bg: 'var(--wl-DBEAFE, #DBEAFE)', text: '#2563EB' };
      case 'completed':
      case 'visa approved':
      case 'paid':
      case 'approved':
        return { label: statusStr, color: 'success', icon: <CheckCircleIcon size={14} />, bg: 'var(--wl-DCFCE7, #DCFCE7)', text: '#15803D' };
      case 'cancelled':
      case 'no show':
      case 'failed':
      case 'rejected':
        return { label: statusStr, color: 'error', icon: <CancelIcon size={14} />, bg: 'var(--wl-FEE2E2, #FEE2E2)', text: '#B91C1C' };
      case 'cold lead':
        return { label: statusStr, color: 'default', icon: <BlockIcon size={14} />, bg: 'var(--wl-F1F5F9, #F1F5F9)', text: '#64748B' };
      case 'lost lead':
      case 'closed':
        return { label: statusStr, color: 'default', icon: <BlockIcon size={14} />, bg: 'var(--wl-E2E8F0, #E2E8F0)', text: '#475569' };
      default:
        return { label: statusStr, color: 'default', icon: null, bg: 'var(--wl-F3F4F6, #F3F4F6)', text: '#374151' };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size={size}
      sx={{
        fontWeight: 600,
        backgroundColor: config.bg,
        color: (theme) => themeText(theme, config.text),
        borderRadius: '6px',
        '& .MuiChip-icon': {
          color: 'inherit',
          fontSize: '14px',
        },
      }}
    />
  );
};

export default StatusBadge;
