import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { TempChart } from '../../components/ui/Charts.jsx';
import {
  Alert,
  Badge,
  Button,
  DataTable,
  DemoNotice,
  Modal,
  ShipmentStatusBadge,
} from '../../components/ui/index.js';
import ShipmentProgress from '../../components/domain/ShipmentProgress.jsx';
import { useApp } from '../../state/store.jsx';
import { getShipment, orgName } from '../../state/selectors.js';
import { TEMP_RANGE, formatDateTime } from '../../data/reference.js';

export default function AdminShipments() {
  const app = useApp();
  const [selected, setSelected] = useState(null);
  const shipment = selected ? getShipment(app, selected) : null;

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
      key: 'from',
      header: 'From → to',
      render: (s) => (
        <div>
          <span className="text-xs">{orgName(app, s.bankId)}</span>
          <span className="table__meta">→ {orgName(app, s.hospitalId)}</span>
        </div>
      ),
    },
    {
      key: 'courier',
      header: 'Courier',
      render: (s) => (
        <div>
          <span className="text-xs">{app.users.find((u) => u.id === s.operatorId)?.name}</span>
          <span className="table__meta">{s.vehicle}</span>
        </div>
      ),
    },
    {
      key: 'temp',
      header: 'Temp.',
      render: (s) => {
        const latest = s.temperature.at(-1);
        if (!latest) return <Badge tone="neutral">—</Badge>;
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
          <span className="table__meta">{s.temperature.length} reading(s)</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(s.id);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Shipments"
        description="All simulated dispatches with their cold-chain readings."
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <DataTable
          columns={columns}
          rows={app.shipments}
          onRowClick={(s) => setSelected(s.id)}
          searchFields={['id', 'requestId', 'vehicle']}
          searchPlaceholder="Search shipment or request"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'created', label: 'Awaiting pickup' },
                { value: 'picked_up', label: 'Picked up' },
                { value: 'in_transit', label: 'In transit' },
                { value: 'delivered', label: 'Delivered' },
              ],
              accessor: (s) => s.status,
            },
          ]}
          pageSize={9}
          empty={{ title: 'No shipments recorded' }}
        />
      </Card>

      <Modal
        open={!!shipment}
        onClose={() => setSelected(null)}
        size="lg"
        icon="truck"
        title={shipment ? `Shipment ${shipment.id}` : ''}
        description={
          shipment ? `${orgName(app, shipment.bankId)} → ${orgName(app, shipment.hospitalId)}` : ''
        }
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {shipment && (
          <div className="stack gap-5">
            <ShipmentProgress shipment={shipment} />
            <dl className="desc-list">
              <div>
                <dt>Units</dt>
                <dd>{shipment.units}</dd>
              </div>
              <div>
                <dt>Cold box</dt>
                <dd>{shipment.coldBox}</dd>
              </div>
              <div>
                <dt>Pickup</dt>
                <dd>{shipment.pickup.at ? formatDateTime(shipment.pickup.at) : shipment.pickup.window}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {shipment.delivery.at ? formatDateTime(shipment.delivery.at) : shipment.delivery.window}
                </dd>
              </div>
              <div>
                <dt>Received by</dt>
                <dd>{shipment.delivery.receivedBy || '—'}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>{shipment.distanceKm} km</dd>
              </div>
            </dl>
            <div>
              <p className="divider-label">Cold chain</p>
              <TempChart readings={shipment.temperature} height={130} />
            </div>
            {shipment.tempAlerts.length > 0 && (
              <div className="stack gap-2">
                {shipment.tempAlerts.map((a) => (
                  <Alert
                    key={a.id}
                    tone={a.acknowledged ? 'success' : 'danger'}
                    title={`${a.value} °C at ${formatDateTime(a.at)}`}
                  >
                    {a.note} {a.acknowledged ? '(acknowledged)' : '(open)'}
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
