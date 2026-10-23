import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  BloodPill,
  Button,
  CardBody,
  DataTable,
  DemoNotice,
  Modal,
  Textarea,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank } from '../../state/selectors.js';
import { componentLabel, formatDate } from '../../data/reference.js';

const STATUS_TONE = {
  verified: 'success',
  pending_review: 'warning',
  flagged: 'danger',
};

export default function AdminVerification() {
  const app = useApp();
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const unit = selectedId ? app.verification.find((v) => v.unitId === selectedId) : null;

  const verified = app.verification.filter((v) => v.status === 'verified').length;
  const flagged = app.verification.filter((v) => v.status === 'flagged').length;
  const pending = app.verification.filter((v) => v.status === 'pending_review').length;

  const columns = [
    {
      key: 'unitId',
      header: 'Unit',
      render: (v) => (
        <div>
          <span className="mono text-strong">{v.unitId}</span>
          <span className="table__meta">{getBank(app, v.bankId)?.short}</span>
        </div>
      ),
    },
    {
      key: 'blood',
      header: 'Blood',
      render: (v) => (
        <div className="row gap-2">
          <BloodPill group={v.bloodGroup} />
          <span className="text-xs">{componentLabel(v.component)}</span>
        </div>
      ),
    },
    {
      key: 'collected',
      header: 'Collected',
      render: (v) => <span className="text-xs">{formatDate(v.collectedAt)}</span>,
    },
    {
      key: 'tested',
      header: 'Screened',
      render: (v) => (
        <div>
          <span className="text-xs">{formatDate(v.testedAt)}</span>
          <span className="table__meta">by {v.testedBy}</span>
        </div>
      ),
    },
    {
      key: 'screening',
      header: 'Screening (demo)',
      render: (v) => (
        <span className="text-xs text-muted">
          {Object.values(v.screening).every((s) => s.includes('non-reactive') || s === 'not detected')
            ? 'All non-reactive'
            : 'Review needed'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge tone={STATUS_TONE[v.status]} dot>
          {v.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(v.unitId);
            setNote('');
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Unit verification"
        description="Screening records attached to demo blood units. Nothing here is a real laboratory result."
      />

      <DemoNotice compact />

      <div className="stat-grid mt-5">
        <Card className="card--pad">
          <div className="stat__label">Verified</div>
          <div className="stat__value">{verified}</div>
          <div className="text-xs text-muted">Demo units with complete records</div>
        </Card>
        <Card className="card--pad">
          <div className="stat__label">Pending review</div>
          <div className="stat__value">{pending}</div>
          <div className="text-xs text-muted">Awaiting a second look</div>
        </Card>
        <Card className="card--pad">
          <div className="stat__label">Flagged</div>
          <div className="stat__value">{flagged}</div>
          <div className="text-xs text-muted">Identification or quality issue</div>
        </Card>
        <Card className="card--pad">
          <div className="stat__label">Total units</div>
          <div className="stat__value">{app.verification.length}</div>
          <div className="text-xs text-muted">In the demo verification table</div>
        </Card>
      </div>

      <Card className="mt-4" flush>
        <DataTable
          columns={columns}
          rows={app.verification}
          getRowId={(v) => v.unitId}
          onRowClick={(v) => {
            setSelectedId(v.unitId);
            setNote('');
          }}
          searchFields={['unitId', 'bloodGroup', 'testedBy']}
          searchPlaceholder="Search unit ID or group"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'verified', label: 'Verified' },
                { value: 'pending_review', label: 'Pending review' },
                { value: 'flagged', label: 'Flagged' },
              ],
              accessor: (v) => v.status,
            },
          ]}
          pageSize={8}
          empty={{ title: 'No units to review' }}
        />
      </Card>

      <div className="mt-4">
        <Alert tone="info" title="What this screen is for">
          Verification information lets the platform team confirm that a unit’s screening record and
          identification match what the blood bank dispatched. It is an oversight tool, not a
          replacement for the blood bank’s laboratory records.
        </Alert>
      </div>

      <Modal
        open={!!unit}
        onClose={() => setSelectedId(null)}
        size="lg"
        icon="shield-check"
        title={unit ? `Unit ${unit.unitId}` : ''}
        description={
          unit ? `${getBank(app, unit.bankId)?.name} · ${unit.bloodGroup} ${componentLabel(unit.component)}` : ''
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              Close
            </Button>
            {unit && unit.status !== 'verified' && (
              <Button
                onClick={() => {
                  app.setVerificationStatus(unit.unitId, 'verified', note || 'Verified in demo review.');
                  setSelectedId(null);
                }}
              >
                Mark verified (demo)
              </Button>
            )}
            {unit && unit.status !== 'flagged' && (
              <Button
                variant="danger-outline"
                onClick={() => {
                  app.setVerificationStatus(unit.unitId, 'flagged', note || 'Flagged in demo review.');
                  setSelectedId(null);
                }}
              >
                Flag for review
              </Button>
            )}
          </>
        }
      >
        {unit && (
          <div className="stack gap-4">
            <Alert tone="demo" title="Simulated screening record">
              Laboratory values below are fictional. Do not interpret them clinically.
            </Alert>
            <dl className="desc-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <Badge tone={STATUS_TONE[unit.status]} dot>
                    {unit.status.replace('_', ' ')}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Blood group</dt>
                <dd className="row gap-2">
                  <BloodPill group={unit.bloodGroup} /> {componentLabel(unit.component)}
                </dd>
              </div>
              <div>
                <dt>Collected</dt>
                <dd>{formatDate(unit.collectedAt)}</dd>
              </div>
              <div>
                <dt>Screened</dt>
                <dd>
                  {formatDate(unit.testedAt)} · {unit.testedBy}
                </dd>
              </div>
              {Object.entries(unit.screening).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.toUpperCase()}</dt>
                  <dd style={{ textTransform: 'capitalize' }}>{value}</dd>
                </div>
              ))}
            </dl>

            <Card style={{ boxShadow: 'none' }}>
              <CardBody>
                <div className="row gap-2">
                  <Icon name="scan" className="icon text-muted" />
                  <span className="text-xs text-muted">
                    Barcode label was reported unreadable in alert ALT-3103 for unit U-8842. Manual
                    verification is required before dispatch.
                  </span>
                </div>
              </CardBody>
            </Card>

            <div className="field">
              <label className="field__label" htmlFor="verif-note">
                Review note <span className="field__optional">(optional)</span>
              </label>
              <Textarea
                id="verif-note"
                rows={2}
                placeholder="e.g. Screened record matches dispatch note. No real verification performed."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
