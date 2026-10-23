import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  Badge,
  Button,
  CardBody,
  DemoNotice,
  Field,
  SearchInput,
  Select,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { formatDateTime } from '../../data/reference.js';
import { downloadCsv } from '../../lib/export.js';

const CATEGORIES = [
  { value: 'request', label: 'Requests' },
  { value: 'approval', label: 'Approvals' },
  { value: 'testing', label: 'Testing' },
  { value: 'shipment', label: 'Shipments' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'alert', label: 'Alerts' },
  { value: 'organisation', label: 'Organisations' },
  { value: 'verification', label: 'Verification' },
  { value: 'payment', label: 'Payments' },
  { value: 'report', label: 'Reports' },
];

export default function AdminAudit() {
  const app = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(20);

  const filtered = app.audit.filter((entry) => {
    const matchesQuery =
      !query ||
      [entry.action, entry.actor, entry.target, entry.role]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesCategory = !category || entry.category === category;
    return matchesQuery && matchesCategory;
  });

  const visible = filtered.slice(0, limit);
  const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || value;

  return (
    <>
      <PageHeader
        title="Audit history"
        description="Every status change in the demo, with who did it and when. Read-only by design."
        actions={
          <Button
            variant="secondary"
            icon="download"
            onClick={() =>
              downloadCsv('bloodbridge-audit-log.csv', filtered, [
                { header: 'Timestamp', key: 'at' },
                { header: 'Actor', key: 'actor' },
                { header: 'Role', key: 'role' },
                { header: 'Action', key: 'action' },
                { header: 'Target', key: 'target' },
                { header: 'Category', key: 'category' },
              ])
            }
          >
            Export CSV
          </Button>
        }
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <div className="toolbar">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setLimit(20);
            }}
            placeholder="Search actor, action or target"
            label="Search audit log"
          />
          <Field label="" htmlFor="audit-category">
            <Select
              id="audit-category"
              aria-label="Filter by category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setLimit(20);
              }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <span className="toolbar__count">{filtered.length} entries</span>
        </div>

        <CardBody>
          {visible.length === 0 ? (
            <p className="text-sm text-muted">No audit entries match this search.</p>
          ) : (
            <div className="timeline">
              {visible.map((entry) => (
                <div className="timeline__row" key={entry.id}>
                  <span
                    className={`timeline__dot timeline__dot--${
                      entry.category === 'alert' ? 'warning' : entry.category === 'approval' ? 'success' : 'red'
                    }`}
                  />
                  <div className="grow">
                    <div className="row-between wrap gap-2">
                      <div className="timeline__title">{entry.action}</div>
                      <Badge tone="neutral">{categoryLabel(entry.category)}</Badge>
                    </div>
                    <div className="timeline__meta">
                      {formatDateTime(entry.at)} · {entry.actor} · {entry.role} · target{' '}
                      <span className="mono">{entry.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
        {filtered.length > visible.length && (
          <div className="card__footer row-between">
            <span className="text-xs text-muted">
              Showing {visible.length} of {filtered.length} entries
            </span>
            <Button variant="secondary" size="sm" icon="chevron-down" onClick={() => setLimit((l) => l + 20)}>
              Load more
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-4 alert alert--info">
        <Icon name="lock" className="icon alert__icon" />
        <div>
          <div className="alert__title">Audit entries cannot be edited</div>
          <div className="alert__body">
            There is no edit or delete action anywhere in this prototype. In a production build these
            records would be append-only and retained under an agreed data policy.
          </div>
        </div>
      </div>
    </>
  );
}
