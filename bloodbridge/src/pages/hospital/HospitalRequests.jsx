import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  BloodPill,
  DataTable,
  DemoNotice,
  StatusBadge,
  Tabs,
  UrgencyBadge,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getBank, visibleRequests } from '../../state/selectors.js';
import { componentLabel, formatDate, isOpen, timeAgo } from '../../data/reference.js';

const TAB_MATCHERS = {
  all: () => true,
  review: (r) => ['submitted', 'hospital_review'].includes(r.status),
  active: (r) => isOpen(r.status) && !['submitted', 'hospital_review', 'approval'].includes(r.status),
  approval: (r) => r.status === 'approval',
  closed: (r) => !isOpen(r.status) || ['delivered', 'completed'].includes(r.status),
};

export default function HospitalRequests() {
  const app = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'all');

  const requests = visibleRequests(app, app.currentUser);
  const rows = requests.filter(TAB_MATCHERS[tab] || TAB_MATCHERS.all);

  const changeTab = (next) => {
    setTab(next);
    const p = new URLSearchParams(params);
    if (next === 'all') p.delete('tab');
    else p.set('tab', next);
    setParams(p, { replace: true });
  };

  const columns = [
    {
      key: 'id',
      header: 'Request',
      sortValue: (r) => r.createdAt,
      render: (r) => (
        <div>
          <span className="mono text-strong">{r.id}</span>
          <span className="table__meta">{formatDate(r.createdAt)} · {r.source === 'qr' ? 'QR' : 'Portal'}</span>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (r) => (
        <div>
          <span className="text-strong">{r.patientName}</span>
          <span className="table__meta">
            {r.patientAge} yrs · {r.ward}
          </span>
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
      key: 'bank',
      header: 'Blood bank',
      render: (r) => (
        <div>
          <span>{getBank(app, r.bankId)?.short || '—'}</span>
          <span className="table__meta">
            {r.forwardedToBankId ? `Forwarded to ${getBank(app, r.forwardedToBankId)?.short}` : 'Assigned'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} />
          <span className="table__meta">{timeAgo(r.timeline.at(-1)?.at)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <span className="btn btn--secondary btn--sm">
          {['submitted', 'hospital_review'].includes(r.status) ? 'Review' : 'Open'}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Blood requests"
        description="Review incoming requests, assign blood banks and record clinical approvals."
        actions={
          <Link to="/hospital/requests/new" className="btn btn--primary">
            <Icon name="plus" />
            New request
          </Link>
        }
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <div style={{ padding: '0 12px' }}>
          <Tabs
            value={tab}
            onChange={changeTab}
            tabs={[
              { id: 'all', label: 'All', count: requests.length },
              {
                id: 'review',
                label: 'Needs review',
                count: requests.filter(TAB_MATCHERS.review).length,
              },
              {
                id: 'approval',
                label: 'Needs approval',
                count: requests.filter(TAB_MATCHERS.approval).length,
              },
              { id: 'active', label: 'In progress', count: requests.filter(TAB_MATCHERS.active).length },
              { id: 'closed', label: 'Closed', count: requests.filter(TAB_MATCHERS.closed).length },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => navigate(`/hospital/requests/${r.id}`)}
          searchFields={['id', 'patientName', 'ward', 'bloodGroup', 'indication']}
          searchPlaceholder="Search by request ID, patient, ward"
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
            {
              key: 'component',
              label: 'Component',
              options: [
                { value: 'prbc', label: 'Packed RBC' },
                { value: 'whole', label: 'Whole blood' },
                { value: 'platelets', label: 'Platelets' },
                { value: 'plasma', label: 'Plasma' },
              ],
              accessor: (r) => r.component,
            },
          ]}
          pageSize={8}
          empty={{
            title: 'No requests in this view',
            description:
              tab === 'review'
                ? 'Nothing is waiting for review. New requests from the QR form will appear here.'
                : 'Try a different tab or clear the filters.',
            action: (
              <Link to="/hospital/requests/new" className="btn btn--primary btn--sm">
                Create a request
              </Link>
            ),
          }}
          mobileRender={(r) => (
            <>
              <div className="mobile-row__top">
                <div>
                  <span className="mono text-strong">{r.id}</span>
                  <div className="text-xs text-muted">
                    {r.patientName} · {r.ward}
                  </div>
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
                <span className="text-xs text-muted">{getBank(app, r.bankId)?.short || 'Unassigned'}</span>
                <span className="btn btn--secondary btn--sm">Open</span>
              </div>
            </>
          )}
        />
      </Card>
    </>
  );
}
