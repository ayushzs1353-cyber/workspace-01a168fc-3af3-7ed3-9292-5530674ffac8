import Icon from '../Icon.jsx';

const ICONS = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-circle',
  demo: 'flask',
};

export default function Alert({ tone = 'info', title, children, icon, action }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={icon || ICONS[tone] || 'info'} className="icon alert__icon" />
      <div className="grow">
        {title && <div className="alert__title">{title}</div>}
        {children && <div className="alert__body">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function DemoNotice({ children, compact = false }) {
  return (
    <div className={`alert alert--demo ${compact ? 'alert--compact' : ''}`} role="note">
      <Icon name="flask" className="icon alert__icon" />
      <div className="grow">
        {children || (
          <span>
            <strong>Demo environment.</strong> All requests, payments, clinical approvals and sensor
            readings are simulated for this prototype. Nothing here contacts a real blood bank or
            hospital system.
          </span>
        )}
      </div>
    </div>
  );
}
