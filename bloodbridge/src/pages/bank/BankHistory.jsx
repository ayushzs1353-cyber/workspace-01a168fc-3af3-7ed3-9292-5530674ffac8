import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import {
  Badge,
  BloodPill,
  Button,
  CardBody,
  DataTable,
  DemoNotice,
  StatusBadge,
  Tabs,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { bankRequests, orgName } from '../../state/selectors.js';
import { componentLabel, formatDateTime } from '../../data/reference.js';
import { downloadCsv } from '../../lib/export.js';

export default function BankHistory() {
  const app = useApp();
  const [tab, setTab] = useState('requests');
  const requests = bankRequests(app, app.currentUser.bankId);
  const shipments = app.shipments.filter((s) => s.bankId === app.currentUser.bankId);
  const closed = requests.filter((r) => ['delivered', 'completed', 'rejected', 'cancelled'].includes(r.status));
  const logs = app.audit.filter((a) => a.actor === app.currentUser.name || a.target?.includes('bank'));

  const requestColumns = [
    {
      key: 'id',
      header: 'Request',
      render: (r) => (
        <div>
          <span className="mono text-strong">{r.id}</span>
          <span className="table__meta">{formatDateTime(r.createdAt)}</span>
        </div>
      ),
    },
    { key: 'hospital', header: 'Hospital', render: (r) => orgName(app, r.hospitalId) },
    {
      key: 'requirement',
      header: 'Requirement',
      render: (r) => (
        <div className="row gap-2">
          <BloodPill group={r.bloodGroup} />
          <span>
            {r.units} × {componentLabel(r.component)}
          </span>
        </div>
      ),
    },
    { key: 'status', header: 'Outcome', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'shipment',
      header: 'Shipment',
      render: (r) => (r.shipmentId ? <span className="mono text-xs">{r.shipmentId}</span> : '—'),
    },
  ];

  const shipmentColumns = [
    {
      key: 'id',
      header: 'Shipment',
      render: (s) => (
        <div>
          <span className="mono text-strong">{s.id}</span>
          <span className="table__meta">{s.requestId}</span>
        </div>
      ),
    },
    { key: 'to', header: 'Hospital', render: (s) => orgName(app, s.hospitalId) },
    { key: 'units', header: 'Units', render: (s) => `${s.units}` },
    {
      key: 'delivered',
      header: 'Delivered',
      render: (s) => (s.delivery.at ? formatDateTime(s.delivery.at) : '—'),
    },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'delivered' ? 'success' : 'info'}>{s.status.replace('_', ' ')}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Transaction history"
        description="Closed requests, completed shipments and the audit entries recorded for your bank."
        actions={
          <Button
            variant="secondary"
            icon="download"
            onClick={() =>
              downloadCsv(
                'bloodbridge-bank-history.csv',
                requests,
                [
                  { header: 'Request ID', key: 'id' },
                  { header: 'Hospital', value: (r) => orgName(app, r.hospitalId) },
                  { header: 'Blood group', key: 'bloodGroup' },
                  { header: 'Component', value: (r) => componentLabel(r.component) },
                  { header: 'Units', key: 'units' },
                  { header: 'Status', key: 'status' },
                  { header: 'Shipment', value: (r) => r.shipmentId || '' },
                  { header: 'Created', key: 'createdAt' },
                ],
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <div style={{ padding: '0 12px' }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'requests', label: 'Requests', count: requests.length },
              { id: 'closed', label: 'Closed', count: closed.length },
              { id: 'shipments', label: 'Shipments', count: shipments.length },
              { id: 'audit', label: 'Audit entries', count: logs.length },
            ]}
          />
        </div>

        {tab === 'requests' && (
          <DataTable
            columns={requestColumns}
            rows={requests}
            searchFields={['id', 'bloodGroup']}
            searchPlaceholder="Search by request ID or group"
            pageSize={8}
            empty={{ title: 'No requests recorded', description: 'Requests will appear here once assigned.' }}
          />
        )}

        {tab === 'closed' && (
          <DataTable
            columns={requestColumns}
            rows={closed}
            searchFields={['id', 'bloodGroup']}
            searchPlaceholder="Search closed requests"
            pageSize={8}
            empty={{ title: 'No closed requests yet', description: 'Delivered, declined and cancelled requests appear here.' }}
          />
        )}

        {tab === 'shipments' && (
          <DataTable
            columns={shipmentColumns}
            rows={shipments}
            searchFields={['id', 'requestId']}
            searchPlaceholder="Search shipments"
            pageSize={8}
            empty={{ title: 'No shipments yet' }}
          />
        )}

        {tab === 'audit' && (
          <CardBody>
            <div className="timeline">
              {logs.map((entry) => (
                <div className="timeline__row" key={entry.id}>
                  <span className={`timeline__dot timeline__dot--${entry.category === 'alert' ? 'warning' : 'red'}`} />
                  <div>
                    <div className="timeline__title">
                      {entry.action}
                      <span className="text-xs text-subtle" style={{ fontWeight: 500 }}>
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    <div className="timeline__meta">
                      {entry.actor} · {entry.role} · target {entry.target}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        )}
      </Card>

      <p className="text-xs text-subtle mt-4">
        <Icon name="flask" className="icon icon--sm" style={{ display: 'inline', verticalAlign: '-3px' }} />{' '}
        History is generated from the demonstration dataset in your browser.
      </p>
    </>
  );
}
