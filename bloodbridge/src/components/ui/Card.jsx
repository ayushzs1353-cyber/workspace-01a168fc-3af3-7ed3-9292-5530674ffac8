export default function Card({ children, className = '', flush = false, hover = false, ...rest }) {
  return (
    <section
      className={[
        'card',
        flush ? 'card--flush' : '',
        hover ? 'card--hover' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action, children }) {
  return (
    <header className="card__header">
      {children || (
        <div>
          <h3 className="card__title">{title}</h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      {action}
    </header>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card__body ${className}`}>{children}</div>;
}

export function CardFooter({ children }) {
  return <div className="card__footer">{children}</div>;
}
