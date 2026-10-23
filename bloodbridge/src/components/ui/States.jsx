import Icon from '../Icon.jsx';
import Button from './Button.jsx';

export function EmptyState({ icon = 'clipboard', title, description, action, secondaryAction }) {
  return (
    <div className="state-block">
      <span className="state-block__icon">
        <Icon name={icon} className="icon icon--lg" />
      </span>
      <p className="state-block__title">{title}</p>
      {description && <p className="state-block__desc">{description}</p>}
      {action && (
        <div className="row gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="state-block">
      <span className="state-block__icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
        <Icon name="alert-circle" className="icon icon--lg" />
      </span>
      <p className="state-block__title">{title}</p>
      <p className="state-block__desc">{description || 'The demo data could not be loaded.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton--title" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton--text"
          style={{ width: `${100 - i * 12}%`, marginBottom: 8 }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row gap-4" style={{ marginBottom: 14 }}>
          <div className="skeleton" style={{ height: 14, width: 90 }} />
          <div className="skeleton" style={{ height: 14, flex: 1 }} />
          <div className="skeleton" style={{ height: 14, width: 80 }} />
          <div className="skeleton" style={{ height: 14, width: 60 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat">
          <div className="skeleton skeleton--text" style={{ width: '60%' }} />
          <div className="skeleton" style={{ height: 30, width: '45%', marginTop: 8 }} />
          <div className="skeleton skeleton--text" style={{ width: '70%', marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
