import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../../components/Icon.jsx';
import { Badge, BloodPill } from '../../components/ui/index.js';

const FEATURES = [
  {
    icon: 'layers',
    title: 'Inventory visibility',
    text: 'Authorized portal users can read the inventory records returned by the API. Inventory editing is not provided by this backend.',
  },
  {
    icon: 'clipboard',
    title: 'Request coordination',
    text: 'Public requests carry blood group, component, units, urgency, contact details and a required supporting document. A hospital QR can target a hospital.',
  },
  {
    icon: 'truck',
    title: 'Shipment tracking',
    text: 'Authorized users can update valid shipment transitions and query telemetry when they have a shipment ID. The API does not provide a shipment list.',
  },
  {
    icon: 'shield-check',
    title: 'Verification & approvals',
    text: 'Compatibility outcome is recorded separately from inventory reservation. The backend permits shipment creation after compatibility is confirmed; it has no separate clinical approval API.',
  },
];

const STEPS = [
  {
    title: 'Raise a request',
    text: 'A requester opens the public form with an optional hospital QR. Patient/contact details, blood group, component, units, urgency and an attachment are submitted to the API.',
  },
  {
    title: 'Blood bank responds',
    text: 'Authorized blood-bank staff can reserve unexpired matching inventory or forward an eligible request. Sample collection and compatibility outcomes are separate operations.',
  },
  {
    title: 'Track the delivery',
    text: 'A shipment can be created after compatibility confirmation. Authorized roles update allowed shipment statuses; the API does not expose shipment discovery.',
  },
];

const TRUST = [
  {
    icon: 'eye',
    title: 'Transparent status',
    text: 'Request visibility is scoped by the signed-in backend role. Public tracking exposes only the limited fields returned for a tracking token.',
  },
  {
    icon: 'lock',
    title: 'Access by role',
    text: 'Portal navigation reflects the backend roles: user, hospital_admin, blood_bank_admin and super_admin.',
  },
  {
    icon: 'stethoscope',
    title: 'Clinical steps respected',
    text: 'The backend records compatibility outcomes. It does not provide clinical approval or replace professional decisions.',
  },
  {
    icon: 'flask',
    title: 'Clear backend limitations',
    text: 'Features without API endpoints, including payments, inventory editing and shipment listing, are identified rather than simulated.',
  },
];

export default function Home() {
  const reduce = useReducedMotion();
  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: reduce ? 0 : 0.45, delay: reduce ? 0 : delay, ease: [0.22, 0.61, 0.36, 1] },
  });

  return (
    <>
      <section className="hero">
        <div className="public-container hero__grid">
          <div>
            <span className="eyebrow">
              <Icon name="activity" className="icon icon--sm" />
              Hospital ↔ blood bank coordination
            </span>
            <h1>
              Blood requests, coordinated <em>clearly</em> between hospitals and blood banks.
            </h1>
            <p className="hero__lead">
              BloodBridge gives hospital teams and authorised blood banks one shared view of
              requests, available stock and delivery status — so the right unit is found faster and
              everyone knows what happens next.
            </p>
            <div className="hero__actions">
              <Link to="/request-blood" className="btn btn--primary btn--lg">
                Request blood
                <Icon name="arrow-right" />
              </Link>
              <Link to="/login" className="btn btn--secondary btn--lg">
                Portal login
              </Link>
            </div>
            <p className="hero__note">
              <Icon name="flask" className="icon icon--sm" />
              Backend-connected interface · not for clinical use
            </p>
          </div>

          <div className="hero__art">
            <motion.div
              className="hero-card"
              initial={{ opacity: 0, y: reduce ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.1 }}
            >
              <div className="hero-card__head">
                <div className="row gap-2">
                  <span className="avatar" style={{ width: 28, height: 28 }}>
                    BB
                  </span>
                  <div>
                    <div className="text-sm text-strong">Illustrative request workflow</div>
                    <div className="text-xs text-muted">Artwork only · not a live record</div>
                  </div>
                </div>
                <Badge tone="info" dot>
                  Example status
                </Badge>
              </div>
              <div className="hero-card__body">
                <div className="hero-tile">
                  <span className="hero-tile__icon">
                    <Icon name="droplet" />
                  </span>
                  <div className="grow">
                    <div className="hero-tile__title row gap-2">
                      <BloodPill group="A+" /> 2 units · Packed RBC
                    </div>
                    <div className="hero-tile__meta">Example data · no patient information</div>
                  </div>
                </div>
                <div className="row gap-1" aria-hidden="true">
                  {[1, 1, 1, 1, 1, 0].map((done, i) => (
                    <span
                      key={i}
                      className={`progress-steps__dot ${done ? 'progress-steps__dot--done' : ''}`}
                    />
                  ))}
                </div>
                <div className="row-between text-xs text-muted">
                  <span>Blood bank review</span>
                  <span>Delivery</span>
                </div>
                <div className="hero-tile" style={{ background: 'var(--white)' }}>
                  <span className="hero-tile__icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                    <Icon name="truck" />
                  </span>
                  <div className="grow">
                    <div className="hero-tile__title">Shipment status workflow</div>
                    <div className="hero-tile__meta">Actual shipment lookup requires its database ID</div>
                  </div>
                  <Icon name="chevron-right" className="icon text-subtle" />
                </div>
              </div>
            </motion.div>
            <motion.div
              className="hero-float"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: 0.35 }}
            >
              <span
                className="row"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="shield-check" className="icon icon--sm" />
              </span>
              <div>
                <div className="text-xs text-strong">Compatibility outcome</div>
                <div className="text-xs text-muted">Shipment creation is a separate action</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="public-container">
          <div className="alert alert--demo">
            <Icon name="flask" className="icon alert__icon" />
            <div>
              <div className="alert__title">Backend-connected frontend · not for clinical use</div>
              <div className="alert__body">
                Portal and request workflows call the configured BloodBridge API. The artwork on this page is illustrative, and backend connectivity does not imply clinical validation, certification, or authorization for real-world care.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="public-container">
          <motion.div className="section-head" {...fade()}>
            <h2>Everything needed to coordinate one request — nothing more</h2>
            <p>
              BloodBridge focuses on the four things that decide whether a unit reaches a patient in
              time: what is available, who is responsible, what has been approved, and where the
              shipment is.
            </p>
          </motion.div>
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <motion.article className="feature" key={f.title} {...fade(i * 0.05)}>
                <span className="feature__icon">
                  <Icon name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tinted" id="workflow">
        <div className="public-container">
          <motion.div className="section-head" {...fade()}>
            <h2>How the platform workflow runs</h2>
            <p>
              A request moves through a small number of clearly named stages. Each stage has one
              responsible role, so nothing is silently waiting.
            </p>
          </motion.div>
          <div className="flow">
            {[
              { icon: 'qr', title: 'Request', text: 'Raised by a patient, attendant or hospital team.' },
              { icon: 'bank', title: 'Blood bank', text: 'Checks stock, accepts or forwards to a partner bank.' },
              { icon: 'flask', title: 'Testing & approval', text: 'Compatibility testing, then authorised clinical approval.' },
              { icon: 'truck', title: 'Delivery', text: 'Shipment created, tracked, and signed for at the hospital.' },
            ].map((node, i) => (
              <motion.div className="flow__node" key={node.title} {...fade(i * 0.06)}>
                <Icon name={node.icon} />
                <h4>
                  {i + 1}. {node.title}
                </h4>
                <p>{node.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="public-container">
          <motion.div className="section-head section-head--center" {...fade()}>
            <h2>Three steps to a tracked blood request</h2>
            <p>Designed so a first-time user can complete the request in under two minutes.</p>
          </motion.div>
          <div className="step-cards">
            {STEPS.map((step, i) => (
              <motion.article className="step-card" key={step.title} {...fade(i * 0.07)}>
                <span className="step-card__num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="public-container">
          <motion.div className="section-head" {...fade()}>
            <h2>Built to be trusted, not just impressive</h2>
            <p>
              Trust in a blood coordination tool comes from clarity about who did what, and honesty
              about what the system does not do.
            </p>
          </motion.div>
          <div className="trust-grid">
            {TRUST.map((t, i) => (
              <motion.div className="trust-item" key={t.title} {...fade(i * 0.05)}>
                <Icon name={t.icon} />
                <div>
                  <h4>{t.title}</h4>
                  <p>{t.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="public-container">
          <div className="row gap-5 wrap" style={{ alignItems: 'stretch' }}>
            <div className="grow" style={{ minWidth: 260 }}>
              <h2 style={{ fontSize: 'var(--fs-2xl)', letterSpacing: '-0.025em' }}>
                Portal access for each role
              </h2>
              <p className="text-muted mt-2" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.6 }}>
                Sign in with an account provisioned by a Super Admin. The available portals follow the backend roles; there is no delivery-operator account or self-registration endpoint.
              </p>
              <div className="mt-5">
                <Link to="/login" className="btn btn--primary">
                  Open secure portals
                  <Icon name="arrow-right" />
                </Link>
              </div>
            </div>
            <div className="grid grid-2 grow" style={{ minWidth: 320, gap: 10 }}>
              {[
                { icon: 'user', title: 'Requester', sub: 'Submit and track requests' },
                { icon: 'hospital', title: 'Hospital Admin', sub: 'Review, approve, coordinate' },
                { icon: 'droplet', title: 'Blood Bank', sub: 'Inventory, requests, testing' },
                { icon: 'shield', title: 'Super Admin', sub: 'Organizations, alerts, complaints' },
              ].map((role) => (
                <div className="card card--pad" key={role.title} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="stat__icon">
                    <Icon name={role.icon} className="icon icon--sm" />
                  </span>
                  <div>
                    <div className="text-sm text-strong">{role.title}</div>
                    <div className="text-xs text-muted">{role.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="public-container">
          <div className="cta-band">
            <div>
              <h2>Coordinate the next request, not the next phone call.</h2>
              <p>
                Submit a request or inspect the API-supported workflow. Shipment discovery, payments and separate clinical authorization are not implemented by the supplied backend.
              </p>
            </div>
            <div className="row gap-2 wrap">
              <Link to="/request-blood" className="btn btn--secondary btn--lg">
                Request blood
              </Link>
              <Link to="/how-it-works" className="btn btn--ghost btn--lg">
                See the workflow
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
