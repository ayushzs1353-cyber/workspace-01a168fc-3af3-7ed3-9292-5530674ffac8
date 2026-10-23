import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { getBank, getShipment, visibleShipments } from '../../state/selectors.js';
import { TEMP_RANGE, formatDateTime, timeAgo } from '../../data/reference.js';

export default function HospitalShipments() {
  const app = useApp();
  const shipments = visibleShipments(app, app.currentUser);
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? getShipment(app, selectedId) : null;

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
      key: 'bank',
      header: 'From',
      render: (s) => getBank(app, s.bankId)?.short || '—',
    },
    {
      key: 'units',
      header: 'Units',
      render: (s) => `${s.units} unit(s)`,
    },
    {
      key: 'courier',
      header: 'Courier',
      render: (s) => (
        <div>
          <span>{app.users.find((u) => u.id === s.operatorId)?.name || '—'}</span>
          <span className="table__meta">{s.vehicle}</span>
        </div>
      ),
    },
    {
      key: 'temp',
      header: 'Temperature',
      render: (s) => {
        const latest = s.temperature.at(-1);
        const breach = latest && (latest.value < TEMP_RANGE.min || latest.value > TEMP_RANGE.max);
        return latest ? (
          <span className={`temp-badge ${breach ? 'temp-badge--alert' : ''}`}>
            <Icon name="thermometer" className="icon icon--sm" />
            {latest.value} °C
          </span>
        ) : (
          <Badge tone="neutral">Not started</Badge>
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
            {s.delivery.at ? formatDateTime(s.delivery.at) : `ETA ${s.delivery.window}`}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedId(s.id)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Shipments"
        description="Deliveries to your hospital, with cold-chain readings and handover details."
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <DataTable
          columns={columns}
          rows={shipments}
          onRowClick={(s) => setSelectedId(s.id)}
          searchFields={['id', 'requestId', 'vehicle']}
          searchPlaceholder="Search by shipment or request ID"
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
          pageSize={6}
          empty={{
            title: 'No shipments yet',
            description: 'A shipment appears once a blood bank dispatches an approved request.',
          }}
          mobileRender={(s) => (
            <>
              <div className="mobile-row__top">
                <div>
                  <span className="mono text-strong">{s.id}</span>
                  <div className="text-xs text-muted">
                    {getBank(app, s.bankId)?.short} · {s.units} unit(s)
                  </div>
                </div>
                <ShipmentStatusBadge status={s.status} />
              </div>
              <div className="row-between">
                <span className="text-xs text-muted">{s.vehicle}</span>
                <Button size="sm" variant="secondary" onClick={() => setSelectedId(s.id)}>
                  Details
                </Button>
              </div>
            </>
          )}
        />
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        size="lg"
        title={selected ? `Shipment ${selected.id}` : ''}
        description={
          selected
            ? `${getBank(app, selected.bankId)?.name} · request ${selected.requestId} · ${selected.units} unit(s)`
            : ''
        }
        icon="truck"
        footer={
          <Button variant="secondary" onClick={() => setSelectedId(null)}>
            Close
          </Button>
        }
      >
        {selected && (
          <div className="stack gap-5">
            <ShipmentProgress shipment={selected} />

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="card card--pad" style={{ boxShadow: 'none' }}>
                <div className="row gap-2 mb-2">
                  <Icon name="map-pin" className="icon icon--sm text-muted" />
                  <span className="text-xs text-strong">Pickup</span>
                </div>
                <div className="text-sm text-strong">{selected.pickup.contactName}</div>
                <p className="text-xs text-muted mt-1">{selected.pickup.address}</p>
                <p className="text-xs text-muted mt-2">{selected.pickup.phone}</p>
                <p className="text-xs text-muted">
                  {selected.pickup.at ? formatDateTime(selected.pickup.at) : selected.pickup.window}
                </p>
              </div>
              <div className="card card--pad" style={{ boxShadow: 'none' }}>
                <div className="row gap-2 mb-2">
                  <Icon name="hospital" className="icon icon--sm text-muted" />
                  <span className="text-xs text-strong">Delivery</span>
                </div>
                <div className="text-sm text-strong">{selected.delivery.ward}</div>
                <p className="text-xs text-muted mt-1">{selected.delivery.address}</p>
                <p className="text-xs text-muted mt-2">Handover code: {selected.delivery.otp}</p>
                <p className="text-xs text-muted">
                  {selected.delivery.at ? formatDateTime(selected.delivery.at) : selected.delivery.window}
                </p>
              </div>
            </div>

            <div>
              <p className="divider-label">Cold chain (simulated)</p>
              <TempChart readings={selected.temperature} height={130} />
              {selected.tempAlerts.filter((a) => !a.acknowledged).length > 0 && (
                <Alert tone="danger" title="Temperature excursion">
                  {selected.tempAlerts.filter((a) => !a.acknowledged).length} unacknowledged reading(s)
                  outside 2–6 °C. The platform team and blood bank have been alerted in the demo.
                </Alert>
              )}
            </div>

            <div>
              <p className="divider-label">Timeline</p>
              <div className="timeline">
                {[...selected.timeline].reverse().map((t, i) => (
                  <div className="timeline__row" key={`${t.label}-${i}`}>
                    <span className={`timeline__dot timeline__dot--${t.tone || 'neutral'}`} />
                    <div>
                      <div className="timeline__title">{t.label}</div>
                      <div className="timeline__meta">
                        {formatDateTime(t.at)} · {t.by}
                      </div>
                      {t.note && <div className="timeline__body">{t.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="row-between">
              <span className="text-xs text-muted">Created {timeAgo(selected.createdAt)}</span>
              <Link to={`/hospital/requests/${selected.requestId}`} className="btn btn--secondary btn--sm">
                Open request
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
