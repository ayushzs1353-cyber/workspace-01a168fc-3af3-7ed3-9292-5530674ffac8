import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { Alert, Badge, Button, CardBody, DemoNotice, Tabs } from '../../components/ui/index.js';
import BloodRequestForm from '../../components/domain/BloodRequestForm.jsx';
import QrScanSimulator from '../../components/domain/QrScanSimulator.jsx';
import { useApp } from '../../state/store.jsx';
import { getHospital } from '../../state/selectors.js';
import { componentLabel } from '../../data/reference.js';

export default function NewRequest() {
  const app = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('mode') === 'qr' ? 'qr' : 'form');
  const [hospitalId, setHospitalId] = useState('');
  const [created, setCreated] = useState(null);

  const hospital = hospitalId ? getHospital(app, hospitalId) : null;

  const handleSubmit = (payload) => {
    const id = app.submitRequest(payload);
    setCreated({ id, payload });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (created) {
    return (
      <>
        <PageHeader
          title="Request submitted"
          description="Your request is now with the hospital for review."
          backTo="/patient"
          backLabel="Back to overview"
        />
        <div className="grid grid-sidebar">
          <Card className="card--pad">
            <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
              <span className="success-check">
                <Icon name="check" />
              </span>
              <h2 style={{ fontSize: 'var(--fs-xl)' }}>Request {created.id} received</h2>
              <p className="text-sm text-muted mt-2" style={{ maxWidth: 420, margin: '8px auto 0', lineHeight: 1.6 }}>
                The hospital will confirm the clinical need and assign a blood bank. You’ll see each
                update in your request timeline.
              </p>
            </div>

            <div className="pay-summary mt-5">
              <div className="pay-row">
                <span className="text-muted">Requirement</span>
                <span className="text-strong">
                  {created.payload.units} unit(s) · {created.payload.bloodGroup} ·{' '}
                  {componentLabel(created.payload.component)}
                </span>
              </div>
              <div className="pay-row">
                <span className="text-muted">Urgency</span>
                <span className="text-strong" style={{ textTransform: 'capitalize' }}>
                  {created.payload.urgency}
                </span>
              </div>
              <div className="pay-row">
                <span className="text-muted">Ward</span>
                <span className="text-strong">{created.payload.ward}</span>
              </div>
              <div className="pay-row pay-row--total">
                <span>Current status</span>
                <Badge tone="info" dot>
                  Hospital review
                </Badge>
              </div>
            </div>

            <Alert tone="demo" title="Continue the demo flow">
              Open the Hospital portal as Dr. Rohan Mehta to review this request and assign a blood
              bank. The same request then appears in the Blood Bank portal.
            </Alert>

            <div className="row gap-2 wrap mt-5">
              <Button onClick={() => navigate(`/patient/requests/${created.id}`)} iconRight="arrow-right">
                Track this request
              </Button>
              <Button
                variant="secondary"
                icon="hospital"
                onClick={() => {
                  app.login('user-hospital');
                  navigate('/hospital/requests');
                }}
              >
                Open hospital portal
              </Button>
            </div>
          </Card>

          <div className="stack gap-4">
            <Card className="card--pad">
              <h3 className="card__title mb-3">What happens next</h3>
              <div className="stack gap-3">
                {[
                  ['hospital', 'Hospital review', 'Clinical need confirmed.'],
                  ['bank', 'Blood bank check', 'Stock confirmed or forwarded.'],
                  ['flask', 'Testing & approval', 'Compatibility test, then approval.'],
                  ['truck', 'Delivery', 'Courier brings units to the ward.'],
                ].map(([icon, title, text], i) => (
                  <div className="row gap-2" key={title} style={{ alignItems: 'flex-start' }}>
                    <span className="stat__icon stat__icon--neutral" style={{ width: 26, height: 26 }}>
                      <Icon name={icon} className="icon icon--sm" />
                    </span>
                    <div>
                      <div className="text-xs text-strong">
                        {i + 1}. {title}
                      </div>
                      <div className="text-xs text-muted">{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <DemoNotice compact>
              This request is simulated and stored in your browser only.
            </DemoNotice>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="New blood request"
        description="A short form — four sections, most fields already filled with sensible defaults."
        backTo="/patient"
        backLabel="Back to overview"
        actions={
          <Link to="/patient/requests" className="btn btn--secondary">
            My requests
          </Link>
        }
      />

      <div className="grid grid-sidebar">
        <Card>
          <Tabs
            tabs={[
              { id: 'form', label: 'Fill the form' },
              { id: 'qr', label: 'Scan hospital QR' },
            ]}
            value={tab}
            onChange={setTab}
          />
          <CardBody>
            {tab === 'qr' && (
              <div className="mb-5">
                <div className="grid grid-2" style={{ alignItems: 'start' }}>
                  <QrScanSimulator
                    token="BB-HOSP-SUNRIS-9F2A"
                    hospitalName="Sunrise Multispecialty Hospital"
                    onDetected={() => {
                      setHospitalId('hosp-sunrise');
                      setTab('form');
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: 'var(--fs-md)' }}>Scanning the QR saves time</h3>
                    <p className="text-sm text-muted mt-2" style={{ lineHeight: 1.6 }}>
                      The hospital QR code identifies the hospital and ward so the form opens
                      pre-filled with the right location.
                    </p>
                    <div className="gate-note mt-3">
                      <Icon name="info" className="icon icon--sm" />
                      <span>Demo scanner: no camera access is requested or used.</span>
                    </div>
                    {hospital && (
                      <div className="alert alert--success mt-3">
                        <Icon name="check-circle" className="icon alert__icon" />
                        <div>
                          <div className="alert__title">Hospital selected</div>
                          <div className="alert__body">{hospital.name}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <BloodRequestForm
              key={hospitalId || 'no-hospital'}
              mode="patient"
              hospitals={app.hospitals}
              defaultHospitalId={hospitalId}
              defaultRequester={{
                name: app.currentUser?.name || '',
                relation: 'Attendant',
                phone: app.currentUser?.phone || '',
              }}
              onSubmit={handleSubmit}
              submitLabel="Submit request"
            />
          </CardBody>
        </Card>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-2">Before you submit</h3>
            <ul className="stack gap-3 mt-2">
              {[
                ['Check the blood group', 'Use the group printed on the hospital requisition.'],
                ['Choose urgency honestly', 'Critical should mean the patient needs blood immediately.'],
                ['Add a ward or bed number', 'It helps the courier and the nursing desk.'],
                ['Keep your phone reachable', 'The blood bank may call to confirm details.'],
              ].map(([title, text]) => (
                <li key={title} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                  <Icon name="check" className="icon icon--sm" style={{ color: 'var(--success)', marginTop: 3 }} />
                  <div>
                    <div className="text-xs text-strong">{title}</div>
                    <div className="text-xs text-muted">{text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Alert tone="warning" title="This is a demo">
            Submitting this form creates a simulated request inside the prototype. It does not notify
            any hospital and cannot reserve real blood units.
          </Alert>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Need a hand?</h3>
            <p className="text-xs text-muted">
              Call the hospital coordination desk and quote your request ID once it is created.
            </p>
            <div className="text-sm text-strong mt-2 row gap-2">
              <Icon name="phone" className="icon icon--sm text-muted" />
              +91 141 402 8800
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
