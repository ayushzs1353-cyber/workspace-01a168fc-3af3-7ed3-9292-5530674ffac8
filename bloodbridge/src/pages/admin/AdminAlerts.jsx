import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  PillFilters,
  Select,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank, orgName } from '../../state/selectors.js';
import { ALERT_TYPES, formatDateTime, timeAgo } from '../../data/reference.js';

export default function AdminAlerts() {
  const app = useApp();
  const [status, setStatus] = useState('open');
  const [type, setType] = useState('');
  const [resolving, setResolving] = useState(null);

  const rows = app.alerts.filter(
    (a) =>
      (status === 'all' || a.status === status || (status === 'open' && a.status === 'in_review')) &&
      (!type || a.type === type),
  );

  const open = app.alerts.filter((a) => a.status === 'open');
  const high = app.alerts.filter((a) => a.severity === 'high' && a.status !== 'resolved');
  const resolved = app.alerts.filter((a) => a.status === 'resolved');

  const severityTone = (severity) =>
    severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'neutral';

  return (
    <>
      <PageHeader
        title="Discrepancy alerts"
        description="Quality, quantity, identification and temperature issues raised by the demo workflow."
        actions={
          <div style={{ width: 190 }}>
            <Select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All alert types</option>
              {Object.entries(ALERT_TYPES).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat label="Open alerts" value={open.length} icon="alert-triangle" tone="warning" meta="Need a first look" />
        <Stat label="High severity" value={high.length} icon="flag" tone="warning" meta="Temperature or identification" />
        <Stat label="Resolved" value={resolved.length} icon="check-circle" tone="success" meta="Closed with a note" />
        <Stat label="Total recorded" value={app.alerts.length} icon="history" tone="neutral" meta="Demo alert history" />
      </div>

      <div className="row-between mt-5 mb-3 wrap gap-3">
        <PillFilters
          value={status}
          onChange={setStatus}
          options={[
            { value: 'open', label: 'Open & in review' },
            { value: 'open_only', label: 'Open only' },
            { value: 'in_review', label: 'In review' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      <div className="stack gap-3">
        {rows.length === 0 && (
          <Card>
            <EmptyState
              icon="shield-check"
              title="No alerts in this view"
              description="That means nothing needs your attention right now. New discrepancies appear here automatically."
            />
          </Card>
        )}
        {rows.map((a) => {
          const meta = ALERT_TYPES[a.type] || ALERT_TYPES.quality;
          return (
            <Card key={a.id} className="card--pad">
              <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
                <span
                  className="stat__icon"
                  style={{
                    background: a.severity === 'high' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    color: a.severity === 'high' ? 'var(--danger)' : 'var(--warning)',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={meta.icon} className="icon icon--sm" />
                </span>
                <div className="grow">
                  <div className="row-between wrap gap-2">
                    <div>
                      <div className="text-sm text-strong">{a.title}</div>
                      <div className="text-xs text-muted mt-1">
                        {a.id} · {meta.label} · raised {timeAgo(a.at)}
                        {a.orgId ? ` · ${orgName(app, a.orgId) || getBank(app, a.orgId)?.name}` : ''}
                      </div>
                    </div>
                    <div className="row gap-2">
                      <Badge tone={severityTone(a.severity)}>{a.severity} severity</Badge>
                      <Badge
                        tone={a.status === 'open' ? 'danger' : a.status === 'in_review' ? 'warning' : 'success'}
                        dot
                      >
                        {a.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted mt-2" style={{ lineHeight: 1.55 }}>
                    {a.detail}
                  </p>

                  <div className="row gap-2 mt-3 wrap">
                    {a.status !== 'resolved' && (
                      <>
                        {a.status === 'open' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => app.updateAlert(a.id, 'in_review')}
                          >
                            Start review
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setResolving(a)}>
                          Resolve
                        </Button>
                      </>
                    )}
                    {a.shipmentId && (
                      <span className="text-xs text-muted row gap-1">
                        <Icon name="truck" className="icon icon--sm" />
                        Shipment {a.shipmentId}
                      </span>
                    )}
                    {a.requestId && (
                      <span className="text-xs text-muted row gap-1">
                        <Icon name="clipboard" className="icon icon--sm" />
                        Request {a.requestId}
                      </span>
                    )}
                    <span className="text-xs text-subtle">Raised {formatDateTime(a.at)}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-5">
        <Alert tone="info" title="How alerts reach this queue">
          The demo raises alerts when a simulated temperature reading leaves 2–6 °C, when a delivery
          quantity differs, when a unit’s identification needs a manual check, or when stock is close
          to expiry. In production each alert type would link to its evidence.
        </Alert>
      </div>

      <ConfirmDialog
        open={!!resolving}
        onCancel={() => setResolving(null)}
        title="Resolve this alert?"
        description="Add nothing hidden — resolving records your name and time in the audit trail."
        confirmLabel="Mark resolved"
        cancelLabel="Cancel"
        tone="success"
        icon="check-circle"
        onConfirm={() => {
          app.updateAlert(resolving.id, 'resolved');
          setResolving(null);
        }}
      >
        <p className="text-sm text-muted">
          {resolving?.title}
          <br />
          <span className="text-xs">
            In a real deployment you would attach the investigation note and any corrective action.
          </span>
        </p>
      </ConfirmDialog>
    </>
  );
}
