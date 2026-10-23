import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardFooter, CardHeader } from '../../components/ui/Card.jsx';
import { Alert, Badge, Button, DemoNotice, Field, Input } from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank } from '../../state/selectors.js';
import { formatDate } from '../../data/reference.js';

export default function BankProfile() {
  const app = useApp();
  const bank = getBank(app, app.currentUser?.bankId);
  const [form, setForm] = useState({
    name: bank?.name || '',
    address: bank?.address || '',
    phone: bank?.phone || '',
    email: bank?.email || '',
    contactPerson: bank?.contactPerson || '',
    operatingHours: bank?.operatingHours || '',
    coldStorage: bank?.coldStorage || '',
  });
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const save = (e) => {
    e.preventDefault();
    app.updateOrganisation(bank.id, form);
    setSaved(true);
  };

  return (
    <>
      <PageHeader
        title="Blood bank profile"
        description="Contact and storage details shown to partner hospitals."
      />

      <DemoNotice compact />

      <div className="grid-sidebar mt-5">
        <Card>
          <CardHeader title="Organisation details" subtitle="Demo record · not verified with any authority" />
          <form onSubmit={save}>
            <div className="card__body stack gap-5">
              {saved && (
                <Alert tone="success" title="Profile saved">
                  Partner hospitals will see the updated contact details.
                </Alert>
              )}
              <div className="form-grid">
                <Field label="Blood bank name" htmlFor="b-name" full>
                  <Input id="b-name" value={form.name} onChange={set('name')} />
                </Field>
                <Field label="Address" htmlFor="b-address" full>
                  <Input id="b-address" value={form.address} onChange={set('address')} />
                </Field>
                <Field label="Phone" htmlFor="b-phone">
                  <Input id="b-phone" value={form.phone} onChange={set('phone')} />
                </Field>
                <Field label="Email" htmlFor="b-email">
                  <Input id="b-email" type="email" value={form.email} onChange={set('email')} />
                </Field>
                <Field label="Duty coordinator" htmlFor="b-contact">
                  <Input id="b-contact" value={form.contactPerson} onChange={set('contactPerson')} />
                </Field>
                <Field label="Operating hours" htmlFor="b-hours">
                  <Input id="b-hours" value={form.operatingHours} onChange={set('operatingHours')} />
                </Field>
                <Field
                  label="Cold storage"
                  htmlFor="b-cold"
                  hint="Shown to hospitals as context, not as a monitoring feed."
                  full
                >
                  <Input id="b-cold" value={form.coldStorage} onChange={set('coldStorage')} />
                </Field>
              </div>
              <Alert tone="info" title="Licence details are read-only">
                Licence references and verification documents cannot be edited here. In production,
                changes would require review by the platform team.
              </Alert>
            </div>
            <CardFooter>
              <div className="row-between wrap gap-3">
                <span className="text-xs text-muted">Joined {formatDate(bank?.joinedAt)}</span>
                <Button type="submit">Save changes</Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-3">Verification</h3>
            <div className="row-between mb-2">
              <span className="text-sm text-muted">Status</span>
              <Badge tone="success" dot>
                Verified in demo
              </Badge>
            </div>
            <div className="info-row">
              <span className="info-row__label">Licence</span>
              <span className="info-row__value text-xs">{bank?.licence}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Joined</span>
              <span className="info-row__value">{formatDate(bank?.joinedAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Partner banks</span>
              <span className="info-row__value">{bank?.partnerBankIds?.length}</span>
            </div>
            <p className="text-xs text-subtle mt-3">
              No real licence verification has taken place for this prototype.
            </p>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-3">Partner banks</h3>
            {app.banks
              .filter((b) => bank?.partnerBankIds?.includes(b.id))
              .map((b) => (
                <div className="info-row" key={b.id}>
                  <span className="info-row__label">{b.short}</span>
                  <span className="info-row__value">{b.city}</span>
                </div>
              ))}
            <div className="gate-note mt-3">
              <Icon name="info" className="icon icon--sm" />
              <span>Requests can be forwarded to partner banks when stock is unavailable.</span>
            </div>
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
