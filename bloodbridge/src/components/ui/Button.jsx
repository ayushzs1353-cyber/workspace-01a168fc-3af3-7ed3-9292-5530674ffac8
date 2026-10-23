import Icon from '../Icon.jsx';

/**
 * Button — single consistent button across all portals.
 * Also exports `btnClass()` so <Link> elements can look identical.
 */
export function btnClass(variant = 'primary', size = 'md', extra = '') {
  return ['btn', `btn--${variant}`, size !== 'md' ? `btn--${size}` : '', extra]
    .filter(Boolean)
    .join(' ');
}

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconRight,
  loading = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={btnClass(variant, size, [block ? 'btn--block' : '', className].filter(Boolean).join(' '))}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {icon && !loading && <Icon name={icon} />}
      {loading && <Icon name="refresh" className="icon spin" />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} />}
    </button>
  );
}
