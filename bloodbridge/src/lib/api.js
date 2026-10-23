import { io } from 'socket.io-client';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (options.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    throw new ApiError(`Cannot reach the BloodBridge API at ${API_BASE_URL}. Check that the backend is running and that its CORS client URL is configured.`, 0);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok || body?.success === false) {
    if (
      response.status === 401
      && !path.startsWith('/auth/')
      && !path.startsWith('/requests/public/')
      && typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new Event('bloodbridge:unauthorized'));
    }
    throw new ApiError(body?.message || `API request failed (${response.status})`, response.status);
  }
  return body;
}

const json = (method, value) => ({ method, body: JSON.stringify(value) });

export const api = {
  login: (email, password) => apiRequest('/auth/login', json('POST', { email, password })),
  logout: () => apiRequest('/auth/logout', json('POST', {})),
  me: () => apiRequest('/auth/me'),
  organizations: () => apiRequest('/organizations'),
  createOrganization: (value) => apiRequest('/organizations', json('POST', value)),
  updateOrganization: (id, value) => apiRequest(`/organizations/${encodeURIComponent(id)}`, json('PATCH', value)),
  organizationAdmins: (id) => apiRequest(`/organizations/${encodeURIComponent(id)}/admins`),
  createOrganizationAdmin: (id, value) => apiRequest(`/organizations/${encodeURIComponent(id)}/admins`, json('POST', value)),
  updateOrganizationAdmin: (organizationId, userId, value) => apiRequest(`/organizations/${encodeURIComponent(organizationId)}/admins/${encodeURIComponent(userId)}`, json('PATCH', value)),
  assignBank: (hospital, bloodBank) => apiRequest('/organizations/assignments', json('POST', { hospital, bloodBank })),
  rotateQr: (organizationId) => apiRequest(`/organizations/${encodeURIComponent(organizationId)}/qr/rotate`, json('POST', {})),
  publicQr: (token) => apiRequest(`/requests/public/qr/${encodeURIComponent(token)}`),
  submitPublicRequest: (formData) => apiRequest('/requests', { method: 'POST', body: formData }),
  publicTrack: (token) => apiRequest(`/requests/public/track/${encodeURIComponent(token)}`),
  requests: () => apiRequest('/requests'),
  requestStatus: (id, status) => apiRequest(`/requests/${encodeURIComponent(id)}/status`, json('PATCH', { status })),
  reserveRequest: (id) => apiRequest(`/requests/${encodeURIComponent(id)}/reserve`, json('POST', {})),
  forwardRequest: (id, reason) => apiRequest(`/requests/${encodeURIComponent(id)}/forward`, json('POST', { reason })),
  stats: () => apiRequest('/operations/stats'),
  hospitalOverview: () => apiRequest('/operations/hospital-overview'),
  inventory: () => apiRequest('/operations/inventory'),
  notifications: () => apiRequest('/operations/notifications'),
  markNotificationRead: (id) => apiRequest(`/operations/notifications/${encodeURIComponent(id)}/read`, json('PATCH', {})),
  alerts: () => apiRequest('/operations/alerts'),
  markAlert: (id, status) => apiRequest(`/iot/alerts/${encodeURIComponent(id)}`, json('PATCH', { status })),
  collectSample: (id) => apiRequest(`/operations/requests/${encodeURIComponent(id)}/sample`, json('POST', {})),
  compatibility: (id, outcome, notes = '') => apiRequest(`/operations/requests/${encodeURIComponent(id)}/compatibility`, json('POST', { outcome, notes })),
  createShipment: (id, vehicle) => apiRequest(`/operations/requests/${encodeURIComponent(id)}/shipment`, json('POST', vehicle ? { vehicle } : {})),
  updateShipment: (id, status) => apiRequest(`/operations/shipments/${encodeURIComponent(id)}/status`, json('PATCH', { status })),
  telemetry: (id) => apiRequest(`/operations/telemetry/${encodeURIComponent(id)}`),
  complaints: () => apiRequest('/complaints'),
  createComplaint: (value) => apiRequest('/complaints', json('POST', value)),
  updateComplaint: (id, value) => apiRequest(`/complaints/${encodeURIComponent(id)}`, json('PATCH', value)),
  createDevice: (value) => apiRequest('/iot/devices', json('POST', value)),
  revokeDevice: (id) => apiRequest(`/iot/devices/${encodeURIComponent(id)}/revoke`, json('PATCH', {})),
  submitReading: (value) => apiRequest('/iot/readings', json('POST', value)),
};

export function connectSocket() {
  const apiOrigin = API_BASE_URL.replace(/\/api$/, '');
  return io(apiOrigin, { withCredentials: true });
}
