import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  Alert,
  Badge,
  Button,
  DataTable,
  DemoNotice,
  Modal,
  Tabs,
  Textarea,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { formatDate } from '../../data/reference.js';

export default function AdminOrganisations() {
  const app = useApp();
  const [tab, setTab] = useState('hospitals');
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const rows = tab === 'hospitals' ? app.hospitals : tab === 'banks' ? app.banks : app.partners;

  const statusBadge = (status) =>
    status === 'verified' ? (
      <Badge tone="success" dot>
        Verified
      </Badge>
    ) : status === 'pending' ? (
      <Badge tone="warning" dot>
        Pending review
      </Badge>
    ) : (
      <Badge tone="info" dot>
        Under review
      </Badge>
    );

  const columns = [
    {
      key: 'name',
      header: 'Organisation',
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <span className="text-strong">{r.name}</span>
          <span className="table__meta">
            {r.city}, {r.state || 'Rajasthan'}
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Primary contact',
      render: (r) => (
        <div>
          <span>{r.contactPerson || r.contact}</span>
          <span className="table__meta">{r.email || r.contact}</span>
        </div>
      ),
    },
    {
      key: 'licence',
      header: 'Licence (demo)',
      render: (r) => <span className="mono text-xs">{r.licence || r.bloodBankLicence || '—'}</span>,
    },
    {
      key: 'joined',
      header: 'Added',
      sortValue: (r) => r.joinedAt || '',
      render: (r) => <span className="text-xs">{r.joinedAt ? formatDate(r.joinedAt) : '—'}</span>,
    },
    { key: 'status', header: 'Status', render: (r) => statusBadge(r.status) },
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
            setSelected(r);
            setReviewNote('');
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
        title="Organisations"
        description="Demo hospitals, blood banks and delivery partners available on the platform."
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <div style={{ padding: '0 12px' }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'hospitals', label: 'Hospitals', count: app.hospitals.length },
              { id: 'banks', label: 'Blood banks', count: app.banks.length },
              { id: 'partners', label: 'Delivery partners', count: app.partners.length },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          searchFields={['name', 'city', 'contactPerson', 'email']}
          searchPlaceholder="Search by name, city or contact"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'verified', label: 'Verified' },
                { value: 'pending', label: 'Pending' },
                { value: 'under_review', label: 'Under review' },
              ],
              accessor: (r) => r.status,
            },
          ]}
          pageSize={8}
          empty={{ title: 'No organisations match', description: 'Try clearing the filters.' }}
        />
      </Card>

      <div className="grid grid-3 mt-4">
        <Card className="card--pad">
          <div className="stat__label">Hospitals</div>
          <div className="stat__value">{app.hospitals.length}</div>
          <div className="text-xs text-muted">
            {app.hospitals.filter((h) => h.status === 'verified').length} verified in demo
          </div>
        </Card>
        <Card className="card--pad">
          <div className="stat__label">Blood banks</div>
          <div className="stat__value">{app.banks.length}</div>
          <div className="text-xs text-muted">
            {app.banks.filter((b) => b.status === 'verified').length} verified in demo
          </div>
        </Card>
        <Card className="card--pad">
          <div className="stat__label">Delivery partners</div>
          <div className="stat__value">{app.partners.length}</div>
          <div className="text-xs text-muted">Covering Jaipur and Ajmer</div>
        </Card>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        icon="building"
        title={selected?.name || ''}
        description={selected ? `${selected.city} · ${selected.type === 'bank' ? 'Blood bank' : selected.type === 'hospital' ? 'Hospital' : 'Delivery partner'}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected && selected.status !== 'verified' && (
              <Button
                onClick={() => {
                  app.updateOrganisation(selected.id, {
                    status: 'verified',
                    verificationNote: reviewNote,
                    verifiedAt: new Date().toISOString(),
                  });
                  setSelected(null);
                }}
              >
                Mark as verified (demo)
              </Button>
            )}
            {selected && selected.status === 'verified' && (
              <Button
                variant="danger-outline"
                onClick={() => {
                  app.updateOrganisation(selected.id, { status: 'under_review' });
                  setSelected(null);
                }}
              >
                Send back for review
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="stack gap-4">
            <Alert tone="demo" title="Simulated verification">
              Marking an organisation as verified here only changes demo state. No licence, ownership
              or facility inspection has been performed.
            </Alert>
            <dl className="desc-list">
              <div>
                <dt>Status</dt>
                <dd>{statusBadge(selected.status)}</dd>
              </div>
              <div>
                <dt>Licence reference</dt>
                <dd className="mono text-xs">{selected.licence || selected.bloodBankLicence || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{selected.address}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{selected.contactPerson || selected.contact}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone || selected.contact}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selected.email || '—'}</dd>
              </div>
              {selected.type === 'hospital' && (
                <>
                  <div>
                    <dt>Beds</dt>
                    <dd>{selected.beds}</dd>
                  </div>
                  <div>
                    <dt>Connected banks</dt>
                    <dd>{selected.connectedBankIds?.length}</dd>
                  </div>
                </>
              )}
              {selected.type === 'bank' && (
                <>
                  <div>
                    <dt>Operating hours</dt>
                    <dd>{selected.operatingHours}</dd>
                  </div>
                  <div>
                    <dt>Cold storage</dt>
                    <dd>{selected.coldStorage}</dd>
                  </div>
                </>
              )}
              {selected.joinedAt && (
                <div>
                  <dt>Added</dt>
                  <dd>{formatDate(selected.joinedAt)}</dd>
                </div>
              )}
            </dl>

            {selected.status !== 'verified' && (
              <div className="field">
                <label className="field__label" htmlFor="review-note">
                  Review note <span className="field__optional">(optional)</span>
                </label>
                <Textarea
                  id="review-note"
                  rows={2}
                  placeholder="e.g. Documents reviewed in demo; no real verification performed."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
