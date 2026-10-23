import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Card from '../../components/ui/Card.jsx';
import { Alert } from '../../components/ui/index.js';

export default function Contact() {
  return (
    <section className="section">
      <div className="public-container" style={{ maxWidth: 820 }}>
        <span className="eyebrow"><Icon name="mail" className="icon icon--sm" />Contact & support</span>
        <h1 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', letterSpacing: '-0.03em', margin: '18px 0 14px' }}>
          Contact options supported by this backend
        </h1>
        <Card className="card--pad">
          <Alert tone="warning" title="No public contact endpoint is configured">
            The supplied API has no general contact-message or email endpoint. This page will not fabricate a sent-message confirmation or show placeholder contact details.
          </Alert>
          <div className="grid grid-2 mt-5">
            <div>
              <h2 className="text-lg text-strong">Hospital issue</h2>
              <p className="text-sm text-muted mt-2">An authenticated hospital administrator can submit and track a complaint. Active Super Admin users receive a notification.</p>
              <Link to="/login" className="btn btn--secondary mt-3">Sign in to the hospital portal</Link>
            </div>
            <div>
              <h2 className="text-lg text-strong">Blood request</h2>
              <p className="text-sm text-muted mt-2">Public blood requests are supported by the API and require a valid supporting document.</p>
              <Link to="/request-blood" className="btn btn--primary mt-3">Open request form</Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
