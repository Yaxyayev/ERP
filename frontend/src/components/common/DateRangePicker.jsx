import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/utils';

export function DateRangePicker({
  startDate = '',
  endDate = '',
  onDateChange,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const popoverRef = useRef(null);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      const d = toISO(today);
      onDateChange({ startDate: d, endDate: d });
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      onDateChange({ startDate: toISO(d), endDate: toISO(today) });
    } else if (preset === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      onDateChange({ startDate: toISO(d), endDate: toISO(today) });
    } else if (preset === 'all') {
      onDateChange({ startDate: '', endDate: '' });
    }
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    onDateChange({ startDate: tempStart, endDate: tempEnd });
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStart('');
    setTempEnd('');
    onDateChange({ startDate: '', endDate: '' });
    setIsOpen(false);
  };

  const getButtonLabel = () => {
    if (!startDate && !endDate) return 'Период: Все время';
    const today = toISO(new Date());
    if (startDate === today && endDate === today) return 'Сегодня';

    const dWeek = new Date();
    dWeek.setDate(dWeek.getDate() - 7);
    if (startDate === toISO(dWeek) && endDate === today) return '7 дней';

    const dMonth = new Date();
    dMonth.setMonth(dMonth.getMonth() - 1);
    if (startDate === toISO(dMonth) && endDate === today) return 'Месяц';

    if (startDate && endDate) return `${formatDate(startDate)} — ${formatDate(endDate)}`;
    if (startDate) return `с ${formatDate(startDate)}`;
    if (endDate) return `по ${formatDate(endDate)}`;
    return 'Период';
  };

  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
          hasFilter
            ? 'bg-[#5645d4]/10 border-[#5645d4]/40 text-[#5645d4]'
            : 'bg-surface border-hairline hover:border-hairline-strong text-foreground'
        }`}
      >
        <Calendar className={`h-3 w-3 ${hasFilter ? 'text-[#5645d4]' : 'text-muted-foreground'}`} />
        <span>{getButtonLabel()}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1 w-64 rounded-lg bg-card border border-hairline p-3 shadow-notion-dropdown z-40 text-card-foreground animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-[#5645d4]" />
              Период
            </span>
            {hasFilter && (
              <button
                onClick={handleReset}
                className="text-[11px] text-[#e03131] hover:underline cursor-pointer"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1 py-2">
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="px-2 py-1 text-xs text-left rounded-md hover:bg-surface text-foreground transition-colors font-medium cursor-pointer"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => handlePreset('week')}
              className="px-2 py-1 text-xs text-left rounded-md hover:bg-surface text-foreground transition-colors font-medium cursor-pointer"
            >
              7 дней
            </button>
            <button
              type="button"
              onClick={() => handlePreset('month')}
              className="px-2 py-1 text-xs text-left rounded-md hover:bg-surface text-foreground transition-colors font-medium cursor-pointer"
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => handlePreset('all')}
              className="px-2 py-1 text-xs text-left rounded-md hover:bg-surface text-foreground transition-colors font-medium cursor-pointer"
            >
              Все время
            </button>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-hairline">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] text-muted-foreground w-6">От:</span>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="flex-1 rounded-md border border-hairline bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-[#5645d4]"
              />
            </div>

            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] text-muted-foreground w-6">До:</span>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="flex-1 rounded-md border border-hairline bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-[#5645d4]"
              />
            </div>

            <div className="pt-1.5">
              <Button
                size="sm"
                onClick={handleApplyCustom}
                className="w-full h-[28px] text-xs font-medium"
              >
                <Check className="h-3 w-3 mr-1" />
                Применить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
