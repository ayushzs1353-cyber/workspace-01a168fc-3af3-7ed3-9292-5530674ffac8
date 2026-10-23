import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  BloodPill,
  Button,
  DataTable,
  DemoNotice,
  StatusBadge,
  Tabs,
  UrgencyBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { bankRequests, orgName } from '../../state/selectors.js';
import { componentLabel, timeAgo } from '../../data/reference.js';

const MATCHERS = {
  new: (r) => ['bank_review', 'forwarded'].includes(r.status),
  testing: (r) => r.status === 'testing',
  approval: (r) => r.status === 'approval',
  ready: (r) => r.status === 'ready',
  shipping: (r) => ['shipment_created', 'picked_up', 'in_transit'].includes(r.status),
  closed: (r) => ['delivered', 'completed', 'rejected', 'cancelled'].includes(r.status),
};

const NEXT_LABEL = {
  new: 'Review',
  testing: 'Record result',
  approval: 'Awaiting hospital',
  ready: 'Create shipment',
  shipping: 'Track',
  closed: 'View',
};

export default function BankRequests() {
  const app = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('new');
  const all = bankRequests(app, app.currentUser.bankId);
  const rows = all.filter(MATCHERS[tab] || MATCHERS.new);

  const columns = [
    {
      key: 'id',
      header: 'Request',
      sortValue: (r) => r.createdAt,
      render: (r) => (
        <div>
          <span className="mono text-strong">{r.id}</span>
          <span className="table__meta">
            {r.forwardedToBankId === app.currentUser.bankId && !r.bankId?.includes('x')
              ? 'Forwarded to you'
              : `Received ${timeAgo(r.createdAt)}`}
          </span>
        </div>
      ),
    },
    {
      key: 'hospital',
      header: 'Hospital',
      render: (r) => (
        <div>
          <span>{orgName(app, r.hospitalId)}</span>
          <span className="table__meta">{r.ward}</span>
        </div>
      ),
    },
    {
      key: 'requirement',
      header: 'Requirement',
      render: (r) => (
        <div className="row gap-2">
          <BloodPill group={r.bloodGroup} />
          <div>
            <span>{componentLabel(r.component)}</span>
            <span className="table__meta">{r.units} unit(s)</span>
          </div>
        </div>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      sortValue: (r) => ['routine', 'urgent', 'critical'].indexOf(r.urgency),
      render: (r) => <UrgencyBadge urgency={r.urgency} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (r) => (
        <Button
          size="sm"
          variant={['new', 'ready', 'testing'].includes(tab) ? 'primary' : 'secondary'}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/bank/requests/${r.id}`);
          }}
        >
          {NEXT_LABEL[tab]}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Incoming requests"
        description="Requests assigned to your bank, including those forwarded from partner banks."
        actions={
          <Link to="/bank/inventory" className="btn btn--secondary">
            <Icon name="layers" />
            Check inventory
          </Link>
        }
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <div style={{ padding: '0 12px' }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'new', label: 'New', count: all.filter(MATCHERS.new).length },
              { id: 'testing', label: 'Testing', count: all.filter(MATCHERS.testing).length },
              { id: 'approval', label: 'Approval', count: all.filter(MATCHERS.approval).length },
              { id: 'ready', label: 'Ready', count: all.filter(MATCHERS.ready).length },
              { id: 'shipping', label: 'Shipping', count: all.filter(MATCHERS.shipping).length },
              { id: 'closed', label: 'Closed', count: all.filter(MATCHERS.closed).length },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => navigate(`/bank/requests/${r.id}`)}
          searchFields={['id', 'patientName', 'bloodGroup', 'ward']}
          searchPlaceholder="Search by request, patient or group"
          filters={[
            {
              key: 'urgency',
              label: 'Urgency',
              options: [
                { value: 'critical', label: 'Critical' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'routine', label: 'Routine' },
              ],
              accessor: (r) => r.urgency,
            },
            {
              key: 'group',
              label: 'Blood group',
              options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({
                value: g,
                label: g,
              })),
              accessor: (r) => r.bloodGroup,
            },
          ]}
          pageSize={8}
          empty={{
            title: tab === 'new' ? 'No new requests' : 'Nothing in this stage',
            description:
              tab === 'new'
                ? 'New requests from hospitals will appear here as soon as they are assigned to your bank.'
                : 'Requests will appear here as they progress through the workflow.',
          }}
          mobileRender={(r) => (
            <>
              <div className="mobile-row__top">
                <div>
                  <span className="mono text-strong">{r.id}</span>
                  <div className="text-xs text-muted">{orgName(app, r.hospitalId)}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="row gap-2 wrap">
                <BloodPill group={r.bloodGroup} />
                <span className="text-xs">
                  {r.units} × {componentLabel(r.component)}
                </span>
                <UrgencyBadge urgency={r.urgency} />
              </div>
              <div className="row-between">
                <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                <span className="btn btn--secondary btn--sm">Open</span>
              </div>
            </>
          )}
        />
      </Card>
    </>
  );
}
