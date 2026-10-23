import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  Badge,
  DataTable,
  DemoNotice,
  ShipmentStatusBadge,
  Tabs,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { orgName, visibleShipments } from '../../state/selectors.js';
import { TEMP_RANGE, formatDateTime, timeAgo } from '../../data/reference.js';

export default function OperatorShipments() {
  const app = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const all = visibleShipments(app, app.currentUser);
  const rows = all.filter((s) => (tab === 'active' ? s.status !== 'delivered' : s.status === 'delivered'));

  const columns = [
    {
      key: 'id',
      header: 'Shipment',
      sortValue: (s) => s.createdAt,
      render: (s) => (
        <div>
          <span className="mono text-strong">{s.id}</span>
          <span className="table__meta">{s.requestId}</span>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (s) => (
        <div>
          <span className="text-xs">{orgName(app, s.bankId)}</span>
          <span className="table__meta">→ {orgName(app, s.hospitalId)}</span>
        </div>
      ),
    },
    {
      key: 'window',
      header: 'Window',
      render: (s) => (
        <div>
          <span className="text-xs">{s.status === 'created' ? s.pickup.window : s.delivery.window}</span>
          <span className="table__meta">{s.distanceKm} km</span>
        </div>
      ),
    },
    {
      key: 'temp',
      header: 'Cold box',
      render: (s) => {
        const latest = s.temperature.at(-1);
        if (!latest) return <span className="text-xs text-muted">Not started</span>;
        const breach = latest.value < TEMP_RANGE.min || latest.value > TEMP_RANGE.max;
        return (
          <span className={`temp-badge ${breach ? 'temp-badge--alert' : ''}`}>
            <Icon name="thermometer" className="icon icon--sm" />
            {latest.value} °C
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <div>
          <ShipmentStatusBadge status={s.status} />
          <span className="table__meta">
            {s.delivery.at ? formatDateTime(s.delivery.at) : timeAgo(s.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (s) => (
        <span className="btn btn--secondary btn--sm">{s.status === 'delivered' ? 'View' : 'Update'}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="My shipments"
        description="Everything assigned to you, active and completed."
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <div style={{ padding: '0 12px' }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'active', label: 'Active', count: all.filter((s) => s.status !== 'delivered').length },
              { id: 'done', label: 'Delivered', count: all.filter((s) => s.status === 'delivered').length },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(s) => navigate(`/operator/shipments/${s.id}`)}
          searchFields={['id', 'requestId']}
          searchPlaceholder="Search shipment or request ID"
          pageSize={8}
          empty={{
            title: tab === 'active' ? 'No active shipments' : 'No completed deliveries',
            description:
              tab === 'active'
                ? 'When a blood bank assigns you a pickup, it will appear here.'
                : 'Delivered shipments will be listed here with their timestamps.',
          }}
          mobileRender={(s) => (
            <>
              <div className="mobile-row__top">
                <div>
                  <span className="mono text-strong">{s.id}</span>
                  <div className="text-xs text-muted">{orgName(app, s.hospitalId)}</div>
                </div>
                <ShipmentStatusBadge status={s.status} />
              </div>
              <div className="row-between">
                <span className="text-xs text-muted">
                  {s.units} unit(s) · {s.distanceKm} km
                </span>
                <Badge tone="neutral">{s.temperature.at(-1)?.value ?? '—'} °C</Badge>
              </div>
            </>
          )}
        />
      </Card>
    </>
  );
}
