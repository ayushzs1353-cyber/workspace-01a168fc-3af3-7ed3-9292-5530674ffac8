import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { TrendChart, SplitBar } from '../../components/ui/Charts.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  CardBody,
  DemoNotice,
  StatusBadge,
  UrgencyBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank, openAlertCount, orgName } from '../../state/selectors.js';
import { OPERATING_REPORT, REQUEST_TREND } from '../../data/demoData.js';
import { componentLabel, isOpen, timeAgo } from '../../data/reference.js';

export default function AdminOverview() {
  const app = useApp();
  const navigate = useNavigate();
  const openRequests = app.requests.filter((r) => isOpen(r.status));
  const activeShipments = app.shipments.filter((s) => s.status !== 'delivered');
  const alerts = app.alerts.filter((a) => a.status !== 'resolved');
  const pendingOrgs = [...app.hospitals, ...app.banks].filter((o) => o.status !== 'verified');
  const tempAlerts = app.shipments.flatMap((s) =>
    s.tempAlerts.filter((a) => !a.acknowledged).map((a) => ({ ...a, shipmentId: s.id })),
  );
  const verifiedUnits = app.verification.filter((v) => v.status === 'verified').length;

  const statusCounts = [
    { label: 'With hospital', value: app.requests.filter((r) => ['submitted', 'hospital_review'].includes(r.status)).length, color: 'var(--info)' },
    { label: 'With blood bank', value: app.requests.filter((r) => ['bank_review', 'forwarded', 'testing', 'approval', 'ready'].includes(r.status)).length, color: 'var(--red-600)' },
    { label: 'Shipping', value: app.requests.filter((r) => ['shipment_created', 'picked_up', 'in_transit'].includes(r.status)).length, color: '#e0a217' },
    { label: 'Closed', value: app.requests.filter((r) => !isOpen(r.status)).length, color: 'var(--success)' },
  ];

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="A single view of organisations, requests, shipments and quality signals across the demo network."
        actions={
          <>
            <Link to="/admin/alerts" className="btn btn--secondary">
              <Icon name="alert-triangle" />
              Alerts
              {alerts.length > 0 && <Badge tone="danger">{alerts.length}</Badge>}
            </Link>
            <Link to="/admin/reports" className="btn btn--primary">
              <Icon name="bar-chart" />
              Reports
            </Link>
          </>
        }
      />

      <DemoNotice />

      <div className="stat-grid mt-5">
        <Stat
          label="Organisations"
          value={app.hospitals.length + app.banks.length}
          icon="building"
          meta={`${pendingOrgs.length} awaiting verification`}
          onClick={() => navigate('/admin/organisations')}
        />
        <Stat
          label="Open requests"
          value={openRequests.length}
          icon="clipboard"
          meta={`${app.requests.length} total in demo`}
          onClick={() => navigate('/admin/requests')}
        />
        <Stat
          label="Active shipments"
          value={activeShipments.length}
          icon="truck"
          tone="info"
          meta={`${app.shipments.length} total recorded`}
          onClick={() => navigate('/admin/shipments')}
        />
        <Stat
          label="Open alerts"
          value={openAlertCount(app)}
          icon="alert-triangle"
          tone={openAlertCount(app) ? 'warning' : 'success'}
          meta={`${tempAlerts.length} temperature excursion(s)`}
          onClick={() => navigate('/admin/alerts')}
        />
      </div>

      {pendingOrgs.length > 0 && (
        <div className="alert alert--warning mt-4">
          <Icon name="shield" className="icon alert__icon" />
          <div className="grow">
            <div className="alert__title">
              {pendingOrgs.length} organisation(s) waiting for verification review
            </div>
            <div className="alert__body">
              {pendingOrgs.map((o) => o.name).join(' · ')} — demo records only; no licence check has
              been performed.
            </div>
          </div>
          <Link to="/admin/organisations" className="btn btn--secondary btn--sm">
            Review
          </Link>
        </div>
      )}

      <div className="grid grid-sidebar section-gap">
        <div className="stack gap-4">
          <Card>
            <CardHeader
              title="Request volume"
              subtitle="Raised versus fulfilled — last 7 days (demo)"
              action={<Badge tone="neutral">Sample data</Badge>}
            />
            <CardBody>
              <TrendChart data={REQUEST_TREND} />
            </CardBody>
          </Card>

          <Card flush>
            <CardHeader
              title="Latest requests"
              subtitle="Across all hospitals"
              action={
                <Link to="/admin/requests" className="btn btn--ghost btn--sm">
                  All requests
                </Link>
              }
            />
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Hospital</th>
                    <th>Bank</th>
                    <th>Requirement</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...app.requests]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 6)
                    .map((r) => (
                      <tr
                        key={r.id}
                        className="is-clickable"
                        onClick={() => navigate('/admin/requests')}
                      >
                        <td>
                          <span className="mono text-strong">{r.id}</span>
                          <span className="table__meta">{timeAgo(r.createdAt)}</span>
                        </td>
                        <td className="text-xs">{orgName(app, r.hospitalId)}</td>
                        <td className="text-xs">{getBank(app, r.bankId)?.short || '—'}</td>
                        <td>
                          <div className="row gap-2">
                            <BloodPill group={r.bloodGroup} />
                            <span className="text-xs">
                              {r.units} × {componentLabel(r.component)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Discrepancy alerts"
              subtitle="Quality, quantity, identification and temperature"
              action={
                <Link to="/admin/alerts" className="btn btn--ghost btn--sm">
                  Manage
                </Link>
              }
            />
            <CardBody>
              <div className="stack gap-3">
                {alerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className={`alert alert--${a.severity === 'high' ? 'danger' : 'warning'}`}
                  >
                    <Icon name="alert-triangle" className="icon alert__icon" />
                    <div className="grow">
                      <div className="alert__title">{a.title}</div>
                      <div className="alert__body">{a.detail}</div>
                    </div>
                    <Badge tone={a.status === 'open' ? 'danger' : 'warning'}>
                      {a.status === 'open' ? 'Open' : 'In review'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="stack gap-4">
          <Card className="card--pad">
            <h3 className="card__title mb-3">Where requests sit</h3>
            <SplitBar segments={statusCounts} height={12} />
            <div className="chart-legend mt-3">
              {statusCounts.map((s) => (
                <span key={s.label}>
                  <i style={{ background: s.color }} /> {s.label} ({s.value})
                </span>
              ))}
            </div>
            <div className="mt-4">
              <div className="info-row">
                <span className="info-row__label">Critical open</span>
                <span className="info-row__value">
                  {openRequests.filter((r) => r.urgency === 'critical').length}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Avg. fulfilment</span>
                <span className="info-row__value">
                  {Math.floor(OPERATING_REPORT.avgFulfilmentMinutes / 60)}h{' '}
                  {OPERATING_REPORT.avgFulfilmentMinutes % 60}m
                </span>
              </div>
              <div className="info-row">
                <span className="info-row__label">On-time deliveries</span>
                <span className="info-row__value">{OPERATING_REPORT.onTimeDeliveryPct}%</span>
              </div>
            </div>
          </Card>

          <Card flush>
            <CardHeader title="Verification" subtitle="Demo units reviewed" />
            <CardBody>
              <div className="row-between mb-2">
                <span className="text-sm text-muted">Verified units</span>
                <span className="text-sm text-strong">
                  {verifiedUnits} / {app.verification.length}
                </span>
              </div>
              <div className="progress">
                <div
                  className="progress__bar progress--success"
                  style={{ width: `${(verifiedUnits / app.verification.length) * 100}%` }}
                />
              </div>
              <div className="mt-4 stack gap-2">
                {app.verification.slice(0, 4).map((v) => (
                  <div className="row-between" key={v.unitId}>
                    <span className="row gap-2">
                      <BloodPill group={v.bloodGroup} />
                      <span className="mono text-xs">{v.unitId}</span>
                    </span>
                    <Badge
                      tone={
                        v.status === 'verified'
                          ? 'success'
                          : v.status === 'flagged'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {v.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
              <Link to="/admin/verification" className="btn btn--secondary btn--sm mt-4">
                Review unit verification
              </Link>
            </CardBody>
          </Card>

          <Card className="card--pad">
            <h3 className="card__title mb-2">Cold chain</h3>
            <div className="row gap-3">
              <div>
                <div className="stat__value" style={{ fontSize: 'var(--fs-3xl)' }}>
                  {OPERATING_REPORT.coldChainCompliancePct}%
                </div>
                <div className="text-xs text-muted">demo shipments within range</div>
              </div>
            </div>
            <div className="mt-3">
              <SplitBar
                segments={[
                  { label: 'Within range', value: 94, color: 'var(--success)' },
                  { label: 'Excursion', value: 6, color: 'var(--danger)' },
                ]}
              />
            </div>
            <Link to="/admin/temperature" className="btn btn--secondary btn--sm mt-4">
              Open monitoring
            </Link>
          </Card>

          <Alert tone="warning" title="Prototype limitations">
            Requests shown here are simulated. Verification, alerts and audit entries exist to
            demonstrate oversight workflows — they are not regulatory records.
          </Alert>
        </div>
      </div>
    </>
  );
}
