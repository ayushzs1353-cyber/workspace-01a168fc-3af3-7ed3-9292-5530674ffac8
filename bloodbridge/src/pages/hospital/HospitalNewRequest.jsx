import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { Alert, CardBody, DemoNotice } from '../../components/ui/index.js';
import BloodRequestForm from '../../components/domain/BloodRequestForm.jsx';
import { useApp } from '../../state/store.jsx';
import { getHospital } from '../../state/selectors.js';

export default function HospitalNewRequest() {
  const app = useApp();
  const navigate = useNavigate();
  const hospital = getHospital(app, app.currentUser?.hospitalId);
  const banks = app.banks.filter((b) => hospital?.connectedBankIds?.includes(b.id));

  const handleSubmit = (payload) => {
    const id = app.submitRequest({ ...payload, hospitalId: hospital.id });
    if (payload.bankId) app.assignBank(id, payload.bankId);
    navigate(`/hospital/requests/${id}`);
  };

  return (
    <>
      <PageHeader
        backTo="/hospital/requests"
        backLabel="Back to requests"
        title="Create a blood request"
        description={`Raised for ${hospital?.name}. The request is visible to the assigned blood bank immediately.`}
      />

      <DemoNotice compact />

      <div className="grid grid-sidebar mt-5">
        <Card>
          <div className="card__header">
            <div>
              <h2 className="card__title">Request details</h2>
              <p className="card__subtitle">Four short sections · defaults are pre-selected</p>
            </div>
          </div>
          <CardBody>
            <BloodRequestForm
              mode="hospital"
              hospitals={app.hospitals}
              banks={banks}
              defaultHospitalId={hospital?.id}
              defaultRequester={{
                name: app.currentUser?.name || '',
                relation: 'Treating doctor',
                phone: app.currentUser?.phone || '',
              }}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/hospital/requests')}
              submitLabel="Create request"
            />
          </CardBody>
        </Card>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-2">Working with blood banks</h3>
            <ul className="stack gap-3 mt-2">
              {[
                ['Assign now or later', 'Pick a bank if you know who has stock; otherwise leave it blank and assign after the ward confirms.'],
                ['Critical requests', 'Marked clearly and sorted to the top of the blood bank queue.'],
                ['Forwarding', 'A bank without stock can forward to a partner bank without you re-entering anything.'],
              ].map(([title, text]) => (
                <li key={title}>
                  <div className="text-xs text-strong">{title}</div>
                  <div className="text-xs text-muted">{text}</div>
                </li>
              ))}
            </ul>
          </Card>

          <Alert tone="info" title="Patient privacy">
            Only the assigned blood bank and your hospital team can see this request. Contact details
            are shared for coordination only.
          </Alert>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Connected banks</h3>
            {banks.map((b) => (
              <div className="info-row" key={b.id}>
                <span className="info-row__label">{b.short}</span>
                <span className="info-row__value">{b.operatingHours}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
