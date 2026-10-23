import { useState } from 'react';
import { Button, Card, Field, Input, Badge } from '../ui/index.js';
import { TempChart } from '../ui/Charts.jsx';
import Icon from '../Icon.jsx';
import { TEMP_RANGE, formatDateTime, timeAgo } from '../../data/reference.js';

/**
 * Simulated cold-chain monitoring. All readings are generated locally —
 * there is no sensor connection. Labels make that explicit in the UI.
 */
export default function TemperaturePanel({ shipment, onAddReading, canAdd = false }) {
  const [value, setValue] = useState('4.0');
  const readings = shipment.temperature || [];
  const latest = readings[readings.length - 1];
  const outOfRange = latest && (latest.value < TEMP_RANGE.min || latest.value > TEMP_RANGE.max);
  const openAlerts = (shipment.tempAlerts || []).filter((a) => !a.acknowledged);

  const submit = (e) => {
    e.preventDefault();
    if (value === '' || Number.isNaN(Number(value))) return;
    onAddReading(Number(value));
  };

  return (
    <Card>
      <div className="card__header">
        <div>
          <h3 className="card__title">Transport temperature</h3>
          <p className="card__subtitle">Simulated readings · target range 2–6 °C</p>
        </div>
        {latest ? (
          <span className={`temp-badge ${outOfRange ? 'temp-badge--alert' : ''}`}>
            <Icon name="thermometer" className="icon icon--sm" />
            {latest.value} °C now
          </span>
        ) : (
          <Badge tone="neutral">No readings yet</Badge>
        )}
      </div>
      <div className="card__body">
        <TempChart readings={readings} />

        {openAlerts.length > 0 && (
          <div className="alert alert--danger mt-4">
            <Icon name="alert-triangle" className="icon alert__icon" />
            <div>
              <div className="alert__title">
                {openAlerts.length} excursion{openAlerts.length > 1 ? 's' : ''} recorded
              </div>
              <div className="alert__body">
                {openAlerts[0].value} °C at {formatDateTime(openAlerts[0].at)} — outside the 2–6 °C
                range. {openAlerts[0].note}
              </div>
            </div>
          </div>
        )}

        {readings.length > 0 && (
          <>
            <p className="divider-label">Latest readings</p>
            <div className="temp-readings">
              {readings
                .slice(-8)
                .reverse()
                .map((r, i) => (
                  <div
                    key={`${r.at}-${i}`}
                    className={`temp-reading ${
                      r.value < TEMP_RANGE.min || r.value > TEMP_RANGE.max ? 'temp-reading--alert' : ''
                    }`}
                  >
                    <div className="temp-reading__val">{r.value}°</div>
                    <div className="temp-reading__time">{timeAgo(r.at)}</div>
                  </div>
                ))}
            </div>
          </>
        )}

        {canAdd && (
          <form className="mt-5" onSubmit={submit}>
            <div className="divider-label">Log a simulated reading</div>
            <div className="field-row">
              <Field
                label="Temperature (°C)"
                htmlFor="temp-value"
                hint="Demo only — values are stored locally, not from a sensor."
              >
                <Input
                  id="temp-value"
                  type="number"
                  step="0.1"
                  min="-10"
                  max="30"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ maxWidth: 160 }}
                />
              </Field>
              <Button type="submit" variant="secondary" icon="plus">
                Add reading
              </Button>
            </div>
            <p className="text-xs text-subtle mt-3">
              Tip: enter 8.2 to see how an excursion alert appears for the Super Admin.
            </p>
          </form>
        )}
      </div>
    </Card>
  );
}
