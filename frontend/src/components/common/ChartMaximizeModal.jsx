import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Table as TableIcon,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { exportToCsv, triggerPrint } from '../../lib/exportUtils';
import { formatCurrency, formatNumber } from '../../lib/utils';

export function ChartMaximizeModal({
  isOpen,
  onClose,
  title = 'Детальная аналитика',
  subtitle = '',
  stats = [],
  renderChart,
  tableData = [],
  columns = [],
  defaultTab = 'combined' // 'combined' | 'chart' | 'table'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSearchQuery('');
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  // Filter table data by search query
  const filteredData = tableData.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (!tableData || tableData.length === 0) return;
    const headers = columns.map((c) => c.label);
    const rows = filteredData.map((r) =>
      columns.map((c) => {
        const val = r[c.key];
        return val !== undefined && val !== null ? String(val) : '';
      })
    );
    exportToCsv(`${title.replace(/\s+/g, '_')}_data`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto antialiased">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-6xl rounded-2xl bg-card border border-border text-card-foreground shadow-2xl transition-all animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col z-10 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-5 py-4 bg-muted/20 gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h2>
                <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-primary/10 border-primary/30 text-primary">
                  Полная статистика
                </Badge>
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons & Tabs */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View switcher */}
            <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1 text-xs">
              <button
                onClick={() => setActiveTab('combined')}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                  activeTab === 'combined'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                График + Таблица
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                  activeTab === 'chart'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Только график
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                  activeTab === 'table'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Ведомость
              </button>
            </div>

            {tableData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 px-2.5 text-xs rounded-xl hidden sm:inline-flex"
                title="Экспортировать в CSV"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/60"
              title="Закрыть (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          
          {/* 1. Детализированные KPI Метрики элемента */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/35 transition-colors shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">{stat.label}</span>
                    {stat.icon && (
                      <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-70" />
                    )}
                  </div>
                  <div className={`text-lg font-bold mt-1 tracking-tight ${stat.color || 'text-foreground'}`}>
                    {stat.value}
                  </div>
                  {stat.desc && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {stat.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 2. Развернутый График во всю ширину */}
          {(activeTab === 'combined' || activeTab === 'chart') && (
            <div className="p-4 rounded-2xl border border-border/80 bg-muted/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Высокоточная визуализация
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Масштабируемый интерактивный режим
                </span>
              </div>

              {/* Chart container with enlarged height */}
              <div className="w-full h-80 sm:h-96">
                {renderChart ? renderChart({ isMaximized: true }) : null}
              </div>
            </div>
          )}

          {/* 3. Детализированная Ведомость (Таблица всех данных графы) */}
          {(activeTab === 'combined' || activeTab === 'table') && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-primary" />
                  <span>Детализированный реестр записей ({filteredData.length})</span>
                </div>

                {/* Table Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Быстрый поиск в строках..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full rounded-xl bg-muted/40 border-0 ring-1 ring-border/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 pl-8 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredData.length > 0 ? (
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                  <div className="overflow-x-auto max-h-[340px]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold z-10">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              className={`py-2.5 px-3.5 ${
                                col.align === 'right'
                                  ? 'text-right'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredData.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-muted/40 transition-colors group"
                          >
                            {columns.map((col) => (
                              <td
                                key={col.key}
                                className={`py-2.5 px-3.5 ${
                                  col.align === 'right'
                                    ? 'text-right'
                                    : col.align === 'center'
                                    ? 'text-center'
                                    : 'text-left'
                                }`}
                              >
                                {col.render
                                  ? col.render(row[col.key], row)
                                  : row[col.key] !== undefined && row[col.key] !== null
                                  ? String(row[col.key])
                                  : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  {searchQuery ? 'По вашему запросу ничего не найдено' : 'Данные для отображения отсутствуют'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Данные синхронизированы в реальном времени</span>
          </div>

          <div className="flex items-center gap-2">
            {tableData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 px-3 text-xs rounded-xl sm:hidden"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
            )}
            <Button
              onClick={onClose}
              size="sm"
              className="h-8 px-4 text-xs font-medium rounded-xl"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
