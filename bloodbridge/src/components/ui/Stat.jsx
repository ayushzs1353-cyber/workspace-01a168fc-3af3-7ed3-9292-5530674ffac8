import Icon from '../Icon.jsx';

export default function Stat({ label, value, meta, icon, tone = 'red', trend, onClick, footer }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      className="stat"
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      style={
        onClick
          ? { textAlign: 'left', cursor: 'pointer', font: 'inherit', width: '100%' }
          : undefined
      }
    >
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        {icon && (
          <span className={`stat__icon ${tone !== 'red' ? `stat__icon--${tone}` : ''}`}>
            <Icon name={icon} className="icon icon--sm" />
          </span>
        )}
      </div>
      <span className="stat__value">{value}</span>
      {(meta || trend) && (
        <span className="stat__meta">
          {trend && (
            <Icon
              name={trend.direction === 'down' ? 'arrow-down-right' : 'arrow-up-right'}
              className="icon icon--sm"
              style={{ color: trend.positive === false ? 'var(--danger)' : 'var(--success)' }}
            />
          )}
          {meta}
        </span>
      )}
      {footer}
    </Wrapper>
  );
}
