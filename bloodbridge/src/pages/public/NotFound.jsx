import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Button, EmptyState } from '../../components/ui/index.js';
import Logo from '../../components/layout/Logo.jsx';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="public-shell">
      <header className="public-nav">
        <div className="public-container public-nav__inner">
          <Logo />
        </div>
      </header>
      <main id="main-content" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div className="public-container" style={{ maxWidth: 560 }}>
          <div className="card card--pad">
            <EmptyState
              icon="search"
              title="Page not found"
              description="The page you’re looking for doesn’t exist in this prototype. It may have moved, or the link may be incorrect."
              action={
                <>
                  <Button variant="secondary" icon="arrow-left" onClick={() => navigate(-1)}>
                    Go back
                  </Button>
                  <Link to="/" className="btn btn--primary">
                    Return home
                    <Icon name="arrow-right" />
                  </Link>
                </>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
