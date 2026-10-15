/**
 * src/services/phase3Service.js
 * WowMyFlight CRM — Phase 3: Management Integration API Services
 * 
 * Each service communicates directly with its backend endpoint:
 * 1. Team Leader Dashboard -> /api/team-leader-dashboard
 * 2. QA -> /api/qa
 * 3. SLA Management -> /api/sla-management
 * 4. Automation -> /api/automation
 * 5. Finance -> /api/finance
 * 6. Management Reports -> /api/management-reports
 * 7. Permission Control -> /api/permission-control
 * 8. Audit Trail -> /api/audit-trail
 */

const PRIMARY_PROD_URL = 'https://wow-my-flight-backend-production.up.railway.app';

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001';
  }
  return PRIMARY_PROD_URL;
};

async function phase3Fetch(endpoint, options = {}) {
  const primary = getBackendUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${primary}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Primary URL failed, attempt failover to Railway production backend if not already tried
    if (primary !== PRIMARY_PROD_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${PRIMARY_PROD_URL}${endpoint}`, {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          ...options
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (prodErr) {
        console.warn(`[Phase 3 API] Failover also failed for ${endpoint}:`, prodErr.message);
      }
    } else {
      console.warn(`[Phase 3 API] Call failed for ${endpoint}:`, err.message);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Team Leader Dashboard API Service (/api/team-leader-dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const teamLeaderDashboardService = {
  getData: async () => {
    const res = await phase3Fetch('/api/team-leader-dashboard');
    return res && res.success ? res.data : null;
  },
  approveDiscount: async (id) => {
    return phase3Fetch(`/api/team-leader-dashboard/approvals/${id}/approve`, { method: 'POST' });
  },
  rejectDiscount: async (id) => {
    return phase3Fetch(`/api/team-leader-dashboard/approvals/${id}/reject`, { method: 'POST' });
  },
  counterDiscount: async (id, counterAmount) => {
    return phase3Fetch(`/api/team-leader-dashboard/approvals/${id}/counter`, {
      method: 'POST',
      body: JSON.stringify({ counterAmount })
    });
  },
  assignLead: async (leadId, agentName) => {
    return phase3Fetch('/api/team-leader-dashboard/leads/assign', {
      method: 'POST',
      body: JSON.stringify({ leadId, agentName })
    });
  },
  distributeLeads: async (source, strategy) => {
    return phase3Fetch('/api/team-leader-dashboard/leads/distribute', {
      method: 'POST',
      body: JSON.stringify({ source, strategy })
    });
  },
  scheduleCoaching: async (coachingData) => {
    return phase3Fetch('/api/team-leader-dashboard/coaching', {
      method: 'POST',
      body: JSON.stringify(coachingData)
    });
  },
  resolveEscalation: async (id, notes) => {
    return phase3Fetch(`/api/team-leader-dashboard/escalations/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  },
  sendPaymentReminder: async (id, channel) => {
    return phase3Fetch(`/api/team-leader-dashboard/payments/${id}/remind`, {
      method: 'POST',
      body: JSON.stringify({ channel })
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. QA API Service (/api/qa)
// ─────────────────────────────────────────────────────────────────────────────
export const qaService = {
  getDocuments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/qa?${query}` : '/api/qa';
    const res = await phase3Fetch(endpoint);
    return res && res.success ? res.data : null;
  },
  uploadDocument: async (docData) => {
    return phase3Fetch('/api/qa/documents', {
      method: 'POST',
      body: JSON.stringify(docData)
    });
  },
  updateDocumentStatus: async (id, status, notes) => {
    return phase3Fetch(`/api/qa/documents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  },
  getAudits: async () => {
    const res = await phase3Fetch('/api/qa/audits');
    return res && res.success ? res.data : null;
  },
  saveAudit: async (auditData) => {
    return phase3Fetch('/api/qa/audits', {
      method: 'POST',
      body: JSON.stringify(auditData)
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SLA Management API Service (/api/sla-management)
// ─────────────────────────────────────────────────────────────────────────────
export const slaManagementService = {
  getData: async () => {
    const res = await phase3Fetch('/api/sla-management');
    return res && res.success ? res.data : null;
  },
  updateRule: async (id, updates) => {
    return phase3Fetch(`/api/sla-management/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  resolveAlert: async (id) => {
    return phase3Fetch(`/api/sla-management/alerts/${id}/resolve`, {
      method: 'POST'
    });
  },
  addTracker: async (trackerData) => {
    return phase3Fetch('/api/sla-management/tracker', {
      method: 'POST',
      body: JSON.stringify(trackerData)
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Automation Engine API Service (/api/automation)
// ─────────────────────────────────────────────────────────────────────────────
export const automationService = {
  getData: async () => {
    const res = await phase3Fetch('/api/automation');
    return res && res.success ? res.data : null;
  },
  createWorkflow: async (workflowData) => {
    return phase3Fetch('/api/automation/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData)
    });
  },
  toggleWorkflow: async (id) => {
    return phase3Fetch(`/api/automation/workflows/${id}/toggle`, {
      method: 'PUT'
    });
  },
  retryHistory: async (id) => {
    return phase3Fetch(`/api/automation/history/${id}/retry`, {
      method: 'POST'
    });
  },
  getTelnyxStatus: async () => {
    const res = await phase3Fetch('/api/automation/telnyx-status');
    return res && res.success ? res.data : null;
  },
  updateSettings: async (settings) => {
    return phase3Fetch('/api/automation/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },
  dispatch: async (payload) => {
    return phase3Fetch('/api/automation/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Finance API Service (/api/finance)
// ─────────────────────────────────────────────────────────────────────────────
export const financeService = {
  getData: async () => {
    const res = await phase3Fetch('/api/finance');
    return res && res.success ? res.data : null;
  },
  getRefunds: async () => {
    const res = await phase3Fetch('/api/finance/refunds');
    return res && res.success ? res.data : null;
  },
  createRefund: async (refundData) => {
    return phase3Fetch('/api/finance/refunds', {
      method: 'POST',
      body: JSON.stringify(refundData)
    });
  },
  updateRefundStatus: async (id, status, user) => {
    return phase3Fetch(`/api/finance/refunds/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, user })
    });
  },
  getCommissionRates: async () => {
    const res = await phase3Fetch('/api/finance/commissions/rates');
    return res && res.success ? res.data : null;
  },
  updateCommissionRate: async (agentId, type, value) => {
    return phase3Fetch('/api/finance/commissions/rates', {
      method: 'PUT',
      body: JSON.stringify({ agentId, type, value })
    });
  },
  getCommissionsReport: async () => {
    const res = await phase3Fetch('/api/finance/commissions/report');
    return res && res.success ? res.data : null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Management Reports API Service (/api/management-reports)
// ─────────────────────────────────────────────────────────────────────────────
export const managementReportsService = {
  getReports: async (range = 'MONTHLY') => {
    const res = await phase3Fetch(`/api/management-reports?range=${range}`);
    return res && res.success ? res.data : null;
  },
  exportReport: async (format = 'csv', range = 'MONTHLY') => {
    return phase3Fetch('/api/management-reports/export', {
      method: 'POST',
      body: JSON.stringify({ format, range })
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Permission Control API Service (/api/permission-control)
// ─────────────────────────────────────────────────────────────────────────────
export const permissionControlService = {
  getRoles: async () => {
    const res = await phase3Fetch('/api/permission-control/roles');
    return res && res.success ? res.data : null;
  },
  createRole: async (roleData) => {
    return phase3Fetch('/api/permission-control/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  },
  updateRole: async (id, roleData) => {
    return phase3Fetch(`/api/permission-control/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    });
  },
  deleteRole: async (id) => {
    return phase3Fetch(`/api/permission-control/roles/${id}`, {
      method: 'DELETE'
    });
  },
  cloneRole: async (id, newRoleName) => {
    return phase3Fetch(`/api/permission-control/roles/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ newRoleName })
    });
  },
  getOverrides: async () => {
    const res = await phase3Fetch('/api/permission-control/overrides');
    return res && res.success ? res.data : null;
  },
  saveOverride: async (overrideData) => {
    return phase3Fetch('/api/permission-control/overrides', {
      method: 'POST',
      body: JSON.stringify(overrideData)
    });
  },
  getHierarchy: async () => {
    const res = await phase3Fetch('/api/permission-control/hierarchy');
    return res && res.success ? res.data : null;
  },
  getAuditLogs: async () => {
    const res = await phase3Fetch('/api/permission-control/audit-logs');
    return res && res.success ? res.data : null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Audit Trail API Service (/api/audit-trail)
// ─────────────────────────────────────────────────────────────────────────────
export const auditTrailService = {
  getAuditTrail: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/audit-trail?${query}` : '/api/audit-trail';
    const res = await phase3Fetch(endpoint);
    return res && res.success ? res.data : null;
  },
  logAudit: async (auditData) => {
    return phase3Fetch('/api/audit-trail', {
      method: 'POST',
      body: JSON.stringify(auditData)
    });
  }
};
