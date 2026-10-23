/* ==========================================================================
   Reference data — the shared vocabulary of the platform.
   Keeping statuses, labels and colours in one place means every portal
   speaks the same language.
   ========================================================================== */

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const COMPONENTS = [
  { id: 'prbc', label: 'Packed Red Blood Cells', short: 'Packed RBC', shelfLife: 42 },
  { id: 'whole', label: 'Whole Blood', short: 'Whole Blood', shelfLife: 35 },
  { id: 'platelets', label: 'Platelets', short: 'Platelets', shelfLife: 5 },
  { id: 'plasma', label: 'Fresh Frozen Plasma', short: 'Plasma', shelfLife: 365 },
];

export const componentLabel = (id) =>
  COMPONENTS.find((c) => c.id === id)?.short || id;

export const URGENCY = [
  {
    id: 'routine',
    label: 'Routine',
    desc: 'Needed within 24–48 hours',
    tone: 'neutral',
    hours: 24,
  },
  {
    id: 'urgent',
    label: 'Urgent',
    desc: 'Needed within a few hours',
    tone: 'warning',
    hours: 6,
  },
  {
    id: 'critical',
    label: 'Critical',
    desc: 'Immediate, life-threatening need',
    tone: 'danger',
    hours: 2,
  },
];

export const urgencyMeta = (id) => URGENCY.find((u) => u.id === id) || URGENCY[0];

/* --------------------------------------------------------------------------
   Request lifecycle.
   Each status maps to one of six patient-visible tracking steps so the
   tracking UI stays simple even though operations are fine-grained.
   -------------------------------------------------------------------------- */
export const REQUEST_STATUS = {
  submitted: {
    label: 'Submitted',
    tone: 'info',
    step: 0,
    description: 'Waiting for the hospital to review the request.',
  },
  hospital_review: {
    label: 'Hospital review',
    tone: 'info',
    step: 1,
    description: 'Hospital staff are confirming the clinical need.',
  },
  bank_review: {
    label: 'With blood bank',
    tone: 'info',
    step: 1,
    description: 'The assigned blood bank is checking available stock.',
  },
  forwarded: {
    label: 'Forwarded',
    tone: 'purple',
    step: 1,
    description: 'Forwarded to a partner blood bank for stock.',
  },
  testing: {
    label: 'Compatibility testing',
    tone: 'warning',
    step: 2,
    description: 'Cross-match and screening checks in progress.',
  },
  approval: {
    label: 'Clinical approval',
    tone: 'warning',
    step: 3,
    description: 'Awaiting authorised clinical sign-off before dispatch.',
  },
  ready: {
    label: 'Ready for dispatch',
    tone: 'red',
    step: 4,
    description: 'Approved. The blood bank can create a shipment.',
  },
  shipment_created: {
    label: 'Shipment created',
    tone: 'info',
    step: 4,
    description: 'A courier has been assigned for pickup.',
  },
  picked_up: {
    label: 'Picked up',
    tone: 'info',
    step: 4,
    description: 'Collected from the blood bank.',
  },
  in_transit: {
    label: 'In transit',
    tone: 'info',
    step: 4,
    description: 'On the way to the hospital.',
  },
  delivered: {
    label: 'Delivered',
    tone: 'success',
    step: 5,
    description: 'Received and signed for at the hospital.',
  },
  completed: {
    label: 'Completed',
    tone: 'success',
    step: 5,
    description: 'Transfusion recorded and request closed.',
  },
  rejected: {
    label: 'Declined',
    tone: 'neutral',
    step: 1,
    description: 'The blood bank could not fulfil this request.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    step: 0,
    description: 'Cancelled by the requester.',
  },
};

export const statusMeta = (id) => REQUEST_STATUS[id] || REQUEST_STATUS.submitted;

export const TRACKING_STEPS = [
  { id: 'submitted', label: 'Request submitted' },
  { id: 'review', label: 'Hospital & blood bank review' },
  { id: 'testing', label: 'Compatibility testing' },
  { id: 'approval', label: 'Clinical approval' },
  { id: 'dispatch', label: 'Dispatched & in transit' },
  { id: 'delivered', label: 'Delivered to hospital' },
];

export const OPEN_STATUSES = [
  'submitted',
  'hospital_review',
  'bank_review',
  'forwarded',
  'testing',
  'approval',
  'ready',
  'shipment_created',
  'picked_up',
  'in_transit',
];

export const isOpen = (status) => OPEN_STATUSES.includes(status);

export const SHIPMENT_STATUS = {
  created: { label: 'Awaiting pickup', tone: 'warning', progress: 15 },
  picked_up: { label: 'Picked up', tone: 'info', progress: 40 },
  in_transit: { label: 'In transit', tone: 'info', progress: 70 },
  delivered: { label: 'Delivered', tone: 'success', progress: 100 },
  delayed: { label: 'Delayed', tone: 'danger', progress: 55 },
  failed: { label: 'Failed', tone: 'danger', progress: 0 },
};

export const TEMP_RANGE = { min: 2, max: 6 };

export const tempState = (value) =>
  value < TEMP_RANGE.min || value > TEMP_RANGE.max ? 'alert' : 'ok';

/* Demo-only donor→recipient compatibility (educational simplification). */
const CAN_RECEIVE_FROM = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

export const compatibleDonors = (recipient) => CAN_RECEIVE_FROM[recipient] || [];

/* Discrepancy / alert categories used by Super Admin */
export const ALERT_TYPES = {
  temperature: { label: 'Temperature excursion', tone: 'danger', icon: 'thermometer' },
  quantity: { label: 'Quantity mismatch', tone: 'warning', icon: 'package' },
  identification: { label: 'Unit identification', tone: 'danger', icon: 'scan' },
  quality: { label: 'Quality check', tone: 'warning', icon: 'shield' },
  expiry: { label: 'Expiry risk', tone: 'warning', icon: 'clock' },
};

/* Utility helpers --------------------------------------------------------- */

export const formatDate = (iso, opts = {}) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })}, ${d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;
};

export const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export const daysUntil = (iso) => {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.floor(diff / 86400000);
};

export const currency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const initials = (name = '') =>
  name
    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
