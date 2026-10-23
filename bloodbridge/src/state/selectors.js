/* ==========================================================================
   Selectors — derive what each role is allowed to see.
   Keeping this out of components means permissions can later be enforced by
   a real API without rewriting pages.
   ========================================================================== */

import { BLOOD_GROUPS, COMPONENTS, isOpen, statusMeta } from '../data/reference.js';

export const getHospital = (state, id) => state.hospitals.find((h) => h.id === id) || null;
export const getBank = (state, id) => state.banks.find((b) => b.id === id) || null;
export const getOrganisation = (state, id) =>
  state.hospitals.find((h) => h.id === id) || state.banks.find((b) => b.id === id) || null;
export const orgName = (state, id) => getOrganisation(state, id)?.name || '—';
export const getUser = (state, id) => state.users.find((u) => u.id === id) || null;
export const getRequest = (state, id) => state.requests.find((r) => r.id === id) || null;
export const getShipment = (state, id) => state.shipments.find((s) => s.id === id) || null;

export const organisationForUser = (state, user) => {
  if (!user) return null;
  if (user.hospitalId) return getHospital(state, user.hospitalId);
  if (user.bankId) return getBank(state, user.bankId);
  return null;
};

/** Requests visible to a user, scoped by role and organisation. */
export function visibleRequests(state, user) {
  if (!user) return [];
  switch (user.role) {
    case 'patient':
      return state.requests.filter((r) => r.requestedBy === user.id);
    case 'hospital':
      return state.requests.filter((r) => r.hospitalId === user.hospitalId);
    case 'bank':
      return state.requests.filter(
        (r) => r.bankId === user.bankId || r.forwardedToBankId === user.bankId,
      );
    case 'operator': {
      const shipmentIds = state.shipments
        .filter((s) => s.operatorId === user.id)
        .map((s) => s.requestId);
      return state.requests.filter((r) => shipmentIds.includes(r.id));
    }
    case 'admin':
      return state.requests;
    default:
      return [];
  }
}

export function visibleShipments(state, user) {
  if (!user) return [];
  if (user.role === 'operator') return state.shipments.filter((s) => s.operatorId === user.id);
  if (user.role === 'hospital') return state.shipments.filter((s) => s.hospitalId === user.hospitalId);
  if (user.role === 'bank') return state.shipments.filter((s) => s.bankId === user.bankId);
  return state.shipments;
}

export function notificationsFor(state, user) {
  if (!user) return [];
  const orgId = user.hospitalId || user.bankId || null;
  return state.notifications.filter(
    (n) => n.audience === user.role && (n.orgId === orgId || n.orgId === null || n.orgId === undefined),
  );
}

export const unreadCount = (notifications) => notifications.filter((n) => !n.read).length;

/* -------------------------------------------------------------------------- */
/* Counters used by sidebars and dashboards                                   */
/* -------------------------------------------------------------------------- */

export const requestCounters = (requests) => ({
  total: requests.length,
  open: requests.filter((r) => isOpen(r.status)).length,
  awaitingReview: requests.filter((r) => ['submitted', 'hospital_review'].includes(r.status)).length,
  awaitingBank: requests.filter((r) => ['bank_review', 'forwarded'].includes(r.status)).length,
  testing: requests.filter((r) => r.status === 'testing').length,
  approval: requests.filter((r) => r.status === 'approval').length,
  inTransit: requests.filter((r) => ['shipment_created', 'picked_up', 'in_transit'].includes(r.status)).length,
  delivered: requests.filter((r) => ['delivered', 'completed'].includes(r.status)).length,
  critical: requests.filter((r) => r.urgency === 'critical' && isOpen(r.status)).length,
});

export const bankRequests = (state, bankId) =>
  state.requests.filter((r) => r.bankId === bankId || r.forwardedToBankId === bankId);

export const bankPendingCount = (state, bankId) =>
  bankRequests(state, bankId).filter((r) => ['bank_review', 'forwarded'].includes(r.status)).length;

export const bankAwaitingApprovalCount = (state, bankId) =>
  bankRequests(state, bankId).filter((r) => r.status === 'approval').length;

export const hospitalApprovalCount = (state, hospitalId) =>
  state.requests.filter((r) => r.hospitalId === hospitalId && r.status === 'approval').length;

export const hospitalReviewCount = (state, hospitalId) =>
  state.requests.filter(
    (r) => r.hospitalId === hospitalId && ['submitted', 'hospital_review'].includes(r.status),
  ).length;

export const operatorActiveCount = (state, userId) =>
  state.shipments.filter(
    (s) => s.operatorId === userId && ['created', 'picked_up', 'in_transit', 'delayed'].includes(s.status),
  ).length;

export const openAlertCount = (state) =>
  state.alerts.filter((a) => a.status !== 'resolved').length;

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export const bankInventory = (state, bankId) => state.inventory.filter((r) => r.bankId === bankId);

export function inventoryByGroup(rows) {
  return BLOOD_GROUPS.map((group) => {
    const groupRows = rows.filter((r) => r.bloodGroup === group);
    const units = groupRows.reduce((sum, r) => sum + r.units, 0);
    const threshold = groupRows.reduce((sum, r) => sum + (r.threshold || 4), 0);
    return {
      bloodGroup: group,
      units,
      threshold,
      components: COMPONENTS.map((c) => ({
        ...c,
        units: groupRows.find((r) => r.component === c.id)?.units ?? 0,
        expiry: groupRows.find((r) => r.component === c.id)?.earliestExpiry,
        rowId: groupRows.find((r) => r.component === c.id)?.id,
      })),
    };
  });
}

/* "Low" here means at or below twice the reorder threshold, so partner
   hospitals see a useful warning before a group actually runs out. */
export const lowStockRows = (rows) =>
  rows
    .filter((r) => r.units <= (r.threshold || 4) * 2)
    .sort((a, b) => a.units - b.units);

export const inventoryTotals = (rows) => ({
  units: rows.reduce((sum, r) => sum + r.units, 0),
  groupsOutOfStock: BLOOD_GROUPS.filter(
    (g) => rows.filter((r) => r.bloodGroup === g).reduce((s, r) => s + r.units, 0) === 0,
  ).length,
  lowGroups: inventoryByGroup(rows).filter((g) => g.units <= 3).length,
  expiringSoon: rows.filter((r) => {
    const days = Math.ceil((new Date(r.earliestExpiry).getTime() - Date.now()) / 86400000);
    return days <= 5 && r.units > 0;
  }).length,
});

export const hospitalStock = (state) => {
  const rows = state.inventory;
  return BLOOD_GROUPS.map((group) => ({
    bloodGroup: group,
    units: rows.filter((r) => r.bloodGroup === group).reduce((s, r) => s + r.units, 0),
  }));
};

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

export const trackingStepIndex = (status) => statusMeta(status).step;

export function trackingStepsFor(request) {
  const current = trackingStepIndex(request.status);
  const terminal = ['rejected', 'cancelled'].includes(request.status);
  return { current, terminal };
}

export const shipmentCounters = (shipments) => ({
  total: shipments.length,
  active: shipments.filter((s) => ['created', 'picked_up', 'in_transit', 'delayed'].includes(s.status)).length,
  delivered: shipments.filter((s) => s.status === 'delivered').length,
  alerts: shipments.reduce((sum, s) => sum + (s.tempAlerts || []).filter((a) => !a.acknowledged).length, 0),
});

export const patientRequestSummary = (state, userId) => {
  const mine = state.requests.filter((r) => r.requestedBy === userId);
  return {
    active: mine.filter((r) => isOpen(r.status)).length,
    completed: mine.filter((r) => ['delivered', 'completed'].includes(r.status)).length,
    unpaid: mine.filter(
      (r) => r.paymentStatus === 'pending' && ['delivered', 'completed', 'in_transit', 'picked_up'].includes(r.status),
    ).length,
  };
};
