import React from 'react';
import { X, Download, Printer, Layers, FileText, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import { exportToCsv, triggerPrint } from '../../lib/exportUtils';

export function ChartDrilldownModal({
  isOpen,
  onClose,
  title = 'Детализация данных',
  subtitle = '',
  stats = [],
  records = [],
  columns = []
}) {
  if (!isOpen) return null;

  const handleExport = () => {
    if (!records || records.length === 0) return;
    const headers = columns.map(c => c.label);
    const rows = records.map(r =>
      columns.map(c => {
        const val = r[c.key];
        return val !== undefined && val !== null ? String(val) : '';
      })
    );
    exportToCsv('drilldown_data', headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border text-card-foreground shadow-2xl transition-all animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{title}</h2>
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport} className="h-8 px-2.5 text-xs">
                <Download className="h-3.5 w-3.5 mr-1" />
                Экспорт CSV
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Верхние KPI метрики выбранного элемента */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border/70 bg-muted/30">
                  <div className="text-[11px] font-medium text-muted-foreground">{stat.label}</div>
                  <div className={`text-base font-bold mt-0.5 ${stat.color || 'text-foreground'}`}>
                    {stat.value}
                  </div>
                  {stat.desc && <div className="text-[10px] text-muted-foreground mt-0.5">{stat.desc}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Таблица подробных записей */}
          <div>
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Связанные операции и сделки ({records.length})</span>
            </div>

            {records.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted/70 backdrop-blur border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        {columns.map((col) => (
                          <th key={col.key} className={`py-2.5 px-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          {columns.map((col) => (
                            <td key={col.key} className={`py-2.5 px-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                              {col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                <Info className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                Нет доступных детальных записей за указанный период
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 bg-muted/20 flex justify-end">
          <Button onClick={onClose} size="sm" className="h-8 px-4 text-xs font-medium">
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}
