import Icon from '../Icon.jsx';

export function Field({ label, htmlFor, hint, error, optional, children, full, className = '' }) {
  return (
    <div className={`field ${full ? 'field--full' : ''} ${className}`}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {optional && <span className="field__optional">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error" role="alert">
          <Icon name="alert-circle" className="icon icon--sm" />
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}

export function Input({ id, invalid, className = '', ...rest }) {
  return (
    <input
      id={id}
      className={`input ${className}`}
      aria-invalid={invalid ? 'true' : undefined}
      {...rest}
    />
  );
}

export function Select({ id, children, invalid, className = '', ...rest }) {
  return (
    <select
      id={id}
      className={`select ${className}`}
      aria-invalid={invalid ? 'true' : undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ id, invalid, className = '', ...rest }) {
  return (
    <textarea
      id={id}
      className={`textarea ${className}`}
      aria-invalid={invalid ? 'true' : undefined}
      {...rest}
    />
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', label = 'Search' }) {
  return (
    <div className="input-group">
      <Icon name="search" />
      <input
        type="search"
        className="input"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Checkbox({ label, checked, onChange, id, ...rest }) {
  return (
    <label className="check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} {...rest} />
      <span>{label}</span>
    </label>
  );
}

export function ChipGroup({ options, value, onChange, label, columns = 4 }) {
  return (
    <div
      className="chip-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="group"
      aria-label={label}
    >
      {options.map((opt) => {
        const optionValue = typeof opt === 'string' ? opt : opt.value;
        const optionLabel = typeof opt === 'string' ? opt : opt.label;
        return (
          <button
            key={optionValue}
            type="button"
            className="chip"
            aria-pressed={value === optionValue}
            onClick={() => onChange(optionValue)}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

export function RadioCards({ options, value, onChange, name, columns }) {
  return (
    <div
      className="radio-cards"
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      role="radiogroup"
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`radio-card ${value === opt.value ? 'radio-card--active' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="radio-card__title">
            {opt.icon && <Icon name={opt.icon} className="icon icon--sm" />}
            {opt.label}
          </span>
          {opt.description && <span className="radio-card__desc">{opt.description}</span>}
        </label>
      ))}
    </div>
  );
}
