import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import { Alert } from '../../components/ui/index.js';

export default function BackendUnavailableFeature({
  title = 'Feature not available',
  description = 'The supplied API does not implement public self-registration. A Super Admin must create organizations and their administrator accounts through the authenticated organization API.',
}) {
  return (
    <section className="section"><div className="public-container" style={{ maxWidth: 720 }}>
      <Card className="card--pad">
        <h1 className="text-xl text-strong">{title}</h1>
        <div className="mt-4"><Alert tone="warning" title="No matching backend endpoint">
          {description}
        </Alert></div>
        <Link to="/login" className="btn btn--primary mt-4">Sign in</Link>
      </Card>
    </div></section>
  );
}
