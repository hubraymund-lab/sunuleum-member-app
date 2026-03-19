// Created: 2026-03-18
export function exportToCSV(data, filename, headers) {
  if (!data.length) return;

  const headerRow = headers.map(h => h.label).join(',');
  const rows = data.map(item =>
    headers.map(h => {
      const val = typeof h.accessor === 'function' ? h.accessor(item) : item[h.accessor];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );

  const bom = '\uFEFF';
  const csv = bom + [headerRow, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
