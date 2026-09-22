import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Check } from 'lucide-react';
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

  // Закрытие при клике вне попапа
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

  // Текст на кнопке
  const getButtonLabel = () => {
    if (!startDate && !endDate) return 'Период: Все время';
    const today = toISO(new Date());
    if (startDate === today && endDate === today) return 'Период: Сегодня';

    const dWeek = new Date();
    dWeek.setDate(dWeek.getDate() - 7);
    if (startDate === toISO(dWeek) && endDate === today) return 'Период: 7 дней';

    const dMonth = new Date();
    dMonth.setMonth(dMonth.getMonth() - 1);
    if (startDate === toISO(dMonth) && endDate === today) return 'Период: Месяц';

    if (startDate && endDate) return `${formatDate(startDate)} — ${formatDate(endDate)}`;
    if (startDate) return `с ${formatDate(startDate)}`;
    if (endDate) return `по ${formatDate(endDate)}`;
    return 'Календарь';
  };

  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Кнопка вызова календаря */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
          hasFilter
            ? 'bg-primary/15 border-primary/40 text-foreground'
            : 'bg-card border-border hover:bg-muted text-foreground'
        }`}
      >
        <Calendar className={`h-3.5 w-3.5 ${hasFilter ? 'text-primary' : 'text-muted-foreground'}`} />
        <span>{getButtonLabel()}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Выпадающее меню календаря */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 rounded-2xl bg-card border border-border p-3.5 shadow-2xl z-40 text-card-foreground animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Выбор периода
            </span>
            {hasFilter && (
              <button
                onClick={handleReset}
                className="text-[11px] text-destructive hover:underline"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Быстрые пресеты */}
          <div className="grid grid-cols-2 gap-1.5 py-2.5">
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-muted/70 text-foreground transition-colors font-medium"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => handlePreset('week')}
              className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-muted/70 text-foreground transition-colors font-medium"
            >
              Последние 7 дней
            </button>
            <button
              type="button"
              onClick={() => handlePreset('month')}
              className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-muted/70 text-foreground transition-colors font-medium"
            >
              Текущий месяц
            </button>
            <button
              type="button"
              onClick={() => handlePreset('all')}
              className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-muted/70 text-foreground transition-colors font-medium"
            >
              Все время
            </button>
          </div>

          {/* Выбор точных дат */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Точные даты
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground w-8">От:</span>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground w-8">До:</span>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleApplyCustom}
                className="w-full h-7 text-xs font-medium"
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
