export default function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {typeof tab.count === 'number' && <span className="tab__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function PillFilters({ options, value, onChange, label = 'Filters' }) {
  return (
    <div className="pill-filters" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="pill-filter"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
