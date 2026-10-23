import Icon from '../Icon.jsx';
import { SHIPMENT_STATUS, formatDateTime } from '../../data/reference.js';

const STEPS = [
  { id: 'created', label: 'Created' },
  { id: 'picked_up', label: 'Picked up' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'delivered', label: 'Delivered' },
];

const ORDER = { created: 0, picked_up: 1, in_transit: 2, delayed: 2, delivered: 3, failed: 1 };

export default function ShipmentProgress({ shipment, showTimes = true }) {
  const currentIndex = ORDER[shipment.status] ?? 0;
  const meta = SHIPMENT_STATUS[shipment.status] || SHIPMENT_STATUS.created;

  return (
    <div>
      <div className="row-between mb-3">
        <span className="text-sm text-muted">Delivery progress</span>
        <span className="text-sm text-strong">{meta.progress}%</span>
      </div>
      <div className="progress mb-4">
        <div
          className={`progress__bar ${shipment.status === 'delivered' ? 'progress--success' : ''}`}
          style={{ width: `${meta.progress}%` }}
        />
      </div>
      <div className="row wrap gap-3" style={{ justifyContent: 'space-between' }}>
        {STEPS.map((step, index) => {
          const done = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const stamp = shipment.timeline.find((t) =>
            t.label?.toLowerCase().includes(step.id === 'picked_up' ? 'picked' : step.id === 'in_transit' ? 'transit' : step.id),
          );
          return (
            <div key={step.id} className="row gap-2" style={{ minWidth: 96 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: done ? (isCurrent ? 'var(--red-50)' : 'var(--success-bg)') : 'var(--bg-sunken)',
                  color: done ? (isCurrent ? 'var(--red-600)' : 'var(--success)') : 'var(--text-subtle)',
                  border: isCurrent ? '1.5px solid var(--red-600)' : '1px solid transparent',
                }}
              >
                {done ? <Icon name="check" className="icon icon--sm" /> : <span className="text-xs">•</span>}
              </span>
              <div>
                <div className="text-xs text-strong" style={{ lineHeight: 1.3 }}>
                  {step.label}
                </div>
                {showTimes && (
                  <div className="text-xs text-subtle">
                    {stamp?.at ? formatDateTime(stamp.at) : done && isCurrent ? 'Now' : '—'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
