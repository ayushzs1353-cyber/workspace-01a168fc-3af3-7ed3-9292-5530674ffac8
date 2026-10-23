import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { TrendChart } from '../../components/ui/Charts.jsx';
import {
  BloodPill,
  Button,
  CardBody,
  DemoNotice,
  StatusBadge,
  UrgencyBadge,
  EmptyState,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import {
  getBank,
  getHospital,
  hospitalApprovalCount,
  hospitalReviewCount,
  lowStockRows,
  orgName,
  requestCounters,
  visibleRequests,
  visibleShipments,
} from '../../state/selectors.js';
import { REQUEST_TREND } from '../../data/demoData.js';
import { componentLabel, isOpen, timeAgo } from '../../data/reference.js';

export default function HospitalOverview() {
  const app = useApp();
  const user = app.currentUser;
  const hospital = getHospital(app, user.hospitalId);
  const requests = visibleRequests(app, user);
  const counters = requestCounters(requests);
  const shipments = visibleShipments(app, user);
  const activeShipments = shipments.filter((s) => s.status !== 'delivered');

  const needsReview = requests.filter((r) => ['submitted', 'hospital_review'].includes(r.status));
  const needsApproval = requests.filter((r) => r.status === 'approval');
  const priority = requests.filter((r) => isOpen(r.status)).slice(0, 5);

  // Stock pressure across connected banks
  const connectedBanks = app.banks.filter((b) => hospital?.connectedBankIds?.includes(b.id));
  const lowStock = connectedBanks.flatMap((bank) =>
    lowStockRows(app.inventory.filter((row) => row.bankId === bank.id))
      .slice(0, 2)
      .map((row) => ({ ...row, bankName: bank.short })),
  );

  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Hospital overview"
        description={`${hospital?.name} · ${hospital?.city} · coordinating with ${connectedBanks.length} blood banks`}
        actions={
          <>
            <Link to="/hospital/alerts" className="btn btn--secondary">
              <Icon name="alert-triangle" />
              Raise urgent need
            </Link>
            <Link to="/hospital/requests/new" className="btn btn--primary">
              <Icon name="plus" />
              New request
            </Link>
          </>
        }
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat
          label="Open requests"
          value={counters.open}
          icon="clipboard"
          meta={`${counters.total} total in the demo`}
          onClick={() => navigate('/hospital/requests')}
        />
        <Stat
          label="Needs review"
          value={hospitalReviewCount(app, user.hospitalId)}
          icon="eye"
          tone="warning"
          meta="Awaiting your assignment"
          onClick={() => navigate('/hospital/requests?tab=review')}
        />
        <Stat
          label="Awaiting approval"
          value={hospitalApprovalCount(app, user.hospitalId)}
          icon="stethoscope"
          tone="info"
          meta="Compatibility passed"
          onClick={() => navigate('/hospital/requests?tab=approval')}
        />
        <Stat
          label="In transit"
          value={counters.inTransit}
          icon="truck"
          tone="neutral"
          meta={`${activeShipments.length} active shipment(s)`}
          onClick={() => navigate('/hospital/shipments')}
        />
      </div>

      <div className="grid grid-sidebar section-gap">
        <div className="stack gap-4">
          {needsApproval.length > 0 && (
            <div className="alert alert--warning" role="status">
              <Icon name="stethoscope" className="icon alert__icon" />
              <div className="grow">
                <div className="alert__title">
                  {needsApproval.length} request{needsApproval.length > 1 ? 's' : ''} waiting for clinical approval
                </div>
                <div className="alert__body">
                  Compatibility testing is complete. A shipment cannot be created until approval is
                  recorded by an authorised clinician.
                </div>
              </div>
              <Link
                to={`/hospital/requests/${needsApproval[0].id}`}
                className="btn btn--secondary btn--sm"
              >
                Review now
              </Link>
            </div>
          )}

          <Card flush>
            <CardHeader
              title="Requests needing attention"
              subtitle="Open requests, most urgent first"
              action={
                <Link to="/hospital/requests" className="btn btn--ghost btn--sm">
                  View all
                </Link>
              }
            />
            {priority.length === 0 ? (
              <EmptyState
                icon="check-circle"
                title="No open requests"
                description="Everything is either delivered or closed. New requests will appear here."
                action={
                  <Link to="/hospital/requests/new" className="btn btn--primary btn--sm">
                    Create a request
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Requirement</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {priority.map((r) => (
                      <tr
                        key={r.id}
                        className="is-clickable"
                        onClick={() => navigate(`/hospital/requests/${r.id}`)}
                      >
                        <td>
                          <span className="mono text-strong">{r.id}</span>
                          <span className="table__meta">
                            {r.patientName} · {r.ward}
                          </span>
                        </td>
                        <td>
                          <div className="row gap-2">
                            <BloodPill group={r.bloodGroup} />
                            <div>
                              <span>{componentLabel(r.component)}</span>
                              <span className="table__meta">{r.units} unit(s)</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <UrgencyBadge urgency={r.urgency} />
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                          <span className="table__meta">
                            {getBank(app, r.bankId)?.short || 'No bank assigned'} · {timeAgo(r.createdAt)}
                          </span>
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

          <div className="grid grid-2">
            <Card>
              <CardHeader title="Request volume" subtitle="Last 7 days (demo)" />
              <CardBody>
                <TrendChart data={REQUEST_TREND} height={150} />
              </CardBody>
            </Card>

            <Card flush>
              <CardHeader
                title="Active shipments"
                action={
                  <Link to="/hospital/shipments" className="btn btn--ghost btn--sm">
                    All
                  </Link>
                }
              />
              {activeShipments.length === 0 ? (
                <p className="text-sm text-muted" style={{ padding: 20 }}>
                  No shipments on the way right now.
                </p>
              ) : (
                activeShipments.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    style={{ padding: '13px 20px', borderTop: '1px solid var(--border)' }}
                  >
                    <div className="row-between">
                      <span className="text-sm text-strong mono">{s.id}</span>
                      <span className="text-xs text-muted">{s.requestId}</span>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {getBank(app, s.bankId)?.short} → {orgName(app, s.hospitalId)}
                    </div>
                    <div className="progress mt-2" style={{ height: 5 }}>
                      <div
                        className="progress__bar"
                        style={{ width: s.status === 'in_transit' ? '70%' : s.status === 'picked_up' ? '40%' : '15%' }}
                      />
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Bank stock pressure"
              subtitle="Low or out-of-stock groups at connected banks"
              action={
                <Link to="/hospital/banks" className="btn btn--ghost btn--sm">
                  Banks
                </Link>
              }
            />
            <CardBody>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted">No low-stock warnings worth flagging.</p>
              ) : (
                <div className="grid grid-3" style={{ gap: 10 }}>
                  {lowStock.slice(0, 6).map((row) => (
                    <div
                      key={`${row.bankId}-${row.bloodGroup}-${row.component}`}
                      className={`inv-card ${row.units === 0 ? 'inv-card--out' : 'inv-card--low'}`}
                    >
                      <div className="inv-card__top">
                        <BloodPill group={row.bloodGroup} />
                        <span className="text-xs text-muted">{row.bankName}</span>
                      </div>
                      <div className="inv-card__units">
                        {row.units}
                        <small>units</small>
                      </div>
                      <div className="inv-card__comp">{componentLabel(row.component)}</div>
                      <span className={`badge badge--${row.units === 0 ? 'danger' : 'warning'}`}>
                        {row.units === 0 ? 'Out of stock' : 'Low stock'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-3">Quick actions</h3>
            <div className="stack gap-2">
              <Link to="/hospital/requests/new" className="btn btn--primary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="plus" /> Create blood request
              </Link>
              <Link to="/hospital/alerts" className="btn btn--secondary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="alert-triangle" /> Raise urgent requirement
              </Link>
              <Link to="/hospital/qr" className="btn btn--secondary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="qr" /> Show hospital QR
              </Link>
              <Link to="/hospital/reports" className="btn btn--secondary btn--block" style={{ justifyContent: 'flex-start' }}>
                <Icon name="bar-chart" /> Monthly report
              </Link>
            </div>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Today at a glance</h3>
            <div className="info-row">
              <span className="info-row__label">Critical open</span>
              <span className="info-row__value">{counters.critical}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">In compatibility testing</span>
              <span className="info-row__value">{counters.testing}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Delivered</span>
              <span className="info-row__value">{counters.delivered}</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">Connected banks</span>
              <span className="info-row__value">{connectedBanks.length}</span>
            </div>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">On-duty contacts</h3>
            {connectedBanks.slice(0, 3).map((b) => (
              <div className="info-row" key={b.id}>
                <span className="info-row__label">{b.short}</span>
                <span className="info-row__value">{b.phone}</span>
              </div>
            ))}
            <div className="gate-note mt-3">
              <Icon name="info" className="icon icon--sm" />
              <span>Contacts are demo data, shown to illustrate the workflow.</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
