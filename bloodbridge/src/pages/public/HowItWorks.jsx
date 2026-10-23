import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Alert, Badge, Card } from '../../components/ui/index.js';
const API_STATUSES = [
  'submitted', 'under_review', 'accepted', 'forwarded', 'awaiting_sample',
  'compatibility_confirmed', 'ready_for_dispatch', 'dispatched', 'in_transit',
  'delivered', 'cancelled', 'unfulfilled',
];

const WORKFLOW = [
  {
    icon: 'qr',
    title: '1. A public request is submitted',
    role: 'Public requester',
    text: 'A hospital QR can identify the target hospital. Without a QR, the backend selects its first active hospital. A supporting document is required.',
    detail: ['Patient name, contact, blood group, component, units and urgency are sent to the API.', 'The API returns a reference and, when available, a bearer tracking token.'],
  },
  {
    icon: 'bank',
    title: '2. Requests are reviewed and routed',
    role: 'Hospital, bank and Super Admin',
    text: 'The API scopes request records by authenticated role. Hospital-to-bank assignment is managed by Super Admin; bank staff can reserve eligible stock or forward eligible requests.',
    detail: ['Reservation needs enough unexpired inventory and sets accepted.', 'Forwarding uses backend location and compatible-stock rules.'],
  },
  {
    icon: 'flask',
    title: '3. Sample and compatibility are separate',
    role: 'Hospital and blood bank',
    text: 'Authorized staff record sample collection. Blood-bank staff or Super Admin then records a compatibility outcome using the backend-supported values.',
    detail: ['Sample collection sets the request to awaiting_sample.', 'Compatibility outcomes are pending, in_progress, confirmed or failed; confirmation is distinct from reservation.'],
  },
  {
    icon: 'stethoscope',
    title: '4. Shipment creation is gated',
    role: 'Blood bank or Super Admin',
    text: 'The backend permits shipment creation only after compatibility_confirmed. It has no separate clinical-approval endpoint or clinician identity field.',
    detail: ['Compatibility confirmation is not ordinary inventory acceptance.', 'Do not interpret this API gate as clinical authorization or use it for real care without an approved process.'],
  },
  {
    icon: 'truck',
    title: '5. Shipment status is updated',
    role: 'Blood bank, hospital or Super Admin',
    text: 'Authorized users update a known shipment through permitted backend status transitions. There is no shipment-list endpoint, vehicle directory or delivery-operator role.',
    detail: ['The backend validates each status transition.', 'Shipment updates and telemetry lookups require a database ID.'],
  },
  {
    icon: 'shield-check',
    title: '6. Alerts and telemetry',
    role: 'Authorized portal users and device clients',
    text: 'Authenticated users can read permitted temperature alerts and query telemetry for a known shipment. Device clients submit readings using device credentials.',
    detail: ['The backend emits temperature:reading and temperature:alert Socket.IO events.', 'This frontend does not ingest sensor readings or expose audit-log browsing.'],
  },
];

export default function HowItWorks() {
  return (
    <>
      <section className="section section--tight" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="public-container" style={{ maxWidth: 800 }}>
          <span className="eyebrow">
            <Icon name="route" className="icon icon--sm" />
            How it works
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', letterSpacing: '-0.03em', margin: '18px 0 14px' }}>
            Workflow stages supported by the API
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-lg)', lineHeight: 1.65 }}>
            Available operations and transitions are governed by the supplied backend. The interface does not add clinical or operational capabilities that its API does not provide.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="public-container">
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="stack gap-4">
              {WORKFLOW.map((step) => (
                <Card key={step.title} className="card--pad">
                  <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
                    <span className="stat__icon" style={{ width: 36, height: 36 }}>
                      <Icon name={step.icon} />
                    </span>
                    <div className="grow">
                      <div className="row-between" style={{ alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: 'var(--fs-lg)' }}>{step.title}</h3>
                      </div>
                      <Badge tone="neutral">{step.role}</Badge>
                      <p className="text-sm text-muted mt-3" style={{ lineHeight: 1.6 }}>
                        {step.text}
                      </p>
                      <ul className="stack gap-2 mt-3">
                        {step.detail.map((d) => (
                          <li key={d} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                            <Icon name="check" className="icon icon--sm" style={{ color: 'var(--success)', marginTop: 3 }} />
                            <span className="text-xs text-muted">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="stack gap-4" style={{ position: 'sticky', top: 88 }}>
              <Card>
                <div className="card__header">
                  <div>
                    <h3 className="card__title">Backend request statuses</h3>
                    <p className="card__subtitle">Exact values returned by the API</p>
                  </div>
                </div>
                <div className="card__body">
                  <div className="row gap-2 wrap">{API_STATUSES.map((status) => <Badge key={status} tone="neutral">{status}</Badge>)}</div>
                </div>
              </Card>

              <Card className="card--pad">
                <h3 style={{ fontSize: 'var(--fs-md)' }}>Status meanings, in plain language</h3>
                <dl className="stack gap-3 mt-3">
                  {[
                    ['accepted', 'A matching inventory reservation was created.'],
                    ['compatibility_confirmed', 'Compatibility is confirmed; the backend has no separate clinical approval route.'],
                    ['ready_for_dispatch', 'A shipment was created after compatibility confirmation.'],
                    ['in_transit', 'The shipment status was advanced through the API.'],
                  ].map(([term, def]) => (
                    <div key={term}>
                      <dt className="text-sm text-strong">{term}</dt>
                      <dd className="text-xs text-muted">{def}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Alert tone="warning">
                Backend connectivity is not clinical validation. Use only synthetic development data until the system, environment and care workflows are formally reviewed.
              </Alert>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="public-container">
          <div className="cta-band">
            <div>
              <h2>Walk through it yourself</h2>
              <p>
                Start with a public request, then follow actions actually supported by the API.
              </p>
            </div>
            <div className="row gap-2 wrap">
              <Link to="/request-blood" className="btn btn--secondary btn--lg">
                Start a request
              </Link>
              <Link to="/login" className="btn btn--ghost btn--lg">
                Portal login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
