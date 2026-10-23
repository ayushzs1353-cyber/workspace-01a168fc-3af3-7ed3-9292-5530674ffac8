import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Logo from './Logo.jsx';
import Icon from '../Icon.jsx';
import { PUBLIC_NAV } from '../../data/navigation.js';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="public-nav">
        <div className="public-container public-nav__inner">
          <Logo />
          <nav className="public-nav__links" aria-label="Main navigation">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `public-nav__link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="public-nav__actions">
            <Link to="/login" className="btn btn--ghost">
              Portal login
            </Link>
            <Link to="/request-blood" className="btn btn--primary">
              Request blood
            </Link>
          </div>
          <button
            type="button"
            className="topbar__icon-btn public-nav__toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
            >
              <div className="public-container public-nav__mobile">
                {PUBLIC_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `public-nav__link ${isActive ? 'is-active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="row gap-2 mt-3">
                  <Link to="/login" className="btn btn--secondary grow">
                    Portal login
                  </Link>
                  <Link to="/request-blood" className="btn btn--primary grow">
                    Request blood
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-container">
          <div className="footer-grid">
            <div>
              <Logo />
              <p className="mt-3" style={{ maxWidth: 300 }}>
                BloodBridge frontend for the separately run API. Backend data and access rules remain authoritative.
              </p>
              <p className="text-xs text-subtle mt-3">
                Software integration preview only. Not for clinical use.
              </p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/how-it-works">How it works</Link>
              <Link to="/about">About us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/register">Register an organisation</Link>
            </div>
            <div className="footer-col">
              <h4>Portals</h4>
              <Link to="/request-blood">Public requester</Link>
              <Link to="/login">Hospital admin</Link>
              <Link to="/login">Blood bank</Link>
              <Link to="/login">Super Admin</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <p>
                No public support contact is configured in the supplied backend.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} BloodBridge. Integration preview.</span>
            <span className="row gap-4 wrap">
              <span className="row gap-2">
                <Icon name="flask" className="icon icon--sm" />
                Not for clinical use
              </span>
              <Link to="/about#privacy">Privacy</Link>
              <Link to="/about#terms">Terms</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
