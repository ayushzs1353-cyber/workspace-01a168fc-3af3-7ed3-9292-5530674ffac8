import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardFooter, CardHeader } from '../../components/ui/Card.jsx';
import { Alert, Badge, Button, Field, Input, DemoNotice } from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getHospital } from '../../state/selectors.js';
import { formatDate } from '../../data/reference.js';

export default function HospitalProfile() {
  const app = useApp();
  const hospital = getHospital(app, app.currentUser?.hospitalId);
  const [form, setForm] = useState({
    name: hospital?.name || '',
    address: hospital?.address || '',
    phone: hospital?.phone || '',
    email: hospital?.email || '',
    contactPerson: hospital?.contactPerson || '',
    beds: hospital?.beds || '',
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const save = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Hospital name is required.';
    if (!form.phone.trim()) next.phone = 'A contact number is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Use a valid email address.';
    setErrors(next);
    if (Object.keys(next).length) return;
    app.updateOrganisation(hospital.id, { ...form, beds: Number(form.beds) || hospital.beds });
    setSaved(true);
  };

  return (
    <>
      <PageHeader
        title="Hospital profile"
        description="Details shown to connected blood banks and on the patient request form."
        actions={
          <Link to="/hospital/qr" className="btn btn--secondary">
            <Icon name="qr" />
            Hospital QR
          </Link>
        }
      />

      <DemoNotice compact />

      <div className="grid-sidebar mt-5">
        <Card>
          <CardHeader
            title="Organisation details"
            subtitle="Changes are saved to this demo workspace only"
          />
          <form onSubmit={save} noValidate>
            <div className="card__body stack gap-5">
              {saved && (
                <Alert tone="success" title="Profile saved">
                  The demo record was updated. Connected banks will see the new details.
                </Alert>
              )}

              <div className="form-grid">
                <Field label="Hospital name" htmlFor="h-name" error={errors.name} full>
                  <Input id="h-name" value={form.name} onChange={set('name')} invalid={!!errors.name} />
                </Field>
                <Field label="Registered address" htmlFor="h-address" full>
                  <Input id="h-address" value={form.address} onChange={set('address')} />
                </Field>
                <Field label="Reception / blood bank desk" htmlFor="h-phone" error={errors.phone}>
                  <Input id="h-phone" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} />
                </Field>
                <Field label="Coordinator email" htmlFor="h-email" error={errors.email}>
                  <Input id="h-email" type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} />
                </Field>
                <Field label="Transfusion coordinator" htmlFor="h-contact">
                  <Input id="h-contact" value={form.contactPerson} onChange={set('contactPerson')} />
                </Field>
                <Field label="Licensed beds" htmlFor="h-beds">
                  <Input id="h-beds" type="number" min="1" value={form.beds} onChange={set('beds')} />
                </Field>
              </div>

              <Alert tone="info" title="Verification details">
                Licence numbers and registration documents cannot be edited here. In production,
                changes require re-verification by the platform team.
              </Alert>
            </div>
            <CardFooter>
              <div className="row-between wrap gap-3">
                <span className="text-xs text-muted">
                  Last demo update: {formatDate(hospital?.joinedAt)}
                </span>
                <Button type="submit">Save changes</Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-3">Verification</h3>
            <div className="row-between">
              <span className="text-sm text-muted">Status</span>
              <Badge tone={hospital?.status === 'verified' ? 'success' : 'warning'} dot>
                {hospital?.status === 'verified' ? 'Verified' : 'Under review'}
              </Badge>
            </div>
            <div className="info-row">
              <span className="info-row__label">Licence reference</span>
              <span className="info-row__value text-xs">{hospital?.bloodBankLicence}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Joined</span>
              <span className="info-row__value">{formatDate(hospital?.joinedAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">QR token</span>
              <span className="info-row__value mono text-xs">{hospital?.qrToken}</span>
            </div>
            <p className="text-xs text-subtle mt-3">
              Verification is simulated. No licence check has been performed.
            </p>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-3">Connected blood banks</h3>
            {app.banks
              .filter((b) => hospital?.connectedBankIds?.includes(b.id))
              .map((b) => (
                <div className="row-between" key={b.id} style={{ padding: '9px 0', borderBottom: '1px dashed var(--border)' }}>
                  <div>
                    <div className="text-sm text-strong">{b.short}</div>
                    <div className="text-xs text-muted">
                      {b.city} · {b.operatingHours}
                    </div>
                  </div>
                  <Badge tone={b.status === 'verified' ? 'success' : 'warning'}>
                    {b.status === 'verified' ? 'Verified' : 'Review'}
                  </Badge>
                </div>
              ))}
            <Link to="/hospital/banks" className="btn btn--secondary btn--sm mt-3">
              View bank stock
            </Link>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Account</h3>
            <div className="info-row">
              <span className="info-row__label">Signed in as</span>
              <span className="info-row__value">{app.currentUser?.name}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Email</span>
              <span className="info-row__value text-xs">{app.currentUser?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Registration</span>
              <span className="info-row__value text-xs">{app.currentUser?.registrationNo}</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
