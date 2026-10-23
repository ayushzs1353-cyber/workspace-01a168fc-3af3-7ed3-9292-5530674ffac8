import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  DemoNotice,
  EmptyState,
  StatusBadge,
  UrgencyBadge,
} from '../../components/ui/index.js';
import TrackingSteps from '../../components/domain/TrackingSteps.jsx';
import { useApp } from '../../state/store.jsx';
import {
  getBank,
  getHospital,
  getShipment,
  notificationsFor,
  patientRequestSummary,
  unreadCount,
  visibleRequests,
} from '../../state/selectors.js';
import { componentLabel, isOpen, timeAgo, currency } from '../../data/reference.js';

export default function PatientOverview() {
  const app = useApp();
  const requests = visibleRequests(app, app.currentUser);
  const summary = patientRequestSummary(app, app.currentUser?.id);
  const notifications = notificationsFor(app, app.currentUser);
  const active = requests.filter((r) => isOpen(r.status));
  const primary = active[0] || requests[0];
  const shipment = primary?.shipmentId ? getShipment(app, primary.shipmentId) : null;
  const hospital = getHospital(app, primary?.hospitalId);
  const bank = getBank(app, primary?.bankId);
  const unpaid = requests.filter((r) => r.paymentStatus === 'pending');

  return (
    <>
      <PageHeader
        title={`Hello, ${app.currentUser?.name?.split(' ')[0] || 'there'}`}
        description="Your blood requests, tracking updates and hospital details in one place."
        actions={
          <>
            <Link to="/patient/new" className="btn btn--secondary">
              <Icon name="plus" />
              New request
            </Link>
            <Link to="/patient/requests" className="btn btn--primary">
              Track requests
            </Link>
          </>
        }
      />

      <DemoNotice />

      <div className="stat-grid mt-5">
        <Stat label="Active requests" value={summary.active} icon="activity" meta="Being coordinated now" />
        <Stat
          label="Delivered"
          value={summary.completed}
          icon="check-circle"
          tone="success"
          meta="Completed requests"
        />
        <Stat
          label="Payment due"
          value={unpaid.length ? currency(unpaid.reduce((s, r) => s + (r.fee || 0), 0)) : '₹0'}
          icon="credit-card"
          tone={unpaid.length ? 'warning' : 'success'}
          meta={unpaid.length ? `${unpaid.length} request(s) · demo charges` : 'Nothing pending'}
        />
        <Stat
          label="Notifications"
          value={unreadCount(notifications)}
          icon="bell"
          tone="info"
          meta="Unread updates"
        />
      </div>

      <div className="grid grid-sidebar section-gap">
        <div className="stack gap-4">
          {primary ? (
            <Card>
              <CardHeader
                title="Current request"
                subtitle={`${componentLabel(primary.component)} · requested ${timeAgo(primary.createdAt)}`}
                action={<StatusBadge status={primary.status} size="lg" />}
              />
              <div className="card__body">
                <div className="row-between wrap gap-3">
                  <div className="row gap-3">
                    <BloodPill group={primary.bloodGroup} />
                    <div>
                      <div className="text-strong" style={{ fontSize: 'var(--fs-lg)' }}>
                        {primary.units} unit{primary.units > 1 ? 's' : ''} · {componentLabel(primary.component)}
                      </div>
                      <div className="text-xs text-muted">
                        {primary.patientName} · {primary.ward} · {hospital?.name}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <UrgencyBadge urgency={primary.urgency} />
                    <Badge tone="neutral">{primary.id}</Badge>
                  </div>
                </div>

                {shipment && (
                  <div className="hero-tile mt-4" style={{ background: 'var(--bg)' }}>
                    <span className="hero-tile__icon" style={{ background: 'var(--white)' }}>
                      <Icon name="truck" />
                    </span>
                    <div className="grow">
                      <div className="hero-tile__title">
                        {shipment.status === 'delivered' ? 'Delivered to hospital' : 'On the way'}
                        <span className="text-xs text-muted" style={{ fontWeight: 500, marginLeft: 6 }}>
                          {shipment.id}
                        </span>
                      </div>
                      <div className="hero-tile__meta">
                        {shipment.status === 'delivered'
                          ? `Signed for at ${shipment.delivery.ward}`
                          : `From ${bank?.name} · cold box sealed · ${shipment.distanceKm} km`}
                      </div>
                    </div>
                    <Link to={`/patient/requests/${primary.id}`} className="btn btn--secondary btn--sm">
                      Details
                    </Link>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-xs text-muted text-strong mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Progress
                  </p>
                  <TrackingSteps request={primary} compact />
                </div>

                <div className="row gap-2 mt-5 wrap">
                  <Link to={`/patient/requests/${primary.id}`} className="btn btn--primary">
                    View tracking
                    <Icon name="arrow-right" />
                  </Link>
                  {primary.paymentStatus === 'pending' && (
                    <Link to={`/patient/payments?pay=${primary.id}`} className="btn btn--secondary">
                      Pay demo charge
                    </Link>
                  )}
                  <span className="text-xs text-muted grow row gap-1" style={{ justifyContent: 'flex-end' }}>
                    <Icon name="phone" className="icon icon--sm" />
                    {hospital?.phone}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="droplet"
                title="No requests yet"
                description="When you create a blood request, you can follow every step here."
                action={
                  <Link to="/patient/new" className="btn btn--primary">
                    Create a request
                  </Link>
                }
              />
            </Card>
          )}

          {active.length > 1 && (
            <Card flush>
              <CardHeader
                title="Other active requests"
                subtitle={`${active.length - 1} more in progress`}
                action={
                  <Link to="/patient/requests" className="btn btn--ghost btn--sm">
                    View all
                  </Link>
                }
              />
              {active.slice(1).map((r) => (
                <Link
                  key={r.id}
                  to={`/patient/requests/${r.id}`}
                  className="row-between"
                  style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', color: 'inherit' }}
                >
                  <div className="row gap-3">
                    <BloodPill group={r.bloodGroup} />
                    <div>
                      <div className="text-sm text-strong">
                        {r.units} unit{r.units > 1 ? 's' : ''} · {componentLabel(r.component)}
                      </div>
                      <div className="text-xs text-muted">
                        {r.id} · {r.ward}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <StatusBadge status={r.status} />
                    <Icon name="chevron-right" className="icon text-subtle" />
                  </div>
                </Link>
              ))}
            </Card>
          )}

          <Card flush>
            <CardHeader
              title="Recent requests"
              subtitle="Your request history"
              action={
                <Link to="/patient/requests" className="btn btn--ghost btn--sm">
                  View all
                </Link>
              }
            />
            {requests.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                to={`/patient/requests/${r.id}`}
                className="row-between"
                style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', color: 'inherit' }}
              >
                <div>
                  <div className="text-sm text-strong">
                    {r.id} · {r.bloodGroup} {componentLabel(r.component)}
                  </div>
                  <div className="text-xs text-muted">
                    {r.units} unit(s) · {timeAgo(r.createdAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </Card>
        </div>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-3">Quick actions</h3>
            <div className="stack gap-2">
              <Link to="/patient/new" className="btn btn--primary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="plus" />
                Raise a new request
              </Link>
              <Link
                to="/patient/new?mode=qr"
                className="btn btn--secondary btn--block"
                style={{ justifyContent: 'flex-start' }}
              >
                <Icon name="qr" />
                Scan hospital QR
              </Link>
              <Link
                to="/patient/notifications"
                className="btn btn--secondary btn--block"
                style={{ justifyContent: 'flex-start' }}
              >
                <Icon name="bell" />
                View notifications
              </Link>
            </div>
          </Card>

          <Card flush>
            <CardHeader
              title="Latest updates"
              action={
                <Link to="/patient/notifications" className="btn btn--ghost btn--sm">
                  All
                </Link>
              }
            />
            <div style={{ padding: '8px 12px 12px' }}>
              {notifications.slice(0, 4).map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '/patient'}
                  className="notif-item"
                  style={{ color: 'inherit' }}
                >
                  <span className={`notif-item__dot ${n.read ? 'notif-item__dot--read' : ''}`} />
                  <span className="grow">
                    <span className="notif-item__title" style={{ display: 'block' }}>
                      {n.title}
                    </span>
                    <span className="notif-item__meta" style={{ display: 'block' }}>
                      {timeAgo(n.at)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          {hospital && (
            <Card className="card--pad">
              <h3 className="card__title mb-3">Your hospital</h3>
              <div className="text-sm text-strong">{hospital.name}</div>
              <p className="text-xs text-muted mt-1">{hospital.address}</p>
              <div className="info-row mt-3">
                <span className="info-row__label">Coordinator</span>
                <span className="info-row__value">{hospital.contactPerson}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Phone</span>
                <span className="info-row__value">{hospital.phone}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Blood bank</span>
                <span className="info-row__value">{bank?.name || 'Assigned per request'}</span>
              </div>
            </Card>
          )}

          <Alert tone="info" title="Need urgent help?">
            This prototype cannot coordinate real blood. In an emergency, speak to the hospital’s
            blood bank or transfusion team directly.
          </Alert>
        </div>
      </div>
    </>
  );
}
