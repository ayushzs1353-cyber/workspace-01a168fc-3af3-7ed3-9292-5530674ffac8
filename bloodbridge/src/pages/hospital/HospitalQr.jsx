import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { Alert, Badge, Button, DemoNotice } from '../../components/ui/index.js';
import QrCode from '../../components/domain/QrCode.jsx';
import { useApp } from '../../state/store.jsx';
import { getHospital } from '../../state/selectors.js';
import { copyText, printPage } from '../../lib/export.js';

export default function HospitalQr() {
  const app = useApp();
  const hospital = getHospital(app, app.currentUser?.hospitalId);
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/request-blood?hospital=${hospital?.id}`;

  return (
    <>
      <PageHeader
        title="Hospital QR code"
        description="Print this at the admission desk, wards and emergency bay so attendants can open a pre-filled request form."
        actions={
          <>
            <Button
              variant="secondary"
              icon={copied ? 'check' : 'clipboard'}
              onClick={async () => {
                const ok = await copyText(link);
                setCopied(ok);
                window.setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? 'Link copied' : 'Copy link'}
            </Button>
            <Button icon="file-text" onClick={printPage}>
              Print sign
            </Button>
          </>
        }
      />

      <DemoNotice compact />

      <div className="grid-sidebar mt-5">
        <div className="stack gap-4">
          <Card>
            <div className="card__header">
              <div>
                <h2 className="card__title">Scan to request blood</h2>
                <p className="card__subtitle">{hospital?.name}</p>
              </div>
              <Badge tone="success" dot>
                Verified in demo
              </Badge>
            </div>
            <div className="card__body">
              <div className="row gap-6 wrap" style={{ alignItems: 'flex-start' }}>
                <div className="qr-card grow" style={{ maxWidth: 320 }}>
                  <div className="qr-frame">
                    <QrCode token={hospital?.qrToken} size={168} />
                  </div>
                  <div className="row gap-2" style={{ justifyContent: 'center' }}>
                    <Icon name="hospital" className="icon icon--sm text-muted" />
                    <span className="text-sm text-strong">{hospital?.short}</span>
                  </div>
                  <div className="mono text-xs text-muted mt-2">{hospital?.qrToken}</div>
                  <p className="text-xs text-subtle mt-3">
                    Demo QR graphic — decorative only. Use “Scan hospital QR code” in the patient
                    portal to simulate a scan.
                  </p>
                </div>

                <div className="grow" style={{ minWidth: 260 }}>
                  <h3 className="text-sm text-strong mb-2">How to display it</h3>
                  <ol className="stack gap-3">
                    {[
                      'Print this page and place it at the admission counter.',
                      'Add a copy to the emergency bay and each ward nursing desk.',
                      'Attendants scan with their phone camera to open the request form.',
                      'The form arrives with the hospital and ward already selected.',
                    ].map((text, i) => (
                      <li key={text} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                        <span
                          className="step__marker"
                          style={{ width: 22, height: 22, fontSize: 11, flexShrink: 0 }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm text-muted">{text}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5">
                    <div className="text-xs text-muted mb-1">Public request link</div>
                    <div className="row gap-2 wrap">
                      <code
                        className="text-xs"
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          padding: '8px 10px',
                          borderRadius: 6,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {link}
                      </code>
                      <Link to="/request-blood" className="btn btn--secondary btn--sm">
                        Open preview
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Alert tone="info" title="What the QR does — and does not do">
                It identifies your hospital so the request reaches the right team. It never contains
                patient information, and it cannot be used to view or edit any existing request.
              </Alert>
            </div>
          </Card>

          <Card>
            <div className="card__header">
              <div>
                <h3 className="card__title">Ward QR codes</h3>
                <p className="card__subtitle">Optional: pre-select a ward as well as the hospital</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ward / area</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Emergency bay', 'BB-HOSP-SUNRIS-EMRG'],
                    ['Ward A', 'BB-HOSP-SUNRIS-WDA'],
                    ['Ward B', 'BB-HOSP-SUNRIS-WDB'],
                    ['ICU', 'BB-HOSP-SUNRIS-ICU'],
                  ].map(([ward, code]) => (
                    <tr key={code}>
                      <td className="text-strong">{ward}</td>
                      <td className="mono text-xs">{code}</td>
                      <td>
                        <Badge tone="success" dot>
                          Active
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyText(code)}
                        >
                          Copy
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card__footer text-xs text-muted">
              Ward-level codes are a demo illustration; the prototype uses the hospital code only.
            </div>
          </Card>
        </div>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-2">QR details</h3>
            <div className="info-row">
              <span className="info-row__label">Hospital</span>
              <span className="info-row__value">{hospital?.short}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">City</span>
              <span className="info-row__value">{hospital?.city}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Token</span>
              <span className="info-row__value mono text-xs">{hospital?.qrToken}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Connected banks</span>
              <span className="info-row__value">{hospital?.connectedBankIds?.length}</span>
            </div>
            <Link to="/request-blood" className="btn btn--primary btn--block mt-3">
              Preview the attendant flow
            </Link>
          </Card>

          <Alert tone="warning" title="Protect the sign">
            Regenerate the code if a printed sign goes missing. In production, codes would be
            revocable from this page.
          </Alert>
        </div>
      </div>
    </>
  );
}
