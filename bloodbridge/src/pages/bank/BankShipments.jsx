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
import { getShipment, orgName, visibleShipments } from '../../state/selectors.js';
import { TEMP_RANGE, formatDateTime, timeAgo } from '../../data/reference.js';

export default function BankShipments() {
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
      key: 'to',
      header: 'Deliver to',
      render: (s) => (
        <div>
          <span>{orgName(app, s.hospitalId)}</span>
          <span className="table__meta">{s.delivery.ward}</span>
        </div>
      ),
    },
    { key: 'units', header: 'Units', render: (s) => `${s.units} unit(s)` },
    {
      key: 'courier',
      header: 'Courier',
      render: (s) => (
        <div>
          <span>{app.users.find((u) => u.id === s.operatorId)?.name}</span>
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
          <span className="table__meta">{timeAgo(s.createdAt)}</span>
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
            setSelectedId(s.id);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  const openAlerts = shipments.flatMap((s) =>
    s.tempAlerts.filter((a) => !a.acknowledged).map((a) => ({ ...a, shipmentId: s.id })),
  );

  return (
    <>
      <PageHeader
        title="Shipments"
        description="Dispatch progress for units leaving your blood bank."
        actions={
          <Link to="/bank/requests" className="btn btn--secondary">
            <Icon name="clipboard" />
            Requests
          </Link>
        }
      />

      <DemoNotice compact />

      {openAlerts.length > 0 && (
        <div className="mt-4">
          <Alert
            tone="danger"
            title={`${openAlerts.length} unacknowledged temperature alert(s)`}
            action={
              <Button size="sm" variant="danger-outline" onClick={() => setSelectedId(openAlerts[0].shipmentId)}>
                Review
              </Button>
            }
          >
            A simulated reading went outside the 2–6 °C range. Review the shipment with the courier
            and record what happened.
          </Alert>
        </div>
      )}

      <Card className="mt-4" flush>
        <DataTable
          columns={columns}
          rows={shipments}
          onRowClick={(s) => setSelectedId(s.id)}
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
          pageSize={7}
          empty={{
            title: 'No shipments yet',
            description: 'Create a shipment from an approved request to see it here.',
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
                  {s.units} unit(s) · {s.temperature.at(-1)?.value ?? '—'} °C
                </span>
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
        icon="truck"
        title={selected ? `Shipment ${selected.id}` : ''}
        description={
          selected ? `Request ${selected.requestId} · ${orgName(app, selected.hospitalId)}` : ''
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              Close
            </Button>
            {selected && (
              <Link to={`/bank/requests/${selected.requestId}`} className="btn btn--primary">
                Open request
              </Link>
            )}
          </>
        }
      >
        {selected && (
          <div className="stack gap-5">
            <ShipmentProgress shipment={selected} />
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="card card--pad" style={{ boxShadow: 'none' }}>
                <div className="text-xs text-muted mb-1">Pickup</div>
                <div className="text-sm text-strong">{selected.pickup.address}</div>
                <div className="text-xs text-muted mt-2">
                  {selected.pickup.at ? formatDateTime(selected.pickup.at) : selected.pickup.window}
                </div>
              </div>
              <div className="card card--pad" style={{ boxShadow: 'none' }}>
                <div className="text-xs text-muted mb-1">Delivery</div>
                <div className="text-sm text-strong">{selected.delivery.ward}</div>
                <div className="text-xs text-muted mt-2">
                  {selected.delivery.at ? formatDateTime(selected.delivery.at) : selected.delivery.window}
                </div>
              </div>
            </div>

            <div>
              <p className="divider-label">Cold chain (simulated)</p>
              <TempChart readings={selected.temperature} height={130} />
            </div>

            {selected.tempAlerts.length > 0 && (
              <div className="stack gap-2">
                <p className="divider-label">Excursions</p>
                {selected.tempAlerts.map((alert) => (
                  <div className="alert alert--danger" key={alert.id}>
                    <Icon name="alert-triangle" className="icon alert__icon" />
                    <div className="grow">
                      <div className="alert__title">
                        {alert.value} °C at {formatDateTime(alert.at)}
                      </div>
                      <div className="alert__body">{alert.note}</div>
                    </div>
                    {alert.acknowledged ? (
                      <Badge tone="success" dot>
                        Acknowledged
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => app.acknowledgeTempAlert(selected.id, alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

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
          </div>
        )}
      </Modal>
    </>
  );
}
