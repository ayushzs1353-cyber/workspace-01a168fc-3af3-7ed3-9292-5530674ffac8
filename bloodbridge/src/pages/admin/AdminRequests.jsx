import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  Badge,
  BloodPill,
  Button,
  DataTable,
  DemoNotice,
  Modal,
  StatusBadge,
  UrgencyBadge,
} from '../../components/ui/index.js';
import RequestDetails from '../../components/domain/RequestDetails.jsx';
import ActivityTimeline from '../../components/domain/ActivityTimeline.jsx';
import { useApp } from '../../state/store.jsx';
import { getBank, orgName } from '../../state/selectors.js';
import { componentLabel, formatDateTime, isOpen } from '../../data/reference.js';

export default function AdminRequests() {
  const app = useApp();
  const [selected, setSelected] = useState(null);
  const request = selected ? app.requests.find((r) => r.id === selected) : null;

  const columns = [
    {
      key: 'id',
      header: 'Request',
      sortValue: (r) => r.createdAt,
      render: (r) => (
        <div>
          <span className="mono text-strong">{r.id}</span>
          <span className="table__meta">{formatDateTime(r.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'hospital',
      header: 'Hospital',
      render: (r) => <span className="text-xs">{orgName(app, r.hospitalId)}</span>,
    },
    {
      key: 'bank',
      header: 'Blood bank',
      render: (r) => (
        <div>
          <span className="text-xs">{getBank(app, r.bankId)?.short || 'Unassigned'}</span>
          {r.forwardedToBankId && (
            <span className="table__meta">→ {getBank(app, r.forwardedToBankId)?.short}</span>
          )}
        </div>
      ),
    },
    {
      key: 'requirement',
      header: 'Requirement',
      render: (r) => (
        <div className="row gap-2">
          <BloodPill group={r.bloodGroup} />
          <span className="text-xs">
            {r.units} × {componentLabel(r.component)}
          </span>
        </div>
      ),
    },
    { key: 'urgency', header: 'Urgency', render: (r) => <UrgencyBadge urgency={r.urgency} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'payment',
      header: 'Payment',
      render: (r) => (
        <Badge
          tone={r.paymentStatus === 'paid' ? 'success' : r.paymentStatus === 'pending' ? 'warning' : 'neutral'}
        >
          {r.paymentStatus === 'paid' ? 'Paid (demo)' : r.paymentStatus === 'pending' ? 'Pending' : 'N/A'}
        </Badge>
      ),
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
            setSelected(r.id);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="All requests"
        description="Every simulated request across hospitals and blood banks."
        actions={
          <Badge tone="neutral" size="lg">
            {app.requests.length} total
          </Badge>
        }
      />

      <DemoNotice compact />

      <Card className="mt-5" flush>
        <DataTable
          columns={columns}
          rows={app.requests}
          onRowClick={(r) => setSelected(r.id)}
          searchFields={['id', 'patientName', 'bloodGroup', (r) => orgName(app, r.hospitalId)]}
          searchPlaceholder="Search request, patient, hospital"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'hospital_review', label: 'Hospital review' },
                { value: 'bank_review', label: 'With blood bank' },
                { value: 'forwarded', label: 'Forwarded' },
                { value: 'testing', label: 'Testing' },
                { value: 'approval', label: 'Clinical approval' },
                { value: 'ready', label: 'Ready' },
                { value: 'in_transit', label: 'In transit' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'rejected', label: 'Declined' },
              ],
              accessor: (r) => r.status,
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
            {
              key: 'scope',
              label: 'Scope',
              options: [
                { value: 'open', label: 'Open only' },
                { value: 'closed', label: 'Closed only' },
              ],
              accessor: (r) => (isOpen(r.status) ? 'open' : 'closed'),
            },
          ]}
          pageSize={10}
          empty={{ title: 'No requests match', description: 'Try clearing the filters.' }}
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
                <span className="text-xs text-muted">{getBank(app, r.bankId)?.short || 'Unassigned'}</span>
                <Button size="sm" variant="secondary" onClick={() => setSelected(r.id)}>
                  View
                </Button>
              </div>
            </>
          )}
        />
      </Card>

      <Modal
        open={!!request}
        onClose={() => setSelected(null)}
        size="lg"
        icon="clipboard"
        title={request ? `Request ${request.id}` : ''}
        description={request ? `${orgName(app, request.hospitalId)} · ${request.ward}` : ''}
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {request && (
          <div className="stack gap-5">
            <div className="row gap-2 wrap">
              <StatusBadge status={request.status} size="lg" />
              <UrgencyBadge urgency={request.urgency} />
              {request.shipmentId && <Badge tone="info">Shipment {request.shipmentId}</Badge>}
            </div>
            <RequestDetails request={request} state={app} />
            <div>
              <p className="divider-label">Timeline</p>
              <ActivityTimeline items={request.timeline} />
            </div>
            <div className="gate-note">
              <Icon name="info" className="icon icon--sm" />
              <span>
                Super admins can review but should not perform clinical or dispatch actions. Those stay
                with the hospital and blood bank.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
