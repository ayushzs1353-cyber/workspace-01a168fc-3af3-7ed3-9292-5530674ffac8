import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, Field, Input } from '../../components/ui/index.js';
import { ROLE_META } from '../../data/navigation.js';
import { useApp } from '../../state/store.jsx';

export default function BackendLogin() {
  const app = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!app.sessionLoading && app.currentUser) {
    return <Navigate to={ROLE_META[app.currentUser.role]?.home || '/'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await app.login(email.trim(), password);
      navigate(ROLE_META[user.role]?.home || '/', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div>
          <Link to="/" className="brand" style={{ color: '#fff' }}>
            <span className="brand__mark" style={{ background: '#fff', color: 'var(--red-600)' }}><Icon name="droplet" /></span>
            <span className="brand__name" style={{ color: '#fff' }}>BloodBridge</span>
          </Link>
          <div style={{ marginTop: 56 }}>
            <h2>One shared view for every blood request.</h2>
            <p>Sign in with an account provisioned by your BloodBridge administrator. Access is verified by the backend.</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>BloodBridge · secure portal</p>
      </aside>
      <main className="auth-main">
        <form className="auth-form stack gap-4" onSubmit={submit}>
          <Link to="/" className="row gap-2 text-sm text-muted"><Icon name="arrow-left" className="icon icon--sm" />Back to website</Link>
          <h1 className="auth-form__title">Sign in to your portal</h1>
          <p className="auth-form__desc">Authentication uses the backend’s HTTP-only session cookie. Credentials are not saved in browser storage.</p>
          {app.connectionError && <Alert tone="danger" title="Backend unavailable">{app.connectionError}</Alert>}
          {error && <Alert tone="danger" title="Sign-in failed">{error}</Alert>}
          <Field label="Email address" htmlFor="login-email">
            <Input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Button type="submit" disabled={loading || app.sessionLoading}>{loading ? 'Signing in…' : 'Sign in securely'}</Button>
          <p className="text-xs text-muted">New users and organizations cannot self-register through this backend. Ask a Super Admin to create an organization and administrator account.</p>
        </form>
      </main>
    </div>
  );
}
