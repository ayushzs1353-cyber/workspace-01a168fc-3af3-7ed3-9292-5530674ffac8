import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './state/store.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import PortalLayout from './components/layout/PortalLayout.jsx';
import Toasts from './components/ui/Toasts.jsx';
import { ROLE_META } from './data/navigation.js';
import Home from './pages/public/Home.jsx';
import About from './pages/public/About.jsx';
import HowItWorks from './pages/public/HowItWorks.jsx';
import Contact from './pages/public/Contact.jsx';
import BackendLogin from './pages/public/BackendLogin.jsx';
import BackendUnavailableFeature from './pages/public/BackendUnavailableFeature.jsx';
import PublicRequest from './pages/public/PublicRequest.jsx';
import PublicTracking from './pages/public/PublicTracking.jsx';
import NotFound from './pages/public/NotFound.jsx';
import IntegrationWorkspace from './pages/IntegrationWorkspace.jsx';

function RequireRole({ role, children }) {
  const { currentUser, sessionLoading } = useApp();
  if (sessionLoading) return <div className="state-block" role="status">Checking secure session…</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to={ROLE_META[currentUser.role]?.home || '/'} replace />;
  return children;
}

function Portal({ role }) {
  return (
    <RequireRole role={role}>
      <PortalLayout role={role}>
        <IntegrationWorkspace />
      </PortalLayout>
    </RequireRole>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="contact" element={<Contact />} />
          <Route path="request" element={<PublicRequest />} />
          <Route path="request-blood" element={<PublicRequest />} />
          <Route path="track/:token" element={<PublicTracking />} />
          <Route path="register" element={<BackendUnavailableFeature title="Organization registration" />} />
        </Route>
        <Route path="login" element={<BackendLogin />} />

        <Route path="patient/*" element={<Portal role="patient" />} />
        <Route path="hospital/*" element={<Portal role="hospital" />} />
        <Route path="bank/*" element={<Portal role="bank" />} />
        <Route path="admin/*" element={<Portal role="admin" />} />
        <Route path="operator/*" element={<BackendUnavailableFeature
          title="Delivery operator portal"
          description="The backend has no delivery-operator role or operator-specific routes. Shipment status actions are available to authorized hospital administrators, blood-bank administrators and Super Admins."
        />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toasts />
    </>
  );
}
