export const ROLE_META = {
  patient: { label: 'Patient / requester', short: 'Requester', icon: 'user', home: '/patient' },
  hospital: { label: 'Hospital Admin', short: 'Hospital', icon: 'hospital', home: '/hospital' },
  bank: { label: 'Blood Bank Admin', short: 'Blood bank', icon: 'droplet', home: '/bank' },
  admin: { label: 'Super Admin', short: 'Super Admin', icon: 'shield', home: '/admin' },
};

const notifications = { to: 'notifications', label: 'Notifications', icon: 'bell' };
const requests = { to: 'requests', label: 'Requests', icon: 'clipboard' };
const inventory = { to: 'inventory', label: 'Inventory', icon: 'layers' };
const shipments = { to: 'shipments', label: 'Shipments', icon: 'truck' };
const alerts = { to: 'alerts', label: 'Temperature alerts', icon: 'alert-triangle' };
const telemetry = { to: 'telemetry', label: 'Telemetry', icon: 'thermometer' };

export const NAV = {
  patient: [
    { label: 'My account', items: [
      { to: '/patient', label: 'Overview', icon: 'home', end: true },
      { to: '/patient/new', label: 'New blood request', icon: 'plus' },
      { to: '/patient/requests', ...requests },
      { to: '/patient/notifications', ...notifications },
    ] },
  ],
  hospital: [
    { label: 'Operations', items: [
      { to: '/hospital', label: 'Overview', icon: 'home', end: true },
      { to: '/hospital/requests', ...requests },
      { to: '/hospital/inventory', ...inventory },
      { to: '/hospital/shipments', ...shipments },
      { to: '/hospital/alerts', ...alerts },
      { to: '/hospital/complaints', label: 'Complaints', icon: 'mail' },
      { to: '/hospital/notifications', ...notifications },
    ] },
  ],
  bank: [
    { label: 'Operations', items: [
      { to: '/bank', label: 'Overview', icon: 'home', end: true },
      { to: '/bank/requests', ...requests },
      { to: '/bank/inventory', ...inventory },
      { to: '/bank/shipments', ...shipments },
      { to: '/bank/alerts', ...alerts },
      { to: '/bank/telemetry', ...telemetry },
      { to: '/bank/devices', label: 'IoT devices', icon: 'settings' },
      { to: '/bank/notifications', ...notifications },
    ] },
  ],
  admin: [
    { label: 'Platform', items: [
      { to: '/admin', label: 'Overview', icon: 'home', end: true },
      { to: '/admin/organizations', label: 'Organizations', icon: 'building' },
      { to: '/admin/requests', ...requests },
      { to: '/admin/inventory', ...inventory },
      { to: '/admin/shipments', ...shipments },
      { to: '/admin/alerts', ...alerts },
      { to: '/admin/complaints', label: 'Complaints', icon: 'mail' },
      { to: '/admin/telemetry', ...telemetry },
      { to: '/admin/devices', label: 'IoT devices', icon: 'settings' },
      { to: '/admin/notifications', ...notifications },
    ] },
  ],
};

export const SIDEBAR_BADGES = [];

export const PUBLIC_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
];
