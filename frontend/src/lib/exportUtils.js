// Утилиты для экспорта данных в Excel (CSV с UTF-8 BOM) и печати документов

export function exportToCsv(filename, headers, rows) {
  // \uFEFF - UTF-8 Byte Order Mark для корректного открытия кириллицы в Microsoft Excel
  let csvContent = '\uFEFF';

  // Заголовки колонок
  csvContent += headers.map(h => `"${(h || '').toString().replace(/"/g, '""')}"`).join(';') + '\r\n';

  // Строки данных
  rows.forEach(row => {
    const rowContent = row
      .map(cell => `"${(cell !== null && cell !== undefined ? cell : '').toString().replace(/"/g, '""')}"`)
      .join(';');
    csvContent += rowContent + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerPrint() {
  window.print();
}
