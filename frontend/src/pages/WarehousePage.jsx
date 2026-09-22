import React, { useState, useEffect } from 'react';
import {
  Package,
  Ticket,
  ArrowDownToLine,
  RotateCcw,
  History,
  AlertTriangle,
  Printer,
  Download,
  CheckCircle2,
  Boxes,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PrintHeader, PrintFooter } from '../components/common/PrintHeader';
import { ChartMaximizeModal } from '../components/common/ChartMaximizeModal';
import { api } from '../api/client';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';
import { exportToCsv, triggerPrint } from '../lib/exportUtils';

export function WarehousePage({ onNavigateToArrivals }) {
  const [viewMode, setViewMode] = useState('stocks'); // 'stocks' | 'tickets' | 'movements'
  const [stocks, setStocks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Maximize Full Element Modal
  const [maximizeModal, setMaximizeModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    stats: [],
    renderChart: null,
    tableData: [],
    columns: []
  });

  // Возврат тикета
  const [returnTicketModal, setReturnTicketModal] = useState(null);
  const [returnComment, setReturnComment] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stocksRes, ticketsRes, movementsRes] = await Promise.all([
        api.getStocks(),
        api.getTickets(),
        api.getStockMovements()
      ]);
      setStocks(stocksRes.data || []);
      setTickets(ticketsRes.data || []);
      setMovements(movementsRes.data || []);
    } catch (err) {
      console.error('Ошибка загрузки склада:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmReturn = async () => {
    if (!returnTicketModal) return;
    try {
      setSubmittingReturn(true);
      setActionError(null);
      const res = await api.returnTicket(returnTicketModal.id, returnComment);
      setActionSuccess(`Успех: ${res.message}. Средства зачислены на брокерский счет.`);
      setReturnTicketModal(null);
      setReturnComment('');
      loadData();
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      setActionError(err.message || 'Не удалось выполнить возврат тикета');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Экспорт в Excel / CSV
  const handleExportCsv = () => {
    if (viewMode === 'stocks') {
      const headers = ['Наименование', 'Категория', 'Марка', 'Завод', 'Фасовка', 'Ед.изм', 'Текущий остаток', 'Мин. запас', 'Закупка (сум)', 'Продажа (сум)'];
      const rows = stocks.map(s => [
        s.name,
        s.category,
        s.cement_grade || '—',
        s.factory_name || '—',
        s.packaging_type === 'bulk' ? 'Навал' : s.packaging_type === 'bag' ? 'Мешок' : '—',
        s.unit,
        s.current_stock,
        s.min_stock_alert,
        s.purchase_price,
        s.selling_price
      ]);
      exportToCsv('erp_sklad_ostatki', headers, rows);
    } else if (viewMode === 'tickets') {
      const headers = ['Номер тикета', 'Завод', 'Товар', 'Начальный объем (т)', 'Остаток квоты (т)', 'Цена за тонну', 'Остаток суммы (сум)', 'Статус'];
      const rows = tickets.map(t => [
        t.ticket_number,
        t.factory_name,
        t.product_name,
        t.initial_tonnage,
        t.remaining_tonnage,
        t.price_per_ton,
        t.remaining_amount,
        t.status
      ]);
      exportToCsv('erp_zavodskie_tikety', headers, rows);
    } else {
      const headers = ['Дата', 'Тип движения', 'Товар', 'Количество', 'Сумма', 'Машина', 'Комментарий'];
      const rows = movements.map(m => [
        m.date,
        m.movement_type === 'in' ? 'Приход' : 'Списание',
        m.product_name,
        m.quantity,
        m.total_price,
        m.vehicle_number || '',
        m.comment || ''
      ]);
      exportToCsv('erp_sklad_dvizheniya', headers, rows);
    }
  };

  // График остатков цемента
  const stockLevelChartData = stocks
    .filter(s => s.category === 'cement')
    .map(s => ({
      name: `${s.cement_grade || ''} ${s.packaging_type === 'bulk' ? 'навал' : 'мешок'}`.trim() || s.name,
      stock: s.current_stock,
      min: s.min_stock_alert,
      factory: s.factory_name
    }));

  const stockCategoryData = [
    { name: 'Навал (т)', value: stocks.filter(s => s.category === 'cement' && s.packaging_type === 'bulk').reduce((a, b) => a + b.current_stock, 0), color: '#f97316' },
    { name: 'Мешки (т)', value: stocks.filter(s => s.category === 'cement' && s.packaging_type === 'bag').reduce((a, b) => a + b.current_stock, 0), color: '#6366f1' },
    { name: 'Тара (тыс. шт)', value: stocks.filter(s => s.category === 'packaging').reduce((a, b) => a + (b.current_stock / 1000), 0), color: '#06b6d4' },
    { name: 'Добавки (т)', value: stocks.filter(s => s.category === 'additive').reduce((a, b) => a + (b.current_stock / 1000), 0), color: '#10b981' }
  ].filter(d => d.value > 0);

  // ==================== MAXIMIZE HANDLERS ====================
  const handleMaximizeStockLevels = () => {
    const totalCementStock = stocks.filter(s => s.category === 'cement').reduce((a, b) => a + (b.current_stock || 0), 0);
    const deficitItems = stocks.filter(s => s.category === 'cement' && s.current_stock <= (s.min_stock_alert || 0));
    const topStockItem = [...stockLevelChartData].sort((a, b) => b.stock - a.stock)[0] || { name: '—', stock: 0 };
    const avgStock = stockLevelChartData.length ? Math.round(totalCementStock / stockLevelChartData.length) : 0;

    setMaximizeModal({
      isOpen: true,
      title: 'Контроль остатков цемента и критических порогов',
      subtitle: 'Сравнение текущих запасов силосов и складов с нормативными минимальными лимитами',
      stats: [
        { label: 'Всего цемента на складе', value: `${formatNumber(totalCementStock)} т`, color: 'text-sky-500', desc: 'Суммарный объем' },
        { label: 'Позиций в дефиците', value: `${deficitItems.length} марок`, color: deficitItems.length > 0 ? 'text-destructive' : 'text-emerald-500', desc: 'Ниже порога безопасности' },
        { label: 'Наибольший остаток', value: topStockItem.name, color: 'text-primary', desc: `${formatNumber(topStockItem.stock)} т` },
        { label: 'Средний остаток марки', value: `${formatNumber(avgStock)} т`, color: 'text-foreground', desc: 'На позицию' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockLevelChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}т`} />
            <Tooltip
              formatter={(val, name) => [`${formatNumber(val)} т`, name === 'stock' ? 'Остаток' : 'Мин. порог']}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
            />
            <Bar dataKey="stock" name="stock" fill="#0ea5e9" radius={[8, 8, 0, 0]}>
              {stockLevelChartData.map((entry, index) => (
                <Cell key={`cell-max-stock-${index}`} fill={entry.stock <= entry.min ? '#f43f5e' : '#0ea5e9'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
      tableData: stocks.filter(s => s.category === 'cement').map(s => ({
        ...s,
        deficit: s.current_stock <= (s.min_stock_alert || 0),
        freeSpace: Math.max(0, (s.min_stock_alert || 0) * 3 - s.current_stock)
      })),
      columns: [
        { key: 'name', label: 'Наименование / Марка', render: (v, r) => (
          <div>
            <span className="font-semibold text-foreground block">{v}</span>
            <span className="text-[10px] text-muted-foreground">{r.cement_grade || 'Стандарт'} • {r.packaging_type === 'bulk' ? 'Навал' : 'Мешки 50кг'}</span>
          </div>
        )},
        { key: 'factory_name', label: 'Завод-поставщик', render: (v) => <span className="text-muted-foreground">{v || '—'}</span> },
        { key: 'current_stock', label: 'Текущий запас', align: 'right', render: (v, r) => (
          <span className={`font-bold ${r.deficit ? 'text-destructive' : 'text-sky-500'}`}>
            {formatNumber(v)} {r.unit}
          </span>
        )},
        { key: 'min_stock_alert', label: 'Мин. порог', align: 'right', render: (v, r) => <span className="text-muted-foreground">{formatNumber(v)} {r.unit}</span> },
        { key: 'deficit', label: 'Статус безопасности', align: 'center', render: (v) => (
          <Badge variant={v ? 'destructive' : 'success'} className="text-[10px]">
            {v ? 'Требуется пополнение' : 'В норме'}
          </Badge>
        )}
      ]
    });
  };

  const handleMaximizeNomenclature = () => {
    const totalItems = stocks.length;
    const totalValuation = stocks.reduce((a, b) => a + ((b.current_stock || 0) * (b.sale_price || 0)), 0);

    const rows = stockCategoryData.map(c => {
      const catStocks = stocks.filter(s => {
        if (c.name.includes('Навал')) return s.category === 'cement' && s.packaging_type === 'bulk';
        if (c.name.includes('Мешки')) return s.category === 'cement' && s.packaging_type === 'bag';
        if (c.name.includes('Тара')) return s.category === 'packaging';
        if (c.name.includes('Добавки')) return s.category === 'additive';
        return false;
      });
      const sumVal = catStocks.reduce((a, b) => a + (b.current_stock * (b.sale_price || 0)), 0);
      return {
        categoryName: c.name,
        amountText: formatNumber(c.value),
        color: c.color,
        valuation: sumVal,
        itemsCount: catStocks.length
      };
    });

    setMaximizeModal({
      isOpen: true,
      title: 'Структура номенклатурных запасов склада',
      subtitle: 'Распределение складских остатков по категориям: навальный цемент, фасовка, тара и добавки',
      stats: [
        { label: 'Номенклатурных позиций', value: `${totalItems} позиций`, color: 'text-foreground', desc: 'В базе склада' },
        { label: 'Оценочная стоимость', value: formatCurrency(totalValuation), color: 'text-emerald-500', desc: 'По цене реализации' },
        { label: 'Навал цемент', value: `${formatNumber(stockCategoryData.find(d => d.name.includes('Навал'))?.value || 0)} т`, color: 'text-orange-500', desc: 'Силосный парк' },
        { label: 'Тарированный цемент', value: `${formatNumber(stockCategoryData.find(d => d.name.includes('Мешки'))?.value || 0)} т`, color: 'text-indigo-500', desc: 'Склад фасовки' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stockCategoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {stockCategoryData.map((entry, index) => (
                <Cell key={`cell-cat-max-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name, props) => [`${formatNumber(val)} (${props.payload.name})`, 'Объем']}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ),
      tableData: rows,
      columns: [
        { key: 'categoryName', label: 'Категория склада', render: (v, r) => (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="font-semibold text-foreground">{v}</span>
          </div>
        )},
        { key: 'amountText', label: 'Физический объем', align: 'right', render: (v) => <span className="font-bold text-foreground">{v}</span> },
        { key: 'itemsCount', label: 'Номенклатур', align: 'center', render: (v) => `${v} товаров` },
        { key: 'valuation', label: 'Оценочная стоимость', align: 'right', render: (v) => <span className="font-bold text-emerald-500">{formatCurrency(v)}</span> }
      ]
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <PrintHeader
        title="Складские остатки и квоты"
        subtitle={`На дату: ${new Date().toLocaleDateString('ru-RU')}`}
      />

      {/* Компактный заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 no-print">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Склад и Квоты
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="h-8 px-2.5 text-xs font-medium"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Печать
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 px-2.5 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Экспорт
          </Button>

          <Button
            size="sm"
            onClick={onNavigateToArrivals}
            className="h-8 px-2.5 text-xs font-medium"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
            Оприходовать
          </Button>
        </div>
      </div>

      {/* ГРАФИКИ СКЛАДА: Уровень запасов и Распределение номенклатуры (Скрыты при печати) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 no-print chart-card">
        {/* График 1: Остатки цемента по маркам против минимального запаса */}
        <Card className="lg:col-span-8 border-border">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Остатки цемента (т) vs Мин. порог</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                <span>Текущий остаток</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                <span>Мин. порог</span>
              </span>
              <button
                onClick={handleMaximizeStockLevels}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors ml-1"
                title="Развернуть график остатков цемента"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-44 w-full">
              {stockLevelChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockLevelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val, name) => [`${formatNumber(val)} т`, name === 'stock' ? 'Остаток' : 'Мин. запас']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                    <Bar dataKey="stock" name="stock" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                      {stockLevelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.stock <= entry.min ? '#f43f5e' : '#0ea5e9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Нет данных по цементу</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* График 2: Структура номенклатуры (Donut) */}
        <Card className="lg:col-span-4 border-border">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Номенклатура склада</span>
              <button
                onClick={handleMaximizeNomenclature}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                title="Развернуть структуру номенклатуры"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {stockCategoryData.length > 0 ? (
              <div className="h-44 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie
                      data={stockCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stockCategoryData.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatNumber(val)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] mt-1">
                  {stockCategoryData.map(item => (
                    <div key={item.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">Склад пуст</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="inline-flex items-center rounded-lg border border-border bg-muted p-1 text-muted-foreground text-xs no-print">
        <button
          onClick={() => setViewMode('stocks')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
            viewMode === 'stocks' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Остатки ({stocks.length})</span>
        </button>
        <button
          onClick={() => setViewMode('tickets')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
            viewMode === 'tickets' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          <Ticket className="h-3.5 w-3.5" />
          <span>Квоты / Тикеты ({tickets.filter(t => t.status === 'active').length})</span>
        </button>
        <button
          onClick={() => setViewMode('movements')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
            viewMode === 'movements' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Движения</span>
        </button>
      </div>

      {/* Alert Banners */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border text-foreground text-xs font-medium no-print">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium no-print">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 1. ФАКТИЧЕСКИЙ СКЛАД */}
      {viewMode === 'stocks' && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Номенклатура и остатки</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="py-2.5 px-3">Наименование</th>
                    <th className="py-2.5 px-2">Категория</th>
                    <th className="py-2.5 px-2">Завод</th>
                    <th className="py-2.5 px-2">Фасовка</th>
                    <th className="py-2.5 px-3 text-right">Остаток</th>
                    <th className="py-2.5 px-3 text-right">Закупка</th>
                    <th className="py-2.5 px-3 text-right">Продажа</th>
                    <th className="py-2.5 px-2 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stocks.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {item.name}
                        {item.cement_grade && (
                          <span className="ml-1 text-[11px] font-mono text-muted-foreground">
                            [{item.cement_grade}]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground">
                        {item.category === 'cement' ? 'Цемент' : item.category === 'packaging' ? 'Тара' : 'Добавки'}
                      </td>
                      <td className="py-2.5 px-2 text-foreground">
                        {item.factory_name || '—'}
                      </td>
                      <td className="py-2.5 px-2">
                        {item.packaging_type === 'bulk' ? (
                          <Badge variant="outline" className="text-[10px]">Навал</Badge>
                        ) : item.packaging_type === 'bag' ? (
                          <Badge variant="secondary" className="text-[10px]">Мешок</Badge>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        <span className={item.current_stock <= item.min_stock_alert ? 'text-destructive font-semibold' : ''}>
                          {formatNumber(item.current_stock)} {item.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {formatCurrency(item.purchase_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-foreground">
                        {formatCurrency(item.selling_price)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {item.current_stock <= item.min_stock_alert ? (
                          <Badge variant="destructive" className="text-[10px]">Мало</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Норма</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. ТИКЕТЫ (КВОТЫ С ВОЗВРАТОМ НА БРОКЕРСКИЙ СЧЕТ) */}
      {viewMode === 'tickets' && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Реестр квот (Тикеты)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="py-2.5 px-3">№ Тикета</th>
                    <th className="py-2.5 px-3">Завод</th>
                    <th className="py-2.5 px-3">Товар</th>
                    <th className="py-2.5 px-3 text-right">Начальный объем</th>
                    <th className="py-2.5 px-3 text-right">Остаток квоты</th>
                    <th className="py-2.5 px-3 text-right">Цена за тонну</th>
                    <th className="py-2.5 px-4 text-right">Остаток средств</th>
                    <th className="py-2.5 px-3 text-center">Статус</th>
                    <th className="py-2.5 px-3 text-center no-print">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {t.ticket_number}
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{t.factory_name}</td>
                      <td className="py-3 px-3 text-muted-foreground">{t.product_name}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{formatNumber(t.initial_tonnage)} т</td>
                      <td className="py-3 px-3 text-right font-bold text-foreground">{formatNumber(t.remaining_tonnage)} т</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{formatCurrency(t.price_per_ton)}</td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">{formatCurrency(t.remaining_amount)}</td>
                      <td className="py-3 px-3 text-center">
                        {t.status === 'active' && <Badge variant="outline">Активен</Badge>}
                        {t.status === 'completed' && <Badge variant="secondary">Отгружен</Badge>}
                        {t.status === 'returned' && <Badge variant="destructive">Возвращен</Badge>}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        {t.status === 'active' && t.remaining_tonnage > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReturnTicketModal(t);
                              setReturnComment('');
                            }}
                            className="h-7 px-2 text-xs font-medium border-border hover:bg-muted"
                            title="Вернуть остаток средств на брокерский счет"
                          >
                            <RotateCcw className="h-3 w-3 mr-1 text-muted-foreground" />
                            Возврат
                          </Button>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. ЖУРНАЛ ДВИЖЕНИЙ ПО СКЛАДУ */}
      {viewMode === 'movements' && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Журнал движений</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="py-2.5 px-3">Дата</th>
                    <th className="py-2.5 px-3">Тип</th>
                    <th className="py-2.5 px-3">Товар</th>
                    <th className="py-2.5 px-3 text-right">Количество</th>
                    <th className="py-2.5 px-3 text-right">Сумма</th>
                    <th className="py-2.5 px-3">Машина</th>
                    <th className="py-2.5 px-3">Примечание</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/50">
                      <td className="py-2 px-3 text-muted-foreground">{formatDate(m.date)}</td>
                      <td className="py-2 px-3">
                        {m.movement_type === 'in' ? (
                          <Badge variant="outline">Приход</Badge>
                        ) : (
                          <Badge variant="secondary">Списание</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium">{m.product_name}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {m.movement_type === 'in' ? '+' : '-'}{formatNumber(m.quantity)} {m.unit}
                      </td>
                      <td className="py-2 px-3 text-right">{formatCurrency(m.total_price)}</td>
                      <td className="py-2 px-3 font-mono">{m.vehicle_number || '—'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{m.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно возврата средств по тикету на брокерский счет */}
      <Modal
        isOpen={!!returnTicketModal}
        onClose={() => setReturnTicketModal(null)}
        title="Возврат остатка тикета на брокерский счет"
        description={`Тикет ${returnTicketModal?.ticket_number} (Завод: ${returnTicketModal?.factory_name})`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-muted text-xs space-y-1">
            <p className="font-semibold text-foreground">Параметры закрытия квоты:</p>
            <p className="text-muted-foreground">
              Неиспользованный остаток составляет <strong>{formatNumber(returnTicketModal?.remaining_tonnage)} т</strong>.
              Сумма возврата: <strong>{formatCurrency(returnTicketModal?.remaining_amount)}</strong> будет автоматически зачислена на баланс брокерского счета.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Основание возврата / Примечание
            </label>
            <textarea
              rows={2}
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="Причина возврата квоты..."
              className="w-full rounded-md border border-input bg-transparent p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setReturnTicketModal(null)}>
              Отмена
            </Button>
            <Button
              size="sm"
              isLoading={submittingReturn}
              onClick={handleConfirmReturn}
            >
              Подтвердить возврат
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно полного разворачивания элемента (Maximize Full Card) */}
      <ChartMaximizeModal
        isOpen={maximizeModal.isOpen}
        onClose={() => setMaximizeModal(prev => ({ ...prev, isOpen: false }))}
        title={maximizeModal.title}
        subtitle={maximizeModal.subtitle}
        stats={maximizeModal.stats}
        renderChart={maximizeModal.renderChart}
        tableData={maximizeModal.tableData}
        columns={maximizeModal.columns}
      />

      <PrintFooter />
    </div>
  );
}
