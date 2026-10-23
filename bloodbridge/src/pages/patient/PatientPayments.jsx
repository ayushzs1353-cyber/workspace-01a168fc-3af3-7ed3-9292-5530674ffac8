import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  Button,
  DemoNotice,
  EmptyState,
  Modal,
  StatusBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { visibleRequests } from '../../state/selectors.js';
import { currency, componentLabel } from '../../data/reference.js';

const METHODS = [
  { id: 'upi', label: 'UPI (demo)', icon: 'activity', note: 'Simulated — nothing is charged' },
  { id: 'card', label: 'Card (demo)', icon: 'credit-card', note: 'No card details are collected' },
  { id: 'netbanking', label: 'Net banking (demo)', icon: 'bank', note: 'Redirect is not performed' },
];

function CheckoutModal({ request, open, onClose, onPaid }) {
  const app = useApp();
  const [method, setMethod] = useState('upi');
  const [stage, setStage] = useState('review'); // review | processing | done
  const [paymentId, setPaymentId] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) {
      setStage('review');
      setPaymentId(null);
      setChecked(false);
    }
  }, [open]);

  if (!request) return null;

  const unitRate = 425;
  const handling = 175;

  const pay = () => {
    setStage('processing');
    window.setTimeout(() => {
      const id = app.payRequest(request.id, method);
      setPaymentId(id);
      setStage('done');
      onPaid?.(id);
    }, 1100);
  };

  return (
    <Modal
      open={open}
      onClose={stage === 'processing' ? undefined : onClose}
      title={stage === 'done' ? 'Demo payment recorded' : 'Payment summary'}
      description={
        stage === 'done'
          ? 'No money moved. This receipt exists only inside the prototype.'
          : `Request ${request.id} · ${request.bloodGroup} ${componentLabel(request.component)}`
      }
      icon={stage === 'done' ? 'check-circle' : 'credit-card'}
      footer={
        stage === 'done' ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={stage === 'processing'}>
              Cancel
            </Button>
            <Button
              onClick={pay}
              loading={stage === 'processing'}
              disabled={!checked}
              iconRight="arrow-right"
            >
              {stage === 'processing' ? 'Processing…' : `Pay ${currency(request.fee)} (demo)`}
            </Button>
          </>
        )
      }
    >
      {stage === 'done' ? (
        <div style={{ textAlign: 'center' }}>
          <span className="success-check">
            <Icon name="check" />
          </span>
          <div className="pay-summary" style={{ textAlign: 'left' }}>
            <div className="pay-row">
              <span className="text-muted">Payment reference</span>
              <span className="mono text-strong">{paymentId}</span>
            </div>
            <div className="pay-row">
              <span className="text-muted">Request</span>
              <span className="text-strong">{request.id}</span>
            </div>
            <div className="pay-row">
              <span className="text-muted">Method</span>
              <span className="text-strong" style={{ textTransform: 'capitalize' }}>
                {method === 'netbanking' ? 'Net banking' : method} (demo)
              </span>
            </div>
            <div className="pay-row pay-row--total">
              <span>Amount</span>
              <span>{currency(request.fee)}</span>
            </div>
          </div>
          <Alert tone="demo" title="Simulated transaction">
            This payment is a demonstration step so you can see the workflow. No payment gateway was
            contacted and no real receipt was issued.
          </Alert>
        </div>
      ) : (
        <div className="stack gap-4">
          <div className="pay-summary">
            <div className="pay-row">
              <span className="text-muted">
                {request.units} × unit processing charge ({request.bloodGroup})
              </span>
              <span>{currency(request.units * unitRate)}</span>
            </div>
            <div className="pay-row">
              <span className="text-muted">Handling & cold-chain (demo)</span>
              <span>{currency(handling)}</span>
            </div>
            <div className="pay-row">
              <span className="text-muted">Hospital coordination</span>
              <span>Included</span>
            </div>
            <div className="pay-row pay-row--total">
              <span>Total payable (demo)</span>
              <span>{currency(request.fee)}</span>
            </div>
          </div>

          <div>
            <p className="divider-label">Payment method</p>
            <div className="stack gap-2">
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`pay-method ${method === m.id ? 'pay-method--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="pay-method"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  <Icon name={m.icon} className="icon text-muted" />
                  <span className="grow">
                    <span className="text-sm text-strong" style={{ display: 'block' }}>
                      {m.label}
                    </span>
                    <span className="text-xs text-muted">{m.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="check">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>
              I understand this is a simulated payment for demonstration purposes and that no real
              money will be charged.
            </span>
          </label>

          {request.paymentStatus === 'paid' && (
            <Alert tone="success" title="Already paid">
              This request was already marked as paid in the demo ({request.paymentId}).
            </Alert>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function PatientPayments() {
  const app = useApp();
  const [params, setParams] = useSearchParams();
  const requests = visibleRequests(app, app.currentUser);
  const payId = params.get('pay');
  const active = requests.find((r) => r.id === payId) || null;
  const [selected, setSelected] = useState(active);

  useEffect(() => {
    if (active) setSelected(active);
  }, [active]);

  const pending = requests.filter((r) => r.paymentStatus === 'pending');
  const paid = requests.filter((r) => r.paymentStatus === 'paid');
  const totalDue = pending.reduce((s, r) => s + (r.fee || 0), 0);
  const totalPaid = paid.reduce((s, r) => s + (r.fee || 0), 0);

  const close = () => {
    setSelected(null);
    if (payId) {
      params.delete('pay');
      setParams(params, { replace: true });
    }
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description="Charges linked to your requests. Everything here is a demonstration."
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Due now (demo)</span>
            <span className="stat__icon stat__icon--warning">
              <Icon name="clock" className="icon icon--sm" />
            </span>
          </div>
          <span className="stat__value">{currency(totalDue)}</span>
          <span className="stat__meta">{pending.length} request(s) awaiting payment</span>
        </div>
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Paid (demo)</span>
            <span className="stat__icon stat__icon--success">
              <Icon name="check-circle" className="icon icon--sm" />
            </span>
          </div>
          <span className="stat__value">{currency(totalPaid)}</span>
          <span className="stat__meta">{paid.length} simulated payment(s)</span>
        </div>
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Payment methods</span>
            <span className="stat__icon stat__icon--neutral">
              <Icon name="credit-card" className="icon icon--sm" />
            </span>
          </div>
          <span className="stat__value" style={{ fontSize: 'var(--fs-xl)' }}>
            Demo only
          </span>
          <span className="stat__meta">No gateway connected</span>
        </div>
      </div>

      <div className="section-gap">
        <Card flush>
          <CardHeader
            title="Charges"
            subtitle="Linked to your blood requests"
            action={<Badge tone="neutral">Simulated</Badge>}
          />
          {requests.length === 0 ? (
            <EmptyState
              icon="credit-card"
              title="No charges yet"
              description="Payment details appear here once a request reaches the delivery stage."
              action={
                <Link to="/patient/new" className="btn btn--primary btn--sm">
                  Create a request
                </Link>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Requirement</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="mono text-strong">{r.id}</span>
                        <span className="table__meta">{r.ward}</span>
                      </td>
                      <td>
                        {r.units} × {r.bloodGroup} {componentLabel(r.component)}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="text-strong">{currency(r.fee)}</td>
                      <td>
                        <Badge
                          tone={
                            r.paymentStatus === 'paid'
                              ? 'success'
                              : r.paymentStatus === 'pending'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {r.paymentStatus === 'paid'
                            ? 'Paid (demo)'
                            : r.paymentStatus === 'pending'
                              ? 'Pending'
                              : 'Not required'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.paymentStatus === 'pending' ? (
                          <Button size="sm" onClick={() => setSelected(r)}>
                            Pay (demo)
                          </Button>
                        ) : (
                          <Link to={`/patient/requests/${r.id}`} className="btn btn--secondary btn--sm">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-2 mt-4">
        <Alert tone="demo" title="Why are there charges?">
          In a real deployment, processing and transport charges may apply depending on the hospital
          and blood bank. This prototype uses fixed sample amounts purely to demonstrate a payment
          summary and confirmation flow.
        </Alert>
        <Card className="card--pad">
          <h3 className="card__title mb-2">Payment support</h3>
          <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
            If a charge looks wrong, speak to the hospital billing desk before paying. This demo
            cannot issue refunds or receipts.
          </p>
          <div className="row gap-2 mt-3 text-sm text-strong">
            <Icon name="phone" className="icon icon--sm text-muted" />
            +91 141 402 8800
          </div>
        </Card>
      </div>

      <CheckoutModal
        request={selected}
        open={!!selected}
        onClose={close}
        onPaid={() => {}}
      />
    </>
  );
}
