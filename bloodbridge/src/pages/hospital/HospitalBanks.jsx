import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { StockBar } from '../../components/ui/Charts.jsx';
import { Alert, Badge, BloodPill, CardBody, DemoNotice } from '../../components/ui/index.js';
import { useApp } from '../../state/store.jsx';
import { getHospital, inventoryByGroup } from '../../state/selectors.js';
import { componentLabel } from '../../data/reference.js';

export default function HospitalBanks() {
  const app = useApp();
  const hospital = getHospital(app, app.currentUser?.hospitalId);
  const banks = app.banks.filter((b) => hospital?.connectedBankIds?.includes(b.id));

  return (
    <>
      <PageHeader
        title="Connected blood banks"
        description="Live demo stock summary shared by each bank. Availability is indicative, not a reservation."
        actions={
          <Link to="/hospital/requests/new" className="btn btn--primary">
            <Icon name="plus" />
            New request
          </Link>
        }
      />

      <DemoNotice compact />

      <div className="stack gap-4 mt-5">
        {banks.map((bank) => {
          const rows = app.inventory.filter((r) => r.bankId === bank.id);
          const groups = inventoryByGroup(rows);
          const totalUnits = rows.reduce((s, r) => s + r.units, 0);
          const outOfStock = groups.filter((g) => g.units === 0).map((g) => g.bloodGroup);
          const openRequests = app.requests.filter(
            (r) => r.bankId === bank.id && r.hospitalId === hospital?.id && !['delivered', 'completed', 'cancelled', 'rejected'].includes(r.status),
          ).length;

          return (
            <Card key={bank.id}>
              <div className="card__header">
                <div className="row gap-3">
                  <span className="avatar avatar--lg" style={{ background: 'var(--red-50)' }}>
                    <Icon name="bank" />
                  </span>
                  <div>
                    <h3 className="card__title">{bank.name}</h3>
                    <p className="card__subtitle">
                      {bank.city} · {bank.operatingHours} · {bank.phone}
                    </p>
                  </div>
                </div>
                <div className="row gap-2">
                  <Badge tone={bank.status === 'verified' ? 'success' : 'warning'} dot>
                    {bank.status === 'verified' ? 'Verified' : 'Under review'}
                  </Badge>
                  <Link to="/hospital/requests/new" className="btn btn--secondary btn--sm">
                    Request blood
                  </Link>
                </div>
              </div>
              <CardBody>
                <div className="row-between wrap gap-3 mb-4">
                  <div className="kv-inline">
                    <Icon name="layers" className="icon icon--sm" />
                    <strong>{totalUnits}</strong> demo units available
                  </div>
                  <div className="kv-inline">
                    <Icon name="clipboard" className="icon icon--sm" />
                    <strong>{openRequests}</strong> open request(s) for this hospital
                  </div>
                  <div className="kv-inline">
                    <Icon name="snowflake" className="icon icon--sm" />
                    {bank.coldStorage}
                  </div>
                </div>

                <div className="inv-grid">
                  {groups.map((g) => {
                    const tone = g.units === 0 ? 'out' : g.units <= 4 ? 'low' : '';
                    return (
                      <div
                        key={g.bloodGroup}
                        className={`inv-card ${g.units === 0 ? 'inv-card--out' : g.units <= 4 ? 'inv-card--low' : ''}`}
                      >
                        <div className="inv-card__top">
                          <BloodPill group={g.bloodGroup} />
                          {g.units === 0 ? (
                            <Badge tone="danger">Out</Badge>
                          ) : g.units <= 4 ? (
                            <Badge tone="warning">Low</Badge>
                          ) : null}
                        </div>
                        <div className="inv-card__units">
                          {g.units}
                          <small>units</small>
                        </div>
                        <StockBar value={g.units} max={16} tone={tone} />
                        <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                          {g.components.map((c) => `${c.short.split(' ')[0]} ${c.units}`).join(' · ')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {outOfStock.length > 0 && (
                  <div className="alert alert--warning mt-4">
                    <Icon name="alert-triangle" className="icon alert__icon" />
                    <div>
                      <div className="alert__title">
                        No {outOfStock.join(', ')} stock at this bank
                      </div>
                      <div className="alert__body">
                        Requests for these groups will be declined or forwarded to a partner bank.
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
              <div className="card__footer row-between wrap gap-3">
                <span className="text-xs text-muted">
                  Stock figures are simulated and updated by the blood bank demo account.
                </span>
                <span className="text-xs text-muted">
                  Contact: {bank.contactPerson} · {bank.phone}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-5">
        <Alert tone="info" title="Availability is not a reservation">
          Seeing stock at a bank does not reserve it. A request must be accepted and approved before
          units are allocated. {componentLabel('prbc')} and other components are listed separately
          inside each bank portal.
        </Alert>
      </div>
    </>
  );
}
