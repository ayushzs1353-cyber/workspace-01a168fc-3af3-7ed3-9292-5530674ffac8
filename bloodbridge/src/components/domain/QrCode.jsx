import { useMemo } from 'react';

/**
 * A deterministic, decorative QR-style code for the demo.
 * It is NOT a scannable QR code and is labelled as such in the UI.
 */
function buildMatrix(token, size = 25) {
  let seed = 0;
  for (let i = 0; i < token.length; i += 1) {
    seed = (seed * 31 + token.charCodeAt(i)) % 2147483647;
  }
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const grid = Array.from({ length: size }, () => Array(size).fill(false));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      grid[y][x] = rand() > 0.52;
    }
  }
  // Clear finder patterns
  const clear = (ox, oy) => {
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        if (oy + y < size && ox + x < size) grid[oy + y][ox + x] = false;
      }
    }
  };
  clear(0, 0);
  clear(size - 8, 0);
  clear(0, size - 8);
  return grid;
}

export default function QrCode({ token, size = 170, label = 'Demo QR code' }) {
  const grid = useMemo(() => buildMatrix(token || 'BB-DEMO'), [token]);
  const cells = grid.length;
  const finder = (x, y) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#252B36" rx="1.4" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" rx="0.8" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#D62839" rx="0.6" />
    </g>
  );

  return (
    <svg
      viewBox={`-1 -1 ${cells + 2} ${cells + 2}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      style={{ display: 'block', margin: '0 auto' }}
    >
      <rect x="-1" y="-1" width={cells + 2} height={cells + 2} fill="#fff" />
      {grid.map((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#252B36" /> : null,
        ),
      )}
      {finder(0, 0)}
      {finder(cells - 7, 0)}
      {finder(0, cells - 7)}
    </svg>
  );
}
