import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  ShipmentStatusBadge,
  StatusBadge,
} from '../../components/ui/index.js';
import TrackingSteps from '../../components/domain/TrackingSteps.jsx';
import ShipmentProgress from '../../components/domain/ShipmentProgress.jsx';
import ActivityTimeline from '../../components/domain/ActivityTimeline.jsx';
import RequestDetails from '../../components/domain/RequestDetails.jsx';
import { useApp } from '../../state/store.jsx';
import { getBank, getHospital, getShipment } from '../../state/selectors.js';
import { TEMP_RANGE, currency, formatDateTime, isOpen, timeAgo } from '../../data/reference.js';

export default function PatientRequestDetail() {
  const { id } = useParams();
  const app = useApp();
  const navigate = useNavigate();
  const request = app.requests.find((r) => r.id === id);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!request) {
    return (
      <Card>
        <EmptyState
          icon="search"
          title="Request not found"
          description="This request may have been removed, or you may be signed in with a different account."
          action={
            <Link to="/patient/requests" className="btn btn--primary">
              Back to my requests
            </Link>
          }
        />
      </Card>
    );
  }

  const shipment = request.shipmentId ? getShipment(app, request.shipmentId) : null;
  const hospital = getHospital(app, request.hospitalId);
  const bank = getBank(app, request.bankId);
  const open = isOpen(request.status);

  return (
    <>
      <PageHeader
        backTo="/patient/requests"
        backLabel="Back to my requests"
        title={
          <span className="row gap-3 wrap">
            Request <span className="mono">{request.id}</span>
            <StatusBadge status={request.status} size="lg" />
          </span>
        }
        description={`${request.bloodGroup} · ${request.units} unit(s) · raised ${timeAgo(request.createdAt)} · ${hospital?.name}`}
        actions={
          <>
            {request.paymentStatus === 'pending' && (
              <Link to={`/patient/payments?pay=${request.id}`} className="btn btn--primary">
                <Icon name="credit-card" />
                Pay {currency(request.fee)}
              </Link>
            )}
            {open && request.status !== 'in_transit' && (
              <Button variant="secondary" icon="x" onClick={() => setConfirmCancel(true)}>
                Cancel request
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-sidebar">
        <div className="stack gap-4">
          <Card>
            <CardHeader
              title="Request progress"
              subtitle="Six steps from submission to delivery at the ward"
            />
            <div className="card__body">
              <TrackingSteps request={request} />
            </div>
          </Card>

          {shipment && (
            <Card>
              <CardHeader
                title="Shipment & delivery"
                subtitle={`${shipment.id} · ${bank?.name} → ${hospital?.short}`}
                action={<ShipmentStatusBadge status={shipment.status} />}
              />
              <div className="card__body">
                <ShipmentProgress shipment={shipment} />

                <div className="grid grid-2 mt-5" style={{ gap: 14 }}>
                  <div className="card card--pad" style={{ boxShadow: 'none' }}>
                    <div className="row gap-2 mb-2">
                      <Icon name="map-pin" className="icon icon--sm text-muted" />
                      <span className="text-xs text-strong">Pickup</span>
                    </div>
                    <div className="text-sm text-strong">{bank?.name}</div>
                    <p className="text-xs text-muted mt-1">{bank?.address}</p>
                    <div className="text-xs text-muted mt-2">
                      {shipment.pickup.at ? formatDateTime(shipment.pickup.at) : shipment.pickup.window}
                    </div>
                  </div>
                  <div className="card card--pad" style={{ boxShadow: 'none' }}>
                    <div className="row gap-2 mb-2">
                      <Icon name="hospital" className="icon icon--sm text-muted" />
                      <span className="text-xs text-strong">Delivery</span>
                    </div>
                    <div className="text-sm text-strong">{shipment.delivery.ward}</div>
                    <p className="text-xs text-muted mt-1">{hospital?.address}</p>
                    <div className="text-xs text-muted mt-2">
                      {shipment.delivery.at
                        ? `Received ${formatDateTime(shipment.delivery.at)}`
                        : shipment.delivery.window}
                    </div>
                  </div>
                </div>

                <div className="row-between mt-4 wrap gap-3">
                  <span className={`temp-badge ${(shipment.temperature.at(-1)?.value || 4) > TEMP_RANGE.max ? 'temp-badge--alert' : ''}`}>
                    <Icon name="thermometer" className="icon icon--sm" />
                    Cold box {shipment.temperature.at(-1)?.value ?? 4} °C ·{' '}
                    {shipment.temperature.at(-1)?.value > TEMP_RANGE.max ? 'above range' : 'within 2–6 °C'}
                  </span>
                  <span className="text-xs text-muted">Simulated reading · not a live sensor</span>
                </div>

                <Alert tone="info" title="Handover code">
                  On delivery the ward uses code <strong className="mono">{shipment.delivery.otp}</strong> to
                  confirm receipt. In this demo the code is shown for illustration only.
                </Alert>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Activity" subtitle="Everything that has happened so far" />
            <div className="card__body">
              <ActivityTimeline items={request.timeline} />
            </div>
          </Card>
        </div>

        <div className="stack gap-4">
          <Card>
            <CardHeader title="Request details" />
            <div className="card__body">
              <RequestDetails request={request} state={app} />
            </div>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-3">Payment (demo)</h3>
            <div className="info-row">
              <span className="info-row__label">Estimated charge</span>
              <span className="info-row__value">{currency(request.fee)}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Status</span>
              <span className="info-row__value">
                <Badge tone={request.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {request.paymentStatus === 'paid'
                    ? `Paid · ${request.paymentId}`
                    : request.paymentStatus === 'pending'
                      ? 'Payment pending'
                      : 'No payment needed'}
                </Badge>
              </span>
            </div>
            {request.paymentStatus === 'pending' ? (
              <Link to={`/patient/payments?pay=${request.id}`} className="btn btn--primary btn--block mt-3">
                Pay demo charge
              </Link>
            ) : (
              <Link to="/patient/payments" className="btn btn--secondary btn--block mt-3">
                View payment summary
              </Link>
            )}
            <p className="text-xs text-subtle mt-2">
              Simulated payment only. No card, UPI or bank details are collected.
            </p>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-3">Coordinates</h3>
            <div className="info-row">
              <span className="info-row__label">Hospital desk</span>
              <span className="info-row__value">{hospital?.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Blood bank</span>
              <span className="info-row__value">{bank?.name || 'Not assigned'}</span>
            </div>
            {bank && (
              <div className="info-row">
                <span className="info-row__label">Bank phone</span>
                <span className="info-row__value">{bank.phone}</span>
              </div>
            )}
            <div className="gate-note mt-3">
              <Icon name="info" className="icon icon--sm" />
              <span>For urgent clinical questions, always contact the hospital team directly.</span>
            </div>
          </Card>

          <DemoNotice compact />
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onCancel={() => setConfirmCancel(false)}
        title="Cancel this blood request?"
        description="The hospital and blood bank will be notified that you no longer need these units. This cannot be undone."
        confirmLabel="Yes, cancel request"
        cancelLabel="Keep request"
        icon="xcircle"
        onConfirm={() => {
          app.cancelRequest(request.id, 'Cancelled by requester in the patient portal.');
          setConfirmCancel(false);
          navigate('/patient/requests');
        }}
      />
    </>
  );
}
