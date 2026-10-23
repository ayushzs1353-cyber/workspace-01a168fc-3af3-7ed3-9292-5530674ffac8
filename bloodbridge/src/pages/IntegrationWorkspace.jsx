import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Stat from '../components/ui/Stat.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import { Alert, Badge, Button, EmptyState, Field, Input, Select, Textarea } from '../components/ui/index.js';
import { api } from '../lib/api.js';
import { useApp } from '../state/store.jsx';

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Inventory reserved',
  forwarded: 'Forwarded',
  awaiting_sample: 'Awaiting sample',
  compatibility_confirmed: 'Compatibility confirmed',
  ready_for_dispatch: 'Ready for dispatch',
  dispatched: 'Dispatched',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  unfulfilled: 'Unfulfilled',
};

const statusTone = (status) => ({
  delivered: 'success',
  accepted: 'success',
  compatibility_confirmed: 'success',
  critical: 'danger',
  cancelled: 'neutral',
  unfulfilled: 'danger',
  in_transit: 'info',
  dispatched: 'info',
  awaiting_sample: 'warning',
  under_review: 'warning',
}[status] || 'neutral');

const shipmentTransitions = {
  ready: ['dispatched', 'cancelled'],
  dispatched: ['in_transit', 'exception'],
  in_transit: ['delivered', 'exception'],
  exception: ['in_transit', 'cancelled'],
};

const supportedSections = ['overview', 'requests', 'inventory', 'shipments', 'alerts', 'notifications', 'organizations', 'complaints', 'telemetry', 'devices'];

function ErrorMessage({ error, retry }) {
  if (!error) return null;
  return (
    <Alert tone="danger" title="Could not load backend data">
      <div>{error}</div>
      {retry && <Button className="mt-3" size="sm" variant="secondary" onClick={retry}>Retry</Button>}
    </Alert>
  );
}

function Unsupported({ title, message }) {
  return (
    <Card className="card--pad">
      <EmptyState icon="info" title={title} description={message} />
    </Card>
  );
}

export default function IntegrationWorkspace() {
  const { currentUser, pushToast, socket, refreshNotifications, refreshSession } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const pathSection = location.pathname.split('/').slice(2).filter(Boolean)[0] || 'overview';
  const section = pathSection === 'organisations' ? 'organizations' : pathSection;
  const requestIdentifier = section === 'requests' ? location.pathname.split('/').filter(Boolean)[2] : null;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});

  const title = {
    overview: 'Operational overview',
    requests: 'Blood requests',
    inventory: 'Blood inventory',
    shipments: 'Shipments',
    alerts: 'Temperature alerts',
    notifications: 'Notifications',
    organizations: 'Organizations',
    complaints: 'Hospital complaints',
    telemetry: 'Shipment telemetry',
    devices: 'IoT devices',
    new: 'New blood request',
  }[section] || 'BloodBridge workspace';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let result = {};
      if (section === 'overview') {
        const [stats, hospital] = await Promise.all([
          api.stats(),
          currentUser.apiRole === 'hospital_admin' ? api.hospitalOverview() : Promise.resolve(null),
        ]);
        result = { stats: stats.stats, hospital: hospital?.organization, assignedBank: hospital?.assignedBank };
      } else if (section === 'requests') result = await api.requests();
      else if (section === 'inventory') {
        if (currentUser.apiRole === 'hospital_admin') {
          const hospital = await api.hospitalOverview();
          result = { inventory: hospital.inventory || [], assignedBank: hospital.assignedBank || null };
        } else result = await api.inventory();
      }
      else if (section === 'alerts') result = await api.alerts();
      else if (section === 'notifications') result = await api.notifications();
      else if (section === 'organizations') result = await api.organizations();
      else if (section === 'complaints') result = await api.complaints();
      else if (section === 'shipments') result = { message: 'The API supports shipment creation and status updates, but does not expose a shipment listing endpoint.' };
      else if (section === 'telemetry') result = { message: 'Enter a shipment database ID to retrieve its telemetry. The API does not expose shipment discovery.' };
      else if (section === 'devices') result = { message: 'The API supports device registration and revocation, but does not expose a device listing endpoint or vehicle directory.' };
      setData(result);
    } catch (requestError) {
      setError(requestError.message);
      setData({});
    } finally {
      setLoading(false);
    }
  }, [section, currentUser.apiRole]);

  useEffect(() => {
    load();
    setForm({});
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const refreshTelemetry = () => { if (section === 'telemetry') load(); };
    const refreshAlerts = () => { if (section === 'alerts') load(); };
    const refreshRequests = () => { if (section === 'requests' || section === 'overview') load(); };
    socket.on('temperature:reading', refreshTelemetry);
    socket.on('temperature:alert', refreshAlerts);
    socket.on('request:created', refreshRequests);
    socket.on('request:forwarded', refreshRequests);
    socket.on('request:status', refreshRequests);
    return () => {
      socket.off('temperature:reading', refreshTelemetry);
      socket.off('temperature:alert', refreshAlerts);
      socket.off('request:created', refreshRequests);
      socket.off('request:forwarded', refreshRequests);
      socket.off('request:status', refreshRequests);
    };
  }, [socket, section, load]);

  const run = async (operation, successMessage) => {
    setBusy(true);
    try {
      const result = await operation();
      if (successMessage) pushToast('Completed', successMessage);
      await load();
      if (section === 'notifications') await refreshNotifications();
      return result;
    } catch (requestError) {
      if (requestError.status === 401) {
        await refreshSession();
        navigate('/login', { replace: true });
      }
      pushToast('Action failed', requestError.message, 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const requests = useMemo(() => data.requests || [], [data.requests]);
  const displayedRequests = requestIdentifier
    ? requests.filter((request) => request._id === requestIdentifier || request.reference === requestIdentifier)
    : requests;
  const organizations = useMemo(() => data.organizations || [], [data.organizations]);
  const canOperateRequests = ['super_admin', 'blood_bank_admin', 'hospital_admin'].includes(currentUser.apiRole);
  const requestAction = (request, nextStatus) => run(
    () => api.requestStatus(request._id, nextStatus),
    `Request ${request.reference} updated to ${STATUS_LABELS[nextStatus] || nextStatus}.`,
  );

  return (
    <div className="stack gap-5">
      <PageHeader
        title={title}
        description={`${currentUser.organization?.name || 'BloodBridge platform'} · Connected to the configured BloodBridge API`}
        actions={['overview', 'requests', 'new'].includes(section) && currentUser.role === 'patient' ? (
          <Link to="/request-blood" className="btn btn--primary"><Icon name="plus" /> New blood request</Link>
        ) : null}
      />
      <ErrorMessage error={error} retry={load} />
      {loading && <div className="state-block" role="status">Loading live data…</div>}

      {!loading && !error && section === 'overview' && (
        <>
          <div className="stat-grid">
            <Stat label="Active requests" value={data.stats?.activeRequests ?? '—'} icon="clipboard" />
            <Stat label="Open temperature alerts" value={data.stats?.alerts ?? '—'} icon="alert-triangle" tone="warning" />
            <Stat label="Organizations" value={data.stats?.organizations ?? '—'} icon="building" />
            <Stat label="Available units" value={data.stats?.availableUnits ?? '—'} icon="droplet" tone="success" />
          </div>
          {currentUser.apiRole === 'hospital_admin' && (
            <Card className="card--pad">
              <h2 className="text-lg text-strong">Hospital connection</h2>
              <p className="text-sm text-muted mt-2">
                Assigned blood bank: <strong>{data.assignedBank?.name || 'No active assignment'}</strong>
              </p>
            </Card>
          )}
          <Alert tone="info" title="Live backend data">
            Counts above come from <code>/api/operations/stats</code>. Data is not replaced with sample values when the backend is unavailable.
          </Alert>
        </>
      )}

      {!loading && !error && section === 'requests' && (
        <Card flush>
          <CardHeader title={requestIdentifier ? `Request ${requestIdentifier}` : 'Requests returned by the API'} subtitle={`${requests.length} record(s), scoped by the authenticated backend role`} />
          {!displayedRequests.length ? <EmptyState icon="clipboard" title={requestIdentifier ? 'Request not found in your API scope' : 'No requests'} description={requestIdentifier ? 'This request may not exist or may be outside the authenticated user’s organization scope.' : 'Requests created for this account will appear here.'} /> : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Reference / patient</th><th>Requirement</th><th>Hospital / bank</th><th>Status</th><th>Workflow actions</th></tr></thead>
                <tbody>{displayedRequests.map((request) => {
                  const id = request._id;
                  const canReserve = ['super_admin', 'blood_bank_admin'].includes(currentUser.apiRole) && ['submitted', 'under_review', 'forwarded'].includes(request.status);
                  const canForward = canReserve;
                  const canCollect = canOperateRequests && request.status === 'accepted';
                  const canTest = ['super_admin', 'blood_bank_admin'].includes(currentUser.apiRole) && request.status === 'awaiting_sample';
                  const canCreateShipment = ['super_admin', 'blood_bank_admin'].includes(currentUser.apiRole) && request.status === 'compatibility_confirmed';
                  return (
                    <tr key={id}>
                      <td><strong>{request.reference}</strong><span className="table__meta">{request.patientName}</span></td>
                      <td>{request.bloodGroup} · {request.component}<span className="table__meta">{request.units} unit(s) · {request.urgency}</span></td>
                      <td>{request.hospital?.name || '—'}<span className="table__meta">{request.assignedBank?.name || 'No bank assigned'}</span></td>
                      <td><Badge tone={statusTone(request.status)}>{STATUS_LABELS[request.status] || request.status}</Badge></td>
                      <td><div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                        {currentUser.apiRole === 'hospital_admin' && request.status === 'submitted' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => requestAction(request, 'under_review')}>Start review</Button>}
                        {canReserve && <Button size="sm" disabled={busy} onClick={() => run(() => api.reserveRequest(id), 'Inventory reserved for this request.')}>Reserve inventory</Button>}
                        {canForward && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.forwardRequest(id, 'Insufficient compatible stock'), 'Request forwarding completed.')}>Forward</Button>}
                        {canCollect && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.collectSample(id), 'Sample collection recorded.')}>Record sample</Button>}
                        {canTest && <>
                          <Button size="sm" disabled={busy} onClick={() => run(() => api.compatibility(id, 'confirmed'), 'Compatibility confirmed. Shipment authorization remains a separate action.')}>Confirm compatibility</Button>
                          <Button size="sm" variant="danger-outline" disabled={busy} onClick={() => run(() => api.compatibility(id, 'failed'), 'Compatibility failure recorded.')}>Mark incompatible</Button>
                        </>}
                        {canCreateShipment && <Button size="sm" disabled={busy} onClick={async () => {
                          const result = await run(() => api.createShipment(id, form.vehicleId), 'Shipment created.');
                          if (result?.shipment?._id) {
                            setForm((previous) => ({ ...previous, shipmentId: result.shipment._id }));
                            setData((previous) => ({ ...previous, createdShipment: result.shipment }));
                          }
                        }}>Create shipment</Button>}
                        {currentUser.apiRole === 'hospital_admin' && ['submitted', 'under_review', 'accepted', 'awaiting_sample'].includes(request.status) && <Button size="sm" variant="danger-outline" disabled={busy} onClick={() => requestAction(request, 'cancelled')}>Cancel</Button>}
                      </div></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
          {['super_admin', 'blood_bank_admin'].includes(currentUser.apiRole) && (
            <div className="card__body">
              <Field label="Vehicle database ID (optional for shipment)" htmlFor="shipment-vehicle">
                <Input id="shipment-vehicle" value={form.vehicleId || ''} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })} placeholder="Vehicle ObjectId" />
              </Field>
            </div>
          )}
          {data.createdShipment && <div className="card__body">
            <Alert tone="success" title="Shipment created by the backend">
              Reference: <strong>{data.createdShipment.reference}</strong> · ID: <code>{data.createdShipment._id}</code>. Copy the database ID to update status or load telemetry.
            </Alert>
          </div>}
        </Card>
      )}

      {!loading && !error && section === 'inventory' && (
        <Card flush>
          <CardHeader title="Current inventory" subtitle="Read-only: no inventory create/update endpoint is present in this backend." />
          {!(data.inventory || []).length ? <EmptyState icon="layers" title="No inventory records" description="No inventory was returned for the authenticated organization." /> : (
            <div className="table-wrap"><table className="data-table">
              <thead><tr><th>Blood bank</th><th>Blood group</th><th>Component</th><th>Available</th><th>Reserved</th><th>Expiry</th></tr></thead>
              <tbody>{data.inventory.map((row) => <tr key={row._id}>
                <td>{data.assignedBank?.name || row.bloodBank?.name || row.bloodBank || '—'}</td><td>{row.bloodGroup}</td><td>{row.component}</td>
                <td>{row.availableUnits}</td><td>{row.reservedUnits}</td><td>{row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </Card>
      )}

      {!loading && !error && section === 'shipments' && (
        <div className="stack gap-4">
          <Alert tone="warning" title="Shipment listing is not available">
            The backend has shipment creation, status transitions, and telemetry lookup by shipment database ID, but no shipment list endpoint. Use a known ID from the creation response or backend records; the frontend does not fabricate a list.
          </Alert>
          <Card className="card--pad">
            <CardHeader title="Update a known shipment" subtitle="The backend validates permitted transitions and organization scope." />
            <form className="stack gap-3" onSubmit={(event) => {
              event.preventDefault();
              run(() => api.updateShipment(form.shipmentId, form.shipmentStatus), 'Shipment status updated.');
            }}>
              <Field label="Shipment database ID" htmlFor="shipment-id"><Input id="shipment-id" required value={form.shipmentId || ''} onChange={(event) => setForm({ ...form, shipmentId: event.target.value })} /></Field>
              <Field label="Current status (known value)" htmlFor="shipment-current-status">
                <Select id="shipment-current-status" required value={form.currentShipmentStatus || ''} onChange={(event) => setForm({ ...form, currentShipmentStatus: event.target.value, shipmentStatus: '' })}>
                  <option value="">Choose the current status</option>{['ready', 'dispatched', 'in_transit', 'exception'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                </Select>
              </Field>
              <Field label="Next status" htmlFor="shipment-status">
                <Select id="shipment-status" required disabled={!form.currentShipmentStatus} value={form.shipmentStatus || ''} onChange={(event) => setForm({ ...form, shipmentStatus: event.target.value })}>
                  <option value="">Choose a permitted next status</option>{(shipmentTransitions[form.currentShipmentStatus] || []).map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                </Select>
              </Field>
              <Button type="submit" disabled={busy}>Update shipment</Button>
            </form>
          </Card>
        </div>
      )}

      {!loading && !error && section === 'alerts' && (
        <Card flush>
          <CardHeader title="Temperature alerts" subtitle="Alert states: open, acknowledged, resolved." />
          {!(data.alerts || []).length ? <EmptyState icon="check-circle" title="No alerts returned" description="There are no temperature alerts visible to this account." /> : (
            <div className="table-wrap"><table className="data-table">
              <thead><tr><th>Shipment</th><th>Temperature</th><th>Allowed range</th><th>Observed</th><th>Status / action</th></tr></thead>
              <tbody>{data.alerts.map((alert) => <tr key={alert._id}>
                <td>{alert.shipmentId || '—'}</td><td>{alert.temperature ?? 'No reading'}</td>
                <td>{alert.lowerLimit}°–{alert.upperLimit}°C</td><td>{alert.observedAt ? new Date(alert.observedAt).toLocaleString() : '—'}</td>
                <td><Badge tone={statusTone(alert.status)}>{alert.status}</Badge>{alert.status !== 'resolved' && <div className="row gap-2 mt-2">
                  {alert.status === 'open' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.markAlert(alert._id, 'acknowledged'), 'Alert acknowledged.')}>Acknowledge</Button>}
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.markAlert(alert._id, 'resolved'), 'Alert resolved.')}>Resolve</Button>
                </div>}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </Card>
      )}

      {!loading && !error && section === 'notifications' && (
        <Card flush>
          <CardHeader title="Your notifications" subtitle={`Unread: ${data.unread ?? 0}`} />
          {!(data.notifications || []).length ? <EmptyState icon="bell" title="No notifications" description="Notifications created for your account will appear here." /> : (
            <div className="stack gap-2 card__body">{data.notifications.map((item) => <div className="alert alert--info" key={item._id}>
              <div className="grow"><div className="alert__title">{item.title}</div><div className="alert__body">{item.message}</div><span className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</span></div>
              {!item.readAt && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.markNotificationRead(item._id), 'Notification marked as read.')}>Mark read</Button>}
            </div>)}</div>
          )}
        </Card>
      )}

      {!loading && !error && section === 'organizations' && currentUser.apiRole === 'super_admin' && (
        <div className="stack gap-4">
          <Card className="card--pad">
            <CardHeader title="Add organization" subtitle="Backend-supported types are hospital and bloodBank." />
            <form className="form-grid" onSubmit={(event) => {
              event.preventDefault();
              run(() => api.createOrganization({ name: form.name, type: form.organizationType, address: form.address, latitude: Number(form.latitude || 0), longitude: Number(form.longitude || 0) }), 'Organization created.').then((result) => {
                if (result?.qr) setData((previous) => ({ ...previous, newQr: result.qr }));
              });
            }}>
              <Field label="Name" htmlFor="organization-name"><Input id="organization-name" required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
              <Field label="Type" htmlFor="organization-type"><Select id="organization-type" value={form.organizationType || 'hospital'} onChange={(event) => setForm({ ...form, organizationType: event.target.value })}><option value="hospital">Hospital</option><option value="bloodBank">Blood bank</option></Select></Field>
              <Field label="Address" htmlFor="organization-address"><Input id="organization-address" value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
              <div className="row gap-2"><Field label="Latitude" htmlFor="organization-latitude"><Input id="organization-latitude" type="number" step="any" value={form.latitude || ''} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></Field><Field label="Longitude" htmlFor="organization-longitude"><Input id="organization-longitude" type="number" step="any" value={form.longitude || ''} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></Field></div>
              <div><Button type="submit" disabled={busy}>Create organization</Button></div>
            </form>
          </Card>
          <Card flush><CardHeader title="Organizations" subtitle={`${organizations.length} organization(s) from the API`} />
            {organizations.length === 0 ? <EmptyState icon="building" title="No organizations" /> : <div className="table-wrap"><table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{organizations.map((organization) => <tr key={organization._id}>
                <td>{organization.name}</td><td>{organization.type}</td><td>{organization.address || '—'}</td><td><Badge tone={statusTone(organization.status)}>{organization.status}</Badge></td>
                <td><div className="row gap-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.updateOrganization(organization._id, { name: organization.name, address: organization.address, status: organization.status === 'active' ? 'suspended' : 'active' }), 'Organization status updated.')}>{organization.status === 'active' ? 'Suspend' : 'Activate'}</Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => setForm((previous) => ({
                    ...previous,
                    [`editName-${organization._id}`]: organization.name,
                    [`editAddress-${organization._id}`]: organization.address || '',
                    editingOrganization: organization._id,
                  }))}>Edit details</Button>
                  {organization.type === 'hospital' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(async () => { const result = await api.rotateQr(organization._id); setData((previous) => ({ ...previous, newQr: result })); return result; }, 'QR code rotated. Save the one-time token securely.')}>Rotate QR</Button>}
                {form.editingOrganization === organization._id && (
                  <form className="row gap-2" onSubmit={(event) => {
                    event.preventDefault();
                    run(() => api.updateOrganization(organization._id, {
                      name: form[`editName-${organization._id}`],
                      address: form[`editAddress-${organization._id}`],
                      status: organization.status,
                    }), 'Organization details updated.');
                  }}>
                    <Field label="Name" htmlFor={`edit-org-name-${organization._id}`}><Input id={`edit-org-name-${organization._id}`} required value={form[`editName-${organization._id}`] || ''} onChange={(event) => setForm({ ...form, [`editName-${organization._id}`]: event.target.value })} /></Field>
                    <Field label="Address" htmlFor={`edit-org-address-${organization._id}`}><Input id={`edit-org-address-${organization._id}`} value={form[`editAddress-${organization._id}`] || ''} onChange={(event) => setForm({ ...form, [`editAddress-${organization._id}`]: event.target.value })} /></Field>
                    <Button type="submit" size="sm" disabled={busy}>Save details</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setForm((previous) => ({ ...previous, editingOrganization: '' }))}>Cancel</Button>
                  </form>
                )}
                </div></td>
              </tr>)}</tbody>
            </table></div>}
            {data.newQr && <div className="card__body"><Alert tone="success" title="New hospital QR credentials (shown once)">
              <p>Token: <code>{data.newQr.token}</code></p>
              {data.newQr.dataUrl && <img src={data.newQr.dataUrl} alt="New hospital request QR code" style={{ width: 180, height: 180, marginTop: 12 }} />}
            </Alert></div>}
          </Card>
          <Card className="card--pad"><CardHeader title="Assign a blood bank" subtitle="Uses the backend's organization IDs." />
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); run(() => api.assignBank(form.hospitalId, form.bloodBankId), 'Blood bank assignment saved.'); }}>
              <Field label="Hospital" htmlFor="assignment-hospital"><Select id="assignment-hospital" required value={form.hospitalId || ''} onChange={(event) => setForm({ ...form, hospitalId: event.target.value })}><option value="">Select a hospital</option>{organizations.filter((organization) => organization.type === 'hospital').map((organization) => <option key={organization._id} value={organization._id}>{organization.name}</option>)}</Select></Field>
              <Field label="Blood bank" htmlFor="assignment-bank"><Select id="assignment-bank" required value={form.bloodBankId || ''} onChange={(event) => setForm({ ...form, bloodBankId: event.target.value })}><option value="">Select a blood bank</option>{organizations.filter((organization) => organization.type === 'bloodBank' && organization.status === 'active').map((organization) => <option key={organization._id} value={organization._id}>{organization.name}</option>)}</Select></Field>
              <div><Button type="submit" disabled={busy}>Save assignment</Button></div>
            </form>
          </Card>
          <Card className="card--pad"><CardHeader title="Create organization administrator" subtitle="The API creates hospital_admin or blood_bank_admin based on organization type." />
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); run(() => api.createOrganizationAdmin(form.adminOrganizationId, { name: form.adminName, email: form.adminEmail, password: form.adminPassword }), 'Administrator created.'); }}>
              <Field label="Organization" htmlFor="admin-organization"><Select id="admin-organization" required value={form.adminOrganizationId || ''} onChange={(event) => setForm({ ...form, adminOrganizationId: event.target.value })}><option value="">Select an organization</option>{organizations.map((organization) => <option key={organization._id} value={organization._id}>{organization.name} ({organization.type})</option>)}</Select></Field>
              <Field label="Name" htmlFor="admin-name"><Input id="admin-name" required value={form.adminName || ''} onChange={(event) => setForm({ ...form, adminName: event.target.value })} /></Field>
              <Field label="Email" htmlFor="admin-email"><Input id="admin-email" type="email" required value={form.adminEmail || ''} onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} /></Field>
              <Field label="Initial password" htmlFor="admin-password"><Input id="admin-password" type="password" required autoComplete="new-password" value={form.adminPassword || ''} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} /></Field>
              <div><Button type="submit" disabled={busy}>Create administrator</Button></div>
            </form>
          </Card>
          <Card className="card--pad"><CardHeader title="Manage organization administrators" subtitle="The backend supports listing and activating/deactivating organization administrators." />
            <div className="row gap-2">
              <Field label="Organization" htmlFor="manage-admin-organization"><Select id="manage-admin-organization" value={form.manageOrganizationId || ''} onChange={(event) => setForm({ ...form, manageOrganizationId: event.target.value })}><option value="">Select an organization</option>{organizations.map((organization) => <option key={organization._id} value={organization._id}>{organization.name}</option>)}</Select></Field>
              <Button type="button" variant="secondary" disabled={busy || !form.manageOrganizationId} onClick={async () => {
                const result = await run(() => api.organizationAdmins(form.manageOrganizationId));
                if (result) setData((previous) => ({ ...previous, organizationAdmins: result.users || [] }));
              }}>Load administrators</Button>
            </div>
            {(data.organizationAdmins || []).map((administrator) => <div className="row-between gap-3 mt-3" key={administrator._id}>
              <div><strong>{administrator.name}</strong><span className="table__meta">{administrator.email} · {administrator.role} · {administrator.active ? 'active' : 'inactive'}</span></div>
              <Button size="sm" variant="secondary" disabled={busy} onClick={async () => {
                const result = await run(() => api.updateOrganizationAdmin(form.manageOrganizationId, administrator._id, { active: !administrator.active, permissions: administrator.permissions || [] }));
                if (result) {
                  const refreshed = await api.organizationAdmins(form.manageOrganizationId);
                  setData((previous) => ({ ...previous, organizationAdmins: refreshed.users || [] }));
                }
              }}>{administrator.active ? 'Deactivate' : 'Activate'}</Button>
            </div>)}
          </Card>
        </div>
      )}

      {!loading && !error && section === 'complaints' && (
        <div className="stack gap-4">
          {currentUser.apiRole === 'hospital_admin' && <Card className="card--pad">
            <CardHeader title="Submit a complaint" subtitle="This creates a real complaint record and notifies active super administrators." />
            <form className="stack gap-3" onSubmit={(event) => { event.preventDefault(); run(() => api.createComplaint({ subject: form.subject, description: form.description, ...(form.requestId ? { requestId: form.requestId } : {}) }), 'Complaint submitted.'); }}>
              <Field label="Subject" htmlFor="complaint-subject"><Input id="complaint-subject" required maxLength={160} value={form.subject || ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field>
              <Field label="Request ID (optional)" htmlFor="complaint-request"><Input id="complaint-request" value={form.requestId || ''} onChange={(event) => setForm({ ...form, requestId: event.target.value })} /></Field>
              <Field label="Description" htmlFor="complaint-description"><Textarea id="complaint-description" required maxLength={2000} value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
              <Button type="submit" disabled={busy}>Submit complaint</Button>
            </form>
          </Card>}
          <Card flush><CardHeader title="Complaints" subtitle="Status values: open, in_review, resolved, closed." />
            {!(data.complaints || []).length ? <EmptyState icon="mail" title="No complaints" description="The API returned no complaints for your role." /> : <div className="stack gap-3 card__body">{data.complaints.map((complaint) => <div className="card card--pad" key={complaint._id}>
              <div className="row-between gap-3"><strong>{complaint.subject}</strong><Badge tone={statusTone(complaint.status)}>{complaint.status}</Badge></div>
              <p className="text-sm mt-2">{complaint.description}</p>
              <p className="text-xs text-muted mt-2">Request: {complaint.request?.reference || '—'} · {new Date(complaint.createdAt).toLocaleString()}</p>
              {currentUser.apiRole === 'super_admin' && <div className="row gap-2 mt-3">
                <Select aria-label="Complaint status" value={form[`complaint-${complaint._id}`] || complaint.status} onChange={(event) => setForm({ ...form, [`complaint-${complaint._id}`]: event.target.value })}>{['open', 'in_review', 'resolved', 'closed'].map((status) => <option key={status} value={status}>{status}</option>)}</Select>
                <Button size="sm" disabled={busy} onClick={() => run(() => api.updateComplaint(complaint._id, { status: form[`complaint-${complaint._id}`] || complaint.status, resolution: form[`resolution-${complaint._id}`] || complaint.resolution || '' }), 'Complaint updated.')}>Save status</Button>
                <Input aria-label="Resolution" placeholder="Resolution (optional)" value={form[`resolution-${complaint._id}`] || ''} onChange={(event) => setForm({ ...form, [`resolution-${complaint._id}`]: event.target.value })} />
              </div>}
            </div>)}</div>}
          </Card>
        </div>
      )}

      {!loading && !error && section === 'telemetry' && (
        <div className="stack gap-4">
          <Alert tone="info" title="Realtime event names verified in backend">
            This page listens for <code>temperature:reading</code> and <code>temperature:alert</code>. Socket.IO authentication uses the backend's HTTP-only <code>bb_access</code> cookie.
          </Alert>
          <Card className="card--pad"><form className="row gap-3" onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              const result = await api.telemetry(form.telemetryShipmentId);
              setData((previous) => ({ ...previous, ...result }));
              setError('');
            } catch (requestError) { setError(requestError.message); }
            finally { setBusy(false); }
          }}>
            <Field label="Shipment database ID" htmlFor="telemetry-shipment"><Input id="telemetry-shipment" required value={form.telemetryShipmentId || ''} onChange={(event) => setForm({ ...form, telemetryShipmentId: event.target.value })} /></Field>
            <Button type="submit" disabled={busy}>Load telemetry</Button>
          </form></Card>
          {data.readings && <Card flush><CardHeader title="Temperature readings" subtitle={`${data.readings.length} reading(s)`} />
            {!data.readings.length ? <EmptyState icon="thermometer" title="No readings" /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Shipment reference</th><th>Temperature</th><th>Sensor</th><th>Device time</th><th>Received</th></tr></thead><tbody>{data.readings.map((reading) => <tr key={reading._id}><td>{reading.shipmentId}</td><td>{reading.temperature}°C</td><td>{reading.sensorId || '—'}</td><td>{reading.deviceTimestamp ? new Date(reading.deviceTimestamp).toLocaleString() : '—'}</td><td>{reading.receivedAt ? new Date(reading.receivedAt).toLocaleString() : '—'}</td></tr>)}</tbody></table></div>}
          </Card>}
        </div>
      )}

      {!loading && !error && section === 'devices' && ['super_admin', 'blood_bank_admin'].includes(currentUser.apiRole) && (
        <div className="stack gap-4">
          <Alert tone="warning" title="Device and vehicle discovery is not supported">
            Device creation needs a vehicle database ID. The API has no endpoint to list vehicles or devices. The ingestion form below submits a real device-authenticated reading; it is a diagnostic tool, not a sensor simulator. Do not enter production device secrets in a browser.
          </Alert>
          <Card className="card--pad"><CardHeader title="Register an IoT device" subtitle="Creates a device secret that must be copied at creation time." />
            <form className="form-grid" onSubmit={async (event) => {
              event.preventDefault();
              const result = await run(() => api.createDevice({ deviceId: form.deviceCode, vehicle: form.vehicleObjectId }), 'Device registered.');
              if (result?.secret) setData((previous) => ({ ...previous, createdDevice: result }));
            }}>
              <Field label="Device identifier" htmlFor="device-code"><Input id="device-code" required value={form.deviceCode || ''} onChange={(event) => setForm({ ...form, deviceCode: event.target.value })} /></Field>
              <Field label="Vehicle database ID" htmlFor="vehicle-id"><Input id="vehicle-id" required value={form.vehicleObjectId || ''} onChange={(event) => setForm({ ...form, vehicleObjectId: event.target.value })} /></Field>
              <div><Button type="submit" disabled={busy}>Register device</Button></div>
            </form>
            {data.createdDevice && <div className="mt-4"><Alert tone="danger" title="Copy the device secret now">
              <code>{data.createdDevice.secret}</code>
            </Alert></div>}
          </Card>
          <Card className="card--pad"><CardHeader title="Submit a device reading" subtitle="POST /api/iot/readings validates the device secret, shipment assignment, timestamp and monotonic sequence." />
            <form className="form-grid" onSubmit={async (event) => {
              event.preventDefault();
              const timestamp = new Date(form.deviceTimestamp);
              if (Number.isNaN(timestamp.getTime())) {
                pushToast('Invalid timestamp', 'Enter a valid device timestamp.', 'error');
                return;
              }
              const result = await run(() => api.submitReading({
                deviceId: form.readingDeviceId,
                deviceSecret: form.readingDeviceSecret,
                shipmentId: form.readingShipmentId,
                sensorId: form.sensorId,
                temperature: Number(form.temperature),
                deviceTimestamp: timestamp.toISOString(),
                sequence: Number(form.sequence),
              }), 'Telemetry reading accepted by the backend.');
              setForm((previous) => ({ ...previous, readingDeviceSecret: '' }));
              if (result) setData((previous) => ({ ...previous, readingResult: result }));
            }}>
              <Field label="Device ID" htmlFor="reading-device-id"><Input id="reading-device-id" required value={form.readingDeviceId || ''} onChange={(event) => setForm({ ...form, readingDeviceId: event.target.value })} /></Field>
              <Field label="Device secret" htmlFor="reading-device-secret" hint="Used only for this request; the form clears it after submission."><Input id="reading-device-secret" type="password" required autoComplete="off" value={form.readingDeviceSecret || ''} onChange={(event) => setForm({ ...form, readingDeviceSecret: event.target.value })} /></Field>
              <Field label="Shipment database ID" htmlFor="reading-shipment-id"><Input id="reading-shipment-id" required value={form.readingShipmentId || ''} onChange={(event) => setForm({ ...form, readingShipmentId: event.target.value })} /></Field>
              <Field label="Sensor ID" htmlFor="reading-sensor-id"><Input id="reading-sensor-id" required value={form.sensorId || ''} onChange={(event) => setForm({ ...form, sensorId: event.target.value })} /></Field>
              <Field label="Temperature (°C)" htmlFor="reading-temperature"><Input id="reading-temperature" type="number" step="any" required value={form.temperature || ''} onChange={(event) => setForm({ ...form, temperature: event.target.value })} /></Field>
              <Field label="Device timestamp" htmlFor="reading-timestamp"><Input id="reading-timestamp" type="datetime-local" required value={form.deviceTimestamp || ''} onChange={(event) => setForm({ ...form, deviceTimestamp: event.target.value })} /></Field>
              <Field label="Sequence number" htmlFor="reading-sequence" hint="Must be an integer greater than the last accepted sequence for this device."><Input id="reading-sequence" type="number" min="0" step="1" required value={form.sequence || ''} onChange={(event) => setForm({ ...form, sequence: event.target.value })} /></Field>
              <div><Button type="submit" disabled={busy}>Submit reading</Button></div>
            </form>
            {data.readingResult && <div className="mt-4"><Alert tone="success" title="Backend reading response">
              Reading ID: <code>{data.readingResult.reading?.id}</code> · {data.readingResult.reading?.temperature}°C
              {data.readingResult.alert && ` · Alert: ${data.readingResult.alert.status}`}
            </Alert></div>}
          </Card>
          <Card className="card--pad"><CardHeader title="Revoke a device" />
            <form className="row gap-3" onSubmit={(event) => { event.preventDefault(); run(() => api.revokeDevice(form.deviceObjectId), 'Device revoked.'); }}>
              <Field label="Device database ID" htmlFor="device-object-id"><Input id="device-object-id" required value={form.deviceObjectId || ''} onChange={(event) => setForm({ ...form, deviceObjectId: event.target.value })} /></Field>
              <Button type="submit" variant="danger-outline" disabled={busy}>Revoke device</Button>
            </form>
          </Card>
        </div>
      )}

      {!loading && !error && section === 'new' && currentUser.role === 'patient' && (
        <Alert tone="info" title="Public request form">
          This backend accepts public requests at the public request form and requires an approved document upload. <Link to="/request-blood">Start a request</Link>.
        </Alert>
      )}
      {!loading && !error && section === 'qr' && (
        <Alert tone="warning" title="QR administration is restricted">
          The backend exposes hospital QR rotation only to Super Admins. Ask an administrator to rotate the hospital QR from Organizations.
        </Alert>
      )}
      {!loading && !error && !supportedSections.includes(section) && !['new', 'qr'].includes(section) && (
        <Unsupported
          title="This screen is not supported by the supplied backend"
          message={`The API has no matching endpoint for “${section}”. No simulated data or success action is provided here.`}
        />
      )}

      {!loading && !error && ['shipments', 'telemetry', 'devices'].includes(section) && data.message && (
        <Card className="card--pad"><p>{data.message}</p></Card>
      )}
    </div>
  );
}
