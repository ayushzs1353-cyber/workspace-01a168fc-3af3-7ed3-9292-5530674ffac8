import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StockBar } from '../../components/ui/Charts.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  ChipGroup,
  DataTable,
  DemoNotice,
  Field,
  Input,
  Modal,
  Select,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { bankInventory, inventoryByGroup, inventoryTotals } from '../../state/selectors.js';
import {
  BLOOD_GROUPS,
  COMPONENTS,
  componentLabel,
  daysUntil,
  formatDate,
  timeAgo,
} from '../../data/reference.js';

export default function BankInventory() {
  const app = useApp();
  const rows = bankInventory(app, app.currentUser.bankId);
  const totals = inventoryTotals(rows);
  const groups = inventoryByGroup(rows);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [newUnits, setNewUnits] = useState('');
  const [addForm, setAddForm] = useState({
    bloodGroup: 'A+',
    component: 'prbc',
    units: '2',
    expiry: '',
    batchId: '',
  });
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().slice(0, 10);

  const columns = useMemo(
    () => [
      {
        key: 'group',
        header: 'Blood group',
        render: (r) => <BloodPill group={r.bloodGroup} />,
        sortValue: (r) => BLOOD_GROUPS.indexOf(r.bloodGroup),
      },
      {
        key: 'component',
        header: 'Component',
        render: (r) => (
          <div>
            <span className="text-strong">{componentLabel(r.component)}</span>
            <span className="table__meta">{r.batchId}</span>
          </div>
        ),
        sortValue: (r) => r.component,
      },
      {
        key: 'units',
        header: 'Available',
        sortValue: (r) => r.units,
        render: (r) => (
          <div style={{ minWidth: 110 }}>
            <div className="row gap-2">
              <span className="text-strong">{r.units}</span>
              <span className="text-xs text-muted">unit(s)</span>
              {r.units === 0 ? (
                <Badge tone="danger">Out</Badge>
              ) : r.units <= r.threshold ? (
                <Badge tone="warning">Low</Badge>
              ) : null}
            </div>
            <div style={{ marginTop: 4 }}>
              <StockBar value={r.units} max={Math.max(r.threshold * 3, 12)} />
            </div>
          </div>
        ),
      },
      {
        key: 'expiry',
        header: 'Earliest expiry',
        sortValue: (r) => r.earliestExpiry,
        render: (r) => {
          const days = daysUntil(r.earliestExpiry);
          return (
            <div>
              <span>{formatDate(r.earliestExpiry)}</span>
              <span className="table__meta">
                {days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days} day(s) left`}
              </span>
            </div>
          );
        },
      },
      {
        key: 'updated',
        header: 'Updated',
        render: (r) => <span className="text-xs text-muted">{timeAgo(r.lastUpdated)}</span>,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (r) => (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
              setNewUnits(String(r.units));
            }}
          >
            Update
          </Button>
        ),
      },
    ],
    [],
  );

  const openAdd = (group, component) => {
    setAddForm((f) => ({
      ...f,
      bloodGroup: group || f.bloodGroup,
      component: component || f.component,
      expiry: new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10),
    }));
    setAddOpen(true);
  };

  const submitAdd = () => {
    const next = {};
    if (!addForm.units || Number(addForm.units) < 1) next.units = 'Enter at least 1 unit.';
    if (!addForm.expiry) next.expiry = 'Choose an expiry date.';
    else if (addForm.expiry < today) next.expiry = 'Expiry must be in the future.';
    setErrors(next);
    if (Object.keys(next).length) return;
    app.addInventoryRecord({
      ...addForm,
      units: Number(addForm.units),
      bankId: app.currentUser.bankId,
    });
    setAddOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Available units by blood group and component. Updates are logged in the demo audit trail."
        actions={
          <Button icon="plus" onClick={() => openAdd()}>
            Add stock
          </Button>
        }
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Stat label="Total units" value={totals.units} icon="droplet" meta="All groups and components" />
        <Stat
          label="Groups out of stock"
          value={totals.groupsOutOfStock}
          icon="alert-circle"
          tone={totals.groupsOutOfStock ? 'warning' : 'success'}
          meta="Blood groups with zero units"
        />
        <Stat
          label="Low stock groups"
          value={totals.lowGroups}
          icon="trending-up"
          tone="warning"
          meta="At or below threshold"
        />
        <Stat
          label="Expiring in 5 days"
          value={totals.expiringSoon}
          icon="clock"
          tone={totals.expiringSoon ? 'warning' : 'success'}
          meta="Rotate these units first"
        />
      </div>

      {totals.groupsOutOfStock > 0 && (
        <div className="alert alert--warning mt-4">
          <Icon name="alert-triangle" className="icon alert__icon" />
          <div className="grow">
            <div className="alert__title">
              {totals.groupsOutOfStock} blood group(s) with no units in stock
            </div>
            <div className="alert__body">
              Incoming requests for these groups will need to be forwarded to a partner blood bank.
              Partner banks are listed on each request.
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => openAdd()}>
            Add stock
          </Button>
        </div>
      )}

      <Card className="mt-5">
        <CardHeader
          title="Stock summary"
          subtitle="Units available per group, by component"
          action={<Badge tone="neutral">Demo inventory</Badge>}
        />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Group</th>
                {COMPONENTS.map((c) => (
                  <th key={c.id}>{c.short}</th>
                ))}
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.bloodGroup}>
                  <td>
                    <BloodPill group={g.bloodGroup} />
                  </td>
                  {g.components.map((c) => (
                    <td key={c.id}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ fontWeight: 650, minWidth: 44 }}
                        onClick={() => openAdd(g.bloodGroup, c.id)}
                        title={`Add ${c.short} for ${g.bloodGroup}`}
                      >
                        {c.units}
                      </button>
                    </td>
                  ))}
                  <td>
                    <strong>{g.units}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {g.units === 0 ? (
                      <Badge tone="danger">Out</Badge>
                    ) : g.units <= 3 ? (
                      <Badge tone="warning">Low</Badge>
                    ) : (
                      <Badge tone="success" dot>
                        OK
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card__footer text-xs text-muted">
          Click any number to add units for that group and component.
        </div>
      </Card>

      <Card className="mt-4" flush>
        <CardHeader
          title="All stock records"
          subtitle={`${rows.length} records · search and filter below`}
        />
        <DataTable
          columns={columns}
          rows={rows}
          searchFields={['bloodGroup', 'component', 'batchId']}
          searchPlaceholder="Search group, component or batch"
          filters={[
            {
              key: 'group',
              label: 'Blood group',
              options: BLOOD_GROUPS.map((g) => ({ value: g, label: g })),
              accessor: (r) => r.bloodGroup,
            },
            {
              key: 'component',
              label: 'Component',
              options: COMPONENTS.map((c) => ({ value: c.id, label: c.short })),
              accessor: (r) => r.component,
            },
            {
              key: 'status',
              label: 'Stock level',
              options: [
                { value: 'out', label: 'Out of stock' },
                { value: 'low', label: 'Low stock' },
                { value: 'ok', label: 'Healthy' },
              ],
              accessor: (r) => (r.units === 0 ? 'out' : r.units <= r.threshold ? 'low' : 'ok'),
            },
          ]}
          pageSize={10}
          empty={{ title: 'No stock records match', description: 'Clear the filters to see all records.' }}
          mobileRender={(r) => (
            <>
              <div className="mobile-row__top">
                <div className="row gap-2">
                  <BloodPill group={r.bloodGroup} />
                  <div>
                    <div className="text-sm text-strong">{componentLabel(r.component)}</div>
                    <div className="text-xs text-muted">{r.batchId}</div>
                  </div>
                </div>
                <Badge tone={r.units === 0 ? 'danger' : r.units <= r.threshold ? 'warning' : 'success'}>
                  {r.units} unit(s)
                </Badge>
              </div>
              <div className="row-between">
                <span className="text-xs text-muted">Expires {formatDate(r.earliestExpiry)}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(r);
                    setNewUnits(String(r.units));
                  }}
                >
                  Update
                </Button>
              </div>
            </>
          )}
        />
      </Card>

      {/* Add stock */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add stock"
        description="Record units received into this blood bank. Demo only."
        icon="plus"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd}>Add to inventory</Button>
          </>
        }
      >
        <div className="stack gap-4">
          <Field label="Blood group" htmlFor="add-group">
            <ChipGroup
              options={BLOOD_GROUPS}
              value={addForm.bloodGroup}
              onChange={(v) => setAddForm((f) => ({ ...f, bloodGroup: v }))}
              label="Blood group"
            />
          </Field>
          <div className="form-grid">
            <Field label="Component" htmlFor="add-component">
              <Select
                id="add-component"
                value={addForm.component}
                onChange={(e) => setAddForm((f) => ({ ...f, component: e.target.value }))}
              >
                {COMPONENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Units" htmlFor="add-units" error={errors.units}>
              <Input
                id="add-units"
                type="number"
                min="1"
                value={addForm.units}
                onChange={(e) => setAddForm((f) => ({ ...f, units: e.target.value }))}
                invalid={!!errors.units}
              />
            </Field>
            <Field label="Earliest expiry" htmlFor="add-expiry" error={errors.expiry}>
              <Input
                id="add-expiry"
                type="date"
                min={today}
                value={addForm.expiry}
                onChange={(e) => setAddForm((f) => ({ ...f, expiry: e.target.value }))}
                invalid={!!errors.expiry}
              />
            </Field>
            <Field label="Batch reference" htmlFor="add-batch" optional>
              <Input
                id="add-batch"
                placeholder="e.g. Batch D2-1"
                value={addForm.batchId}
                onChange={(e) => setAddForm((f) => ({ ...f, batchId: e.target.value }))}
              />
            </Field>
          </div>
          <Alert tone="info">
            Adding stock updates the demo inventory immediately. No real storage or screening record
            is created.
          </Alert>
        </div>
      </Modal>

      {/* Update stock */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Update stock count"
        description={
          editing
            ? `${editing.bloodGroup} · ${componentLabel(editing.component)} · ${editing.batchId}`
            : ''
        }
        icon="edit"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newUnits === '' || Number(newUnits) < 0) return;
                setConfirmSave(true);
              }}
            >
              Save count
            </Button>
          </>
        }
      >
        {editing && (
          <div className="stack gap-4">
            <div className="pay-summary">
              <div className="pay-row">
                <span className="text-muted">Current count</span>
                <span className="text-strong">{editing.units} units</span>
              </div>
              <div className="pay-row">
                <span className="text-muted">Threshold</span>
                <span className="text-strong">{editing.threshold} units</span>
              </div>
              <div className="pay-row">
                <span className="text-muted">Earliest expiry</span>
                <span className="text-strong">{formatDate(editing.earliestExpiry)}</span>
              </div>
            </div>
            <Field
              label="New count"
              htmlFor="update-units"
              hint="Use 0 if the units have been issued or discarded."
            >
              <Input
                id="update-units"
                type="number"
                min="0"
                value={newUnits}
                onChange={(e) => setNewUnits(e.target.value)}
              />
            </Field>
            <Alert tone="demo" compact>
              Count changes are logged with your name and time in the demo audit trail.
            </Alert>
          </div>
        )}
      </Modal>

      <Modal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="Confirm stock update"
        description={`Set ${editing?.bloodGroup || ''} ${editing ? componentLabel(editing.component) : ''} to ${newUnits} unit(s)?`}
        icon="alert-triangle"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSave(false)}>
              Go back
            </Button>
            <Button
              onClick={() => {
                app.updateInventory(editing.id, newUnits);
                setConfirmSave(false);
                setEditing(null);
              }}
            >
              Confirm update
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          This changes what partner hospitals see as available. Stock counts should match the
          physical register.
        </p>
      </Modal>
    </>
  );
}
