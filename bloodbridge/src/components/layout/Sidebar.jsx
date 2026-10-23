import { NavLink } from 'react-router-dom';
import Icon from '../Icon.jsx';
import Logo from './Logo.jsx';
import { NAV, ROLE_META } from '../../data/navigation.js';
import { useApp } from '../../state/store.jsx';

export default function Sidebar({ role, open, onNavigate }) {
  const { currentUser, notifications } = useApp();
  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Portal navigation">
      <div className="sidebar__brand"><Logo /></div>
      <div className="sidebar__org">
        <span className="sidebar__org-label">{ROLE_META[role]?.label || 'Portal'}</span>
        <span className="sidebar__org-name">{currentUser?.organization?.name || (role === 'admin' ? 'BloodBridge platform' : currentUser?.name)}</span>
        {currentUser && <span className="sidebar__org-role">{currentUser.email}</span>}
      </div>
      <nav className="sidebar__nav">
        {(NAV[role] || []).map((group) => (
          <div className="sidebar__group" key={group.label}>
            <div className="sidebar__group-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              >
                <Icon name={item.icon} className="icon" />
                <span>{item.label}</span>
                {item.to.endsWith('/notifications') && unread > 0 && <span className="nav-item__badge">{unread}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__demo">
          <Icon name="shield-check" className="icon icon--sm" />
          <span>Live API data only. Unsupported backend actions are shown as limitations, not simulated.</span>
        </div>
      </div>
    </aside>
  );
}
