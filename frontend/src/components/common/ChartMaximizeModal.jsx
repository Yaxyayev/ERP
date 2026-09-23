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
      {/* Notion Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 notion-modal-backdrop transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog Card (Notion Glass & Spring Animation) */}
      <div className="relative w-full max-w-6xl rounded-xl notion-modal-glass text-charcoal dark:text-foreground my-auto max-h-[92vh] flex flex-col z-10 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-hairline/80 px-5 py-3.5 bg-white/40 dark:bg-white/5 backdrop-blur-sm gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-tint-lavender text-primary flex items-center justify-center shrink-0 mt-0.5">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                <Badge variant="lavender" className="text-[10px] py-0.5 px-2">
                  Полная статистика
                </Badge>
              </div>
              {subtitle && (
                <p className="text-xs text-steel mt-0.5 max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons & Tabs */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View switcher (Notion pill-tabs) */}
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setActiveTab('combined')}
                className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-all ${
                  activeTab === 'combined'
                    ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                    : 'bg-transparent text-steel border-hairline hover:text-foreground'
                }`}
              >
                График + Таблица
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-all ${
                  activeTab === 'chart'
                    ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                    : 'bg-transparent text-steel border-hairline hover:text-foreground'
                }`}
              >
                Только график
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-all ${
                  activeTab === 'table'
                    ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                    : 'bg-transparent text-steel border-hairline hover:text-foreground'
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
                className="h-7 px-2.5 text-xs hidden sm:inline-flex"
                title="Экспортировать в CSV"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
            )}

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-steel hover:bg-surface hover:text-foreground transition-colors border border-hairline shrink-0"
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
                  className="p-3.5 rounded-md border border-hairline bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-steel">{stat.label}</span>
                    {stat.icon && (
                      <stat.icon className="h-3.5 w-3.5 text-steel" />
                    )}
                  </div>
                  <div className={`text-lg font-semibold mt-1 tracking-tight ${stat.color || 'text-foreground'}`}>
                    {stat.value}
                  </div>
                  {stat.desc && (
                    <div className="text-[10px] text-steel mt-0.5">
                      {stat.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 2. Развернутый График во всю ширину */}
          {(activeTab === 'combined' || activeTab === 'chart') && (
            <div className="p-4 rounded-lg border border-hairline bg-canvas">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-steel flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Визуализация данных
                </span>
                <span className="text-[11px] text-steel">
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
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-steel" />
                  <input
                    type="text"
                    placeholder="Быстрый поиск в строках..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-full rounded-md bg-canvas border border-hairline px-2.5 py-1 text-xs text-foreground placeholder:text-steel focus:outline-none focus:border-primary pl-8 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-steel hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredData.length > 0 ? (
                <div className="rounded-md border border-hairline overflow-hidden bg-canvas">
                  <div className="overflow-x-auto max-h-[340px]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-surface border-b border-hairline text-steel font-medium z-10">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              className={`py-2 px-3 ${
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
                      <tbody className="divide-y divide-hairline-soft">
                        {filteredData.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-surface/60 transition-colors"
                          >
                            {columns.map((col) => (
                              <td
                                key={col.key}
                                className={`py-2 px-3 ${
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
                <div className="py-10 text-center text-xs text-steel border border-dashed border-hairline rounded-md">
                  {searchQuery ? 'По вашему запросу ничего не найдено' : 'Данные для отображения отсутствуют'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-hairline px-5 py-3 bg-surface flex items-center justify-between">
          <div className="text-[11px] text-steel flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            <span>Синхронизировано в реальном времени</span>
          </div>

          <div className="flex items-center gap-2">
            {tableData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-7 px-3 text-xs sm:hidden"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
            )}
            <Button
              onClick={onClose}
              size="sm"
              className="h-7 px-4 text-xs font-medium"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
