import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Field,
  Input,
  ShipmentStatusBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getShipment, orgName, visibleShipments } from '../../state/selectors.js';
import { TEMP_RANGE, formatDateTime, timeAgo } from '../../data/reference.js';

export default function OperatorTemperature() {
  const app = useApp();
  const shipments = visibleShipments(app, app.currentUser);
  const [selectedId, setSelectedId] = useState(
    (shipments.find((s) => s.status !== 'delivered') || shipments[0])?.id || null,
  );
  const [value, setValue] = useState('4.0');
  const selected = selectedId ? getShipment(app, selectedId) : null;

  const readings = shipments.flatMap((s) => s.temperature);
  const excursions = readings.filter((r) => r.value < TEMP_RANGE.min || r.value > TEMP_RANGE.max);
  const openAlerts = shipments.flatMap((s) =>
    s.tempAlerts.filter((a) => !a.acknowledged).map((a) => ({ ...a, shipmentId: s.id })),
  );

  return (
    <>
      <PageHeader
        title="Temperature readings"
        description="Log simulated cold-box readings during transit. No sensor is connected in this prototype."
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat label="Shipments" value={shipments.length} icon="truck" meta="Assigned to you" />
        <Stat label="Readings logged" value={readings.length} icon="thermometer" tone="neutral" meta="All shipments" />
        <Stat
          label="Within 2–6 °C"
          value={`${readings.length ? Math.round(((readings.length - excursions.length) / readings.length) * 100) : 100}%`}
          icon="check-circle"
          tone="success"
          meta="Simulated readings"
        />
        <Stat
          label="Open alerts"
          value={openAlerts.length}
          icon="alert-triangle"
          tone={openAlerts.length ? 'warning' : 'success'}
          meta="Needs acknowledgement"
        />
      </div>

      <div className="grid-sidebar section-gap">
        <div className="stack gap-4">
          <Card flush>
            <CardHeader title="My shipments" subtitle="Select one to log a reading" />
            {shipments.length === 0 ? (
              <EmptyState icon="truck" title="No shipments assigned" description="Readings can be logged once you have a shipment." />
            ) : (
              shipments.map((s) => {
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
                      background: selectedId === s.id ? 'var(--red-50)' : 'transparent',
                      border: 0,
                      borderTop: '1px solid var(--border)',
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

          {selected && (
            <Card>
              <CardHeader
                title={`${selected.id} · readings`}
                subtitle={`${orgName(app, selected.bankId)} → ${orgName(app, selected.hospitalId)}`}
                action={<Badge tone="neutral">Simulated</Badge>}
              />
              <CardBody>
                <TempChart readings={selected.temperature} height={150} />

                {selected.status !== 'delivered' && (
                  <form
                    className="mt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (value === '' || Number.isNaN(Number(value))) return;
                      app.addTemperatureReading(selected.id, Number(value));
                    }}
                  >
                    <div className="field-row">
                      <Field
                        label="New reading (°C)"
                        htmlFor="op-temp"
                        hint="Outside 2–6 °C raises a demo alert."
                      >
                        <Input
                          id="op-temp"
                          type="number"
                          step="0.1"
                          min="-10"
                          max="30"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          style={{ maxWidth: 150 }}
                        />
                      </Field>
                      <Button type="submit" icon="plus">
                        Log reading
                      </Button>
                    </div>
                  </form>
                )}

                {selected.tempAlerts.length > 0 && (
                  <div className="stack gap-2 mt-4">
                    <p className="divider-label">Excursions</p>
                    {selected.tempAlerts.map((a) => (
                      <div className="alert alert--danger" key={a.id}>
                        <Icon name="alert-triangle" className="icon alert__icon" />
                        <div className="grow">
                          <div className="alert__title">
                            {a.value} °C · {formatDateTime(a.at)}
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

                <div className="row-between mt-4">
                  <span className="text-xs text-muted">
                    Last updated {selected.temperature.at(-1) ? timeAgo(selected.temperature.at(-1).at) : '—'}
                  </span>
                  <Link to={`/operator/shipments/${selected.id}`} className="btn btn--secondary btn--sm">
                    Open shipment
                  </Link>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="stack gap-4">
          <Card>
            <CardHeader title="What the readings mean" />
            <CardBody>
              <div className="stack gap-3">
                <div>
                  <div className="text-xs text-strong">2–6 °C</div>
                  <div className="text-xs text-muted">
                    Within the safe transport range for red cells in this demo.
                  </div>
                </div>
                <div>
                  <div className="text-xs text-strong">Above 6 °C</div>
                  <div className="text-xs text-muted">
                    Raises an alert for the blood bank and platform team to review.
                  </div>
                </div>
                <div>
                  <div className="text-xs text-strong">Below 2 °C</div>
                  <div className="text-xs text-muted">
                    Also outside range — never place units directly against ice packs.
                  </div>
                </div>
              </div>
              <div className="gate-note mt-3">
                <Icon name="info" className="icon icon--sm" />
                <span>
                  These thresholds are illustrative. Real cold-chain rules are set by the blood bank
                  and its regulators.
                </span>
              </div>
            </CardBody>
          </Card>

          {openAlerts.length > 0 && (
            <Alert tone="danger" title={`${openAlerts.length} open alert(s)`}>
              {openAlerts.map((a) => `${a.shipmentId}: ${a.value} °C`).join(' · ')}
            </Alert>
          )}

          <Alert tone="demo" title="No hardware">
            This screen never reads a real sensor. Readings are typed in, or generated by the demo
            workflow, and stored only in your browser.
          </Alert>
        </div>
      </div>
    </>
  );
}
