import { statusMeta, urgencyMeta, SHIPMENT_STATUS } from '../../data/reference.js';

export default function Badge({ tone = 'neutral', children, dot = false, size, solid = false }) {
  return (
    <span
      className={`badge badge--${solid ? 'solid' : tone}${size === 'lg' ? ' badge--lg' : ''}`}
    >
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, size }) {
  const meta = statusMeta(status);
  return (
    <Badge tone={meta.tone} dot size={size}>
      {meta.label}
    </Badge>
  );
}

export function UrgencyBadge({ urgency, size }) {
  const meta = urgencyMeta(urgency);
  return (
    <Badge tone={meta.tone === 'danger' ? 'danger' : meta.tone} size={size}>
      {meta.label}
    </Badge>
  );
}

export function ShipmentStatusBadge({ status, size }) {
  const meta = SHIPMENT_STATUS[status] || SHIPMENT_STATUS.created;
  return (
    <Badge tone={meta.tone} dot size={size}>
      {meta.label}
    </Badge>
  );
}

export function BloodPill({ group, className = '' }) {
  return <span className={`blood-pill ${className}`}>{group}</span>;
}

export function ToneBadge({ tone = 'neutral', children }) {
  return <Badge tone={tone}>{children}</Badge>;
}
