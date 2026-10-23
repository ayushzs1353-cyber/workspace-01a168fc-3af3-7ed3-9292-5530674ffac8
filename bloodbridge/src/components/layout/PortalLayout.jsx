import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function PortalLayout({ role, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar role={role} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <div className="portal-main">
        <Topbar role={role} onMenu={() => setSidebarOpen((o) => !o)} />
        <main id="main-content" className="portal-content" tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -4 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
