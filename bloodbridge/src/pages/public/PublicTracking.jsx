import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { Alert, Badge } from '../../components/ui/index.js';
import { api } from '../../lib/api.js';

export default function PublicTracking() {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.publicTrack(token)
      .then((response) => { if (active) setRequest(response.request); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [token]);

  return (
    <section className="section"><div className="public-container" style={{ maxWidth: 720 }}>
      <Card className="card--pad">
        <CardHeader title="Request tracking" subtitle="Limited status information provided by the backend tracking token." />
        {error && <Alert tone="danger" title="Tracking unavailable">{error}</Alert>}
        {!request && !error && <p className="text-sm text-muted">Loading request status…</p>}
        {request && <div className="stack gap-3">
          <div><span className="text-xs text-muted">Reference</span><div className="text-strong">{request.reference}</div></div>
          <div><span className="text-xs text-muted">Status</span><div><Badge>{request.status}</Badge></div></div>
          <div><span className="text-xs text-muted">Hospital</span><div>{request.hospital?.name || '—'}</div></div>
          <div><span className="text-xs text-muted">Assigned blood bank</span><div>{request.assignedBank?.name || 'Not assigned'}</div></div>
          <div><span className="text-xs text-muted">Last updated</span><div>{request.updatedAt ? new Date(request.updatedAt).toLocaleString() : '—'}</div></div>
        </div>}
        <Link to="/" className="btn btn--secondary mt-4">Return home</Link>
      </Card>
    </div></section>
  );
}
