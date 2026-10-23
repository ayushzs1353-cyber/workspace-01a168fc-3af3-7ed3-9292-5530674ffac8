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
  DataTable,
  DemoNotice,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { OPERATING_REPORT, REQUEST_TREND } from '../../data/demoData.js';
import { isOpen } from '../../data/reference.js';
import { downloadCsv } from '../../lib/export.js';

export default function AdminReports() {
  const app = useApp();

  const orgRows = [...app.hospitals, ...app.banks].map((org) => {
    const isHospital = org.type === 'hospital';
    const requests = app.requests.filter((r) =>
      isHospital ? r.hospitalId === org.id : r.bankId === org.id,
    );
    const shipments = app.shipments.filter((s) =>
      isHospital ? s.hospitalId === org.id : s.bankId === org.id,
    );
    return {
      id: org.id,
      name: org.name,
      type: isHospital ? 'Hospital' : 'Blood bank',
      city: org.city,
      requests: requests.length,
      open: requests.filter((r) => isOpen(r.status)).length,
      shipments: shipments.length,
      status: org.status,
    };
  });

  const columns = [
    {
      key: 'name',
      header: 'Organisation',
      render: (r) => (
        <div>
          <span className="text-strong">{r.name}</span>
          <span className="table__meta">
            {r.city} · {r.type}
          </span>
        </div>
      ),
    },
    { key: 'requests', header: 'Requests', sortValue: (r) => r.requests },
    { key: 'open', header: 'Open', render: (r) => (r.open ? <Badge tone="warning">{r.open}</Badge> : '—') },
    { key: 'shipments', header: 'Shipments' },
    {
      key: 'status',
      header: 'Verification',
      render: (r) => (
        <Badge tone={r.status === 'verified' ? 'success' : 'warning'}>
          {r.status === 'verified' ? 'Verified' : 'Pending'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Operational reports"
        description="Platform-level metrics across the demo network. Export works on the demo dataset."
        actions={
          <Button
            variant="secondary"
            icon="download"
            onClick={() =>
              downloadCsv('bloodbridge-platform-report.csv', orgRows, [
                { header: 'Organisation', key: 'name' },
                { header: 'Type', key: 'type' },
                { header: 'City', key: 'city' },
                { header: 'Requests', key: 'requests' },
                { header: 'Open requests', key: 'open' },
                { header: 'Shipments', key: 'shipments' },
                { header: 'Verification', key: 'status' },
              ])
            }
          >
            Export CSV
          </Button>
        }
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat
          label="Avg. fulfilment"
          value={`${Math.floor(OPERATING_REPORT.avgFulfilmentMinutes / 60)}h ${OPERATING_REPORT.avgFulfilmentMinutes % 60}m`}
          icon="clock"
          meta="Request raised → delivered"
        />
        <Stat
          label="On-time delivery"
          value={`${OPERATING_REPORT.onTimeDeliveryPct}%`}
          icon="truck"
          tone="success"
          meta="Within the requested window"
        />
        <Stat
          label="Cold chain compliance"
          value={`${OPERATING_REPORT.coldChainCompliancePct}%`}
          icon="thermometer"
          tone="info"
          meta="Readings within 2–6 °C"
        />
        <Stat
          label="Declined requests"
          value={`${OPERATING_REPORT.declinedPct}%`}
          icon="xcircle"
          tone="warning"
          meta="Mostly rare groups"
        />
      </div>

      <div className="grid-sidebar section-gap">
        <Card>
          <CardHeader
            title="Requests raised vs fulfilled"
            subtitle="Last 7 days · sample data"
            action={<Badge tone="neutral">Demo</Badge>}
          />
          <CardBody>
            <TrendChart data={REQUEST_TREND} />
          </CardBody>
        </Card>

        <div className="stack gap-4">
          <Card>
            <CardHeader title="Fulfilment split" subtitle="Where requests end up" />
            <CardBody>
              <SplitBar
                segments={[
                  { label: 'Delivered', value: 68, color: 'var(--success)' },
                  { label: 'In progress', value: 21, color: 'var(--red-600)' },
                  { label: 'Declined', value: 6, color: 'var(--danger)' },
                  { label: 'Cancelled', value: 5, color: 'var(--text-subtle)' },
                ]}
                height={12}
              />
              <div className="chart-legend mt-3">
                <span>
                  <i style={{ background: 'var(--success)' }} /> Delivered
                </span>
                <span>
                  <i style={{ background: 'var(--red-600)' }} /> In progress
                </span>
                <span>
                  <i style={{ background: 'var(--danger)' }} /> Declined
                </span>
                <span>
                  <i style={{ background: 'var(--text-subtle)' }} /> Cancelled
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Network activity" subtitle="Demo totals" />
            <CardBody>
              <div className="info-row">
                <span className="info-row__label">Units issued</span>
                <span className="info-row__value">{OPERATING_REPORT.unitsIssued}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Discarded at expiry</span>
                <span className="info-row__value">{OPERATING_REPORT.unitsDiscardedExpiry}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Cross-bank transfers</span>
                <span className="info-row__value">{OPERATING_REPORT.crossBankTransfers}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Active organisations</span>
                <span className="info-row__value">{OPERATING_REPORT.activeOrganisations}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-4" flush>
        <CardHeader title="By organisation" subtitle="Request and shipment activity in the demo" />
        <DataTable
          columns={columns}
          rows={orgRows}
          searchFields={['name', 'city', 'type']}
          searchPlaceholder="Search organisation"
          filters={[
            {
              key: 'type',
              label: 'Type',
              options: [
                { value: 'Hospital', label: 'Hospitals' },
                { value: 'Blood bank', label: 'Blood banks' },
              ],
              accessor: (r) => r.type,
            },
          ]}
          pageSize={8}
          empty={{ title: 'No organisations' }}
        />
      </Card>

      <div className="mt-4 grid grid-2">
        <Alert tone="warning" title="Demo metrics">
          Averages and percentages here are illustrative sample values. They are not calculated from
          real operational history and should not be used for planning.
        </Alert>
        <Card className="card--pad">
          <div className="row gap-2 mb-2">
            <Icon name="file-text" className="icon text-muted" />
            <h3 className="card__title">Report packs</h3>
          </div>
          <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
            In a production version you could schedule weekly fulfilment, cold-chain and discrepancy
            summaries for individual hospitals or blood banks. This prototype exports the current
            demo dataset only.
          </p>
        </Card>
      </div>
    </>
  );
}
