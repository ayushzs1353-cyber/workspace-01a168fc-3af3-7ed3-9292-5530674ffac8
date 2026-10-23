import { Link } from 'react-router-dom';

export default function Logo({ to = '/', compact = false, light = false }) {
  return (
    <Link to={to} className="brand" aria-label="BloodBridge home" style={light ? { color: '#fff' } : undefined}>
      <span
        className="brand__mark"
        style={light ? { background: '#fff', color: 'var(--red-600)' } : undefined}
      >
        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
          <path
            d="M12 3.2 7.2 8a6.8 6.8 0 1 0 9.6 0L12 3.2Z"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M8.6 13.4h2.1l1.1-2 1.7 4 1.2-2.4h2.3"
            stroke={light ? '#D62839' : '#fff'}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="brand__name">
          Blood<span>Bridge</span>
        </span>
      )}
    </Link>
  );
}
