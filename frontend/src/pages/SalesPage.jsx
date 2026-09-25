import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Truck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  ShieldAlert,
  Search,
  Filter,
  X,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LabelList
} from 'recharts';
import { useChartTheme, NOTION_CHART_PALETTE } from '../lib/chartTheme';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PrintHeader, PrintFooter } from '../components/common/PrintHeader';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { ChartDrilldownModal } from '../components/common/ChartDrilldownModal';
import { ChartMaximizeModal } from '../components/common/ChartMaximizeModal';
import { api } from '../api/client';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';
import { exportToCsv, triggerPrint } from '../lib/exportUtils';

export function SalesPage() {
  const chartTheme = useChartTheme();
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Фильтрация
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Модалка оформления сделки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [saleType, setSaleType] = useState('cement'); // 'cement' | 'service_only'

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client_id: '',
    factory_id: '',
    product_id: '',
    packaging_type: 'bulk',
    tonnage: '',
    price_per_ton: '',
    cement_amount: 0,
    delivery_type: 'pickup',
    vehicle_id: '',
    vehicle_number: '',
    is_company_vehicle: 1,
    logistics_rate_per_ton: '',
    logistics_amount: 0,
    total_amount: 0,
    warehouse_source: 'warehouse',
    ticket_id: '',
    payment_status: 'paid',
    paid_amount: '',
    payment_method: 'cash',
    currency: 'UZS',
    exchange_rate: '1',
    comment: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesRes, cRes, pRes, fRes, vRes, tRes] = await Promise.all([
        api.getSales({
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate
        }),
        api.getClients(),
        api.getProducts(),
        api.getFactories(),
        api.getVehicles(),
        api.getTickets('active')
      ]);
      setSales(salesRes.data || []);
      setClients(cRes.data || []);
      setProducts(pRes.data || []);
      setFactories(fRes.data || []);
      setVehicles(vRes.data || []);
      setTickets(tRes.data || []);

      if (cRes.data?.length > 0 && !formData.client_id) {
        setFormData(prev => ({ ...prev, client_id: cRes.data[0].id }));
      }
      if (pRes.data?.length > 0 && !formData.product_id) {
        setFormData(prev => ({
          ...prev,
          product_id: pRes.data[0].id,
          price_per_ton: pRes.data[0].selling_price || ''
        }));
      }
    } catch (err) {
      console.error('Ошибка загрузки сделок:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter.startDate, dateFilter.endDate]);

  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
  const selectedTicket = tickets.find(t => t.id === parseInt(formData.ticket_id));

  const factoryTickets = tickets.filter(t => !formData.factory_id || t.factory_id === parseInt(formData.factory_id));
  const factoryRemainingTonnage = factoryTickets.reduce((acc, t) => acc + (parseFloat(t.remaining_tonnage) || 0), 0);

  const availableStock = formData.warehouse_source === 'warehouse'
    ? (selectedProduct?.current_stock || 0)
    : formData.warehouse_source === 'ticket'
      ? (selectedTicket?.remaining_tonnage || 0)
      : factoryRemainingTonnage;

  const requestedTonnage = parseFloat(formData.tonnage) || 0;
  const isStockInsufficient = formData.warehouse_source !== 'direct' && requestedTonnage > availableStock;

  useEffect(() => {
    const qty = parseFloat(formData.tonnage) || 0;
    const price = parseFloat(formData.price_per_ton) || 0;
    const logRate = formData.delivery_type === 'delivery' ? (parseFloat(formData.logistics_rate_per_ton) || 0) : 0;

    const cementSum = saleType === 'cement' ? (qty * price) : 0;
    const logSum = qty * logRate;
    const grandTotal = cementSum + logSum;

    setFormData(prev => ({
      ...prev,
      cement_amount: cementSum,
      logistics_amount: logSum,
      total_amount: grandTotal,
      paid_amount: prev.payment_status === 'paid' ? grandTotal.toString() : (prev.payment_status === 'debt' ? '0' : prev.paid_amount)
    }));
  }, [formData.tonnage, formData.price_per_ton, formData.delivery_type, formData.logistics_rate_per_ton, formData.payment_status, saleType]);

  const handleTicketSelect = (ticketId) => {
    const t = tickets.find(tick => tick.id === parseInt(ticketId));
    if (t) {
      setFormData(prev => ({
        ...prev,
        ticket_id: ticketId,
        factory_id: t.factory_id ? t.factory_id.toString() : prev.factory_id,
        product_id: t.product_id ? t.product_id.toString() : prev.product_id,
        packaging_type: t.packaging_type || prev.packaging_type,
        price_per_ton: t.price_per_ton ? t.price_per_ton.toString() : prev.price_per_ton
      }));
    } else {
      setFormData(prev => ({ ...prev, ticket_id: '' }));
    }
  };

  const handleProductSelect = (prodId) => {
    const p = products.find(prod => prod.id === parseInt(prodId));
    setFormData(prev => ({
      ...prev,
      product_id: prodId,
      price_per_ton: p?.selling_price ? p.selling_price.toString() : prev.price_per_ton,
      packaging_type: p?.packaging_type === 'bag' ? 'bag' : 'bulk',
      factory_id: p?.factory_id ? p.factory_id.toString() : prev.factory_id
    }));
  };

  const handleDeliveryTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      delivery_type: type,
      vehicle_id: type === 'pickup' ? '' : prev.vehicle_id,
      vehicle_number: type === 'pickup' ? '' : prev.vehicle_number,
      logistics_rate_per_ton: type === 'pickup' ? '0' : prev.logistics_rate_per_ton
    }));
  };

  const handleVehicleSelect = (vehId) => {
    const v = vehicles.find(veh => veh.id === parseInt(vehId));
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehId,
      vehicle_number: v?.plate_number || '',
      is_company_vehicle: 1
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      if (isStockInsufficient) {
        throw new Error(`Недостаточно остатка на складе! Доступно: ${availableStock} т, запрошено: ${requestedTonnage} т.`);
      }

      if (formData.delivery_type === 'delivery') {
        if (!formData.vehicle_id && !formData.vehicle_number) {
          throw new Error('При выборе доставки автопарком необходимо указать машину');
        }
        if (!formData.logistics_rate_per_ton || parseFloat(formData.logistics_rate_per_ton) <= 0) {
          throw new Error('Укажите стоимость (тариф) доставки за тонну');
        }
      }

      await api.createSale({
        ...formData,
        sale_type: saleType
      });

      setFeedback({ type: 'success', message: 'Сделка успешно проведена и отражена в системе!' });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка проведения сделки' });
    } finally {
      setSubmitting(false);
    }
  };

  // Экспорт реестра сделок в CSV
  const handleExportCsv = () => {
    const headers = ['Номер сделки', 'Дата', 'Клиент', 'Тип', 'Продукция', 'Завод', 'Объем (т)', 'Цена за тонну', 'Цемент (сум)', 'Доставка (сум)', 'Всего (сум)', 'Оплачено (сум)', 'Долг (сум)', 'Статус оплаты'];
    const rows = sales.map(s => [
      s.sale_number,
      s.date,
      s.client_name,
      s.sale_type === 'cement' ? 'Цемент' : 'Логистика',
      s.product_name || '—',
      s.factory_name || '—',
      s.tonnage,
      s.price_per_ton,
      s.cement_amount,
      s.logistics_amount,
      s.total_amount,
      s.paid_amount,
      s.debt_amount,
      s.payment_status === 'paid' ? 'Оплачено' : s.payment_status === 'debt' ? 'В долг' : 'Частично'
    ]);
    exportToCsv('erp_reestr_sdelok', headers, rows);
  };

  // Графики для сделок
  const salesByClientMap = sales.reduce((acc, s) => {
    const name = (s.client_name || 'Не указан').replace('ООО ', '').replace('ИП ', '').replace(/«|»/g, '');
    if (!acc[name]) acc[name] = { name, fullName: s.client_name, tonnage: 0, amount: 0 };
    acc[name].tonnage += (s.tonnage || 0);
    acc[name].amount += (s.total_amount || 0);
    return acc;
  }, {});
  const salesByClientChartData = Object.values(salesByClientMap).slice(0, 6);

  const paymentStatusMap = sales.reduce((acc, s) => {
    const status = s.payment_status || 'paid';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const paymentStatusData = [
    { name: 'Оплачено', value: paymentStatusMap.paid || 0, color: '#10b981', statusKey: 'paid' },
    { name: 'В долг', value: paymentStatusMap.debt || 0, color: '#f43f5e', statusKey: 'debt' },
    { name: 'Частично', value: paymentStatusMap.partial || 0, color: '#f59e0b', statusKey: 'partial' }
  ].filter(d => d.value > 0);

  // Таблица для модалки детализации (Drill-down)
  const drilldownColumns = [
    { key: 'sale_number', label: 'Номер сделки' },
    { key: 'date', label: 'Дата', render: (v) => formatDate(v) },
    { key: 'client_name', label: 'Клиент' },
    { key: 'product_name', label: 'Товар / Завод' },
    { key: 'tonnage', label: 'Тоннаж', align: 'right', render: (v) => `${formatNumber(v)} т` },
    { key: 'total_amount', label: 'Сумма', align: 'right', render: (v) => formatCurrency(v) },
    {
      key: 'payment_status',
      label: 'Статус',
      align: 'center',
      render: (v) => (
        <Badge variant={v === 'paid' ? 'success' : v === 'debt' ? 'destructive' : 'warning'} className="text-[10px]">
          {v === 'paid' ? 'Оплачено' : v === 'debt' ? 'В долг' : 'Частично'}
        </Badge>
      )
    }
  ];

  const handleClientBarClick = (data) => {
    if (!data) return;
    const clientName = data.fullName || data.name;
    const matched = sales.filter(s => s.client_name && (s.client_name.includes(data.name) || s.client_name === clientName));
    setDrilldownData({
      isOpen: true,
      title: `Отгрузки контрагенту: ${clientName}`,
      subtitle: `История всех сделок клиента за выбранный период`,
      stats: [
        { label: 'Общий объем', value: `${formatNumber(data.tonnage || 0)} т`, color: 'text-amber-500' },
        { label: 'Общая выручка', value: formatCurrency(data.amount || 0), color: 'text-emerald-500' },
        { label: 'Сделок в выборке', value: `${matched.length} шт` }
      ],
      records: matched,
      columns: drilldownColumns
    });
  };

  const handleStatusPieClick = (data) => {
    if (!data) return;
    const matched = sales.filter(s => s.payment_status === data.statusKey);
    const sumAmount = matched.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    setDrilldownData({
      isOpen: true,
      title: `Сделки со статусом: ${data.name}`,
      subtitle: `Реестр отгрузок по выбранному типу оплаты`,
      stats: [
        { label: 'Количество сделок', value: `${matched.length} шт` },
        { label: 'Сумма по статусу', value: formatCurrency(sumAmount), color: data.statusKey === 'paid' ? 'text-emerald-500' : 'text-rose-500' }
      ],
      records: matched,
      columns: drilldownColumns
    });
  };

  // ==================== MAXIMIZE HANDLERS ====================
  const handleMaximizeClientSales = () => {
    const allClientStats = Object.values(salesByClientMap).sort((a, b) => b.tonnage - a.tonnage);
    const totalTon = allClientStats.reduce((acc, c) => acc + c.tonnage, 0);
    const totalRev = allClientStats.reduce((acc, c) => acc + c.amount, 0);
    const topClient = allClientStats[0] || { name: '—', tonnage: 0 };

    setMaximizeModal({
      isOpen: true,
      title: 'Объем поставок цемента по контрагентам',
      subtitle: `Период: ${dateRange.startDate ? formatDate(dateRange.startDate) : 'Все время'} ${dateRange.endDate ? `— ${formatDate(dateRange.endDate)}` : ''} • Детализация закупок по всем покупателям`,
      stats: [
        { label: 'Контрагентов', value: `${allClientStats.length} клиентов`, color: 'text-foreground', desc: 'В текущей выборке' },
        { label: 'Совокупный тоннаж', value: `${formatNumber(totalTon)} т`, color: 'text-amber-500', desc: 'Отгруженный цемент' },
        { label: 'Суммарный объем продаж', value: formatCurrency(totalRev), color: 'text-emerald-500', desc: 'Выручка от реализации' },
        { label: 'Крупнейший покупатель', value: topClient.fullName || topClient.name, color: 'text-primary', desc: `${formatNumber(topClient.tonnage)} т` }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={allClientStats} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
            <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${v}т`} />
            <Tooltip
              formatter={(val) => [`${formatNumber(val)} т`, 'Объем']}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
            <Bar dataKey="tonnage" radius={[8, 8, 0, 0]}>
              <LabelList
                dataKey="tonnage"
                position="top"
                formatter={(val) => `${formatNumber(val)} т`}
                style={{ fontSize: '11px', fontWeight: 600, fill: chartTheme.dataTextColor }}
              />
              {allClientStats.map((_, index) => (
                <Cell key={`cell-max-${index}`} fill={NOTION_CHART_PALETTE[index % NOTION_CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
      tableData: allClientStats.map(c => ({
        ...c,
        dealsCount: sales.filter(s => s.client_name && (s.client_name === c.fullName || s.client_name.includes(c.name))).length,
        share: totalTon ? ((c.tonnage / totalTon) * 100).toFixed(1) : 0
      })),
      columns: [
        { key: 'fullName', label: 'Контрагент', render: (v, r) => <span className="font-semibold text-foreground">{v || r.name}</span> },
        { key: 'tonnage', label: 'Общий тоннаж', align: 'right', render: (v) => <span className="text-amber-500 font-bold">{formatNumber(v)} т</span> },
        { key: 'amount', label: 'Сумма покупок', align: 'right', render: (v) => <span className="text-emerald-500 font-bold">{formatCurrency(v)}</span> },
        { key: 'dealsCount', label: 'Кол-во сделок', align: 'center', render: (v) => `${v} сделок` },
        { key: 'share', label: 'Доля в отгрузках', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> }
      ]
    });
  };

  const handleMaximizePaymentStatuses = () => {
    const totalDeals = sales.length || 1;
    const paidSales = sales.filter(s => s.payment_status === 'paid');
    const debtSales = sales.filter(s => s.payment_status === 'debt');
    const partialSales = sales.filter(s => s.payment_status === 'partial');

    const paidSum = paidSales.reduce((a, b) => a + (b.total_amount || 0), 0);
    const debtSum = debtSales.reduce((a, b) => a + (b.total_amount || 0), 0);
    const partialSum = partialSales.reduce((a, b) => a + (b.total_amount || 0), 0);
    const totalSum = paidSum + debtSum + partialSum;

    const statusRows = [
      { name: 'Оплачено полностью', statusKey: 'paid', count: paidSales.length, sum: paidSum, share: ((paidSales.length / totalDeals) * 100).toFixed(1), color: '#10b981' },
      { name: 'В долг (Дебиторка)', statusKey: 'debt', count: debtSales.length, sum: debtSum, share: ((debtSales.length / totalDeals) * 100).toFixed(1), color: '#f43f5e' },
      { name: 'Частичная оплата', statusKey: 'partial', count: partialSales.length, sum: partialSum, share: ((partialSales.length / totalDeals) * 100).toFixed(1), color: '#f59e0b' }
    ].filter(r => r.count > 0);

    setMaximizeModal({
      isOpen: true,
      title: 'Структура платежных статусов и задолженностей',
      subtitle: 'Распределение всех оформленных сделок по статусам факта оплаты и дебиторской задолженности',
      stats: [
        { label: 'Всего сделок', value: `${sales.length} сделок`, color: 'text-foreground', desc: 'Оформлено' },
        { label: 'Оплачено', value: formatCurrency(paidSum), color: 'text-emerald-500', desc: `${paidSales.length} сделок (${((paidSales.length / totalDeals) * 100).toFixed(0)}%)` },
        { label: 'В долг (Не оплачено)', value: formatCurrency(debtSum), color: 'text-rose-500', desc: `${debtSales.length} сделок` },
        { label: 'Суммарный объем сделок', value: formatCurrency(totalSum), color: 'text-foreground', desc: 'Фактический объем' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={paymentStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {paymentStatusData.map((entry, index) => (
                <Cell key={`cell-status-max-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name, props) => [`${val} сделок (${props.payload.name})`, 'Количество']}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      ),
      tableData: statusRows,
      columns: [
        { key: 'name', label: 'Статус платежа', render: (v, r) => (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="font-semibold text-foreground">{v}</span>
          </div>
        )},
        { key: 'count', label: 'Количество сделок', align: 'center', render: (v) => `${v} шт` },
        { key: 'sum', label: 'Сумма сделок', align: 'right', render: (v, r) => <span className={`font-bold ${r.statusKey === 'paid' ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(v)}</span> },
        { key: 'share', label: 'Доля в сделках', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> }
      ]
    });
  };

  // Фильтрация сделок по строке поиска и статусу
  const filteredSales = sales.filter(s => {
    if (statusFilter !== 'all' && s.payment_status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.client_name && s.client_name.toLowerCase().includes(q);
      const matchNum = s.sale_number && s.sale_number.toLowerCase().includes(q);
      const matchProd = s.product_name && s.product_name.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchProd) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <PrintHeader
        title="Реестр продаж и отгрузок"
        subtitle={`На дату: ${new Date().toLocaleDateString('ru-RU')}`}
      />

      {/* Компактный заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 no-print">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Продажи и Отгрузки
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
            onClick={() => {
              setIsModalOpen(true);
              setFeedback(null);
            }}
            className="h-8 px-2.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Новая продажа
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium animate-in fade-in no-print ${
            feedback.type === 'success'
              ? 'bg-muted border-border text-foreground'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ГРАФИКИ ПРОДАЖ: Объем по клиентам и Статусы оплаты (Скрыты при печати) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 no-print chart-card">
        {/* График 1: Объем отгрузок по клиентам */}
        <Card className="lg:col-span-8 border-border">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Объем поставок по контрагентам (т)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-normal">нажмите для деталей</span>
                <button
                  onClick={handleMaximizeClientSales}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                  title="Развернуть график поставок по контрагентам"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-44 w-full cursor-pointer">
              {salesByClientChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesByClientChartData}
                    margin={{ top: 25, right: 10, left: -15, bottom: 0 }}
                    onClick={(e) => e && e.activePayload && handleClientBarClick(e.activePayload[0]?.payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: chartTheme.textColor }}
                      axisLine={{ stroke: chartTheme.gridColor }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: chartTheme.textColor }}
                      tickFormatter={(v) => `${v}т`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} т`, 'Объем']}
                      contentStyle={chartTheme.tooltipStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                    />
                    <Bar dataKey="tonnage" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="tonnage"
                        position="top"
                        formatter={(val) => `${formatNumber(val)} т`}
                        style={{ fontSize: '11px', fontWeight: 600, fill: chartTheme.dataTextColor }}
                      />
                      {salesByClientChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={NOTION_CHART_PALETTE[index % NOTION_CHART_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Нет данных по сделкам</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* График 2: Статусы оплат (Donut) */}
        <Card className="lg:col-span-4 border-border">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Статус оплат</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-normal">кликните сегмент</span>
                <button
                  onClick={handleMaximizePaymentStatuses}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                  title="Развернуть структуру статусов оплаты"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {paymentStatusData.length > 0 ? (
              <div className="h-44 w-full flex flex-col items-center justify-center cursor-pointer">
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(e) => handleStatusPieClick(e)}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} сделок`, 'Количество']}
                      contentStyle={chartTheme.tooltipStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] mt-1">
                  {paymentStatusData.map(item => (
                    <div
                      key={item.name}
                      onClick={() => handleStatusPieClick(item)}
                      className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                    >
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">Нет сделок</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Панель фильтрации: Календарь + Поиск + Статусы (Notion style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <DateRangePicker
          startDate={dateFilter.startDate}
          endDate={dateFilter.endDate}
          onDateChange={setDateFilter}
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Поиск по клиенту / номеру */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-steel" />
            <input
              type="text"
              placeholder="Поиск по сделке..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-3 text-xs rounded-md bg-canvas border border-hairline w-full text-foreground placeholder:text-steel focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Статус оплаты (Notion pill-tabs) */}
          <div className="inline-flex items-center gap-1">
            {[
              { id: 'all', label: 'Все' },
              { id: 'paid', label: 'Оплачено' },
              { id: 'debt', label: 'В долг' },
              { id: 'partial', label: 'Частично' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === st.id
                    ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
                    : 'bg-transparent text-steel border-hairline hover:text-foreground'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Таблица продаж (Notion Database Table) */}
      <Card className="border-hairline rounded-lg">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-hairline bg-surface">
          <CardTitle className="text-sm font-semibold text-charcoal dark:text-foreground">Реестр сделок</CardTitle>
          <Badge variant="outline" className="text-xs">
            {filteredSales.length !== sales.length
              ? `Найдено ${filteredSales.length} из ${sales.length}`
              : `${sales.length} сделок`}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-hairline bg-surface text-steel font-medium">
                  <th className="py-2.5 px-3">Сделка</th>
                  <th className="py-2.5 px-3">Клиент</th>
                  <th className="py-2.5 px-2">Товар / Завод</th>
                  <th className="py-2.5 px-2 text-right">Объем</th>
                  <th className="py-2.5 px-2 text-right">Цемент</th>
                  <th className="py-2.5 px-2 text-right">Доставка</th>
                  <th className="py-2.5 px-3 text-right">Итого</th>
                  <th className="py-2.5 px-2 text-center">Оплата</th>
                  <th className="py-2.5 px-2 text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft text-xs">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {s.sale_number}
                      <span className="block text-[11px] text-steel font-sans">{formatDate(s.date)}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-charcoal dark:text-foreground">{s.client_name}</span>
                      {s.client_phone && <span className="block text-[11px] text-steel">{s.client_phone}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.sale_type === 'cement' ? (
                        <>
                          <span className="font-medium text-charcoal dark:text-foreground">{s.product_name}</span>
                          <span className="block text-[11px] text-steel">{s.factory_name || 'Склад'}</span>
                        </>
                      ) : (
                        <Badge variant="lavender">Услуга перевозки</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatNumber(s.tonnage)} т</td>
                    <td className="py-2.5 px-3 text-right text-steel">{formatCurrency(s.cement_amount)}</td>
                    <td className="py-2.5 px-3 text-right text-steel">{formatCurrency(s.logistics_amount)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-charcoal dark:text-foreground">{formatCurrency(s.total_amount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {s.paid_amount >= s.total_amount ? (
                        <span className="text-brand-green font-semibold">{formatCurrency(s.paid_amount)}</span>
                      ) : (
                        <div>
                          <span className="text-steel block">Опл: {formatNumber(s.paid_amount)}</span>
                          <span className="text-destructive font-semibold block">Долг: {formatNumber(s.debt_amount)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {s.payment_status === 'paid' && <Badge variant="mint">Оплачено</Badge>}
                      {s.payment_status === 'debt' && <Badge variant="rose">В долг</Badge>}
                      {s.payment_status === 'partial' && <Badge variant="peach">Частично</Badge>}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-steel">
                      Сделок пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* МОДАЛЬНОЕ ОКНО ОФОРМЛЕНИЯ ПРОДАЖИ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Оформление сделки и отгрузки"
        description="Транзакционное списание склада и автоматическая фиксация в кассе / долгах"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Режим: Цемент или Только логистика */}
          <div className="inline-flex w-full items-center rounded-lg border border-border bg-muted p-1 text-muted-foreground text-xs">
            <button
              type="button"
              onClick={() => setSaleType('cement')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                saleType === 'cement' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
              }`}
            >
              Отгрузка цемента (с доставкой или самовывоз)
            </button>
            <button
              type="button"
              onClick={() => setSaleType('service_only')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                saleType === 'service_only' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
              }`}
            >
              Только услуга (логистика / перевозка)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Дата сделки"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Select
              label="Клиент (покупатель)"
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">Выберите клиента...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.balance < 0 ? `(Долг: ${formatCurrency(Math.abs(c.balance))})` : ''}
                </option>
              ))}
            </Select>
          </div>

          {saleType === 'cement' && (
            <div className="space-y-3 rounded-lg border border-border p-3.5 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Марка цемента"
                  required
                  value={formData.product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                >
                  <option value="">Выберите товар...</option>
                  {products.filter(p => p.category === 'cement').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.cement_grade || ''}]
                    </option>
                  ))}
                </Select>

                <Select
                  label="Завод"
                  value={formData.factory_id}
                  onChange={(e) => {
                    const facId = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      factory_id: facId,
                      // Если выбран тикет не от этого завода - сбросить
                      ticket_id: prev.ticket_id && tickets.find(t => t.id === parseInt(prev.ticket_id))?.factory_id !== parseInt(facId) ? '' : prev.ticket_id
                    }));
                  }}
                >
                  <option value="">Все заводы / Склад...</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </Select>

                <Select
                  label="Фасовка"
                  value={formData.packaging_type}
                  onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                >
                  <option value="bulk">Навал</option>
                  <option value="bag">Мешки</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Источник отгрузки"
                  value={formData.warehouse_source}
                  onChange={(e) => setFormData({ ...formData, warehouse_source: e.target.value })}
                >
                  <option value="warehouse">Фактический склад</option>
                  <option value="ticket">Тикет завода</option>
                  <option value="direct">Напрямую с завода (транзит)</option>
                </Select>

                {formData.warehouse_source === 'ticket' && (
                  <Select
                    label="Выбор тикета"
                    required
                    value={formData.ticket_id}
                    onChange={(e) => handleTicketSelect(e.target.value)}
                  >
                    <option value="">Выберите тикет...</option>
                    {tickets
                      .filter(t => !formData.factory_id || t.factory_id === parseInt(formData.factory_id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.ticket_number} • {t.factory_name} (ост: {t.remaining_tonnage} т)
                        </option>
                      ))}
                  </Select>
                )}

                {formData.warehouse_source === 'direct' && (
                  <div className="p-2.5 rounded-md bg-tint-sky/50 border border-brand-navy/15 text-foreground text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-semibold text-brand-navy dark:text-sky-300">Прямой транзит: </span>
                      <span className="text-steel">Отгрузка напрямую покупателю</span>
                    </div>
                    <div className="font-medium text-foreground">
                      Остаток по заводу: <strong className="text-primary">{formatNumber(factoryRemainingTonnage)} т</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Защита от нехватки товара и отображение остатка */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-md text-xs font-medium ${
                  formData.warehouse_source !== 'direct' && isStockInsufficient
                    ? 'bg-destructive/10 border border-destructive/30 text-destructive'
                    : 'bg-surface border border-hairline text-foreground'
                }`}
              >
                <span>
                  {formData.warehouse_source === 'direct'
                    ? `Доступный остаток квот завода: ${formatNumber(factoryRemainingTonnage)} т (прямой транзит с завода)`
                    : isStockInsufficient
                      ? `ОТГРУЗКА ЗАБЛОКИРОВАНА: в наличии ${availableStock} т, а запрошено ${requestedTonnage} т!`
                      : `Доступный остаток для отгрузки: ${availableStock} т`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  label="Тоннаж (т)"
                  required
                  placeholder="30"
                  value={formData.tonnage}
                  onChange={(e) => setFormData({ ...formData, tonnage: e.target.value })}
                />
                <Input
                  type="text"
                  label="Цена за тонну"
                  required
                  formatSpaces={true}
                  placeholder="850 000"
                  value={formData.price_per_ton}
                  onChange={(e) => setFormData({ ...formData, price_per_ton: e.target.value })}
                />
                <Input
                  type="text"
                  label="Сумма за цемент"
                  readOnly
                  value={formatCurrency(formData.cement_amount)}
                  className="bg-muted font-bold"
                />
              </div>
            </div>
          )}

          {/* Логистика (Дополнительная услуга: Самовывоз или Автопарк) */}
          <div className="space-y-3 rounded-lg border border-border p-3.5 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Доставка и логистика</span>
              <div className="inline-flex rounded-md border border-hairline bg-surface p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange('pickup')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    formData.delivery_type === 'pickup'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-steel hover:text-foreground'
                  }`}
                >
                  Самовывоз клиентом
                </button>
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange('delivery')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    formData.delivery_type === 'delivery'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-steel hover:text-foreground'
                  }`}
                >
                  Доставка автопарком
                </button>
              </div>
            </div>

            {formData.delivery_type === 'pickup' ? (
              <div className="p-3 rounded-lg bg-surface border border-hairline space-y-2">
                <div className="text-xs text-steel">
                  Клиент забирает продукцию своим транспортом. Логистические услуги компании не оплачиваются.
                </div>
                <Input
                  type="text"
                  label="Гос. номер машины клиента (для ТТН / пропуска)"
                  placeholder="01 A 777 AA"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                />
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-surface border border-hairline space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Машина из автопарка"
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                  >
                    <option value="">Выберите машину автопарка...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.model || 'Тягач'} {v.driver_name ? `(${v.driver_name})` : ''}
                      </option>
                    ))}
                  </Select>

                  <Input
                    type="text"
                    label="Тариф доставки за тонну"
                    required
                    formatSpaces={true}
                    placeholder="70 000"
                    value={formData.logistics_rate_per_ton}
                    onChange={(e) => setFormData({ ...formData, logistics_rate_per_ton: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-hairline text-xs">
                  <span className="text-steel">
                    Стоимость логистики ({formData.tonnage || 0} т × {formatThousands(formData.logistics_rate_per_ton || 0)} сум):
                  </span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(formData.logistics_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Итоги и оплата */}
          <div className="rounded-lg border border-border p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <span className="text-xs font-medium text-muted-foreground block">Итоговая стоимость сделки:</span>
                <span className="text-[11px] text-steel">
                  Цемент: {formatCurrency(formData.cement_amount)} • Логистика: {formatCurrency(formData.logistics_amount)}
                </span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(formData.total_amount)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Статус оплаты"
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              >
                <option value="paid">Оплачено полностью</option>
                <option value="debt">В долг (дебиторка 100%)</option>
                <option value="partial">Частичная оплата</option>
              </Select>

              <Input
                type="text"
                label="Сумма оплаты сейчас"
                formatSpaces={true}
                placeholder="0"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              />

              <Select
                label="Способ оплаты"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="cash">Наличные</option>
                <option value="transfer">Перечисление (банк)</option>
                <option value="card">Оплата картой</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isStockInsufficient}
              isLoading={submitting}
            >
              Подтвердить сделку
            </Button>
          </div>
        </form>
      </Modal>

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
