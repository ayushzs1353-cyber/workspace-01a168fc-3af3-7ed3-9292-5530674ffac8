import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';

export default function PageHeader({ title, description, actions, badge, backTo, backLabel = 'Back', children }) {
  useEffect(() => {
    if (typeof title === 'string') document.title = `${title} · BloodBridge`;
  }, [title]);

  return (
    <>
      {backTo && (
        <Link to={backTo} className="back-link">
          <Icon name="arrow-left" className="icon icon--sm" />
          {backLabel}
        </Link>
      )}
      <div className="page-head">
        <div>
          <h1 className="page-head__title">
            {title}
            {badge}
          </h1>
          {description && <p className="page-head__desc">{description}</p>}
          {children}
        </div>
        {actions && <div className="page-head__actions">{actions}</div>}
      </div>
    </>
  );
}
