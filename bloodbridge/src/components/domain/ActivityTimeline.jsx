import { formatDateTime } from '../../data/reference.js';

export default function ActivityTimeline({ items, emptyLabel = 'No activity recorded yet.' }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }
  const ordered = [...items].reverse();
  return (
    <div className="timeline">
      {ordered.map((item, i) => (
        <div className="timeline__row" key={`${item.label}-${item.at}-${i}`}>
          <span className={`timeline__dot timeline__dot--${item.tone || 'neutral'}`} />
          <div>
            <div className="timeline__title">
              {item.label}
              <span className="text-xs text-subtle" style={{ fontWeight: 500 }}>
                {formatDateTime(item.at)}
              </span>
            </div>
            <div className="timeline__meta">
              {item.by ? `by ${item.by}` : 'System'}
            </div>
            {item.note && <div className="timeline__body">{item.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
