import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  Field,
  Input,
  Modal,
  ShipmentStatusBadge,
  Textarea,
} from '../../components/ui/index.js';
import ShipmentProgress from '../../components/domain/ShipmentProgress.jsx';
import TemperaturePanel from '../../components/domain/TemperaturePanel.jsx';
import { useApp } from '../../state/store.jsx';
import { getBank, getHospital, getShipment } from '../../state/selectors.js';
import { componentLabel, formatDateTime } from '../../data/reference.js';

export default function OperatorShipmentDetail() {
  const { id } = useParams();
  const app = useApp();
  const shipment = getShipment(app, id);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [note, setNote] = useState('');
  const [confirmPickup, setConfirmPickup] = useState(false);

  if (!shipment) {
    return (
      <Card>
        <EmptyState
          icon="search"
          title="Shipment not found"
          description="It may be assigned to another operator, or the demo data was reset."
          action={
            <Link to="/operator/shipments" className="btn btn--primary">
              Back to shipments
            </Link>
          }
        />
      </Card>
    );
  }

  const bank = getBank(app, shipment.bankId);
  const hospital = getHospital(app, shipment.hospitalId);
  const request = app.requests.find((r) => r.id === shipment.requestId);

  const nextAction =
    shipment.status === 'created'
      ? { label: 'Confirm pickup', status: 'picked_up', icon: 'package' }
      : shipment.status === 'picked_up'
        ? { label: 'Start transit', status: 'in_transit', icon: 'route' }
        : shipment.status === 'in_transit'
          ? { label: 'Confirm delivery', status: 'delivered', icon: 'check-circle' }
          : null;

  const runNext = () => {
    if (shipment.status === 'created') {
      setConfirmPickup(true);
      return;
    }
    if (shipment.status === 'picked_up') {
      app.updateShipmentStatus(shipment.id, 'in_transit', note || 'Left the blood bank with the sealed cold box.');
      return;
    }
    if (shipment.status === 'in_transit') {
      setDeliverOpen(true);
    }
  };

  return (
    <>
      <PageHeader
        backTo="/operator/shipments"
        backLabel="Back to my shipments"
        title={
          <span className="row gap-3 wrap">
            Shipment <span className="mono">{shipment.id}</span>
            <ShipmentStatusBadge status={shipment.status} size="lg" />
          </span>
        }
        description={`${bank?.name} → ${hospital?.short} · ${shipment.units} unit(s) · request ${shipment.requestId}`}
        actions={
          nextAction ? (
            <Button icon={nextAction.icon} onClick={runNext}>
              {nextAction.label}
            </Button>
          ) : (
            <Badge tone="success" dot>
              Delivered
            </Badge>
          )
        }
      />

      <div className="grid-sidebar">
        <div className="stack gap-4">
          {shipment.status === 'in_transit' && (
            <Alert tone="info" title="Deliver only with the handover code">
              Ask the nursing desk for the 4-digit code printed on their request. Entering the wrong
              code will not complete the delivery in this demo.
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Delivery progress"
              subtitle={shipment.vehicle}
              action={<Badge tone="neutral">{shipment.distanceKm} km</Badge>}
            />
            <div className="card__body">
              <ShipmentProgress shipment={shipment} />
            </div>
          </Card>

          <div className="grid grid-2">
            <Card>
              <CardHeader title="Pickup" subtitle={shipment.pickup.window} />
              <div className="card__body">
                <div className="text-sm text-strong">{bank?.name}</div>
                <p className="text-xs text-muted mt-1">{shipment.pickup.address}</p>
                <div className="info-row mt-3">
                  <span className="info-row__label">Contact</span>
                  <span className="info-row__value">{shipment.pickup.contactName}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Phone</span>
                  <span className="info-row__value">
                    <a href={`tel:${shipment.pickup.phone}`}>{shipment.pickup.phone}</a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Status</span>
                  <span className="info-row__value">
                    {shipment.pickup.at ? formatDateTime(shipment.pickup.at) : 'Pending'}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Delivery" subtitle={shipment.delivery.window} />
              <div className="card__body">
                <div className="text-sm text-strong">
                  {hospital?.name} · {shipment.delivery.ward}
                </div>
                <p className="text-xs text-muted mt-1">{shipment.delivery.address}</p>
                <div className="info-row mt-3">
                  <span className="info-row__label">Contact</span>
                  <span className="info-row__value">{shipment.delivery.contactName}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Phone</span>
                  <span className="info-row__value">
                    <a href={`tel:${shipment.delivery.phone}`}>{shipment.delivery.phone}</a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Received by</span>
                  <span className="info-row__value">{shipment.delivery.receivedBy || '—'}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Route" subtitle="Illustrative — no live GPS tracking in this demo" />
            <div className="card__body">
              <div className="pin-map">
                <div className="pin-map__route" />
                <div className="pin-map__pin" style={{ left: '10%', top: '58%' }}>
                  <span className="pin-map__dot" />
                  {bank?.short}
                </div>
                <div className="pin-map__pin" style={{ left: '70%', top: '26%' }}>
                  <span className="pin-map__dot" />
                  {hospital?.short}
                </div>
                <div className="pin-map__pin" style={{ left: '42%', top: '40%' }}>
                  <span className="pin-map__dot pin-map__dot--muted" />
                  {shipment.status === 'created' ? 'Awaiting pickup' : 'Courier'}
                </div>
              </div>
              <div className="row-between mt-3 text-xs text-muted">
                <span>{shipment.distanceKm} km estimated</span>
                <span>Map is decorative in this prototype</span>
              </div>
            </div>
          </Card>

          <TemperaturePanel
            shipment={shipment}
            canAdd={shipment.status !== 'delivered'}
            onAddReading={(value) => app.addTemperatureReading(shipment.id, value)}
          />

          <Card>
            <CardHeader title="Shipment timeline" />
            <div className="card__body">
              <div className="timeline">
                {[...shipment.timeline].reverse().map((t, i) => (
                  <div className="timeline__row" key={`${t.label}-${i}`}>
                    <span className={`timeline__dot timeline__dot--${t.tone || 'neutral'}`} />
                    <div>
                      <div className="timeline__title">{t.label}</div>
                      <div className="timeline__meta">
                        {formatDateTime(t.at)} · {t.by}
                      </div>
                      {t.note && <div className="timeline__body">{t.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="stack gap-4">
          <Card>
            <CardHeader title="Update status" subtitle="Keep the hospital and patient informed" />
            <div className="card__body">
              <div className="action-list">
                <Button
                  variant={shipment.status === 'created' ? 'primary' : 'secondary'}
                  block
                  icon="package"
                  disabled={shipment.status !== 'created'}
                  onClick={() => setConfirmPickup(true)}
                >
                  {shipment.status === 'created' ? 'Confirm pickup' : 'Picked up'}
                </Button>
                <Button
                  variant={shipment.status === 'picked_up' ? 'primary' : 'secondary'}
                  block
                  icon="route"
                  disabled={shipment.status !== 'picked_up'}
                  onClick={() =>
                    app.updateShipmentStatus(
                      shipment.id,
                      'in_transit',
                      note || 'Left the blood bank with the sealed cold box.',
                    )
                  }
                >
                  Start transit
                </Button>
                <Button
                  variant={shipment.status === 'in_transit' ? 'primary' : 'secondary'}
                  block
                  icon="check-circle"
                  disabled={shipment.status !== 'in_transit'}
                  onClick={() => setDeliverOpen(true)}
                >
                  Confirm delivery
                </Button>
              </div>
              <Field label="Status note (optional)" htmlFor="op-note" className="mt-4">
                <Textarea
                  id="op-note"
                  rows={2}
                  placeholder="e.g. Traffic delay near Malviya Nagar"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <div className="gate-note mt-3">
                <Icon name="info" className="icon icon--sm" />
                <span>
                  Each update is visible to the hospital and patient immediately, and written to the
                  demo audit trail.
                </span>
              </div>
            </div>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Handover code</h3>
            <p className="text-xs text-muted">
              The ward uses this code to confirm receipt. Shown here for the demo.
            </p>
            <div
              className="mono"
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textAlign: 'center',
                padding: '12px 0',
                marginTop: 10,
                background: 'var(--bg)',
                borderRadius: 8,
                border: '1px dashed var(--border-strong)',
              }}
            >
              {shipment.delivery.otp}
            </div>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Cold box</h3>
            <div className="info-row">
              <span className="info-row__label">Reference</span>
              <span className="info-row__value">{shipment.coldBox}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Units</span>
              <span className="info-row__value">{shipment.units}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Target range</span>
              <span className="info-row__value">2–6 °C</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Latest reading</span>
              <span className="info-row__value">{shipment.temperature.at(-1)?.value ?? '—'} °C</span>
            </div>
          </Card>

          {request && (
            <Card className="card--pad">
              <h3 className="card__title mb-2">Contents</h3>
              <div className="row gap-2">
                <BloodPill group={request.bloodGroup} />
                <div className="text-sm">
                  <div className="text-strong">{componentLabel(request.component)}</div>
                  <div className="text-xs text-muted">
                    {shipment.units} unit(s) for {request.patientName}
                  </div>
                </div>
              </div>
              <div className="info-row mt-3">
                <span className="info-row__label">Ward</span>
                <span className="info-row__value">{request.ward}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Urgency</span>
                <span className="info-row__value" style={{ textTransform: 'capitalize' }}>
                  {request.urgency}
                </span>
              </div>
            </Card>
          )}

          <DemoNotice compact />
        </div>
      </div>

      <ConfirmDialog
        open={confirmPickup}
        onCancel={() => setConfirmPickup(false)}
        title="Confirm pickup?"
        description="Only confirm once the cold box is sealed and the unit count matches the dispatch note."
        confirmLabel="Confirm pickup"
        cancelLabel="Not yet"
        tone="primary"
        icon="package"
        onConfirm={() => {
          app.updateShipmentStatus(shipment.id, 'picked_up', note || 'Collected from the blood bank; cold box sealed.');
          setConfirmPickup(false);
        }}
      />

      <Modal
        open={deliverOpen}
        onClose={() => {
          setDeliverOpen(false);
          setOtpError('');
        }}
        title="Confirm delivery"
        description="Enter the handover code from the nursing desk."
        icon="check-circle"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeliverOpen(false);
                setOtpError('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (otp.trim() !== shipment.delivery.otp) {
                  setOtpError('That code does not match the demo handover code.');
                  return;
                }
                app.updateShipmentStatus(
                  shipment.id,
                  'delivered',
                  note || 'Delivered to the ward nursing desk; unit count verified.',
                );
                setDeliverOpen(false);
                setOtp('');
              }}
            >
              Complete delivery
            </Button>
          </>
        }
      >
        <div className="stack gap-4">
          <Field
            label="Handover code"
            htmlFor="otp"
            error={otpError}
            hint={`Demo code for this shipment: ${shipment.delivery.otp}`}
          >
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit code"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setOtpError('');
              }}
              invalid={!!otpError}
              style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }}
            />
          </Field>
          <Alert tone="demo" title="Simulated handover">
            The code is printed on the shipment in this demo. No real signature or proof of delivery is
            recorded.
          </Alert>
        </div>
      </Modal>
    </>
  );
}
