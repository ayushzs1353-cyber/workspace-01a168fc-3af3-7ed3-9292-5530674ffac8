import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { BarChart, StockBar } from '../../components/ui/Charts.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  CardBody,
  DemoNotice,
  EmptyState,
  StatusBadge,
  UrgencyBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import {
  bankInventory,
  bankPendingCount,
  getBank,
  hospitalStock,
  inventoryByGroup,
  inventoryTotals,
  lowStockRows,
  orgName,
} from '../../state/selectors.js';
import { componentLabel, daysUntil, formatDate, isOpen, timeAgo } from '../../data/reference.js';

export default function BankOverview() {
  const app = useApp();
  const user = app.currentUser;
  const bank = getBank(app, user.bankId);
  const requests = app.requests.filter(
    (r) => r.bankId === user.bankId || r.forwardedToBankId === user.bankId,
  );
  const rows = bankInventory(app, user.bankId);
  const totals = inventoryTotals(rows);
  const groups = inventoryByGroup(rows);
  const navigate = useNavigate();

  const incoming = requests.filter((r) => ['bank_review', 'forwarded'].includes(r.status));
  const testing = requests.filter((r) => r.status === 'testing');
  const awaitingApproval = requests.filter((r) => r.status === 'approval');
  const ready = requests.filter((r) => r.status === 'ready');
  const activeShipments = app.shipments.filter(
    (s) => s.bankId === user.bankId && s.status !== 'delivered',
  );
  const low = lowStockRows(rows);

  return (
    <>
      <PageHeader
        title="Blood bank overview"
        description={`${bank?.name} · ${bank?.city} · ${bank?.operatingHours} · ${bank?.coldStorage}`}
        actions={
          <>
            <Link to="/bank/inventory" className="btn btn--secondary">
              <Icon name="layers" />
              Update stock
            </Link>
            <Link to="/bank/requests" className="btn btn--primary">
              <Icon name="clipboard" />
              Incoming requests
            </Link>
          </>
        }
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat
          label="Requests to action"
          value={incoming.length}
          icon="clipboard"
          tone={incoming.length ? 'warning' : 'success'}
          meta="Awaiting accept, decline or forward"
          onClick={() => navigate('/bank/requests')}
        />
        <Stat
          label="In compatibility testing"
          value={testing.length}
          icon="flask"
          tone="info"
          meta="Record results to progress"
          onClick={() => navigate('/bank/requests')}
        />
        <Stat
          label="Ready to dispatch"
          value={ready.length}
          icon="truck"
          tone="success"
          meta="Approved by the hospital"
          onClick={() => navigate('/bank/requests')}
        />
        <Stat
          label="Units in stock"
          value={totals.units}
          icon="droplet"
          meta={`${totals.lowGroups} group(s) low · ${totals.expiringSoon} expiring soon`}
          onClick={() => navigate('/bank/inventory')}
        />
      </div>

      <div className="grid-sidebar section-gap">
        <div className="stack gap-4">
          {incoming.length > 0 && (
            <Card flush>
              <CardHeader
                title="New requests waiting for you"
                subtitle="Accept, decline, or forward to a partner bank"
                action={
                  <Badge tone="warning" dot>
                    {incoming.length} new
                  </Badge>
                }
              />
              {incoming.map((r) => (
                <div
                  key={r.id}
                  className="row-between wrap gap-3"
                  style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}
                >
                  <div className="row gap-3">
                    <BloodPill group={r.bloodGroup} />
                    <div>
                      <div className="text-sm text-strong">
                        {r.id} · {r.units} unit(s) {componentLabel(r.component)}
                      </div>
                      <div className="text-xs text-muted">
                        {orgName(app, r.hospitalId)} · {r.ward} · {timeAgo(r.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <UrgencyBadge urgency={r.urgency} />
                    <Link to={`/bank/requests/${r.id}`} className="btn btn--primary btn--sm">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {awaitingApproval.length > 0 && (
            <Alert tone="warning" title={`${awaitingApproval.length} request(s) awaiting hospital approval`}>
              Compatibility testing is complete. Dispatch is blocked until the hospital records
              clinical approval — this is deliberate.
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Stock by blood group"
              subtitle="Units available across all components"
              action={
                <Link to="/bank/inventory" className="btn btn--ghost btn--sm">
                  Manage
                </Link>
              }
            />
            <CardBody>
              <BarChart
                data={groups.map((g) => ({
                  label: g.bloodGroup,
                  value: g.units,
                  muted: g.units === 0,
                }))}
                height={150}
                suffix=""
              />
              <div className="grid grid-4 mt-4" style={{ gap: 8 }}>
                {groups.slice(0, 4).map((g) => (
                  <div className="inv-card" key={g.bloodGroup}>
                    <div className="inv-card__top">
                      <BloodPill group={g.bloodGroup} />
                    </div>
                    <div className="inv-card__units">
                      {g.units}
                      <small>units</small>
                    </div>
                    <StockBar value={g.units} max={20} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card flush>
            <CardHeader
              title="Requests in progress"
              subtitle="Testing through to delivery"
              action={
                <Link to="/bank/requests" className="btn btn--ghost btn--sm">
                  All requests
                </Link>
              }
            />
            {testing.length + ready.length + awaitingApproval.length === 0 ? (
              <EmptyState
                icon="check-circle"
                title="Nothing in progress"
                description="Accepted requests will appear here as they move through testing and dispatch."
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Hospital</th>
                      <th>Requirement</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...testing, ...awaitingApproval, ...ready].map((r) => (
                      <tr
                        key={r.id}
                        className="is-clickable"
                        onClick={() => navigate(`/bank/requests/${r.id}`)}
                      >
                        <td>
                          <span className="mono text-strong">{r.id}</span>
                          <span className="table__meta">{r.urgency === 'critical' ? 'Critical' : r.urgency}</span>
                        </td>
                        <td>{orgName(app, r.hospitalId)}</td>
                        <td>
                          <div className="row gap-2">
                            <BloodPill group={r.bloodGroup} />
                            <span>
                              {r.units} × {componentLabel(r.component)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Icon name="chevron-right" className="icon text-subtle" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-3">Quick actions</h3>
            <div className="stack gap-2">
              <Link to="/bank/inventory" className="btn btn--primary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="plus" /> Add or update stock
              </Link>
              <Link to="/bank/requests" className="btn btn--secondary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="clipboard" /> Review incoming requests
              </Link>
              <Link to="/bank/shipments" className="btn btn--secondary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="truck" /> Track shipments
              </Link>
              <Link to="/bank/history" className="btn btn--secondary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="history" /> Transaction history
              </Link>
            </div>
          </Card>

          <Card flush>
            <CardHeader title="Stock alerts" subtitle={`${low.length} record(s) at or below threshold`} />
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {low.length === 0 ? (
                <p className="text-sm text-muted" style={{ padding: 20 }}>
                  Stock levels look healthy.
                </p>
              ) : (
                low.slice(0, 6).map((row) => (
                  <div
                    key={row.id}
                    className="row-between"
                    style={{ padding: '11px 20px', borderTop: '1px solid var(--border)' }}
                  >
                    <span className="row gap-2">
                      <BloodPill group={row.bloodGroup} />
                      <span className="text-sm">{componentLabel(row.component)}</span>
                    </span>
                    <span className="row gap-2">
                      <span className="text-xs text-muted">exp {formatDate(row.earliestExpiry)}</span>
                      <Badge tone={row.units === 0 ? 'danger' : 'warning'}>
                        {row.units} left
                      </Badge>
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="card__footer">
              <Link to="/bank/inventory" className="btn btn--secondary btn--sm">
                Update inventory
              </Link>
            </div>
          </Card>

          <Card flush>
            <CardHeader title="Active shipments" subtitle={`${activeShipments.length} on the road`} />
            {activeShipments.length === 0 ? (
              <p className="text-sm text-muted" style={{ padding: 20 }}>
                No active shipments.
              </p>
            ) : (
              activeShipments.map((s) => (
                <div key={s.id} style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                  <div className="row-between">
                    <span className="mono text-sm text-strong">{s.id}</span>
                    <Badge tone={s.status === 'delivered' ? 'success' : 'info'} dot>
                      {s.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    → {orgName(app, s.hospitalId)} · {s.temperature.at(-1)?.value ?? '—'} °C
                  </div>
                </div>
              ))
            )}
            <div className="card__footer">
              <Link to="/bank/shipments" className="btn btn--secondary btn--sm">
                Open shipments
              </Link>
            </div>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Hospital stock view</h3>
            <p className="text-xs text-muted mb-3">
              What your partner hospitals see of this bank right now.
            </p>
            <div className="grid grid-4" style={{ gap: 6 }}>
              {hospitalStock(app)
                .slice(0, 8)
                .map((g) => (
                  <div key={g.bloodGroup} className="text-xs" style={{ textAlign: 'center' }}>
                    <BloodPill group={g.bloodGroup} />
                    <div className="text-strong" style={{ marginTop: 2 }}>
                      {g.units}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {totals.expiringSoon > 0 && (
            <Alert tone="warning" title={`${totals.expiringSoon} record(s) expiring within 5 days`}>
              Rotate older units first. Try to prioritise urgent requests for these groups.
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
