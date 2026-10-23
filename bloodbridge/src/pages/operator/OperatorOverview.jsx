import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  CardBody,
  DemoNotice,
  EmptyState,
  ShipmentStatusBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank, getHospital, getShipment, orgName, visibleShipments } from '../../state/selectors.js';
import { TEMP_RANGE, componentLabel, timeAgo } from '../../data/reference.js';

export default function OperatorOverview() {
  const app = useApp();
  const navigate = useNavigate();
  const shipments = visibleShipments(app, app.currentUser);
  const active = shipments.filter((s) => s.status !== 'delivered');
  const delivered = shipments.filter((s) => s.status === 'delivered');
  const next = active.find((s) => s.status === 'created') || active[0];
  const alerts = shipments.flatMap((s) =>
    s.tempAlerts.filter((a) => !a.acknowledged).map((a) => ({ ...a, shipmentId: s.id })),
  );
  const nextRequest = next ? app.requests.find((r) => r.id === next.requestId) : null;

  return (
    <>
      <PageHeader
        title={`Hello, ${app.currentUser?.name?.split(' ')[0] || 'operator'}`}
        description={`${app.currentUser?.vehicle || 'Courier'} · ${app.currentUser?.note || 'Demonstration deliveries'}`}
        actions={
          <Link to="/operator/shipments" className="btn btn--secondary">
            <Icon name="truck" />
            All shipments
          </Link>
        }
      />

      <DemoNotice />

      <div className="stat-grid mt-5">
        <Stat label="Active shipments" value={active.length} icon="truck" meta="Assigned to you" />
        <Stat
          label="Awaiting pickup"
          value={active.filter((s) => s.status === 'created').length}
          icon="package"
          tone="warning"
          meta="Ready at the blood bank"
        />
        <Stat
          label="Delivered"
          value={delivered.length}
          icon="check-circle"
          tone="success"
          meta="Completed demo deliveries"
        />
        <Stat
          label="Temperature alerts"
          value={alerts.length}
          icon="thermometer"
          tone={alerts.length ? 'warning' : 'success'}
          meta="Simulated readings"
        />
      </div>

      {next && (
        <Card className="mt-5">
          <div className="card__header">
            <div>
              <h3 className="card__title">Next task</h3>
              <p className="card__subtitle">
                {next.status === 'created' ? 'Collect from the blood bank' : 'Continue the delivery'}
              </p>
            </div>
            <ShipmentStatusBadge status={next.status} size="lg" />
          </div>
          <div className="card__body">
            <div className="row-between wrap gap-4">
              <div>
                <div className="row gap-2">
                  <span className="mono text-strong">{next.id}</span>
                  {nextRequest && <BloodPill group={nextRequest.bloodGroup} />}
                  <span className="text-xs text-muted">
                    {nextRequest ? `${next.units} unit(s) ${componentLabel(nextRequest.component)}` : ''}
                  </span>
                </div>
                <div className="mt-3 stack gap-2">
                  <div className="row gap-2 text-sm">
                    <Icon name="map-pin" className="icon icon--sm text-muted" />
                    <span className="text-muted">Pickup:</span>
                    <strong>{getBank(app, next.bankId)?.name}</strong>
                  </div>
                  <div className="row gap-2 text-sm">
                    <Icon name="hospital" className="icon icon--sm text-muted" />
                    <span className="text-muted">Deliver to:</span>
                    <strong>
                      {getHospital(app, next.hospitalId)?.short} · {next.delivery.ward}
                    </strong>
                  </div>
                  <div className="row gap-2 text-sm">
                    <Icon name="clock" className="icon icon--sm text-muted" />
                    <span className="text-muted">Window:</span>
                    <strong>{next.status === 'created' ? next.pickup.window : next.delivery.window}</strong>
                  </div>
                </div>
              </div>
              <div className="stack gap-2">
                <Link to={`/operator/shipments/${next.id}`} className="btn btn--primary">
                  Open shipment
                  <Icon name="arrow-right" />
                </Link>
                <span className="text-xs text-subtle center">Distance {next.distanceKm} km</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid-sidebar section-gap">
        <div className="stack gap-4">
          <Card flush>
            <CardHeader
              title="My active deliveries"
              subtitle={`${active.length} in progress`}
              action={
                <Link to="/operator/shipments" className="btn btn--ghost btn--sm">
                  View all
                </Link>
              }
            />
            {active.length === 0 ? (
              <EmptyState
                icon="check-circle"
                title="No active deliveries"
                description="When a blood bank assigns you a shipment, it will appear here."
              />
            ) : (
              active.map((s) => {
                const req = app.requests.find((r) => r.id === s.requestId);
                return (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/operator/shipments/${s.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/operator/shipments/${s.id}`)}
                    style={{
                      padding: '14px 20px',
                      borderTop: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="row-between wrap gap-2">
                      <div>
                        <div className="row gap-2">
                          <span className="mono text-sm text-strong">{s.id}</span>
                          {req && <BloodPill group={req.bloodGroup} />}
                          <span className="text-xs text-muted">{s.units} unit(s)</span>
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {orgName(app, s.bankId)} → {orgName(app, s.hospitalId)}
                        </div>
                      </div>
                      <div className="row gap-2">
                        {s.temperature.at(-1) && (
                          <span
                            className={`temp-badge ${
                              s.temperature.at(-1).value > TEMP_RANGE.max ||
                              s.temperature.at(-1).value < TEMP_RANGE.min
                                ? 'temp-badge--alert'
                                : ''
                            }`}
                          >
                            <Icon name="thermometer" className="icon icon--sm" />
                            {s.temperature.at(-1).value} °C
                          </span>
                        )}
                        <ShipmentStatusBadge status={s.status} />
                        <Icon name="chevron-right" className="icon text-subtle" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          <Card flush>
            <CardHeader title="Recently delivered" subtitle="Completed demo shipments" />
            {delivered.length === 0 ? (
              <p className="text-sm text-muted" style={{ padding: 20 }}>
                No completed deliveries yet.
              </p>
            ) : (
              delivered.map((s) => (
                <Link
                  key={s.id}
                  to={`/operator/shipments/${s.id}`}
                  className="row-between"
                  style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', color: 'inherit' }}
                >
                  <div>
                    <div className="mono text-sm text-strong">{s.id}</div>
                    <div className="text-xs text-muted">
                      {orgName(app, s.hospitalId)} · {timeAgo(s.delivery.at)}
                    </div>
                  </div>
                  <Badge tone="success" dot>
                    Delivered
                  </Badge>
                </Link>
              ))
            )}
          </Card>
        </div>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-2">Before pickup</h3>
            <ul className="stack gap-3 mt-2">
              {[
                ['Check the cold box', 'Sealed and within 2–6 °C before you leave the bank.'],
                ['Confirm the unit count', 'Match the dispatch note to the units in the box.'],
                ['Note the handover code', 'The ward needs it to confirm receipt.'],
                ['Never open the box', 'Keep it sealed until the nursing desk checks it.'],
              ].map(([title, text]) => (
                <li key={title}>
                  <div className="text-xs text-strong">{title}</div>
                  <div className="text-xs text-muted">{text}</div>
                </li>
              ))}
            </ul>
          </Card>

          {alerts.length > 0 ? (
            <Card flush>
              <CardHeader title="Temperature alerts" subtitle="Simulated readings" />
              {alerts.map((a) => (
                <div key={a.id} style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                  <div className="row-between">
                    <span className="mono text-sm text-strong">{a.shipmentId}</span>
                    <Badge tone="danger">{a.value} °C</Badge>
                  </div>
                  <div className="text-xs text-muted mt-1">{a.note}</div>
                </div>
              ))}
              <div className="card__footer">
                <Link to="/operator/temperature" className="btn btn--secondary btn--sm">
                  Review readings
                </Link>
              </div>
            </Card>
          ) : (
            <Alert tone="success" title="Cold chain looks fine">
              All simulated readings are within the 2–6 °C range.
            </Alert>
          )}

          <Alert tone="warning" title="Demo courier account">
            Deliveries, codes and temperature readings are simulated. No real blood products are being
            transported.
          </Alert>
        </div>
      </div>
    </>
  );
}
