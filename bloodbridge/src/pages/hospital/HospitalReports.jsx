import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { TrendChart, SplitBar } from '../../components/ui/Charts.jsx';
import {
  Alert,
  Badge,
  Button,
  CardBody,
  DemoNotice,
  Field,
  Select,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank, visibleRequests } from '../../state/selectors.js';
import { OPERATING_REPORT, REQUEST_TREND } from '../../data/demoData.js';
import { COMPONENTS, componentLabel, isOpen } from '../../data/reference.js';
import { downloadCsv } from '../../lib/export.js';

export default function HospitalReports() {
  const app = useApp();
  const requests = visibleRequests(app, app.currentUser);
  const [period, setPeriod] = useState('30');

  const byComponent = COMPONENTS.map((c) => {
    const rows = requests.filter((r) => r.component === c.id);
    return {
      ...c,
      requests: rows.length,
      units: rows.reduce((s, r) => s + r.units, 0),
      delivered: rows.filter((r) => ['delivered', 'completed'].includes(r.status)).length,
    };
  });

  const byBank = app.banks
    .filter((b) => app.currentUser?.hospitalId && b.id !== undefined)
    .map((b) => ({
      bank: b.short,
      requests: requests.filter((r) => r.bankId === b.id).length,
    }))
    .filter((row) => row.requests > 0);

  const openCount = requests.filter((r) => isOpen(r.status)).length;
  const delivered = requests.filter((r) => ['delivered', 'completed'].includes(r.status)).length;

  return (
    <>
      <PageHeader
        title="Reports"
        description="A simple operational summary for your hospital. All figures come from the demo data."
        actions={
          <>
            <Button
              variant="secondary"
              icon="download"
              onClick={() =>
                downloadCsv(
                  'bloodbridge-hospital-requests.csv',
                  requests,
                  [
                    { header: 'Request ID', key: 'id' },
                    { header: 'Patient', key: 'patientName' },
                    { header: 'Blood group', key: 'bloodGroup' },
                    { header: 'Component', value: (r) => componentLabel(r.component) },
                    { header: 'Units', key: 'units' },
                    { header: 'Urgency', key: 'urgency' },
                    { header: 'Status', key: 'status' },
                    { header: 'Blood bank', value: (r) => getBank(app, r.bankId)?.name || '' },
                    { header: 'Created', key: 'createdAt' },
                  ],
                )
              }
            >
              Export CSV
            </Button>
            <Button variant="secondary" icon="file-text" onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      />

      <DemoNotice compact />

      <div className="row-between mt-5 mb-4 wrap gap-3">
        <div className="row gap-2">
          <Badge tone="neutral">Demo period</Badge>
          <span className="text-sm text-muted">
            {period === '30' ? 'Last 30 days' : period === '7' ? 'Last 7 days' : 'This quarter'}
          </span>
        </div>
        <div style={{ width: 200 }}>
          <Field label="Period" htmlFor="report-period">
            <Select id="report-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">This quarter</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="stat-grid">
        <Stat
          label="Requests received"
          value={requests.length}
          icon="clipboard"
          meta={`${openCount} still open`}
        />
        <Stat
          label="Delivered"
          value={delivered}
          icon="check-circle"
          tone="success"
          meta={`${OPERATING_REPORT.onTimeDeliveryPct}% on-time (demo)`}
        />
        <Stat
          label="Average fulfilment"
          value={`${Math.floor(OPERATING_REPORT.avgFulfilmentMinutes / 60)}h ${OPERATING_REPORT.avgFulfilmentMinutes % 60}m`}
          icon="clock"
          tone="info"
          meta="Request → delivered"
        />
        <Stat
          label="Units issued"
          value={OPERATING_REPORT.unitsIssued}
          icon="droplet"
          tone="neutral"
          meta="Across all components (demo)"
        />
      </div>

      <div className="grid-sidebar section-gap">
        <Card>
          <CardHeader title="Requests vs fulfilled" subtitle="Last 7 days of demo activity" />
          <CardBody>
            <TrendChart data={REQUEST_TREND} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cold chain" subtitle="Simulated compliance" />
          <CardBody>
            <div className="stat__value" style={{ fontSize: 'var(--fs-4xl)' }}>
              {OPERATING_REPORT.coldChainCompliancePct}%
            </div>
            <p className="text-sm text-muted">
              of demo shipments stayed within 2–6 °C for all recorded readings.
            </p>
            <div className="mt-4">
              <p className="text-xs text-muted mb-2">Status mix</p>
              <SplitBar
                segments={[
                  { label: 'Within range', value: 93, color: 'var(--success)' },
                  { label: 'Excursion', value: 7, color: 'var(--danger)' },
                ]}
              />
            </div>
            <Alert tone="warning" title="1 open excursion">
              Shipment SHP-2087 recorded 7.6 °C during handover. Review with the blood bank.
            </Alert>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-2 section-gap">
        <Card flush>
          <CardHeader title="By component" subtitle="Requests and units issued" />
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Requests</th>
                  <th>Units</th>
                  <th>Delivered</th>
                </tr>
              </thead>
              <tbody>
                {byComponent.map((c) => (
                  <tr key={c.id}>
                    <td className="text-strong">{c.label}</td>
                    <td>{c.requests}</td>
                    <td>{c.units}</td>
                    <td>{c.delivered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card flush>
          <CardHeader title="By blood bank" subtitle="Where your requests went" />
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Blood bank</th>
                  <th>Requests</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {byBank.map((row) => (
                  <tr key={row.bank}>
                    <td className="text-strong">{row.bank}</td>
                    <td>{row.requests}</td>
                    <td>
                      <div className="row gap-2">
                        <div className="progress grow" style={{ height: 6, minWidth: 60 }}>
                          <div
                            className="progress__bar"
                            style={{ width: `${Math.round((row.requests / requests.length) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">
                          {Math.round((row.requests / requests.length) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="text-xs text-subtle mt-5">
        <Icon name="flask" className="icon icon--sm" style={{ display: 'inline', verticalAlign: '-3px' }} />{' '}
        Reports use demonstration data only. Export creates a CSV of the fictional records in your
        browser.
      </p>
    </>
  );
}
