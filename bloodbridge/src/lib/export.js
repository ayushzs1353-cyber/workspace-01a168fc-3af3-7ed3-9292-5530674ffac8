/* Small helpers for the demo: CSV export and clipboard, all local. */

export function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => `"${c.header}"`).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const value = typeof c.value === 'function' ? c.value(row) : row[c.key];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function printPage() {
  window.print();
}
