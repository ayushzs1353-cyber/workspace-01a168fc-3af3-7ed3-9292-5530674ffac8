import { useState } from 'react';
import Icon from '../Icon.jsx';
import {
  Alert,
  Button,
  Checkbox,
  ChipGroup,
  Field,
  Input,
  RadioCards,
  Select,
  Textarea,
} from '../ui/index.js';
import { BLOOD_GROUPS, COMPONENTS, URGENCY } from '../../data/reference.js';

/**
 * Shared request form.
 * - mode="patient": hospital is chosen (or prefilled from a QR scan).
 * - mode="hospital": hospital is fixed; staff can assign a blood bank immediately.
 */
export default function BloodRequestForm({
  mode = 'patient',
  hospitals = [],
  banks = [],
  defaultHospitalId = '',
  defaultRequester = { name: '', relation: 'Attendant', phone: '' },
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Submit request',
}) {
  const [form, setForm] = useState({
    hospitalId: defaultHospitalId,
    patientName: '',
    patientAge: '',
    patientGender: 'Female',
    ward: '',
    bloodGroup: 'A+',
    component: 'prbc',
    units: '2',
    urgency: 'urgent',
    indication: '',
    requesterName: defaultRequester.name,
    requesterRelation: defaultRequester.relation,
    requesterPhone: defaultRequester.phone,
    bankId: '',
    consent: false,
    ...initialValues,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const next = {};
    if (mode === 'patient' && !form.hospitalId) next.hospitalId = 'Choose the hospital.';
    if (!form.patientName.trim()) next.patientName = 'Enter the patient’s name.';
    if (!form.patientAge) next.patientAge = 'Enter the patient’s age.';
    else if (Number(form.patientAge) < 0 || Number(form.patientAge) > 120) next.patientAge = 'Enter a realistic age.';
    if (!form.ward.trim()) next.ward = 'Enter the ward, bed or room.';
    if (!form.requesterName.trim()) next.requesterName = 'Enter a contact name.';
    if (!form.requesterPhone.trim()) next.requesterPhone = 'Enter a contact number.';
    else if (form.requesterPhone.replace(/\D/g, '').length < 10) next.requesterPhone = 'Enter at least 10 digits.';
    if (!form.consent) next.consent = 'Please confirm before submitting.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) {
      window.setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus?.(), 30);
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      onSubmit?.({
        ...form,
        patientAge: Number(form.patientAge),
        units: Number(form.units),
        source: mode === 'hospital' ? 'hospital' : 'form',
      });
      setSaving(false);
    }, 350);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="stack gap-6">
        <section>
          <p className="divider-label">Patient & location</p>
          <div className="form-grid">
            {mode === 'patient' && (
              <Field
                label="Hospital"
                htmlFor="f-hospital"
                error={errors.hospitalId}
                hint="The hospital where the patient is admitted"
                full
              >
                <Select
                  id="f-hospital"
                  value={form.hospitalId}
                  onChange={set('hospitalId')}
                  invalid={!!errors.hospitalId}
                >
                  <option value="">Choose a hospital</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Patient name" htmlFor="f-patient" error={errors.patientName}>
              <Input
                id="f-patient"
                placeholder="Full name as in hospital records"
                value={form.patientName}
                onChange={set('patientName')}
                invalid={!!errors.patientName}
              />
            </Field>
            <Field label="Ward / bed / room" htmlFor="f-ward" error={errors.ward}>
              <Input
                id="f-ward"
                placeholder="e.g. Ward B-4, Bed 12"
                value={form.ward}
                onChange={set('ward')}
                invalid={!!errors.ward}
              />
            </Field>
            <Field label="Age" htmlFor="f-age" error={errors.patientAge}>
              <Input
                id="f-age"
                type="number"
                min="0"
                max="120"
                placeholder="e.g. 45"
                value={form.patientAge}
                onChange={set('patientAge')}
                invalid={!!errors.patientAge}
              />
            </Field>
            <Field label="Gender" htmlFor="f-gender">
              <Select id="f-gender" value={form.patientGender} onChange={set('patientGender')}>
                {['Female', 'Male', 'Other', 'Prefer not to say'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        <section>
          <p className="divider-label">Blood requirement</p>
          <div className="stack gap-4">
            <Field label="Blood group" htmlFor="f-group">
              <ChipGroup
                options={BLOOD_GROUPS}
                value={form.bloodGroup}
                onChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}
                label="Blood group"
              />
            </Field>
            <div className="form-grid">
              <Field label="Component" htmlFor="f-component">
                <Select id="f-component" value={form.component} onChange={set('component')}>
                  {COMPONENTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Units required" htmlFor="f-units">
                <Select id="f-units" value={form.units} onChange={set('units')}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} unit{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Urgency" htmlFor="f-urgency">
              <RadioCards
                name="f-urgency"
                options={URGENCY.map((u) => ({ value: u.id, label: u.label, description: u.desc }))}
                value={form.urgency}
                onChange={(v) => setForm((f) => ({ ...f, urgency: v }))}
                columns={3}
              />
            </Field>
            {form.urgency === 'critical' && (
              <Alert tone="danger" title="Critical request">
                Critical requests are highlighted for the hospital and blood bank straight away. In a
                real deployment this would also page the on-call coordinator.
              </Alert>
            )}
            <Field
              label="Clinical note / reason"
              htmlFor="f-indication"
              optional
              hint="e.g. post-operative anaemia, dengue with low platelets"
            >
              <Textarea
                id="f-indication"
                rows={2}
                placeholder="Brief reason for the request"
                value={form.indication}
                onChange={set('indication')}
              />
            </Field>
          </div>
        </section>

        <section>
          <p className="divider-label">Contact for updates</p>
          <div className="form-grid">
            <Field label="Contact name" htmlFor="f-requester" error={errors.requesterName}>
              <Input
                id="f-requester"
                placeholder="Who should we call?"
                value={form.requesterName}
                onChange={set('requesterName')}
                invalid={!!errors.requesterName}
              />
            </Field>
            <Field label="Relationship" htmlFor="f-relation">
              <Select id="f-relation" value={form.requesterRelation} onChange={set('requesterRelation')}>
                {[
                  'Attendant',
                  'Attendant (daughter)',
                  'Attendant (son)',
                  'Parent',
                  'Spouse',
                  'Self',
                  'Hospital staff',
                  'Treating doctor',
                  'Nursing staff',
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mobile number" htmlFor="f-phone" error={errors.requesterPhone} full>
              <Input
                id="f-phone"
                type="tel"
                placeholder="+91 98290 00000"
                value={form.requesterPhone}
                onChange={set('requesterPhone')}
                invalid={!!errors.requesterPhone}
              />
            </Field>
          </div>
        </section>

        {mode === 'hospital' && (
          <section>
            <p className="divider-label">Coordination</p>
            <Field
              label="Assign a blood bank"
              htmlFor="f-bank"
              optional
              hint="Leave blank to send to connected banks for review."
            >
              <Select id="f-bank" value={form.bankId} onChange={set('bankId')}>
                <option value="">No bank assigned yet</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.city}
                  </option>
                ))}
              </Select>
            </Field>
          </section>
        )}

        <Field error={errors.consent}>
          <Checkbox
            id="f-consent"
            checked={form.consent}
            onChange={set('consent')}
            label={
              mode === 'hospital'
                ? 'I confirm the clinical details are correct and that this is a simulated demo request.'
                : 'I understand this is a demonstration prototype and no real blood request is placed.'
            }
          />
        </Field>

        <div className="row gap-2 wrap" style={{ justifyContent: 'flex-end' }}>
          <span className="text-xs text-muted grow row gap-1">
            <Icon name="lock" className="icon icon--sm" />
            Only your hospital and the assigned blood bank see this request.
          </span>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} type="button">
              Cancel
            </Button>
          )}
          <Button type="submit" loading={saving} iconRight="arrow-right">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
