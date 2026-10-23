import { Link, useLocation } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { ROLE_META } from '../../data/navigation.js';
import { useApp } from '../../state/store.jsx';

export default function Topbar({ role, onMenu }) {
  const { currentUser, logout, pushToast, notifications } = useApp();
  const location = useLocation();
  const sections = location.pathname.split('/').filter(Boolean);
  const title = sections[1] ? sections[1].replaceAll('-', ' ') : 'overview';
  const unread = notifications.filter((item) => !item.readAt).length;

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      pushToast('Sign out failed', error.message, 'error');
    }
  };

  return (
    <header className="topbar">
      <button type="button" className="topbar__icon-btn topbar__menu-btn" aria-label="Open menu" onClick={onMenu}>
        <Icon name="menu" />
      </button>
      <nav className="topbar__crumbs" aria-label="Breadcrumb">
        <Link to={ROLE_META[role]?.home || '/'} className="root">{ROLE_META[role]?.label || 'Portal'}</Link>
        <Icon name="chevron-right" className="icon icon--sm" />
        <span className="current" style={{ textTransform: 'capitalize' }}>{title}</span>
      </nav>
      <div className="topbar__right">
        <Link to={`${ROLE_META[role]?.home || ''}/notifications`} className="topbar__icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Icon name="bell" />{unread > 0 && <span className="dot" />}
        </Link>
        <span className="text-xs text-muted">{currentUser?.name}</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>Sign out</button>
      </div>
    </header>
  );
}
