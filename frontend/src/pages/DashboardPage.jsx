import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Truck,
  Users,
  AlertTriangle,
  Layers,
  Printer,
  Download,
  DollarSign,
  GitBranch,
  BarChart3,
  Package,
  ArrowUpRight,
  ExternalLink,
  Calendar,
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
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  LabelList
} from 'recharts';
import { useChartTheme, NOTION_CHART_PALETTE } from '../lib/chartTheme';
import { StatCard } from '../components/common/StatCard';
import { ProcessGraph } from '../components/common/ProcessGraph';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { ChartDrilldownModal } from '../components/common/ChartDrilldownModal';
import { ChartMaximizeModal } from '../components/common/ChartMaximizeModal';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PrintHeader, PrintFooter } from '../components/common/PrintHeader';
import { api } from '../api/client';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';
import { exportToCsv, triggerPrint } from '../lib/exportUtils';

const CLIENT_COLORS = ['#5645d4', '#1aae39', '#dd5b00', '#0075de', '#7b3ff2', '#2a9d99'];

export function DashboardPage({ onNavigate }) {
  const chartTheme = useChartTheme();
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [mainView, setMainView] = useState('charts'); // 'charts' | 'process_graph'
  const [summary, setSummary] = useState(null);
  const [rawSales, setRawSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('cement'); // 'cement' | 'logistics'

  // Drilldown Modal
  const [drilldownData, setDrilldownData] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    stats: [],
    records: [],
    columns: []
  });

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

  // История
  const [historyTab, setHistoryTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [factories, setFactories] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [entityHistory, setEntityHistory] = useState(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const [res, salesRes] = await Promise.all([
        api.getDashboardSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }),
        api.getSales({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 300
        }).catch(() => ({ data: [] }))
      ]);
      setSummary(res);
      setRawSales(salesRes.data || []);
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    Promise.all([api.getClients(), api.getVehicles(), api.getFactories()])
      .then(([cRes, vRes, fRes]) => {
        setClients(cRes.data || []);
        setVehicles(vRes.data || []);
        setFactories(fRes.data || []);
        if (cRes.data?.length > 0) setSelectedEntityId(cRes.data[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedEntityId) return;
    let promise;
    if (historyTab === 'clients') promise = api.getClientHistory(selectedEntityId);
    else if (historyTab === 'vehicles') promise = api.getVehicleHistory(selectedEntityId);
    else if (historyTab === 'factories') promise = api.getFactoryHistory(selectedEntityId);

    promise?.then((data) => setEntityHistory(data)).catch(console.error);
  }, [historyTab, selectedEntityId]);

  // Данные для диаграммы заводов
  const cementFactoryData = (summary?.cementByFactory || []).map(f => ({
    name: f.factory_name.replace(' (Навои)', '').replace(' цементный завод', '').replace('цемент', ''),
    bulk: f.bulk_tonnage,
    bag: f.bag_tonnage,
    total: f.total_factory_tonnage,
    amount: f.total_cement_amount,
    rawName: f.factory_name
  }));

  // Данные для диаграммы логистики
  const logisticsVehicleData = (summary?.logisticsByVehicle || []).map(v => ({
    name: v.vehicle_number,
    revenue: v.total_revenue,
    tonnage: v.total_tonnage,
    trips: v.trips_count,
    model: v.vehicle_model
  }));

  // Данные для диаграммы топ-клиентов
  const topClientsData = (summary?.topClients || []).slice(0, 6).map((c, idx) => ({
    name: c.client_name.replace('ООО ', '').replace('ИП ', '').replace(/«|»/g, ''),
    fullName: c.client_name,
    tonnage: c.total_tonnage_bought,
    amount: c.total_sales_amount,
    profit: c.estimated_profit,
    fill: CLIENT_COLORS[idx % CLIENT_COLORS.length]
  }));

  // Данные таймлайна отгрузок
  const timelineData = summary?.salesTimeline?.length > 0 ? summary.salesTimeline : [
    { date: '2026-09-22', tonnage: summary?.turnover?.totalTonnage || 0, total_amount: summary?.turnover?.total || 0 }
  ];

  // ==================== DRILLDOWN ОБРАБОТЧИКИ ====================
  const salesColumns = [
    { key: 'date', label: 'Дата' },
    { key: 'client_name', label: 'Клиент' },
    { key: 'product_name', label: 'Товар / Марка' },
    { key: 'packaging_type', label: 'Тара', render: (v) => v === 'bulk' ? 'Навал' : v === 'bag' ? 'Мешок' : '—' },
    { key: 'tonnage', label: 'Тоннаж', align: 'right', render: (v) => `${formatNumber(v)} т` },
    { key: 'total_amount', label: 'Сумма', align: 'right', render: (v) => formatCurrency(v) },
    {
      key: 'payment_status',
      label: 'Статус',
      align: 'center',
      render: (v) => (
        <Badge variant={v === 'paid' ? 'mint' : v === 'debt' ? 'rose' : 'peach'} className="text-[10px]">
          {v === 'paid' ? 'Оплачено' : v === 'debt' ? 'В долг' : 'Частично'}
        </Badge>
      )
    }
  ];

  // Клик по точке динамики
  const handleTimelineClick = (point) => {
    if (!point || !point.activePayload) return;
    const item = point.activePayload[0]?.payload;
    if (!item) return;

    const matched = rawSales.filter(s => s.date === item.date);
    setDrilldownData({
      isOpen: true,
      title: `Отгрузки за ${formatDate(item.date)}`,
      subtitle: `Детализация всех сделок за выбранную дату`,
      stats: [
        { label: 'Выручка за день', value: formatCurrency(item.total_amount), color: 'text-emerald-500' },
        { label: 'Отгруженный объем', value: `${formatNumber(item.tonnage)} т`, color: 'text-amber-500' },
        { label: 'Количество сделок', value: `${matched.length} шт` },
        { label: 'Средний чек', value: matched.length ? formatCurrency(item.total_amount / matched.length) : '0 сум' }
      ],
      records: matched,
      columns: salesColumns
    });
  };

  // Клик по заводу
  const handleFactoryClick = (barData) => {
    if (!barData) return;
    const factoryName = barData.rawName || barData.name;
    const matched = rawSales.filter(s => s.factory_name && (s.factory_name.includes(barData.name) || s.factory_name === factoryName));

    setDrilldownData({
      isOpen: true,
      title: `Поставки завода: ${factoryName}`,
      subtitle: `Статистика отгрузок цемента, навал и тарированный цемент`,
      stats: [
        { label: 'Общий тоннаж', value: `${formatNumber(barData.total || 0)} т`, color: 'text-amber-500' },
        { label: 'Навал', value: `${formatNumber(barData.bulk || 0)} т`, color: 'text-orange-500' },
        { label: 'Мешки', value: `${formatNumber(barData.bag || 0)} т`, color: 'text-indigo-500' },
        { label: 'Выручка по заводу', value: formatCurrency(barData.amount || 0), color: 'text-emerald-500' }
      ],
      records: matched,
      columns: salesColumns
    });
  };

  // Клик по машине
  const handleVehicleClick = (vData) => {
    if (!vData) return;
    const matched = rawSales.filter(s => s.vehicle_number === vData.name || (s.vehicle_plate && s.vehicle_plate === vData.name));

    setDrilldownData({
      isOpen: true,
      title: `Рейсы машины: ${vData.name}`,
      subtitle: `Модель: ${vData.model || 'Тягач'} • Логистические рейсы и тоннаж`,
      stats: [
        { label: 'Выручка за доставку', value: formatCurrency(vData.revenue || 0), color: 'text-blue-500' },
        { label: 'Перевезено', value: `${formatNumber(vData.tonnage || 0)} т`, color: 'text-amber-500' },
        { label: 'Количество рейсов', value: `${vData.trips || matched.length} рейсов` }
      ],
      records: matched,
      columns: salesColumns
    });
  };

  // Клик по клиенту
  const handleClientClick = (cData) => {
    if (!cData) return;
    const clientName = cData.fullName || cData.name;
    const matched = rawSales.filter(s => s.client_name && (s.client_name.includes(cData.name) || s.client_name === clientName));

    setDrilldownData({
      isOpen: true,
      title: `Клиент: ${clientName}`,
      subtitle: `История закупленного цемента и расчетная прибыль`,
      stats: [
        { label: 'Сумма покупок', value: formatCurrency(cData.amount || 0), color: 'text-emerald-500' },
        { label: 'Объем цемента', value: `${formatNumber(cData.tonnage || 0)} т`, color: 'text-amber-500' },
        { label: 'Маржинальная прибыль', value: formatCurrency(cData.profit || 0), color: 'text-teal-500' },
        { label: 'Количество отгрузок', value: `${matched.length} сделок` }
      ],
      records: matched,
      columns: salesColumns
    });
  };

  // Клик по категории оборота (Цемент / Логистика / Навал / Мешок)
  const handleTurnoverCategoryClick = (category) => {
    let matched = [];
    let title = '';
    let stats = [];

    if (category === 'cement') {
      matched = rawSales.filter(s => s.sale_type === 'cement' || s.cement_amount > 0);
      title = 'Оборот: Продажи цемента';
      stats = [
        { label: 'Выручка от цемента', value: formatCurrency(summary?.turnover?.cement || 0), color: 'text-amber-500' },
        { label: 'Реализованный объем', value: `${formatNumber(summary?.turnover?.totalTonnage || 0)} т`, color: 'text-amber-500' },
        { label: 'Сделок', value: `${matched.length} шт` }
      ];
    } else if (category === 'logistics') {
      matched = rawSales.filter(s => s.logistics_amount > 0);
      title = 'Оборот: Логистика и доставка';
      stats = [
        { label: 'Выручка за логистику', value: formatCurrency(summary?.turnover?.logistics || 0), color: 'text-blue-500' },
        { label: 'Рейсов с доставкой', value: `${matched.length} рейсов` }
      ];
    } else if (category === 'bulk') {
      matched = rawSales.filter(s => s.packaging_type === 'bulk');
      title = 'Оборот: Навальный цемент';
      stats = [
        { label: 'Объем навала', value: `${formatNumber(summary?.turnover?.bulkTonnage || 0)} т`, color: 'text-orange-500' },
        { label: 'Отгрузок навалом', value: `${matched.length} шт` }
      ];
    } else if (category === 'bag') {
      matched = rawSales.filter(s => s.packaging_type === 'bag');
      title = 'Оборот: Тарированный цемент (Мешки)';
      stats = [
        { label: 'Объем в мешках', value: `${formatNumber(summary?.turnover?.bagTonnage || 0)} т`, color: 'text-indigo-500' },
        { label: 'Отгрузок в мешках', value: `${matched.length} шт` }
      ];
    }

    setDrilldownData({
      isOpen: true,
      title,
      subtitle: 'Подробный список операций выбранной категории',
      stats,
      records: matched,
      columns: salesColumns
    });
  };

  // ==================== MAXIMIZE ELEMENT HANDLERS ====================
  const handleMaximizeTimeline = () => {
    const totalRev = summary?.turnover?.total || 0;
    const totalTon = summary?.turnover?.totalTonnage || 0;
    const peakDay = [...timelineData].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))[0] || { date: '—', total_amount: 0, tonnage: 0 };
    const avgDailyRev = timelineData.length ? Math.round(totalRev / timelineData.length) : 0;
    const avgDailyTon = timelineData.length ? (totalTon / timelineData.length).toFixed(1) : 0;

    const tableRows = timelineData.map(d => ({
      date: d.date,
      total_amount: d.total_amount,
      tonnage: d.tonnage,
      share: totalRev ? ((d.total_amount / totalRev) * 100).toFixed(1) : 0,
      dealsCount: rawSales.filter(s => s.date === d.date).length
    }));

    setMaximizeModal({
      isOpen: true,
      title: 'Динамика отгрузок и выручки предприятия',
      subtitle: `Период: ${dateRange.startDate ? formatDate(dateRange.startDate) : 'Все время'} ${dateRange.endDate ? `— ${formatDate(dateRange.endDate)}` : ''} • Временной ряд с распределением выручки и тоннажа`,
      stats: [
        { label: 'Общая выручка', value: formatCurrency(totalRev), color: 'text-emerald-500', desc: 'Суммарный объем продаж' },
        { label: 'Отгруженный тоннаж', value: `${formatNumber(totalTon)} т`, color: 'text-amber-500', desc: 'Суммарный вес цемента' },
        { label: 'Пиковый день', value: formatDate(peakDay.date), color: 'text-primary', desc: `${formatCurrency(peakDay.total_amount)} (${formatNumber(peakDay.tonnage)} т)` },
        { label: 'Среднедневно', value: formatCurrency(avgDailyRev), color: 'text-foreground', desc: `~${avgDailyTon} тонн в сутки` }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="maxAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
            <YAxis yAxisId="amount" orientation="left" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
            <YAxis yAxisId="tonnage" orientation="right" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${v}т`} />
            <Tooltip
              formatter={(val, name) => [
                name === 'total_amount' ? formatCurrency(val) : `${formatNumber(val)} т`,
                name === 'total_amount' ? 'Выручка' : 'Тоннаж'
              ]}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
            <Area yAxisId="amount" type="monotone" dataKey="total_amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#maxAmount)" name="total_amount" />
            <Area yAxisId="tonnage" type="monotone" dataKey="tonnage" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5" fillOpacity={0} name="tonnage" />
          </AreaChart>
        </ResponsiveContainer>
      ),
      tableData: tableRows,
      columns: [
        { key: 'date', label: 'Дата отгрузки', render: (v) => formatDate(v) },
        { key: 'total_amount', label: 'Выручка (сум)', align: 'right', render: (v) => <span className="font-bold text-emerald-500">{formatCurrency(v)}</span> },
        { key: 'tonnage', label: 'Тоннаж', align: 'right', render: (v) => <span className="font-bold text-amber-500">{formatNumber(v)} т</span> },
        { key: 'dealsCount', label: 'Сделок', align: 'center', render: (v) => `${v} шт` },
        { key: 'share', label: 'Доля в периоде', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> }
      ]
    });
  };

  const handleMaximizeTurnover = () => {
    const totalRev = summary?.turnover?.total || 1;
    const cementRev = summary?.turnover?.cement || 0;
    const logRev = summary?.turnover?.logistics || 0;
    const bulkTon = summary?.turnover?.bulkTonnage || 0;
    const bagTon = summary?.turnover?.bagTonnage || 0;
    const totalTon = summary?.turnover?.totalTonnage || 0;

    const rows = [
      { category: 'Цемент навалом (Хопперы / Автоцистерны)', type: 'bulk', tonnage: bulkTon, shareTon: totalTon ? ((bulkTon / totalTon) * 100).toFixed(1) : 0, status: 'Крупнооптовые поставки' },
      { category: 'Цемент тарированный (Мешки 50 кг)', type: 'bag', tonnage: bagTon, shareTon: totalTon ? ((bagTon / totalTon) * 100).toFixed(1) : 0, status: 'Розничный / Мелкий опт' },
      { category: 'Логистика и доставка (Автопарк)', type: 'logistics', tonnage: '—', shareTon: '—', revenue: logRev, shareRev: `${logisticsShare}%`, status: 'Собственный и наемный транспорт' }
    ];

    setMaximizeModal({
      isOpen: true,
      title: 'Полная структура товарооборота и направлений',
      subtitle: 'Комплексный анализ выручки по цементу, логистике, навальной и фасованной продукции',
      stats: [
        { label: 'Совокупный оборот', value: formatCurrency(totalRev), color: 'text-foreground', desc: '100% выручки' },
        { label: 'Цементная выручка', value: formatCurrency(cementRev), color: 'text-amber-500', desc: `${cementShare}% от оборота` },
        { label: 'Транспортные услуги', value: formatCurrency(logRev), color: 'text-blue-500', desc: `${logisticsShare}% от оборота` },
        { label: 'Соотношение Навал/Мешок', value: `${formatNumber(bulkTon)} / ${formatNumber(bagTon)} т`, color: 'text-indigo-500', desc: 'Структура фасовки' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: 'Цемент навал', tonnage: bulkTon, fill: '#f97316' },
            { name: 'Цемент мешки', tonnage: bagTon, fill: '#6366f1' },
            { name: 'Всего цемент', tonnage: totalTon, fill: '#10b981' }
          ]} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
            <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${v}т`} />
            <Tooltip
              formatter={(val) => [`${formatNumber(val)} тонн`, 'Объем']}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
            <Bar dataKey="tonnage" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="tonnage" position="top" formatter={(val) => `${formatNumber(val)} т`} style={{ fontSize: '11px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
              <Cell fill="#f97316" />
              <Cell fill="#6366f1" />
              <Cell fill="#10b981" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
      tableData: rows,
      columns: [
        { key: 'category', label: 'Категория оборота', render: (v) => <span className="font-semibold text-foreground">{v}</span> },
        { key: 'tonnage', label: 'Тоннаж', align: 'right', render: (v) => v !== '—' ? `${formatNumber(v)} т` : '—' },
        { key: 'shareTon', label: 'Доля в тоннаже', align: 'right', render: (v) => v !== '—' ? `${v}%` : '—' },
        { key: 'status', label: 'Примечание / Сегмент', render: (v) => <span className="text-muted-foreground">{v}</span> }
      ]
    });
  };

  const handleMaximizeFactoriesLogistics = () => {
    if (chartView === 'cement') {
      const totalFacTon = cementFactoryData.reduce((acc, f) => acc + (f.total || 0), 0);
      const totalFacAmount = cementFactoryData.reduce((acc, f) => acc + (f.amount || 0), 0);
      const topFac = [...cementFactoryData].sort((a, b) => (b.total || 0) - (a.total || 0))[0] || { name: '—', total: 0 };

      setMaximizeModal({
        isOpen: true,
        title: 'Аналитика отгрузок по заводам-производителям',
        subtitle: 'Полное распределение объемов навала и тары по каждому партнерскому цементному заводу',
        stats: [
          { label: 'Всего заводов', value: `${cementFactoryData.length} завода`, color: 'text-foreground', desc: 'Активные поставщики' },
          { label: 'Общий тоннаж', value: `${formatNumber(totalFacTon)} т`, color: 'text-amber-500', desc: 'Совокупный объем' },
          { label: 'Выручка по заводам', value: formatCurrency(totalFacAmount), color: 'text-emerald-500', desc: 'Суммарные продажи' },
          { label: 'Лидер поставок', value: topFac.name, color: 'text-primary', desc: `${formatNumber(topFac.total)} т` }
        ],
        renderChart: () => (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cementFactoryData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${v}т`} />
              <Tooltip
                formatter={(val, name) => [`${formatNumber(val)} т`, name === 'bulk' ? 'Навал' : 'Мешки']}
                contentStyle={chartTheme.tooltipStyle}
                itemStyle={chartTheme.tooltipItemStyle}
                labelStyle={chartTheme.tooltipLabelStyle}
              />
              <Legend verticalAlign="top" align="right" height={36} formatter={(v) => v === 'bulk' ? 'Навал (Оранжевый)' : 'Мешки (Индиго)'} />
              <Bar dataKey="bulk" name="bulk" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="bag" name="bag" stackId="a" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ),
        tableData: cementFactoryData.map(f => ({
          ...f,
          share: totalFacTon ? ((f.total / totalFacTon) * 100).toFixed(1) : 0
        })),
        columns: [
          { key: 'rawName', label: 'Цементный завод', render: (v, r) => <span className="font-semibold text-foreground">{v || r.name}</span> },
          { key: 'bulk', label: 'Навал (т)', align: 'right', render: (v) => <span className="text-orange-500 font-bold">{formatNumber(v)} т</span> },
          { key: 'bag', label: 'Мешки (т)', align: 'right', render: (v) => <span className="text-indigo-500 font-bold">{formatNumber(v)} т</span> },
          { key: 'total', label: 'Всего тоннаж', align: 'right', render: (v) => <span className="text-amber-500 font-bold">{formatNumber(v)} т</span> },
          { key: 'amount', label: 'Выручка (сум)', align: 'right', render: (v) => <span className="text-emerald-500 font-bold">{formatCurrency(v)}</span> },
          { key: 'share', label: 'Доля в объеме', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> }
        ]
      });
    } else {
      const totalVehTon = logisticsVehicleData.reduce((acc, v) => acc + (v.tonnage || 0), 0);
      const totalVehRev = logisticsVehicleData.reduce((acc, v) => acc + (v.revenue || 0), 0);
      const totalTrips = logisticsVehicleData.reduce((acc, v) => acc + (v.trips || 0), 0);
      const topVeh = [...logisticsVehicleData].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0] || { name: '—', revenue: 0 };

      setMaximizeModal({
        isOpen: true,
        title: 'Эффективность и выручка автопарка',
        subtitle: 'Статистика рейсов, перевозок и транспортной выручки по тягачам и цементовозам',
        stats: [
          { label: 'Транспортных средств', value: `${logisticsVehicleData.length} ед.`, color: 'text-foreground', desc: 'Автопарк' },
          { label: 'Совокупная выручка', value: formatCurrency(totalVehRev), color: 'text-blue-500', desc: 'Доставка' },
          { label: 'Всего перевезено', value: `${formatNumber(totalVehTon)} т`, color: 'text-amber-500', desc: 'Масса груза' },
          { label: 'Всего рейсов', value: `${totalTrips} рейсов`, color: 'text-primary', desc: `Лидер: ${topVeh.name}` }
        ],
        renderChart: () => (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={logisticsVehicleData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(val) => [formatCurrency(val), 'Выручка']}
                contentStyle={chartTheme.tooltipStyle}
                itemStyle={chartTheme.tooltipItemStyle}
                labelStyle={chartTheme.tooltipLabelStyle}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="revenue" position="top" formatter={(val) => `${(val/1000000).toFixed(1)}M`} style={{ fontSize: '10px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ),
        tableData: logisticsVehicleData,
        columns: [
          { key: 'name', label: 'Госномер', render: (v) => <span className="font-bold text-foreground">{v}</span> },
          { key: 'model', label: 'Модель / Тип', render: (v) => <span className="text-muted-foreground">{v || 'Цементовоз'}</span> },
          { key: 'trips', label: 'Рейсов', align: 'center', render: (v) => `${v} рейсов` },
          { key: 'tonnage', label: 'Перевезено', align: 'right', render: (v) => <span className="text-amber-500 font-bold">{formatNumber(v)} т</span> },
          { key: 'revenue', label: 'Выручка (сум)', align: 'right', render: (v) => <span className="text-blue-500 font-bold">{formatCurrency(v)}</span> }
        ]
      });
    }
  };

  const handleMaximizeTopClients = () => {
    const allClients = summary?.topClients || [];
    const totalBought = allClients.reduce((acc, c) => acc + (c.total_tonnage_bought || 0), 0);
    const totalAmount = allClients.reduce((acc, c) => acc + (c.total_sales_amount || 0), 0);
    const totalProfit = allClients.reduce((acc, c) => acc + (c.estimated_profit || 0), 0);
    const topClient = allClients[0] || { client_name: '—', total_tonnage_bought: 0 };

    setMaximizeModal({
      isOpen: true,
      title: 'Рейтинг ключевых клиентов предприятия',
      subtitle: 'Ранжирование покупателей по общему тоннажу закупки, объему выручки и маржинальной прибыли',
      stats: [
        { label: 'Ключевых контрагентов', value: `${allClients.length} клиентов`, color: 'text-foreground', desc: 'В активной базе' },
        { label: 'Общий тоннаж топа', value: `${formatNumber(totalBought)} т`, color: 'text-amber-500', desc: 'Суммарный объем' },
        { label: 'Выручка от клиентов', value: formatCurrency(totalAmount), color: 'text-emerald-500', desc: 'Общая сумма' },
        { label: 'Маржинальная прибыль', value: formatCurrency(totalProfit), color: 'text-teal-500', desc: `Лидер: ${topClient.client_name}` }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topClientsData} layout="vertical" margin={{ top: 10, right: 40, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridColor} opacity={0.6} />
            <XAxis type="number" tick={{ fontSize: 11, fill: chartTheme.textColor }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: chartTheme.dataTextColor }} width={120} />
            <Tooltip
              formatter={(val) => [`${formatNumber(val)} тонн`, 'Объем']}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
            <Bar dataKey="tonnage" radius={[0, 8, 8, 0]}>
              <LabelList dataKey="tonnage" position="right" formatter={(val) => `${formatNumber(val)} т`} style={{ fontSize: '11px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
              {topClientsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
      tableData: allClients.map(c => ({
        ...c,
        share: totalBought ? ((c.total_tonnage_bought / totalBought) * 100).toFixed(1) : 0
      })),
      columns: [
        { key: 'client_name', label: 'Контрагент / Компания', render: (v) => <span className="font-semibold text-foreground">{v}</span> },
        { key: 'total_tonnage_bought', label: 'Куплено цемента', align: 'right', render: (v) => <span className="font-bold text-amber-500">{formatNumber(v)} т</span> },
        { key: 'total_sales_amount', label: 'Сумма покупок', align: 'right', render: (v) => <span className="font-bold text-emerald-500">{formatCurrency(v)}</span> },
        { key: 'estimated_profit', label: 'Маржинальная прибыль', align: 'right', render: (v) => <span className="font-bold text-teal-500">{formatCurrency(v)}</span> },
        { key: 'share', label: 'Доля в объеме', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> }
      ]
    });
  };

  // Экспорт сводки в CSV
  const handleExportCsv = () => {
    const headers = ['Завод', 'Навал (т)', 'Мешки (т)', 'Всего (т)', 'Выручка (сум)'];
    const rows = (summary?.cementByFactory || []).map(f => [
      f.factory_name,
      f.bulk_tonnage,
      f.bag_tonnage,
      f.total_factory_tonnage,
      f.total_cement_amount
    ]);
    exportToCsv('erp_analytics', headers, rows);
  };

  const totalTurnover = summary?.turnover?.total || 1;
  const cementShare = Math.round(((summary?.turnover?.cement || 0) / totalTurnover) * 100);
  const logisticsShare = Math.round(((summary?.turnover?.logistics || 0) / totalTurnover) * 100);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <PrintHeader
        title="Сводный аналитический отчет"
        subtitle={`Период: ${dateRange.startDate ? `с ${formatDate(dateRange.startDate)}` : ''} ${dateRange.endDate ? `по ${formatDate(dateRange.endDate)}` : 'Все время'}`}
      />

      {/* Компактная шапка с режимом (Графики / Схема процессов) + Календарь фильтрации */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          {/* Режим отображения (Notion pill-tabs) */}
          <div className="inline-flex items-center gap-1.5">
            <button
              onClick={() => setMainView('charts')}
              className={`h-7 px-3 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1.5 ${
                mainView === 'charts'
                  ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                  : 'bg-transparent text-steel border-hairline hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Графики и Сводка</span>
            </button>
            <button
              onClick={() => setMainView('process_graph')}
              className={`h-7 px-3 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1.5 ${
                mainView === 'process_graph'
                  ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                  : 'bg-transparent text-steel border-hairline hover:text-foreground'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Схема процессов (Граф)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Фильтр с календарем (DateRangePicker) */}
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateChange={setDateRange}
          />

          <Button variant="outline" size="sm" onClick={triggerPrint} className="h-7 px-2.5 text-xs font-medium">
            <Printer className="h-3.5 w-3.5 mr-1" />
            Печать
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-7 px-2.5 text-xs font-medium">
            <Download className="h-3.5 w-3.5 mr-1" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* 4 ключевые KPI карточки с яркими различимыми акцентами */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => handleTurnoverCategoryClick('cement')}
          className="cursor-pointer group"
          title="Нажмите для детализации оборота"
        >
          <StatCard
            title="Общий оборот"
            value={formatCurrency(summary?.turnover?.total || 0)}
            subtitle={`Цемент: ${formatCurrency(summary?.turnover?.cement || 0)}`}
            icon={TrendingUp}
            iconBg="bg-tint-mint text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
          />
        </div>

        <div className="group">
          <StatCard
            title="Чистая прибыль"
            value={formatCurrency(summary?.profit?.total || 0)}
            subtitle={`Маржинальность: ${summary?.profit?.marginPercent || 0}%`}
            icon={DollarSign}
            iconBg="bg-tint-lavender text-primary border-primary/30"
          />
        </div>

        <div
          onClick={() => onNavigate('finances')}
          className="cursor-pointer group"
          title="Нажмите для перехода в кассу и долги"
        >
          <StatCard
            title="Дебиторка (Долги)"
            value={formatCurrency(summary?.debts?.totalDebt || 0)}
            subtitle={`${summary?.debts?.debtorsCount || 0} контрагентов в долгу`}
            icon={AlertTriangle}
            iconBg="bg-tint-rose text-destructive border-destructive/30"
          />
        </div>

        <div
          onClick={() => handleTurnoverCategoryClick('cement')}
          className="cursor-pointer group"
          title="Нажмите для детализации отгруженного цемента"
        >
          <StatCard
            title="Отгрузка цемента"
            value={`${formatNumber(summary?.turnover?.totalTonnage || 0)} т`}
            subtitle="Реализованный объем"
            icon={Layers}
            iconBg="bg-tint-peach text-brand-orange border-orange-500/30"
          />
        </div>
      </div>

      {/* ЕСЛИ ВЫБРАН ГРАФ БИЗНЕС-ПРОЦЕССОВ */}
      {mainView === 'process_graph' && (
        <ProcessGraph
          pipelineStats={summary?.pipelineStats}
          turnover={summary?.turnover}
          profit={summary?.profit}
          debts={summary?.debts}
          onNavigate={onNavigate}
        />
      )}

      {/* ОСНОВНЫЕ ГРАФИКИ И ДИАГРАММЫ (Скрываются при печати) */}
      {mainView === 'charts' && (
        <div className="space-y-4">
          {/* Секция 1: Динамика (Линии) + Структура оборота (Замена круговой диаграммы) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* График 1: Таймлайн отгрузок (AreaChart) с различимыми цветами */}
            <Card className="lg:col-span-8 border-border chart-card">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    Динамика отгрузок и выручки
                    <span className="text-[10px] text-muted-foreground font-normal">(кликните по точке для деталей)</span>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-muted-foreground">Выручка</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-muted-foreground">Тоннаж (т)</span>
                  </div>
                  <button
                    onClick={handleMaximizeTimeline}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors ml-1"
                    title="Развернуть график"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                <div className="h-56 w-full cursor-pointer">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timelineData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      onClick={handleTimelineClick}
                    >
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="amount" orientation="left" tick={{ fontSize: 10, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="tonnage" orientation="right" tick={{ fontSize: 10, fill: chartTheme.textColor }} tickFormatter={(v) => `${v}т`} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(val, name) => [
                          name === 'total_amount' ? formatCurrency(val) : `${formatNumber(val)} т`,
                          name === 'total_amount' ? 'Выручка' : 'Тоннаж'
                        ]}
                        contentStyle={chartTheme.tooltipStyle}
                        itemStyle={chartTheme.tooltipItemStyle}
                        labelStyle={chartTheme.tooltipLabelStyle}
                      />
                      <Area
                        yAxisId="amount"
                        type="monotone"
                        dataKey="total_amount"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        name="total_amount"
                      />
                      <Area
                        yAxisId="tonnage"
                        type="monotone"
                        dataKey="tonnage"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fillOpacity={0}
                        name="tonnage"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Замена круговой диаграммы: Структурированная шкала и карточки категорий оборота */}
            <Card className="lg:col-span-4 border-border chart-card flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Структура оборота</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {formatCurrency(summary?.turnover?.total || 0)}
                      </Badge>
                      <button
                        onClick={handleMaximizeTurnover}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                        title="Развернуть структуру оборота"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  {/* Горизонтальный сегментированный бар пропорций */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Цемент ({cementShare}%)</span>
                      <span>Логистика ({logisticsShare}%)</span>
                    </div>
                    <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex shadow-2xs">
                      <div
                        style={{ width: `${cementShare}%` }}
                        className="bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer"
                        title={`Цемент: ${formatCurrency(summary?.turnover?.cement || 0)}`}
                        onClick={() => handleTurnoverCategoryClick('cement')}
                      />
                      <div
                        style={{ width: `${logisticsShare}%` }}
                        className="bg-blue-500 hover:bg-blue-400 transition-all cursor-pointer"
                        title={`Логистика: ${formatCurrency(summary?.turnover?.logistics || 0)}`}
                        onClick={() => handleTurnoverCategoryClick('logistics')}
                      />
                    </div>
                  </div>

                  {/* Интерактивные плитки категорий с кликом для деталей */}
                  <div className="space-y-2 pt-1">
                    {/* 1. Цемент */}
                    <div
                      onClick={() => handleTurnoverCategoryClick('cement')}
                      className="p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                            Цемент
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatNumber(summary?.turnover?.totalTonnage || 0)} тонн
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-500">{formatCurrency(summary?.turnover?.cement || 0)}</div>
                        <span className="text-[10px] text-muted-foreground">{cementShare}% от выручки</span>
                      </div>
                    </div>

                    {/* 2. Логистика */}
                    <div
                      onClick={() => handleTurnoverCategoryClick('logistics')}
                      className="p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                            Логистика и доставка
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Собственный и наемный автопарк
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-500">{formatCurrency(summary?.turnover?.logistics || 0)}</div>
                        <span className="text-[10px] text-muted-foreground">{logisticsShare}% от выручки</span>
                      </div>
                    </div>

                    {/* Подкатегории: Навал vs Мешки */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div
                        onClick={() => handleTurnoverCategoryClick('bulk')}
                        className="p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-left transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                          Навал
                        </div>
                        <div className="text-[11px] font-bold text-orange-500 mt-0.5">
                          {formatNumber(summary?.turnover?.bulkTonnage || 0)} т
                        </div>
                      </div>

                      <div
                        onClick={() => handleTurnoverCategoryClick('bag')}
                        className="p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-left transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          Мешки
                        </div>
                        <div className="text-[11px] font-bold text-indigo-500 mt-0.5">
                          {formatNumber(summary?.turnover?.bagTonnage || 0)} т
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Кнопка "Сформировать отчет" */}
              <div className="p-4 pt-0">
                <Button
                  onClick={triggerPrint}
                  className="w-full h-8 rounded-xl text-xs font-medium"
                >
                  Сформировать сводный отчет
                </Button>
              </div>
            </Card>
          </div>

          {/* Секция 2: Заводы (Навал vs Мешки) и Топ клиентов с различимыми цветами */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* График 3: Столбчатая диаграмма заводов / машин */}
            <Card className="lg:col-span-7 border-border chart-card">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {chartView === 'cement' ? 'Отгрузка по заводам (т)' : 'Выручка автопарка (сум)'}
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Нажмите на столбец для просмотра накладных</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 no-print">
                    <button
                      onClick={() => setChartView('cement')}
                      className={`h-6 px-2.5 rounded-full text-xs font-medium border transition-all ${
                        chartView === 'cement'
                          ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                          : 'bg-transparent text-steel border-hairline hover:text-foreground'
                      }`}
                    >
                      Заводы
                    </button>
                    <button
                      onClick={() => setChartView('logistics')}
                      className={`h-6 px-2.5 rounded-full text-xs font-medium border transition-all ${
                        chartView === 'logistics'
                          ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                          : 'bg-transparent text-steel border-hairline hover:text-foreground'
                      }`}
                    >
                      Машины
                    </button>
                  </div>
                  <button
                    onClick={handleMaximizeFactoriesLogistics}
                    className="p-1 rounded-md text-steel hover:text-foreground hover:bg-surface transition-colors no-print"
                    title="Развернуть график заводов и автопарка"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                <div className="h-56 w-full cursor-pointer">
                  {chartView === 'cement' ? (
                    cementFactoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={cementFactoryData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          onClick={(e) => e && e.activePayload && handleFactoryClick(e.activePayload[0]?.payload)}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(val, name) => [`${formatNumber(val)} т`, name === 'bulk' ? 'Навал' : 'Мешки']}
                            contentStyle={chartTheme.tooltipStyle}
                            itemStyle={chartTheme.tooltipItemStyle}
                            labelStyle={chartTheme.tooltipLabelStyle}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            height={24}
                            formatter={(v) => (v === 'bulk' ? 'Навал (Оранжевый)' : 'Мешки (Индиго)')}
                          />
                          <Bar dataKey="bulk" name="bulk" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="bag" name="bag" stackId="a" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Нет данных</div>
                    )
                  ) : (
                    logisticsVehicleData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={logisticsVehicleData}
                          margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                          onClick={(e) => e && e.activePayload && handleVehicleClick(e.activePayload[0]?.payload)}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(val) => [formatCurrency(val), 'Выручка']}
                            contentStyle={chartTheme.tooltipStyle}
                            itemStyle={chartTheme.tooltipItemStyle}
                            labelStyle={chartTheme.tooltipLabelStyle}
                          />
                          <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                            <LabelList dataKey="revenue" position="top" formatter={(val) => `${(val/1000000).toFixed(1)}M`} style={{ fontSize: '10px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Рейсов не зафиксировано</div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* График 4: Топ клиентов по закупкам (разноцветные столбцы) */}
            <Card className="lg:col-span-5 border-border chart-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Объем отгрузок по клиентам (т)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-normal">кликните для карточки</span>
                    <button
                      onClick={handleMaximizeTopClients}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                      title="Развернуть рейтинг клиентов"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="h-56 w-full cursor-pointer">
                  {topClientsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topClientsData}
                        layout="vertical"
                        margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                        onClick={(e) => e && e.activePayload && handleClientClick(e.activePayload[0]?.payload)}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridColor} opacity={0.6} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: chartTheme.dataTextColor }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip
                          formatter={(val) => [`${formatNumber(val)} т`, 'Объем']}
                          contentStyle={chartTheme.tooltipStyle}
                          itemStyle={chartTheme.tooltipItemStyle}
                          labelStyle={chartTheme.tooltipLabelStyle}
                        />
                        <Bar dataKey="tonnage" radius={[0, 6, 6, 0]}>
                          <LabelList dataKey="tonnage" position="right" formatter={(val) => `${formatNumber(val)} т`} style={{ fontSize: '10px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
                          {topClientsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Нет данных</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Секция «История»: Компактный журнал */}
          <Card className="border-border">
            <CardHeader className="p-3.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">История операций и аналитика сущностей</CardTitle>
                <Badge variant="outline" className="text-[10px]">Журнал</Badge>
              </div>

              {/* Табы сущностей */}
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border border-border bg-muted p-0.5 text-xs">
                  <button
                    onClick={() => { setHistoryTab('clients'); setSelectedEntityId(clients[0]?.id || ''); }}
                    className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                      historyTab === 'clients' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Клиенты
                  </button>
                  <button
                    onClick={() => { setHistoryTab('factories'); setSelectedEntityId(factories[0]?.id || ''); }}
                    className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                      historyTab === 'factories' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Заводы
                  </button>
                  <button
                    onClick={() => { setHistoryTab('vehicles'); setSelectedEntityId(vehicles[0]?.id || ''); }}
                    className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                      historyTab === 'vehicles' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Машины
                  </button>
                </div>

                {/* Селектор конкретного элемента */}
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px] truncate"
                >
                  {historyTab === 'clients' && clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {historyTab === 'factories' && factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  {historyTab === 'vehicles' && vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} ({v.model})</option>)}
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 px-2">Дата</th>
                      <th className="py-2 px-2">{historyTab === 'clients' ? 'Сделка' : historyTab === 'vehicles' ? 'Клиент' : 'Товар'}</th>
                      <th className="py-2 px-2 text-right">Объем</th>
                      <th className="py-2 px-2 text-right">Сумма</th>
                      <th className="py-2 px-2 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyTab === 'clients' && entityHistory?.sales?.map(s => (
                      <tr key={s.id} className="hover:bg-muted/50">
                        <td className="py-2 px-2 text-muted-foreground">{formatDate(s.date)}</td>
                        <td className="py-2 px-2 font-medium">{s.sale_number} ({s.product_name || 'Логистика'})</td>
                        <td className="py-2 px-2 text-right">{formatNumber(s.tonnage)} т</td>
                        <td className="py-2 px-2 text-right font-semibold">{formatCurrency(s.total_amount)}</td>
                        <td className="py-2 px-2 text-center">
                          {s.payment_status === 'paid' && <Badge variant="outline">Оплачено</Badge>}
                          {s.payment_status === 'debt' && <Badge variant="destructive">В долг</Badge>}
                          {s.payment_status === 'partial' && <Badge variant="secondary">Частично</Badge>}
                        </td>
                      </tr>
                    ))}

                    {historyTab === 'vehicles' && entityHistory?.shipments?.map(s => (
                      <tr key={s.id} className="hover:bg-muted/50">
                        <td className="py-2 px-2 text-muted-foreground">{formatDate(s.date)}</td>
                        <td className="py-2 px-2 font-medium">{s.client_name}</td>
                        <td className="py-2 px-2 text-right">{formatNumber(s.tonnage)} т</td>
                        <td className="py-2 px-2 text-right font-semibold">{formatCurrency(s.logistics_amount)}</td>
                        <td className="py-2 px-2 text-center"><Badge variant="outline">Рейс</Badge></td>
                      </tr>
                    ))}

                    {historyTab === 'factories' && entityHistory?.arrivals?.map(a => (
                      <tr key={a.id} className="hover:bg-muted/50">
                        <td className="py-2 px-2 text-muted-foreground">{formatDate(a.date)}</td>
                        <td className="py-2 px-2 font-medium">{a.product_name}</td>
                        <td className="py-2 px-2 text-right">{formatNumber(a.tonnage)} т</td>
                        <td className="py-2 px-2 text-right font-semibold">{formatCurrency(a.total_amount)}</td>
                        <td className="py-2 px-2 text-center"><Badge variant="outline">Приход</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ОФИЦИАЛЬНАЯ ПЕЧАТНАЯ ТАБЛИЦА (Видна ТОЛЬКО при печати вместо графиков) */}
      <div className="print-only hidden space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black">Сводка по отгрузкам цемента с заводов</h3>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th>Завод</th>
              <th className="text-right">Навал (т)</th>
              <th className="text-right">Мешки (т)</th>
              <th className="text-right">Всего (т)</th>
              <th className="text-right">Выручка (сум)</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.cementByFactory || []).map((f, i) => (
              <tr key={i}>
                <td>{f.factory_name}</td>
                <td className="text-right">{formatNumber(f.bulk_tonnage)}</td>
                <td className="text-right">{formatNumber(f.bag_tonnage)}</td>
                <td className="text-right font-bold">{formatNumber(f.total_factory_tonnage)}</td>
                <td className="text-right font-bold">{formatCurrency(f.total_cement_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PrintFooter />

      {/* Модальное окно детализации выбранного графика (Drill-Down) */}
      <ChartDrilldownModal
        isOpen={drilldownData.isOpen}
        onClose={() => setDrilldownData(prev => ({ ...prev, isOpen: false }))}
        title={drilldownData.title}
        subtitle={drilldownData.subtitle}
        stats={drilldownData.stats}
        records={drilldownData.records}
        columns={drilldownData.columns}
      />

      {/* Модальное окно полного разворачивания графика (Maximize Full Card) */}
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
    </div>
  );
}
