import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  BloodPill,
  DataTable,
  DemoNotice,
  StatusBadge,
  UrgencyBadge,
  PillFilters,
} from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { visibleRequests, getHospital } from '../../state/selectors.js';
import { componentLabel, isOpen, timeAgo, formatDate } from '../../data/reference.js';

export default function PatientRequests() {
  const app = useApp();
  const navigate = useNavigate();
  const all = visibleRequests(app, app.currentUser);
  const [scope, setScope] = useState('all');

  const scoped = all.filter((r) => {
    if (scope === 'active') return isOpen(r.status);
    if (scope === 'closed') return !isOpen(r.status);
    return true;
  });

  const columns = [
    {
      key: 'id',
      header: 'Request',
      sortValue: (r) => r.createdAt,
      render: (r) => (
        <div>
          <span className="text-strong mono">{r.id}</span>
          <span className="table__meta">{formatDate(r.createdAt)}</span>
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
            <span className="text-strong">{componentLabel(r.component)}</span>
            <span className="table__meta">
              {r.units} unit{r.units > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (r) => (
        <div>
          <span>{r.patientName}</span>
          <span className="table__meta">{r.ward}</span>
        </div>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (r) => <UrgencyBadge urgency={r.urgency} />,
      sortValue: (r) => ['routine', 'urgent', 'critical'].indexOf(r.urgency),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} />
          <span className="table__meta">{timeAgo(r.timeline[r.timeline.length - 1]?.at)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Link
          to={`/patient/requests/${r.id}`}
          className="btn btn--secondary btn--sm"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="My requests"
        description="Every request you have raised, with its latest status."
        actions={
          <Link to="/patient/new" className="btn btn--primary">
            <Icon name="plus" />
            New request
          </Link>
        }
      />

      <DemoNotice compact />

      <div className="row-between mt-5 mb-3 wrap gap-3">
        <PillFilters
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: `All (${all.length})` },
            { value: 'active', label: `Active (${all.filter((r) => isOpen(r.status)).length})` },
            { value: 'closed', label: `Closed (${all.filter((r) => !isOpen(r.status)).length})` },
          ]}
        />
      </div>

      <Card flush>
        <DataTable
          columns={columns}
          rows={scoped}
          searchFields={['id', 'patientName', 'ward', 'bloodGroup']}
          searchPlaceholder="Search by request ID, patient or ward"
          filters={[
            {
              key: 'group',
              label: 'Blood group',
              options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g })),
              accessor: (r) => r.bloodGroup,
            },
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
          ]}
          pageSize={6}
          onRowClick={(r) => navigate(`/patient/requests/${r.id}`)}
          empty={{
            title: 'No requests in this view',
            description: 'Try another filter, or raise a new request.',
            action: (
              <Link to="/patient/new" className="btn btn--primary btn--sm">
                New request
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
                  {r.units} unit(s) · {componentLabel(r.component)}
                </span>
                <UrgencyBadge urgency={r.urgency} />
              </div>
              <div className="row-between">
                <span className="text-xs text-muted">
                  {getHospital(app, r.hospitalId)?.short} · {timeAgo(r.createdAt)}
                </span>
                <Link to={`/patient/requests/${r.id}`} className="btn btn--secondary btn--sm">
                  View
                </Link>
              </div>
            </>
          )}
        />
      </Card>
    </>
  );
}
