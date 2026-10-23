import Icon from '../Icon.jsx';
import { Badge } from '../ui/index.js';
import { TRACKING_STEPS, formatDateTime, statusMeta } from '../../data/reference.js';

/**
 * Patient-facing request tracker: six plain-language steps.
 * Fine-grained operational statuses are mapped onto these steps so the
 * patient never has to learn internal workflow vocabulary.
 */
export default function TrackingSteps({ request, compact = false }) {
  const meta = statusMeta(request.status);
  const terminal = ['rejected', 'cancelled'].includes(request.status);
  const current = meta.step;

  const timeForStep = (index) => {
    const match = [...request.timeline]
      .reverse()
      .find((t) => statusMeta(t.status).step === index && !['rejected', 'cancelled'].includes(t.status));
    return match?.at || null;
  };

  return (
    <div className={`steps ${compact ? 'steps--compact' : ''}`}>
      {TRACKING_STEPS.map((step, index) => {
        const done = index < current || (terminal && index === 0);
        const isCurrent = index === current && !terminal;
        const skipped = terminal && index > 0;
        return (
          <div
            key={step.id}
            className={`step ${done ? 'step--done' : ''} ${isCurrent ? 'step--current' : ''} ${
              skipped ? 'step--skipped' : ''
            }`}
          >
            <div>
              <span className="step__marker">
                {done ? (
                  <Icon name="check" className="icon icon--sm" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </span>
              {index < TRACKING_STEPS.length - 1 && !compact && <span className="step__line" />}
            </div>
            <div>
              <div className="step__title">
                {step.label}
                {isCurrent && <Badge tone="red">{meta.label}</Badge>}
                {skipped && <Badge tone="neutral">Not reached</Badge>}
              </div>
              {isCurrent && <p className="step__desc">{meta.description}</p>}
              {done && timeForStep(index) && (
                <p className="step__time">{formatDateTime(timeForStep(index))}</p>
              )}
              {skipped && index === 1 && terminal && (
                <p className="step__time">
                  {request.status === 'cancelled' ? 'Request was cancelled.' : 'This request was declined.'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
