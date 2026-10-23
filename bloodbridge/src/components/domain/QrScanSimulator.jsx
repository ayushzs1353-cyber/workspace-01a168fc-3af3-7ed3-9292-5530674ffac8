import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { Button, Input, Field } from '../ui/index.js';

/**
 * Simulated hospital-QR scanner for the patient portal.
 * No camera permission is requested: the demo intentionally simulates the
 * scan so it works on any device and in any browser.
 */
export default function QrScanSimulator({ onDetected, hospitalName, token, autoStart = false }) {
  const [stage, setStage] = useState('idle'); // idle | scanning | detected
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = () => {
    setError('');
    setStage('scanning');
    timer.current = window.setTimeout(() => {
      setStage('detected');
      onDetected?.(token);
    }, 1700);
  };

  useEffect(() => {
    if (autoStart) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div>
      <div className="scanner" aria-live="polite">
        {stage === 'detected' ? (
          <div className="qr-fallback">
            <Icon name="check-circle" className="icon icon--lg" style={{ color: '#7ee2b8' }} />
            <strong>Hospital QR recognised</strong>
            <span>{hospitalName} · form prefilled</span>
          </div>
        ) : (
          <>
            <div className="qr-fallback">
              <Icon name="qr" className="icon icon--lg" />
              <strong style={{ color: '#fff' }}>
                {stage === 'scanning' ? 'Reading code…' : 'Hospital QR scanner'}
              </strong>
              <span style={{ maxWidth: 260 }}>
                {stage === 'scanning'
                  ? 'Hold steady in front of the code.'
                  : 'Simulated scanner — no camera access is used in this demo.'}
              </span>
            </div>
            {stage === 'scanning' && <span className="scanner__beam" />}
            <span className="scanner__hint">Demo simulation · {token}</span>
          </>
        )}
      </div>

      <div className="mt-4">
        {stage === 'detected' ? (
          <div className="row-between">
            <span className="text-sm text-muted">
              Detected <strong className="mono">{token}</strong>
            </span>
            <Button variant="secondary" size="sm" icon="refresh" onClick={start}>
              Scan again
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            block
            icon="scan"
            onClick={start}
            loading={stage === 'scanning'}
          >
            {stage === 'scanning' ? 'Scanning…' : 'Scan hospital QR code'}
          </Button>
        )}
      </div>

      <details className="mt-4">
        <summary className="text-sm text-muted" style={{ cursor: 'pointer' }}>
          Enter a hospital code instead
        </summary>
        <div className="field-row mt-3">
          <Field label="Hospital code" htmlFor="manual-token" error={error} className="grow">
            <Input
              id="manual-token"
              placeholder="e.g. BB-HOSP-SUNRIS-9F2A"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
          </Field>
          <Button
            variant="secondary"
            onClick={() => {
              const code = manual.trim().toUpperCase();
              if (!code) {
                setError('Enter the code printed under the QR.');
                return;
              }
              setError('');
              setStage('detected');
              onDetected?.(code);
            }}
          >
            Use code
          </Button>
        </div>
      </details>
    </div>
  );
}
