import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { Alert, Button, Field, Input, Select, Textarea } from '../../components/ui/index.js';
import { api } from '../../lib/api.js';

const componentOptions = ['Whole blood', 'Red cells', 'Platelets', 'Plasma'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PublicRequest() {
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('qr') || '';
  const [hospital, setHospital] = useState(null);
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(Boolean(qrToken));
  const [form, setForm] = useState({ patientName: '', contact: '', bloodGroup: 'A+', component: 'Red cells', units: '1', urgency: 'urgent', notes: '' });
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!qrToken) {
      setQrLoading(false);
      return undefined;
    }
    let active = true;
    api.publicQr(qrToken)
      .then((response) => { if (active) setHospital(response.hospital); })
      .catch((requestError) => { if (active) setQrError(requestError.message); })
      .finally(() => { if (active) setQrLoading(false); });
    return () => { active = false; };
  }, [qrToken]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!document) {
      setError('Attach a supporting PDF, JPEG, or PNG document (maximum 5 MB).');
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(document.type)) {
      setError('The document must be a PDF, JPEG, or PNG file.');
      return;
    }
    if (document.size > 5 * 1024 * 1024) {
      setError('The document must be 5 MB or smaller.');
      return;
    }
    if (qrToken && qrError) {
      setError('This hospital QR code could not be verified. Request submission is disabled.');
      return;
    }
    const body = new FormData();
    body.set('patientName', form.patientName.trim());
    body.set('contact', form.contact.trim());
    body.set('bloodGroup', form.bloodGroup);
    body.set('component', form.component);
    body.set('units', form.units);
    body.set('urgency', form.urgency);
    if (form.notes.trim()) body.set('notes', form.notes.trim());
    if (qrToken) body.set('qrToken', qrToken);
    body.set('document', document);
    setLoading(true);
    try {
      setResult((await api.submitPublicRequest(body)).request);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <section className="section"><div className="public-container" style={{ maxWidth: 720 }}>
        <Card className="card--pad">
          <div style={{ textAlign: 'center' }}>
            <span className="success-check"><Icon name="check" /></span>
            <h1 style={{ fontSize: 'var(--fs-2xl)' }}>Request submitted</h1>
            <p className="text-sm text-muted mt-2">The backend accepted the request. Its current workflow state is shown below.</p>
            <div className="row gap-2 mt-4" style={{ justifyContent: 'center' }}>
              <span className="detail-id">{result.reference}</span>
              <span className="badge badge--info">{result.status}</span>
            </div>
          </div>
          {result.trackingToken ? <div className="mt-5"><Alert tone="warning" title="Keep this private tracking link">
            Anyone with this bearer link can view limited request status. It is not saved in local storage.
            <p className="mt-2"><Link to={`/track/${encodeURIComponent(result.trackingToken)}`}>Track this request</Link></p>
          </Alert></div> : <div className="mt-5"><Alert tone="info" title="Tracking link unavailable">
            The backend returned no tracking token for this response. Save the reference above; this frontend will not create a substitute tracking link.
          </Alert></div>}
          <div className="row gap-2 mt-4"><Link className="btn btn--primary" to="/">Return home</Link><Link className="btn btn--secondary" to="/request-blood">Submit another request</Link></div>
        </Card>
      </div></section>
    );
  }

  return (
    <section className="section"><div className="public-container" style={{ maxWidth: 760 }}>
      <Card className="card--pad">
        <CardHeader title="Request blood" subtitle="Public requests require patient/contact details and a supporting document. The backend accepts PDF, JPEG, or PNG files up to 5 MB." />
        {qrToken && (qrError ? <Alert tone="danger" title="Hospital QR is invalid or unavailable">{qrError}</Alert> : <Alert tone="success" title="Verified hospital">{hospital?.name || 'Checking QR code…'}{hospital?.address ? ` · ${hospital.address}` : ''}</Alert>)}
        {!qrToken && <Alert tone="info" title="No hospital QR provided">The backend will route this request to its first active hospital. Scan a hospital QR to target a specific hospital.</Alert>}
        {error && <div className="mt-4"><Alert tone="danger" title="Request not submitted">{error}</Alert></div>}
        <form className="form-grid mt-5" onSubmit={submit}>
          <Field label="Patient name" htmlFor="request-patient"><Input id="request-patient" required maxLength={120} value={form.patientName} onChange={(event) => setForm({ ...form, patientName: event.target.value })} /></Field>
          <Field label="Contact number" htmlFor="request-contact"><Input id="request-contact" type="tel" required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></Field>
          <Field label="Blood group" htmlFor="request-group"><Select id="request-group" value={form.bloodGroup} onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })}>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</Select></Field>
          <Field label="Component" htmlFor="request-component"><Select id="request-component" value={form.component} onChange={(event) => setForm({ ...form, component: event.target.value })}>{componentOptions.map((component) => <option key={component}>{component}</option>)}</Select></Field>
          <Field label="Units (1–50)" htmlFor="request-units"><Input id="request-units" type="number" min="1" max="50" step="1" required value={form.units} onChange={(event) => setForm({ ...form, units: event.target.value })} /></Field>
          <Field label="Urgency" htmlFor="request-urgency"><Select id="request-urgency" value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value })}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="critical">Critical</option></Select></Field>
          <Field label="Clinical notes (optional)" htmlFor="request-notes" full><Textarea id="request-notes" maxLength={1000} rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          <Field label="Supporting document" htmlFor="request-document" full hint="Required by the backend. Accepted: PDF, JPEG, PNG; maximum 5 MB.">
            <Input id="request-document" type="file" required accept="application/pdf,image/jpeg,image/png" onChange={(event) => setDocument(event.target.files?.[0] || null)} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}><Button type="submit" disabled={loading || qrLoading || Boolean(qrToken && qrError)}>{loading ? 'Submitting…' : 'Submit request'}</Button></div>
        </form>
      </Card>
    </div></section>
  );
}
