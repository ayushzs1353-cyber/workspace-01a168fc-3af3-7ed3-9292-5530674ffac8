import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Alert, Card } from '../../components/ui/index.js';

const PRINCIPLES = [
  {
    icon: 'eye',
    title: 'Clarity over cleverness',
    text: 'Every screen answers one question: what needs my attention now? If a feature makes the next action harder to find, it does not belong here.',
  },
  {
    icon: 'users',
    title: 'Built around real roles',
    text: 'The connected portals reflect the backend roles: user, hospital_admin, blood_bank_admin and super_admin.',
  },
  {
    icon: 'shield-check',
    title: 'Clinical steps stay clinical',
    text: 'Inventory reservation and compatibility outcomes are distinct. The supplied API has no separate clinical approval endpoint.',
  },
  {
    icon: 'flask',
    title: 'Honest about being new',
    text: 'Backend connectivity does not imply clinical validation, certification, hospital coverage or partnerships.',
  },
];

export default function About() {
  return (
    <>
      <section className="section section--tight" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="public-container" style={{ maxWidth: 800 }}>
          <span className="eyebrow">
            <Icon name="info" className="icon icon--sm" />
            About BloodBridge
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', letterSpacing: '-0.03em', margin: '18px 0 14px' }}>
            A calmer way to coordinate something urgent
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-lg)', lineHeight: 1.65 }}>
            BloodBridge began with a simple observation: when a unit of blood is needed urgently, the
            coordination is often harder than the medicine. Requests travel by phone calls and
            messages, stock levels live in separate registers, and nobody has quite the same picture
            of what has been approved or where the shipment is.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-lg)', lineHeight: 1.65, marginTop: 14 }}>
            The platform is being built as a shared, role-aware coordination layer between hospitals
            and authorised blood banks — one place for requests, inventory visibility, approvals and
            delivery tracking, with every step attributable to a person and a time.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="public-container">
          <div className="section-head">
            <h2>What we are building, and what we are not</h2>
            <p>
              Being precise about scope is part of being trustworthy in healthcare. Here is the
              honest position of this project today.
            </p>
          </div>
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <Card>
              <div className="card__header">
                <div>
                  <h3 className="card__title">What the platform does</h3>
                  <p className="card__subtitle">Coordination and visibility</p>
                </div>
                <Icon name="check-circle" className="icon" style={{ color: 'var(--success)' }} />
              </div>
              <div className="card__body">
                <ul className="stack gap-3">
                  {[
                    'Reads inventory records by blood bank, group and component.',
                    'Accepts public requests with a required supporting document and optional hospital QR.',
                    'Supports inventory reservation, forwarding, sample collection and compatibility outcomes.',
                    'Creates shipments after compatibility confirmation and accepts permitted status updates.',
                    'Provides scoped notifications, complaints, alerts and shipment telemetry reads.',
                  ].map((item) => (
                    <li className="row gap-2" key={item} style={{ alignItems: 'flex-start' }}>
                      <Icon name="check" className="icon icon--sm" style={{ color: 'var(--success)', marginTop: 3 }} />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card>
              <div className="card__header">
                <div>
                  <h3 className="card__title">What it does not do</h3>
                  <p className="card__subtitle">No claims beyond the build</p>
                </div>
                <Icon name="info" className="icon" style={{ color: 'var(--text-subtle)' }} />
              </div>
              <div className="card__body">
                <ul className="stack gap-3">
                  {[
                    'It does not collect, test, store or transport blood itself.',
                    'It does not replace clinical judgement, testing protocols or regulation.',
                    'It holds no certifications, licences or regulatory approvals.',
                    'The API has no shipment, vehicle or device listing endpoints, and no delivery-operator role.',
                    'No inventory editing, payment, audit-listing, self-registration or separate clinical approval route is provided.',
                    'Telemetry readings are submitted by device clients; this frontend does not authenticate or submit sensor secrets.',
                  ].map((item) => (
                    <li className="row gap-2" key={item} style={{ alignItems: 'flex-start' }}>
                      <Icon name="minus" className="icon icon--sm" style={{ color: 'var(--text-subtle)', marginTop: 3 }} />
                      <span className="text-sm text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="section section--tinted" id="principles">
        <div className="public-container">
          <div className="section-head">
            <h2>Principles we design against</h2>
            <p>These are the rules we use when deciding what to build next.</p>
          </div>
          <div className="feature-grid">
            {PRINCIPLES.map((p) => (
              <article className="feature" key={p.title}>
                <span className="feature__icon">
                  <Icon name={p.icon} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="public-container" style={{ maxWidth: 820 }}>
          <h2 style={{ fontSize: 'var(--fs-2xl)', letterSpacing: '-0.025em' }}>Where the project stands</h2>
          <div className="mt-4 stack gap-3">
            <Alert tone="info" title="Stage: frontend integration">
              The frontend calls the supplied API for authentication, requests, organizations, operations, notifications, complaints and telemetry. The backend remains a separate application and must be configured and started independently.
            </Alert>
            <Alert tone="warning" title="Development use only">
              The included backend and frontend are software components, not evidence of clinical validation, certification, or authorization for real patient care.
            </Alert>
          </div>

          <div id="privacy" className="mt-8" style={{ paddingTop: 28 }}>
            <h3 style={{ fontSize: 'var(--fs-xl)' }}>Privacy & data handling</h3>
            <p className="text-muted text-sm mt-2" style={{ lineHeight: 1.65 }}>
              Authentication is held by the backend in an HTTP-only cookie; the frontend does not store authentication secrets in local storage. Request details and uploaded documents are sent to the configured backend. Deployments must complete privacy, security, retention and data-protection reviews before handling real patient information.
            </p>
          </div>

          <div id="terms" className="mt-6" style={{ paddingTop: 20 }}>
            <h3 style={{ fontSize: 'var(--fs-xl)' }}>Terms of use</h3>
            <p className="text-muted text-sm mt-2" style={{ lineHeight: 1.65 }}>
              BloodBridge is provided for software integration and evaluation only. Do not use it to
              request, approve or coordinate real blood products without formal validation and authorization. Nothing in this frontend
              constitutes medical advice.
            </p>
          </div>

          <div className="mt-6">
            <Link to="/contact" className="btn btn--primary">
              Talk to the team
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
