import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { TEMP_RANGE, formatDateTime } from '../../data/reference.js';

/** Simple column chart with a light entry animation. */
export function BarChart({ data, height = 168, valueKey = 'value', labelKey = 'label', suffix = '' }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  const max = Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d) => {
        const pct = Math.round((d[valueKey] / max) * 100);
        return (
          <div className="bar-chart__col" key={d[labelKey]}>
            <span className="bar-chart__value">
              {d[valueKey]}
              {suffix}
            </span>
            <div
              className={`bar-chart__bar ${d.muted ? 'bar-chart__bar--muted' : ''}`}
              style={{ height: `${mounted || reduce ? pct : 0}%` }}
              title={`${d[labelKey]}: ${d[valueKey]}${suffix}`}
            />
            <span className="bar-chart__label">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Two-series grouped bar chart (requests vs fulfilled). */
export function TrendChart({ data, height = 180 }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  const max = Math.max(...data.map((d) => Math.max(d.requests, d.fulfilled)), 1);

  return (
    <div>
      <div className="bar-chart" style={{ height }}>
        {data.map((d) => (
          <div className="bar-chart__col" key={d.label}>
            <div className="row gap-1" style={{ alignItems: 'flex-end', width: '100%', justifyContent: 'center', height: '100%' }}>
              <div style={{ width: '38%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${mounted || reduce ? Math.round((d.requests / max) * 100) : 0}%`,
                    background: 'var(--red-600)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 700ms var(--ease)',
                    minHeight: 4,
                  }}
                  title={`${d.requests} requests`}
                />
              </div>
              <div style={{ width: '38%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${mounted || reduce ? Math.round((d.fulfilled / max) * 100) : 0}%`,
                    background: '#f0c3c8',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 700ms var(--ease)',
                    minHeight: 4,
                  }}
                  title={`${d.fulfilled} fulfilled`}
                />
              </div>
            </div>
            <span className="bar-chart__label">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend mt-3">
        <span>
          <i style={{ background: 'var(--red-600)' }} /> Requests raised
        </span>
        <span>
          <i style={{ background: '#f0c3c8' }} /> Fulfilled
        </span>
      </div>
    </div>
  );
}

/** Cold-chain temperature line chart with the safe 2–6 °C band. */
export function TempChart({ readings, height = 150 }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  if (!readings.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--r-md)',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-sm)',
          textAlign: 'center',
          padding: 16,
        }}
      >
        No simulated readings yet. The operator can log a reading during transit.
      </div>
    );
  }

  const width = 640;
  const padX = 34;
  const padY = 16;
  const values = readings.map((r) => r.value);
  const min = Math.min(0, Math.floor(Math.min(...values) - 1));
  const max = Math.max(10, Math.ceil(Math.max(...values) + 1));
  const x = (i) => padX + (i * (width - padX * 2)) / Math.max(1, readings.length - 1);
  const y = (v) => padY + ((max - v) / (max - min)) * (height - padY * 2);
  const line = readings.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(r.value)}`).join(' ');
  const area = `${line} L ${x(readings.length - 1)} ${height - padY} L ${x(0)} ${height - padY} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart"
        role="img"
        aria-label={`Simulated temperature readings, ${readings.length} points between ${min} and ${max} degrees celsius`}
      >
        <rect
          x={padX}
          y={y(TEMP_RANGE.max)}
          width={width - padX * 2}
          height={y(TEMP_RANGE.min) - y(TEMP_RANGE.max)}
          fill="#e7f6f0"
          opacity="0.8"
        />
        <text x={6} y={y(TEMP_RANGE.max) + 4} className="chart__axis-label">
          6°
        </text>
        <text x={6} y={y(TEMP_RANGE.min) + 4} className="chart__axis-label">
          2°
        </text>
        <text x={6} y={y(max) + 10} className="chart__axis-label">
          {max}°
        </text>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#e6e9f0" />
        <path
          d={area}
          fill="rgba(214,40,57,0.06)"
          style={{ opacity: mounted || reduce ? 1 : 0, transition: 'opacity 500ms var(--ease)' }}
        />
        <path
          d={line}
          fill="none"
          stroke="var(--red-600)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: 1600,
            strokeDashoffset: mounted || reduce ? 0 : 1600,
            transition: 'stroke-dashoffset 900ms var(--ease)',
          }}
        />
        {readings.map((r, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(r.value)}
            r={r.alert || r.value > TEMP_RANGE.max || r.value < TEMP_RANGE.min ? 4.5 : 3}
            fill={r.alert || r.value > TEMP_RANGE.max || r.value < TEMP_RANGE.min ? 'var(--danger)' : 'var(--white)'}
            stroke={r.alert || r.value > TEMP_RANGE.max || r.value < TEMP_RANGE.min ? 'var(--danger)' : 'var(--red-600)'}
            strokeWidth="1.8"
          >
            <title>{`${formatDateTime(r.at)} · ${r.value} °C`}</title>
          </circle>
        ))}
        <text x={padX} y={height - 2} className="chart__axis-label">
          {readings.length > 1 ? formatDateTime(readings[0].at) : ''}
        </text>
        <text x={width - padX} y={height - 2} textAnchor="end" className="chart__axis-label">
          {readings.length > 1 ? formatDateTime(readings[readings.length - 1].at) : ''}
        </text>
      </svg>
      <div className="chart-legend mt-2">
        <span>
          <i style={{ background: '#e7f6f0', border: '1px solid #bfe6d7' }} /> Safe range 2–6 °C
        </span>
        <span>
          <i style={{ background: 'var(--danger)' }} /> Excursion (simulated)
        </span>
      </div>
    </div>
  );
}

export function StockBar({ value, max, tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const toneClass = tone || (value === 0 ? 'out' : value <= 3 ? 'low' : '');
  return (
    <div className="stock-bar">
      <div className="stock-bar__track">
        <div className={`stock-bar__fill ${toneClass ? `stock-bar__fill--${toneClass}` : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SplitBar({ segments, height = 10 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="split-bar" style={{ height }}>
      {segments.map((s) => (
        <span
          key={s.label}
          style={{ background: s.color, width: `${(s.value / total) * 100}%` }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}
