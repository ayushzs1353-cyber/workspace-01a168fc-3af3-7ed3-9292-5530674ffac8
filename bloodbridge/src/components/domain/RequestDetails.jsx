import { componentLabel, currency, formatDate, formatDateTime, urgencyMeta } from '../../data/reference.js';
import { getBank, getHospital } from '../../state/selectors.js';
import { Badge, UrgencyBadge, BloodPill, StatusBadge } from '../ui/index.js';

export default function RequestDetails({ request, state, showBank = true }) {
  const hospital = getHospital(state, request.hospitalId);
  const bank = getBank(state, request.bankId);
  const forwarded = request.forwardedToBankId ? getBank(state, request.forwardedToBankId) : null;

  return (
    <dl className="desc-list">
      <div>
        <dt>Patient</dt>
        <dd>
          {request.patientName}{' '}
          <span className="text-muted text-xs">
            · {request.patientAge} yrs · {request.patientGender}
          </span>
        </dd>
      </div>
      <div>
        <dt>Blood group & component</dt>
        <dd className="row gap-2">
          <BloodPill group={request.bloodGroup} />
          <span>{componentLabel(request.component)}</span>
        </dd>
      </div>
      <div>
        <dt>Quantity</dt>
        <dd>
          {request.units} unit{request.units > 1 ? 's' : ''}
        </dd>
      </div>
      <div>
        <dt>Urgency</dt>
        <dd className="row gap-2">
          <UrgencyBadge urgency={request.urgency} />
          <span className="text-xs text-muted">Needed {urgencyMeta(request.urgency).desc.toLowerCase()}</span>
        </dd>
      </div>
      <div>
        <dt>Hospital</dt>
        <dd>{hospital?.name || '—'}</dd>
      </div>
      <div>
        <dt>Ward / location</dt>
        <dd>{request.ward || '—'}</dd>
      </div>
      {showBank && (
        <div>
          <dt>Blood bank</dt>
          <dd>
            {bank ? bank.name : <span className="text-muted">Not assigned</span>}
            {forwarded && (
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: 2 }}>
                Forwarded to {forwarded.name}
              </span>
            )}
          </dd>
        </div>
      )}
      <div>
        <dt>Requested by</dt>
        <dd>
          {request.requesterName}
          {request.requesterRelation && (
            <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 400 }}>
              {request.requesterRelation} · {request.requesterPhone}
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt>Clinical note / indication</dt>
        <dd style={{ fontWeight: 500 }}>{request.indication || '—'}</dd>
      </div>
      <div>
        <dt>Requested on</dt>
        <dd>{formatDateTime(request.createdAt)}</dd>
      </div>
      <div>
        <dt>Needed by</dt>
        <dd>{request.neededBy ? formatDate(request.neededBy) : '—'}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={request.status} />
        </dd>
      </div>
      <div>
        <dt>Estimated charge (demo)</dt>
        <dd>
          {currency(request.fee)}{' '}
          <Badge tone={request.paymentStatus === 'paid' ? 'success' : 'neutral'}>
            {request.paymentStatus === 'paid'
              ? 'Paid (demo)'
              : request.paymentStatus === 'pending'
                ? 'Payment pending'
                : 'No payment needed'}
          </Badge>
        </dd>
      </div>
    </dl>
  );
}
