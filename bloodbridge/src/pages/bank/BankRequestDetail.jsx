import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  Select,
  ShipmentStatusBadge,
  StatusBadge,
  Textarea,
} from '../../components/ui/index.js';
import TrackingSteps from '../../components/domain/TrackingSteps.jsx';
import ShipmentProgress from '../../components/domain/ShipmentProgress.jsx';
import ActivityTimeline from '../../components/domain/ActivityTimeline.jsx';
import RequestDetails from '../../components/domain/RequestDetails.jsx';
import { useApp } from '../../state/store.jsx';
import { getBank, getHospital, getShipment, orgName } from '../../state/selectors.js';
import { componentLabel, formatDateTime } from '../../data/reference.js';

export default function BankRequestDetail() {
  const { id } = useParams();
  const app = useApp();
  const navigate = useNavigate();
  const request = app.requests.find((r) => r.id === id);
  const bank = request ? getBank(app, request.bankId) : null;
  const hospital = request ? getHospital(app, request.hospitalId) : null;

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [compatOpen, setCompatOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [declineReason, setDeclineReason] = useState('');
  const [forwardBankId, setForwardBankId] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [compatResult, setCompatResult] = useState('passed');
  const [compatMethod, setCompatMethod] = useState('AHG gel card cross-match');
  const [compatUnit, setCompatUnit] = useState('');
  const [compatNotes, setCompatNotes] = useState('');
  const [operatorId, setOperatorId] = useState('user-operator');
  const [coldBox, setColdBox] = useState('CB-09');
  const [pickupWindow, setPickupWindow] = useState('Next 45 minutes');
  const [deliveryWindow, setDeliveryWindow] = useState('Within 2 hours');

  if (!request) {
    return (
      <Card>
        <EmptyState
          icon="search"
          title="Request not found"
          description="It may be assigned to a different blood bank or the demo data was reset."
          action={
            <Link to="/bank/requests" className="btn btn--primary">
              Back to requests
            </Link>
          }
        />
      </Card>
    );
  }

  const myBankId = app.currentUser.bankId;
  const isForwardedToMe = request.forwardedToBankId === myBankId && request.status === 'forwarded';
  const assignedToMe = request.bankId === myBankId;
  const stockRows = app.inventory.filter(
    (row) =>
      row.bankId === myBankId &&
      row.bloodGroup === request.bloodGroup &&
      row.component === request.component,
  );
  const availableUnits = stockRows.reduce((s, r) => s + r.units, 0);
  const enoughStock = availableUnits >= request.units;
  const shipment = request.shipmentId ? getShipment(app, request.shipmentId) : null;
  const partners = app.banks.filter(
    (b) => b.id !== myBankId && (bank?.partnerBankIds?.includes(b.id) || b.status === 'verified'),
  );
  const operators = app.users.filter((u) => u.role === 'operator');

  const status = request.status;
  const canAccept = assignedToMe && status === 'bank_review';
  const canAcceptForwarded = isForwardedToMe;
  const canTest = status === 'testing' && assignedToMe;
  const canDispatch = status === 'ready' && assignedToMe;

  return (
    <>
      <PageHeader
        backTo="/bank/requests"
        backLabel="Back to requests"
        title={
          <span className="row gap-3 wrap">
            Request <span className="mono">{request.id}</span>
            <StatusBadge status={request.status} size="lg" />
          </span>
        }
        description={`${request.bloodGroup} · ${request.units} unit(s) ${componentLabel(request.component)} · ${orgName(app, request.hospitalId)}`}
        actions={
          <>
            {canAccept && (
              <Button icon="check" onClick={() => setAcceptOpen(true)}>
                Accept request
              </Button>
            )}
            {canAcceptForwarded && (
              <Button icon="check" onClick={() => setAcceptOpen(true)}>
                Accept forwarded request
              </Button>
            )}
            {canTest && (
              <Button icon="flask" onClick={() => setCompatOpen(true)}>
                Record compatibility
              </Button>
            )}
            {canDispatch && (
              <Button icon="truck" onClick={() => setCreateOpen(true)}>
                Create shipment
              </Button>
            )}
            {(status === 'bank_review' || isForwardedToMe) && (
              <>
                <Button variant="secondary" icon="send" onClick={() => setForwardOpen(true)}>
                  Forward
                </Button>
                <Button variant="secondary" icon="x" onClick={() => setDeclineOpen(true)}>
                  Decline
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-sidebar">
        <div className="stack gap-4">
          {status === 'approval' && (
            <Alert tone="warning" title="Awaiting clinical approval at the hospital">
              Testing passed. A shipment cannot be created until the hospital records clinical
              approval. This separation protects the clinical decision.
            </Alert>
          )}
          {canAccept && !enoughStock && (
            <Alert tone="danger" title="Not enough stock for this request">
              {availableUnits} unit(s) of {request.bloodGroup} {componentLabel(request.component)} available;
              {request.units} requested. Forward to a partner bank instead of accepting, or add stock
              first.
            </Alert>
          )}
          {isForwardedToMe && (
            <Alert tone="info" title={`Forwarded by ${bank?.name || 'a partner bank'}`}>
              A partner bank could not fulfil this request and forwarded it to you. Check your stock
              before accepting.
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Request progress"
              subtitle="Same timeline the hospital and patient see"
            />
            <div className="card__body">
              <TrackingSteps request={request} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Stock check"
              subtitle={`Your inventory for ${request.bloodGroup} · ${componentLabel(request.component)}`}
              action={
                <Badge tone={enoughStock ? 'success' : 'danger'} dot>
                  {enoughStock ? 'Enough stock' : 'Insufficient'}
                </Badge>
              }
            />
            <div className="card__body">
              <div className="row-between wrap gap-3 mb-3">
                <div className="row gap-3">
                  <BloodPill group={request.bloodGroup} />
                  <div>
                    <div className="text-2xl text-strong" style={{ fontSize: 'var(--fs-2xl)' }}>
                      {availableUnits} unit(s) available
                    </div>
                    <div className="text-xs text-muted">
                      {request.units} requested · {Math.max(0, availableUnits - request.units)} would
                      remain after dispatch
                    </div>
                  </div>
                </div>
                <Link to="/bank/inventory" className="btn btn--secondary btn--sm">
                  <Icon name="layers" />
                  Manage stock
                </Link>
              </div>

              {stockRows.length === 0 ? (
                <Alert tone="warning" title="No record for this component">
                  There is no inventory record for {request.bloodGroup} {componentLabel(request.component)}.
                  Add stock, or forward the request.
                </Alert>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Batch</th>
                        <th>Units</th>
                        <th>Expiry</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockRows.map((row) => (
                        <tr key={row.id}>
                          <td className="text-strong">{row.batchId}</td>
                          <td>{row.units}</td>
                          <td>{formatDateTime(row.earliestExpiry)}</td>
                          <td className="text-xs text-muted">{formatDateTime(row.lastUpdated)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card__footer gate-note">
              <Icon name="info" className="icon icon--sm" />
              <span>
                Accepting does not move units out of stock. Inventory reduces only when a shipment is
                created, so the count stays accurate for other requests.
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Verification checkpoints"
              subtitle="Testing and clinical approval are tracked separately"
            />
            <div className="card__body">
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="card card--pad" style={{ boxShadow: 'none' }}>
                  <div className="row-between mb-2">
                    <span className="text-sm text-strong row gap-2">
                      <Icon name="flask" className="icon text-muted" />
                      Compatibility testing
                    </span>
                    <Badge
                      tone={
                        request.compatibilityTest?.status === 'passed'
                          ? 'success'
                          : request.compatibilityTest?.status === 'failed'
                            ? 'danger'
                            : 'warning'
                      }
                      dot
                    >
                      {request.compatibilityTest?.status === 'passed'
                        ? 'Passed'
                        : request.compatibilityTest?.status === 'failed'
                          ? 'Failed'
                          : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {request.compatibilityTest?.method || 'Cross-match method not recorded yet.'}
                  </p>
                  {request.compatibilityTest?.performedAt ? (
                    <div className="text-xs text-muted mt-2">
                      {request.compatibilityTest.performedBy} ·{' '}
                      {formatDateTime(request.compatibilityTest.performedAt)} · unit{' '}
                      {request.compatibilityTest.unitId}
                    </div>
                  ) : (
                    canTest && (
                      <Button
                        size="sm"
                        className="mt-3"
                        variant="secondary"
                        onClick={() => setCompatOpen(true)}
                      >
                        Record result
                      </Button>
                    )
                  )}
                </div>

                <div className="card card--pad" style={{ boxShadow: 'none' }}>
                  <div className="row-between mb-2">
                    <span className="text-sm text-strong row gap-2">
                      <Icon name="stethoscope" className="icon text-muted" />
                      Clinical approval
                    </span>
                    <Badge
                      tone={
                        request.clinicalApproval?.status === 'approved'
                          ? 'success'
                          : request.clinicalApproval?.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                      }
                      dot
                    >
                      {request.clinicalApproval?.status === 'approved'
                        ? 'Approved'
                        : request.clinicalApproval?.status === 'rejected'
                          ? 'Withheld'
                          : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {request.clinicalApproval?.status === 'approved'
                      ? `Approved by ${request.clinicalApproval.by}`
                      : 'Recorded by the hospital’s authorised clinician.'}
                  </p>
                  {request.clinicalApproval?.at && (
                    <div className="text-xs text-muted mt-2">
                      {formatDateTime(request.clinicalApproval.at)} ·{' '}
                      {request.clinicalApproval.registration}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {shipment && (
            <Card>
              <CardHeader
                title="Shipment"
                subtitle={`${shipment.id} · ${shipment.vehicle}`}
                action={<ShipmentStatusBadge status={shipment.status} />}
              />
              <div className="card__body">
                <ShipmentProgress shipment={shipment} />
                <div className="grid grid-3 mt-4" style={{ gap: 12 }}>
                  <div>
                    <div className="text-xs text-muted">Courier</div>
                    <div className="text-sm text-strong">
                      {app.users.find((u) => u.id === shipment.operatorId)?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Cold box</div>
                    <div className="text-sm text-strong">{shipment.coldBox}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Latest reading</div>
                    <div className="text-sm text-strong">
                      {shipment.temperature.at(-1)?.value ?? '—'} °C
                    </div>
                  </div>
                </div>
                <Link to="/bank/shipments" className="btn btn--secondary btn--sm mt-4">
                  Open shipments
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Activity log" subtitle="All recorded events" />
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
            <h3 className="card__title mb-2">Next step</h3>
            {canAccept && (
              <>
                <p className="text-xs text-muted">
                  {enoughStock
                    ? 'Stock is available. Accept to start compatibility testing.'
                    : 'Stock is short. Forward to a partner bank, or add stock first.'}
                </p>
                <Button
                  className="mt-3"
                  block
                  variant={enoughStock ? 'primary' : 'secondary'}
                  onClick={() => setAcceptOpen(true)}
                >
                  Accept request
                </Button>
                <Button className="mt-2" block variant="secondary" onClick={() => setForwardOpen(true)}>
                  Forward to partner bank
                </Button>
              </>
            )}
            {canAcceptForwarded && (
              <>
                <p className="text-xs text-muted">
                  This was forwarded to your bank. Accept it to begin compatibility testing.
                </p>
                <Button className="mt-3" block onClick={() => setAcceptOpen(true)}>
                  Accept forwarded request
                </Button>
              </>
            )}
            {canTest && (
              <>
                <p className="text-xs text-muted">
                  Record the cross-match result. A passed result moves the request to clinical
                  approval.
                </p>
                <Button className="mt-3" block icon="flask" onClick={() => setCompatOpen(true)}>
                  Record compatibility
                </Button>
              </>
            )}
            {status === 'approval' && (
              <Badge tone="warning" dot>
                Waiting for hospital approval
              </Badge>
            )}
            {canDispatch && (
              <>
                <p className="text-xs text-muted">
                  Clinical approval is recorded. Create a shipment to dispatch the units.
                </p>
                <Button className="mt-3" block icon="truck" onClick={() => setCreateOpen(true)}>
                  Create shipment
                </Button>
              </>
            )}
            {['shipment_created', 'picked_up', 'in_transit', 'delivered'].includes(status) && (
              <>
                <p className="text-xs text-muted">
                  Dispatch is in progress. The delivery operator updates pickup, transit and delivery.
                </p>
                <Link to="/bank/shipments" className="btn btn--secondary btn--block mt-3">
                  Track shipment
                </Link>
              </>
            )}
            {['rejected', 'cancelled', 'completed'].includes(status) && (
              <p className="text-xs text-muted">
                {request.rejectionReason || 'This request is closed.'}
              </p>
            )}
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Hospital contact</h3>
            <div className="info-row">
              <span className="info-row__label">Hospital</span>
              <span className="info-row__value">{hospital?.short}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Coordinator</span>
              <span className="info-row__value">{hospital?.contactPerson}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Phone</span>
              <span className="info-row__value">{hospital?.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Requester</span>
              <span className="info-row__value">{request.requesterName}</span>
            </div>
          </Card>

          <DemoNotice compact />
        </div>
      </div>

      {/* Accept */}
      <ConfirmDialog
        open={acceptOpen}
        onCancel={() => setAcceptOpen(false)}
        title={canAcceptForwarded ? 'Accept forwarded request?' : 'Accept this request?'}
        description={
          enoughStock
            ? `You have ${availableUnits} unit(s) of ${request.bloodGroup} ${componentLabel(request.component)}. Compatibility testing becomes the next step.`
            : 'Stock is currently short. You can still accept, but you may need to add stock or forward.'
        }
        confirmLabel="Accept and start testing"
        cancelLabel="Not now"
        tone="primary"
        icon="check-circle"
        onConfirm={() => {
          if (canAcceptForwarded) app.acceptForwarded(request.id);
          else app.bankAccept(request.id);
          setAcceptOpen(false);
        }}
      />

      {/* Decline */}
      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this request"
        description="The hospital will be notified with your reason."
        icon="xcircle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!declineReason.trim()}
              onClick={() => {
                app.rejectRequest(request.id, declineReason.trim());
                setDeclineOpen(false);
                navigate('/bank/requests');
              }}
            >
              Decline request
            </Button>
          </>
        }
      >
        <Field
          label="Reason for declining"
          htmlFor="decline-reason"
          hint="This is shared with the hospital so they can try another bank."
        >
          <Textarea
            id="decline-reason"
            rows={3}
            placeholder="e.g. No O- whole blood in stock; nearest partner bank has 3 units."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
        </Field>
      </Modal>

      {/* Forward */}
      <Modal
        open={forwardOpen}
        onClose={() => setForwardOpen(false)}
        title="Forward to a partner blood bank"
        description="The request moves to their queue with the same clinical details."
        icon="send"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForwardOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!forwardBankId}
              onClick={() => {
                app.forwardRequest(request.id, forwardBankId, forwardNote || 'Stock unavailable at originating bank.');
                setForwardOpen(false);
                navigate('/bank/requests');
              }}
            >
              Forward request
            </Button>
          </>
        }
      >
        <div className="stack gap-4">
          <Field label="Partner blood bank" htmlFor="forward-bank">
            <Select id="forward-bank" value={forwardBankId} onChange={(e) => setForwardBankId(e.target.value)}>
              <option value="">Choose a partner bank</option>
              {partners.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.city}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note for the partner bank" htmlFor="forward-note" optional>
            <Textarea
              id="forward-note"
              rows={2}
              placeholder="e.g. Only 1 unit available here; request needs 2."
              value={forwardNote}
              onChange={(e) => setForwardNote(e.target.value)}
            />
          </Field>
          <Alert tone="info">
            Forwarding keeps the original bank in the record. The partner bank must accept the request
            before testing begins.
          </Alert>
        </div>
      </Modal>

      {/* Compatibility */}
      <Modal
        open={compatOpen}
        onClose={() => setCompatOpen(false)}
        title="Record compatibility testing"
        description="Simulated cross-match result for the demo workflow."
        icon="flask"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompatOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={compatResult === 'passed' ? 'primary' : 'danger'}
              onClick={() => {
                app.recordCompatibility(request.id, {
                  result: compatResult,
                  method: compatMethod,
                  unitId: compatUnit || `U-${Math.floor(10000 + Math.random() * 89999)}`,
                  notes: compatNotes,
                });
                setCompatOpen(false);
              }}
            >
              Record result
            </Button>
          </>
        }
      >
        <div className="stack gap-4">
          <Alert tone="demo" title="Demo step">
            In production this would be entered by a qualified technologist with the cross-match
            record attached. Nothing here is a real clinical result.
          </Alert>
          <div className="form-grid">
            <Field label="Result" htmlFor="compat-result">
              <Select id="compat-result" value={compatResult} onChange={(e) => setCompatResult(e.target.value)}>
                <option value="passed">Passed — compatible</option>
                <option value="failed">Failed — not compatible</option>
              </Select>
            </Field>
            <Field label="Unit reference" htmlFor="compat-unit">
              <Input
                id="compat-unit"
                placeholder={stockRows[0]?.batchId || 'U-00000'}
                value={compatUnit}
                onChange={(e) => setCompatUnit(e.target.value)}
              />
            </Field>
            <Field label="Method" htmlFor="compat-method" full>
              <Select id="compat-method" value={compatMethod} onChange={(e) => setCompatMethod(e.target.value)}>
                {['AHG gel card cross-match', 'Immediate spin cross-match', 'Computer-assisted cross-match'].map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ),
                )}
              </Select>
            </Field>
          </div>
          <Field label="Notes" htmlFor="compat-notes" optional>
            <Textarea
              id="compat-notes"
              rows={2}
              placeholder="e.g. Cross-match compatible; screening within range."
              value={compatNotes}
              onChange={(e) => setCompatNotes(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      {/* Create shipment */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create shipment"
        description="Assign a courier and handover windows. Dispatch requires recorded clinical approval."
        icon="truck"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const shipmentId = app.createShipment(request.id, {
                  operatorId,
                  coldBox,
                  pickupWindow,
                  deliveryWindow,
                  distanceKm: 8.4,
                });
                setCreateOpen(false);
                if (shipmentId) navigate('/bank/shipments');
              }}
            >
              Create shipment
            </Button>
          </>
        }
      >
        <div className="stack gap-4">
          <div className="pay-summary">
            <div className="pay-row">
              <span className="text-muted">Request</span>
              <span className="text-strong">{request.id}</span>
            </div>
            <div className="pay-row">
              <span className="text-muted">Units</span>
              <span className="text-strong">
                {request.units} × {request.bloodGroup} {componentLabel(request.component)}
              </span>
            </div>
            <div className="pay-row">
              <span className="text-muted">Deliver to</span>
              <span className="text-strong">{request.ward}</span>
            </div>
            <div className="pay-row pay-row--total">
              <span>Clinical approval</span>
              <span className="text-success">Recorded</span>
            </div>
          </div>

          <div className="form-grid">
            <Field label="Delivery operator" htmlFor="ship-operator">
              <Select id="ship-operator" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.vehicle}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cold box reference" htmlFor="ship-cold">
              <Input id="ship-cold" value={coldBox} onChange={(e) => setColdBox(e.target.value)} />
            </Field>
            <Field label="Pickup window" htmlFor="ship-pickup">
              <Input id="ship-pickup" value={pickupWindow} onChange={(e) => setPickupWindow(e.target.value)} />
            </Field>
            <Field label="Expected delivery" htmlFor="ship-delivery">
              <Input
                id="ship-delivery"
                value={deliveryWindow}
                onChange={(e) => setDeliveryWindow(e.target.value)}
              />
            </Field>
          </div>

          <Alert tone="info" title="Inventory will update">
            Creating the shipment reduces your {request.bloodGroup} {componentLabel(request.component)} count
            by {request.units} unit(s).
          </Alert>
        </div>
      </Modal>
    </>
  );
}
