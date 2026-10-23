import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  CardBody,
  ChipGroup,
  DemoNotice,
  Field,
  Input,
  Select,
  StatusBadge,
  UrgencyBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank, getHospital, lowStockRows, visibleRequests } from '../../state/selectors.js';
import { BLOOD_GROUPS, COMPONENTS, componentLabel, isOpen, timeAgo } from '../../data/reference.js';

export default function HospitalAlerts() {
  const app = useApp();
  const hospital = getHospital(app, app.currentUser?.hospitalId);
  const requests = visibleRequests(app, app.currentUser);
  const banks = app.banks.filter((b) => hospital?.connectedBankIds?.includes(b.id));

  const [form, setForm] = useState({
    bloodGroup: 'O-',
    component: 'prbc',
    units: '2',
    ward: 'Emergency Bay 1',
    patientName: '',
    note: '',
    bankId: banks[0]?.id || '',
  });
  const [raised, setRaised] = useState(null);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const lowStock = banks.flatMap((bank) =>
    lowStockRows(app.inventory.filter((r) => r.bankId === bank.id)).map((row) => ({
      ...row,
      bankName: bank.short,
      bankId: bank.id,
    })),
  );

  const criticalOpen = requests.filter((r) => r.urgency === 'critical' && isOpen(r.status));

  const raise = (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) {
      setError('Add a patient name or reference so the bank can match the request.');
      return;
    }
    setError('');
    const id = app.submitRequest({
      patientName: form.patientName,
      patientAge: 0,
      patientGender: 'Not specified',
      bloodGroup: form.bloodGroup,
      component: form.component,
      units: Number(form.units),
      urgency: 'critical',
      hospitalId: hospital.id,
      bankId: form.bankId || null,
      ward: form.ward,
      indication: form.note || 'Urgent requirement raised by hospital.',
      requesterName: app.currentUser.name,
      requesterPhone: app.currentUser.phone,
      requesterRelation: 'Hospital staff',
      source: 'hospital',
      consent: true,
    });
    if (!form.bankId) app.assignBank(id, banks[0]?.id || 'bank-city');
    setRaised(id);
  };

  return (
    <>
      <PageHeader
        title="Urgent & stock alerts"
        description="Raise an urgent requirement in one step, and see where connected banks are running low."
      />

      <DemoNotice compact />

      <div className="grid grid-sidebar mt-5">
        <div className="stack gap-4">
          <Card>
            <CardHeader
              title="Raise an urgent requirement"
              subtitle="Creates a critical request, assigned to a connected blood bank"
            />
            <form onSubmit={raise}>
              <CardBody>
                {raised ? (
                  <div className="stack gap-4">
                    <div className="alert alert--success">
                      <Icon name="check-circle" className="icon alert__icon" />
                      <div>
                        <div className="alert__title">Urgent request {raised} raised</div>
                        <div className="alert__body">
                          The blood bank has been notified in the demo and will see it at the top of
                          its queue.
                        </div>
                      </div>
                    </div>
                    <div className="row gap-2 wrap">
                      <Link to={`/hospital/requests/${raised}`} className="btn btn--primary btn--sm">
                        Open request
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRaised(null);
                          setForm((f) => ({ ...f, patientName: '', note: '' }));
                        }}
                      >
                        Raise another
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="stack gap-4">
                    <Alert tone="warning" title="Use for genuinely urgent needs">
                      Critical requests are flagged to the blood bank immediately. In a real
                      deployment they would also page the on-call coordinator.
                    </Alert>

                    <Field label="Blood group" htmlFor="urgent-group">
                      <ChipGroup
                        options={BLOOD_GROUPS}
                        value={form.bloodGroup}
                        onChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}
                        label="Blood group"
                      />
                    </Field>

                    <div className="form-grid">
                      <Field label="Component" htmlFor="urgent-component">
                        <Select id="urgent-component" value={form.component} onChange={set('component')}>
                          {COMPONENTS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Units needed" htmlFor="urgent-units">
                        <Select id="urgent-units" value={form.units} onChange={set('units')}>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n} unit{n > 1 ? 's' : ''}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Patient name / reference" htmlFor="urgent-patient" error={error}>
                        <Input
                          id="urgent-patient"
                          placeholder="e.g. Trauma patient, Emergency Bay 2"
                          value={form.patientName}
                          onChange={set('patientName')}
                          invalid={!!error}
                        />
                      </Field>
                      <Field label="Ward / bay" htmlFor="urgent-ward">
                        <Input id="urgent-ward" value={form.ward} onChange={set('ward')} />
                      </Field>
                      <Field label="Assign to blood bank" htmlFor="urgent-bank" full>
                        <Select id="urgent-bank" value={form.bankId} onChange={set('bankId')}>
                          {banks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} — {b.city}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Short note for the blood bank" htmlFor="urgent-note" optional full>
                        <Input
                          id="urgent-note"
                          placeholder="e.g. Active bleeding, theatre on standby"
                          value={form.note}
                          onChange={set('note')}
                        />
                      </Field>
                    </div>

                    <Button type="submit" icon="alert-triangle">
                      Raise critical request
                    </Button>
                  </div>
                )}
              </CardBody>
            </form>
          </Card>

          <Card flush>
            <CardHeader
              title="Open critical requests"
              subtitle={`${criticalOpen.length} in progress`}
              action={
                <Link to="/hospital/requests" className="btn btn--ghost btn--sm">
                  All requests
                </Link>
              }
            />
            {criticalOpen.length === 0 ? (
              <p className="text-sm text-muted" style={{ padding: 20 }}>
                No open critical requests. That is good news.
              </p>
            ) : (
              criticalOpen.map((r) => (
                <Link
                  key={r.id}
                  to={`/hospital/requests/${r.id}`}
                  className="row-between"
                  style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', color: 'inherit' }}
                >
                  <div className="row gap-3">
                    <BloodPill group={r.bloodGroup} />
                    <div>
                      <div className="text-sm text-strong">
                        {r.id} · {r.units} unit(s) {componentLabel(r.component)}
                      </div>
                      <div className="text-xs text-muted">
                        {r.patientName} · {r.ward} · {getBank(app, r.bankId)?.short || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <UrgencyBadge urgency={r.urgency} />
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))
            )}
          </Card>
        </div>

        <div className="stack gap-4">
          <Card flush>
            <CardHeader
              title="Low stock at connected banks"
              subtitle="Groups approaching or below the demo threshold"
            />
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted" style={{ padding: 20 }}>
                  No low-stock warnings right now.
                </p>
              ) : (
                lowStock.map((row) => (
                  <div
                    key={`${row.bankId}-${row.bloodGroup}-${row.component}`}
                    style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}
                  >
                    <div className="row-between">
                      <span className="row gap-2">
                        <BloodPill group={row.bloodGroup} />
                        <span className="text-sm">{componentLabel(row.component)}</span>
                      </span>
                      <Badge tone={row.units === 0 ? 'danger' : 'warning'}>
                        {row.units} unit{row.units === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {row.bankName} · updated {timeAgo(row.lastUpdated)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="card__footer">
              <Link to="/hospital/banks" className="btn btn--secondary btn--sm">
                View all connected banks
              </Link>
            </div>
          </Card>

          <Alert tone="info" title="How alerts are raised">
            The demo flags groups at or below each blood bank’s threshold. In production, thresholds
            would be configured by each bank and reviewed by the platform team.
          </Alert>
        </div>
      </div>
    </>
  );
}
