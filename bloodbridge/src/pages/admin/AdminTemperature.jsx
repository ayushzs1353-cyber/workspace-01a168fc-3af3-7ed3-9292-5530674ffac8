import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { TempChart } from '../../components/ui/Charts.jsx';
import {
  Alert,
  Badge,
  Button,
  CardBody,
  DemoNotice,
  EmptyState,
  ShipmentStatusBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getShipment, orgName } from '../../state/selectors.js';
import { TEMP_RANGE, formatDateTime, timeAgo } from '../../data/reference.js';

export default function AdminTemperature() {
  const app = useApp();
  const withReadings = app.shipments.filter((s) => s.temperature.length > 0);
  const [selectedId, setSelectedId] = useState(
    (withReadings.find((s) => s.status !== 'delivered') || withReadings[0] || app.shipments[0])?.id || null,
  );
  const selected = selectedId ? getShipment(app, selectedId) : null;

  const openAlerts = app.shipments.flatMap((s) =>
    s.tempAlerts.filter((a) => !a.acknowledged).map((a) => ({ ...a, shipmentId: s.id })),
  );
  const allReadings = app.shipments.flatMap((s) => s.temperature);
  const excursions = allReadings.filter((r) => r.value < TEMP_RANGE.min || r.value > TEMP_RANGE.max);
  const compliance = allReadings.length
    ? Math.round(((allReadings.length - excursions.length) / allReadings.length) * 100)
    : 100;

  return (
    <>
      <PageHeader
        title="Cold chain monitoring"
        description="Simulated transport readings across demo shipments. No sensor or data logger is connected."
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat
          label="Shipments monitored"
          value={withReadings.length}
          icon="truck"
          meta={`${app.shipments.length} in the demo`}
        />
        <Stat
          label="Readings recorded"
          value={allReadings.length}
          icon="thermometer"
          tone="neutral"
          meta="Across all shipments"
        />
        <Stat
          label="Within range"
          value={`${compliance}%`}
          icon="check-circle"
          tone="success"
          meta="2–6 °C target range"
        />
        <Stat
          label="Open excursions"
          value={openAlerts.length}
          icon="alert-triangle"
          tone={openAlerts.length ? 'warning' : 'success'}
          meta="Awaiting acknowledgement"
        />
      </div>

      {openAlerts.length > 0 && (
        <div className="alert alert--danger mt-4">
          <Icon name="alert-triangle" className="icon alert__icon" />
          <div className="grow">
            <div className="alert__title">
              {openAlerts.length} excursion(s) needing acknowledgement
            </div>
            <div className="alert__body">
              {openAlerts
                .slice(0, 2)
                .map((a) => `${a.shipmentId}: ${a.value} °C`)
                .join(' · ')}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setSelectedId(openAlerts[0].shipmentId)}>
            Review
          </Button>
        </div>
      )}

      <div className="grid-sidebar section-gap">
        <Card flush>
          <CardHeader title="Shipments" subtitle="Select one to see its readings" />
          {app.shipments.length === 0 ? (
            <EmptyState icon="thermometer" title="No shipments" description="Nothing to monitor yet." />
          ) : (
            app.shipments.map((s) => {
              const latest = s.temperature.at(-1);
              const breach = latest && (latest.value < TEMP_RANGE.min || latest.value > TEMP_RANGE.max);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className="row-between"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border)',
                    background: selectedId === s.id ? 'var(--red-50)' : 'transparent',
                    border: 0,
                    borderTopWidth: 1,
                    borderTopStyle: 'solid',
                    borderTopColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="mono text-sm text-strong">{s.id}</div>
                    <div className="text-xs text-muted">
                      {orgName(app, s.bankId)} → {orgName(app, s.hospitalId)}
                    </div>
                  </div>
                  <div className="row gap-2">
                    {latest ? (
                      <span className={`temp-badge ${breach ? 'temp-badge--alert' : ''}`}>
                        <Icon name="thermometer" className="icon icon--sm" />
                        {latest.value} °C
                      </span>
                    ) : (
                      <Badge tone="neutral">No readings</Badge>
                    )}
                    <ShipmentStatusBadge status={s.status} />
                  </div>
                </button>
              );
            })
          )}
        </Card>

        <div className="stack gap-4">
          {selected ? (
            <>
              <Card>
                <CardHeader
                  title={`${selected.id} readings`}
                  subtitle={`${orgName(app, selected.bankId)} → ${orgName(app, selected.hospitalId)}`}
                  action={<Badge tone="neutral">Simulated</Badge>}
                />
                <CardBody>
                  <TempChart readings={selected.temperature} height={150} />
                  <div className="grid grid-3 mt-4" style={{ gap: 8 }}>
                    <div>
                      <div className="text-xs text-muted">Cold box</div>
                      <div className="text-sm text-strong">{selected.coldBox}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Pickup</div>
                      <div className="text-sm text-strong">
                        {selected.pickup.at ? formatDateTime(selected.pickup.at) : 'Pending'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Delivery</div>
                      <div className="text-sm text-strong">
                        {selected.delivery.at ? formatDateTime(selected.delivery.at) : selected.delivery.window}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Excursions" subtitle="Readings outside 2–6 °C" />
                <CardBody>
                  {selected.tempAlerts.length === 0 ? (
                    <p className="text-sm text-muted">
                      No excursions recorded for this shipment.
                    </p>
                  ) : (
                    <div className="stack gap-2">
                      {selected.tempAlerts.map((a) => (
                        <div className="alert alert--danger" key={a.id}>
                          <Icon name="alert-triangle" className="icon alert__icon" />
                          <div className="grow">
                            <div className="alert__title">
                              {a.value} °C · {timeAgo(a.at)}
                            </div>
                            <div className="alert__body">{a.note}</div>
                          </div>
                          {a.acknowledged ? (
                            <Badge tone="success" dot>
                              Acknowledged
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => app.acknowledgeTempAlert(selected.id, a.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Alert tone="info" title="What happens next">
                An acknowledged excursion stays in the audit history. In production, the blood bank
                would review the unit’s viability and record whether it can still be used.
              </Alert>
            </>
          ) : (
            <Card>
              <EmptyState icon="thermometer" title="Select a shipment" description="Choose a shipment to see its readings." />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
