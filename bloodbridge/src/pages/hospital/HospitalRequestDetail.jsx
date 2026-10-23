import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { getBank, getHospital, getShipment } from '../../state/selectors.js';
import { formatDateTime, isOpen } from '../../data/reference.js';

function GateCard({ title, subtitle, state, children, icon }) {
  const tone = state === 'passed' || state === 'approved' ? 'success' : state === 'failed' || state === 'withheld' ? 'danger' : 'warning';
  return (
    <div className="card card--pad" style={{ boxShadow: 'none' }}>
      <div className="row-between mb-2">
        <div className="row gap-2">
          <Icon name={icon} className="icon text-muted" />
          <span className="text-sm text-strong">{title}</span>
        </div>
        <Badge tone={tone} dot>
          {state === 'passed'
            ? 'Passed'
            : state === 'approved'
              ? 'Approved'
              : state === 'failed'
                ? 'Failed'
                : state === 'withheld'
                  ? 'Withheld'
                  : 'Pending'}
        </Badge>
      </div>
      <p className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
        {subtitle}
      </p>
      {children}
    </div>
  );
}

export default function HospitalRequestDetail() {
  const { id } = useParams();
  const app = useApp();
  const navigate = useNavigate();
  const request = app.requests.find((r) => r.id === id);
  const [assignOpen, setAssignOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [bankId, setBankId] = useState('');
  const [decision, setDecision] = useState('approved');
  const [approver, setApprover] = useState(app.currentUser?.name || '');
  const [registration, setRegistration] = useState(app.currentUser?.registrationNo || '');
  const [notes, setNotes] = useState('');

  if (!request) {
    return (
      <Card>
        <EmptyState
          icon="search"
          title="Request not found"
          description="It may belong to another hospital, or the demo data was reset."
          action={
            <Link to="/hospital/requests" className="btn btn--primary">
              Back to requests
            </Link>
          }
        />
      </Card>
    );
  }

  const hospital = getHospital(app, request.hospitalId);
  const bank = getBank(app, request.bankId);
  const forwarded = getBank(app, request.forwardedToBankId);
  const shipment = request.shipmentId ? getShipment(app, request.shipmentId) : null;
  const needsAssignment = ['submitted', 'hospital_review'].includes(request.status);
  const needsApproval = request.status === 'approval';
  const connectedBanks = app.banks.filter((b) => hospital?.connectedBankIds?.includes(b.id));

  return (
    <>
      <PageHeader
        backTo="/hospital/requests"
        backLabel="Back to requests"
        title={
          <span className="row gap-3 wrap">
            Request <span className="mono">{request.id}</span>
            <StatusBadge status={request.status} size="lg" />
          </span>
        }
        description={`${request.patientName} · ${request.ward} · raised ${formatDateTime(request.createdAt)}`}
        actions={
          <>
            {needsAssignment && (
              <Button icon="bank" onClick={() => setAssignOpen(true)}>
                Assign blood bank
              </Button>
            )}
            {needsApproval && (
              <Button icon="stethoscope" onClick={() => setApprovalOpen(true)}>
                Record clinical approval
              </Button>
            )}
            {isOpen(request.status) && (
              <Button variant="secondary" icon="x" onClick={() => setCancelOpen(true)}>
                Cancel request
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-sidebar">
        <div className="stack gap-4">
          {needsApproval && (
            <Alert tone="warning" title="Action needed: clinical approval">
              Compatibility testing passed at {bank?.name}. A courier cannot be dispatched until an
              authorised clinician records approval.
            </Alert>
          )}
          {needsAssignment && (
            <Alert tone="info" title="New request — assign a blood bank">
              Confirm the clinical details, then assign one of your connected blood banks. You can
              also leave it unassigned if you need to verify with the ward first.
            </Alert>
          )}

          <Card>
            <CardHeader title="Request progress" subtitle="Shared with the patient and blood bank" />
            <div className="card__body">
              <TrackingSteps request={request} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Verification checkpoints"
              subtitle="Testing and approval are recorded separately"
            />
            <div className="card__body">
              <div className="grid grid-2" style={{ gap: 12 }}>
                <GateCard
                  icon="flask"
                  title="Compatibility testing"
                  state={
                    request.compatibilityTest?.status === 'passed'
                      ? 'passed'
                      : request.compatibilityTest?.status === 'failed'
                        ? 'failed'
                        : 'pending'
                  }
                  subtitle={
                    request.compatibilityTest?.status === 'pending'
                      ? 'The blood bank records cross-match results here.'
                      : `${request.compatibilityTest?.method || 'Cross-match'} · unit ${request.compatibilityTest?.unitId || '—'}`
                  }
                >
                  {request.compatibilityTest?.performedAt && (
                    <div className="text-xs text-muted mt-3">
                      Recorded by {request.compatibilityTest.performedBy} ·{' '}
                      {formatDateTime(request.compatibilityTest.performedAt)}
                    </div>
                  )}
                  {request.compatibilityTest?.notes && (
                    <p className="text-xs mt-2" style={{ color: 'var(--text)' }}>
                      {request.compatibilityTest.notes}
                    </p>
                  )}
                </GateCard>

                <GateCard
                  icon="stethoscope"
                  title="Clinical approval"
                  state={
                    request.clinicalApproval?.status === 'approved'
                      ? 'approved'
                      : request.clinicalApproval?.status === 'rejected'
                        ? 'withheld'
                        : 'pending'
                  }
                  subtitle={
                    request.clinicalApproval?.status === 'pending'
                      ? 'Required before the blood bank can dispatch.'
                      : `Approved by ${request.clinicalApproval?.by}`
                  }
                >
                  {request.clinicalApproval?.at && (
                    <div className="text-xs text-muted mt-3">
                      {formatDateTime(request.clinicalApproval.at)} ·{' '}
                      {request.clinicalApproval.registration}
                    </div>
                  )}
                  {request.clinicalApproval?.notes && (
                    <p className="text-xs mt-2" style={{ color: 'var(--text)' }}>
                      {request.clinicalApproval.notes}
                    </p>
                  )}
                  {needsApproval && (
                    <Button
                      size="sm"
                      className="mt-3"
                      variant="secondary"
                      icon="stethoscope"
                      onClick={() => setApprovalOpen(true)}
                    >
                      Record approval
                    </Button>
                  )}
                </GateCard>
              </div>

              <div className="gate-note mt-4">
                <Icon name="info" className="icon icon--sm" />
                <span>
                  The order is deliberate: testing first, then clinical approval, then dispatch. Each
                  action is written to the demo audit trail with the person and time.
                </span>
              </div>
            </div>
          </Card>

          {shipment && (
            <Card>
              <CardHeader
                title="Shipment"
                subtitle={`${shipment.id} · ${bank?.name} → ${hospital?.short}`}
                action={<ShipmentStatusBadge status={shipment.status} />}
              />
              <div className="card__body">
                <ShipmentProgress shipment={shipment} />
                <div className="grid grid-2 mt-4" style={{ gap: 12 }}>
                  <div>
                    <div className="text-xs text-muted">Courier</div>
                    <div className="text-sm text-strong">
                      {app.users.find((u) => u.id === shipment.operatorId)?.name} · {shipment.vehicle}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Cold box</div>
                    <div className="text-sm text-strong">
                      {shipment.coldBox} · {shipment.temperature.at(-1)?.value ?? '—'} °C
                    </div>
                  </div>
                </div>
                <Link to="/hospital/shipments" className="btn btn--secondary btn--sm mt-4">
                  View all shipments
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Activity log" subtitle="All recorded events for this request" />
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
            <h3 className="card__title mb-2">Next action</h3>
            {needsAssignment && (
              <>
                <p className="text-xs text-muted">
                  Assign a connected blood bank so stock can be checked.
                </p>
                <Button className="mt-3" block icon="bank" onClick={() => setAssignOpen(true)}>
                  Assign blood bank
                </Button>
              </>
            )}
            {needsApproval && (
              <>
                <p className="text-xs text-muted">
                  Compatibility passed. Record clinical approval to release the request for dispatch.
                </p>
                <Button className="mt-3" block icon="stethoscope" onClick={() => setApprovalOpen(true)}>
                  Record approval
                </Button>
              </>
            )}
            {['bank_review', 'forwarded'].includes(request.status) && (
              <>
                <p className="text-xs text-muted">
                  Waiting for {forwarded?.name || bank?.name} to confirm stock. Nothing needed from the
                  hospital right now.
                </p>
                <Badge tone="info" dot>
                  With blood bank
                </Badge>
              </>
            )}
            {request.status === 'testing' && (
              <>
                <p className="text-xs text-muted">
                  {bank?.name} is running compatibility testing. Approval will be requested next.
                </p>
                <Badge tone="warning" dot>
                  Testing in progress
                </Badge>
              </>
            )}
            {['ready', 'shipment_created', 'picked_up', 'in_transit'].includes(request.status) && (
              <>
                <p className="text-xs text-muted">
                  Approved and released. Follow the shipment for delivery updates.
                </p>
                <Link to="/hospital/shipments" className="btn btn--secondary btn--block mt-3">
                  Track shipment
                </Link>
              </>
            )}
            {['delivered', 'completed'].includes(request.status) && (
              <>
                <p className="text-xs text-muted">
                  Delivered. The ward records the transfusion in the hospital system.
                </p>
                <Badge tone="success" dot>
                  Closed
                </Badge>
              </>
            )}
            {['rejected', 'cancelled'].includes(request.status) && (
              <p className="text-xs text-muted">
                {request.rejectionReason || 'This request is closed and needs no further action.'}
              </p>
            )}
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Coordination</h3>
            <div className="info-row">
              <span className="info-row__label">Hospital</span>
              <span className="info-row__value">{hospital?.short}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Blood bank</span>
              <span className="info-row__value">{bank?.short || 'Not assigned'}</span>
            </div>
            {forwarded && (
              <div className="info-row">
                <span className="info-row__label">Forwarded to</span>
                <span className="info-row__value">{forwarded.short}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-row__label">Requester</span>
              <span className="info-row__value">{request.requesterName}</span>
            </div>
          </Card>

          <DemoNotice compact />
        </div>
      </div>

      {/* Assign bank */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign a blood bank"
        description="The request is sent to this bank for a stock check."
        icon="bank"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!bankId}
              onClick={() => {
                app.assignBank(request.id, bankId);
                setAssignOpen(false);
              }}
            >
              Assign bank
            </Button>
          </>
        }
      >
        <div className="stack gap-4">
          <Field label="Connected blood bank" htmlFor="assign-bank">
            <Select id="assign-bank" value={bankId} onChange={(e) => setBankId(e.target.value)}>
              <option value="">Choose a blood bank</option>
              {connectedBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.city}
                </option>
              ))}
            </Select>
          </Field>
          <Alert tone="info">
            Requests for rare groups may need forwarding. The blood bank can forward to a partner bank
            if stock is unavailable.
          </Alert>
        </div>
      </Modal>

      {/* Clinical approval */}
      <Modal
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        title="Record clinical approval"
        description="This is a simulated approval for the demo workflow."
        icon="stethoscope"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApprovalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decision === 'approved' ? 'primary' : 'danger'}
              onClick={() => {
                app.recordClinicalApproval(request.id, { decision, notes, approver });
                setApprovalOpen(false);
              }}
            >
              {decision === 'approved' ? 'Record approval' : 'Withhold approval'}
            </Button>
          </>
        }
      >
        <div className="stack gap-4">
          <div className="alert alert--demo">
            <Icon name="flask" className="icon alert__icon" />
            <div>
              <div className="alert__title">Demonstration only</div>
              <div className="alert__body">
                No real clinical decision is recorded. In production this action would require an
                authenticated clinician and would be permanently audited.
              </div>
            </div>
          </div>
          <Field label="Decision" htmlFor="approval-decision">
            <Select
              id="approval-decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="approved">Approve for dispatch</option>
              <option value="rejected">Withhold approval</option>
            </Select>
          </Field>
          <div className="form-grid">
            <Field label="Approving clinician" htmlFor="approval-by">
              <Input id="approval-by" value={approver} onChange={(e) => setApprover(e.target.value)} />
            </Field>
            <Field label="Registration reference" htmlFor="approval-reg">
              <Input
                id="approval-reg"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Notes"
            htmlFor="approval-notes"
            optional
            hint="For the demo, any note is stored with the request."
          >
            <Textarea
              id="approval-notes"
              rows={2}
              placeholder="e.g. Approved for 2 units PRBC"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        title="Cancel this request?"
        description="The blood bank will be told to stop work on it. This cannot be undone in the demo."
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        icon="xcircle"
        onConfirm={() => {
          app.cancelRequest(request.id, 'Cancelled by hospital team.');
          setCancelOpen(false);
          navigate('/hospital/requests');
        }}
      />
    </>
  );
}
