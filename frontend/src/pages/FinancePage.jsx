import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Landmark,
  Users,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  DollarSign,
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
import { useChartTheme } from '../lib/chartTheme';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatCard } from '../components/common/StatCard';
import { PrintHeader, PrintFooter } from '../components/common/PrintHeader';
import { ChartMaximizeModal } from '../components/common/ChartMaximizeModal';
import { api } from '../api/client';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';
import { exportToCsv, triggerPrint } from '../lib/exportUtils';

export function FinancePage() {
  const chartTheme = useChartTheme();
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'debts' | 'broker'
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [debts, setDebts] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [brokerData, setBrokerData] = useState(null);
  const [clients, setClients] = useState([]);
  const [factories, setFactories] = useState([]);

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
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Модальные окна
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [repayModalClient, setRepayModalClient] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState('cash');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'cement_sale',
    client_id: '',
    currency: 'UZS',
    exchange_rate: '12800',
    amount: '',
    payment_method: 'cash',
    comment: ''
  });

  const [expenseScope, setExpenseScope] = useState('cement'); // 'cement' | 'logistics'
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cement_category: 'factory_payment',
    logistics_category: 'gas',
    factory_id: '',
    vehicle_id: '',
    vehicle_number: '',
    currency: 'UZS',
    exchange_rate: '12800',
    amount: '',
    payment_method: 'cash',
    comment: ''
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [txRes, debtRes, brokerRes, cRes, fRes, vRes] = await Promise.all([
        api.getTransactions(),
        api.getDebts(),
        api.getBrokerAccount(),
        api.getClients(),
        api.getFactories(),
        api.getVehicles()
      ]);

      setTransactions(txRes.data || []);
      setSummary(txRes.summary || null);
      setDebts(debtRes.data || []);
      setTotalDebt(debtRes.totalDebt || 0);
      setBrokerData(brokerRes || null);
      setClients(cRes.data || []);
      setFactories(fRes.data || []);
      setVehicles(vRes.data || []);

      if (cRes.data?.length > 0 && !incomeForm.client_id) {
        setIncomeForm(prev => ({ ...prev, client_id: cRes.data[0].id }));
      }
      if (fRes.data?.length > 0 && !expenseForm.factory_id) {
        setExpenseForm(prev => ({ ...prev, factory_id: fRes.data[0].id }));
      }
    } catch (err) {
      console.error('Ошибка загрузки финансов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);
      await api.createTransaction({
        date: incomeForm.date,
        transaction_type: 'income',
        category: incomeForm.category,
        client_id: incomeForm.client_id,
        currency: incomeForm.currency,
        exchange_rate: incomeForm.currency === 'USD' ? incomeForm.exchange_rate : 1,
        amount: incomeForm.amount,
        payment_method: incomeForm.payment_method,
        comment: incomeForm.comment
      });
      setFeedback({ type: 'success', message: 'Поступление зафиксировано в кассе!' });
      setIncomeModal(false);
      setIncomeForm(prev => ({ ...prev, amount: '', comment: '' }));
      loadAll();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка сохранения прихода' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);
      const category = expenseScope === 'cement' ? expenseForm.cement_category : expenseForm.logistics_category;
      await api.createTransaction({
        date: expenseForm.date,
        transaction_type: 'expense',
        category,
        factory_id: expenseScope === 'cement' ? expenseForm.factory_id : null,
        vehicle_id: expenseScope === 'logistics' ? expenseForm.vehicle_id : null,
        vehicle_number: expenseScope === 'logistics' ? expenseForm.vehicle_number : null,
        currency: expenseForm.currency,
        exchange_rate: expenseForm.currency === 'USD' ? expenseForm.exchange_rate : 1,
        amount: expenseForm.amount,
        payment_method: expenseForm.payment_method,
        comment: expenseForm.comment,
        is_broker_account: category === 'broker_deposit' ? 1 : 0
      });
      setFeedback({ type: 'success', message: 'Расход успешно проведен!' });
      setExpenseModal(false);
      setExpenseForm(prev => ({ ...prev, amount: '', comment: '' }));
      loadAll();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка проведения расхода' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepayDebt = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);
      await api.repayDebt({
        client_id: repayModalClient.id,
        amount: repayAmount,
        payment_method: repayMethod,
        date: new Date().toISOString().split('T')[0],
        comment: `Погашение задолженности клиентом ${repayModalClient.name}`
      });
      setFeedback({ type: 'success', message: `Долг клиента ${repayModalClient.name} уменьшен!` });
      setRepayModalClient(null);
      setRepayAmount('');
      loadAll();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка погашения долга' });
    } finally {
      setSubmitting(false);
    }
  };

  // Экспорт в Excel / CSV
  const handleExportCsv = () => {
    if (activeTab === 'transactions') {
      const headers = ['Дата', 'Тип', 'Категория', 'Контрагент / Машина', 'Вид оплаты', 'Сумма (сум)', 'Примечание'];
      const rows = transactions.map(tx => [
        tx.date,
        tx.transaction_type === 'income' ? 'Приход' : 'Расход',
        tx.category,
        tx.client_name || tx.factory_name || tx.vehicle_number || '',
        tx.payment_method,
        tx.amount_uzs,
        tx.comment || ''
      ]);
      exportToCsv('erp_kassa_operatsii', headers, rows);
    } else if (activeTab === 'debts') {
      const headers = ['Клиент', 'Компания', 'Телефон', 'Неоплаченных сделок', 'Дата последней сделки', 'Сумма долга (сум)'];
      const rows = debts.map(d => [
        d.name,
        d.company_name || '',
        d.phone || '',
        d.unpaid_sales_count,
        d.last_sale_date || '',
        d.debt_amount
      ]);
      exportToCsv('erp_debitorskaya_zadolzhennost', headers, rows);
    } else {
      const headers = ['Дата', 'Тип', 'Связанный тикет', 'Сумма', 'Комментарий'];
      const rows = (brokerData?.history || []).map(b => [
        b.date,
        b.type,
        b.ticket_number || '',
        b.amount,
        b.comment || ''
      ]);
      exportToCsv('erp_brokerskiy_schet', headers, rows);
    }
  };

  // Данные для графиков финансов (различимая яркая палитра без черного)
  const cashFlowBarData = [
    { name: 'Приход', amount: summary?.totalIncome || 0, fill: '#10b981' },
    { name: 'Расход', amount: summary?.totalExpense || 0, fill: '#f43f5e' },
    { name: 'Остаток', amount: Math.max(0, summary?.netCash || 0), fill: '#3b82f6' }
  ];

  const expenseCategories = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category || 'other';
      acc[cat] = (acc[cat] || 0) + (t.amount_uzs || 0);
      return acc;
    }, {});

  const catNames = {
    gas: 'Топливо / Газ',
    spare_parts: 'Запчасти / ТО',
    salary: 'Зарплата',
    lunch: 'Обеды',
    factory_payment: 'Заводы',
    broker_deposit: 'Биржа',
    other: 'Прочее'
  };
  const catColors = {
    gas: '#f59e0b',
    spare_parts: '#6366f1',
    salary: '#0ea5e9',
    lunch: '#10b981',
    factory_payment: '#8b5cf6',
    broker_deposit: '#ec4899',
    other: '#64748b'
  };

  const expensePieData = Object.entries(expenseCategories)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: catNames[k] || k,
      value: v,
      color: catColors[k] || '#8b5cf6'
    }));

  // ==================== MAXIMIZE HANDLERS ====================
  const handleMaximizeCashFlow = () => {
    const inc = summary?.totalIncome || 0;
    const exp = summary?.totalExpense || 0;
    const net = inc - exp;
    const cash = summary?.cashBalance || 0;

    setMaximizeModal({
      isOpen: true,
      title: 'Денежные потоки и операционная касса',
      subtitle: 'Комплексный баланс поступлений от реализации, расходов предприятия и фактического кассового остатка',
      stats: [
        { label: 'Всего поступлений (Приход)', value: formatCurrency(inc), color: 'text-emerald-500', desc: 'Оплата клиентов' },
        { label: 'Всего списаний (Расход)', value: formatCurrency(exp), color: 'text-rose-500', desc: 'Операционные затраты' },
        { label: 'Чистый денежный поток', value: formatCurrency(net), color: net >= 0 ? 'text-teal-500' : 'text-destructive', desc: 'Разница прихода и расхода' },
        { label: 'Фактический остаток в кассе', value: formatCurrency(cash), color: 'text-foreground', desc: 'Наличные и расчетный счет' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashFlowBarData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
            <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip
              formatter={(val) => [formatCurrency(val), 'Сумма']}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="amount" position="top" formatter={(v) => `${(v/1000000).toFixed(1)}M`} style={{ fontSize: '11px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
              {cashFlowBarData.map((entry, index) => (
                <Cell key={`cell-max-cf-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
      tableData: transactions,
      columns: [
        { key: 'date', label: 'Дата ордера', render: (v) => formatDate(v) },
        { key: 'type', label: 'Тип', align: 'center', render: (v) => (
          <Badge variant={v === 'income' ? 'success' : 'destructive'} className="text-[10px]">
            {v === 'income' ? 'Приход' : 'Расход'}
          </Badge>
        )},
        { key: 'category', label: 'Категория', render: (v) => catNames[v] || v || 'Основная' },
        { key: 'amount', label: 'Сумма (сум)', align: 'right', render: (v, r) => (
          <span className={`font-bold ${r.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {r.type === 'income' ? '+' : '-'}{formatCurrency(v)}
          </span>
        )},
        { key: 'comment', label: 'Примечание / Основание', render: (v) => <span className="text-muted-foreground">{v || '—'}</span> }
      ]
    });
  };

  const handleMaximizeExpenses = () => {
    const totalExp = summary?.totalExpense || 0;
    const topExp = [...expensePieData].sort((a, b) => b.value - a.value)[0] || { name: '—', value: 0 };
    const expCount = transactions.filter(t => t.type === 'expense').length;

    setMaximizeModal({
      isOpen: true,
      title: 'Структура расходов предприятия по статьям затрат',
      subtitle: 'Подробная аналитика направлений расходования средств: сырье, автопарк, зарплаты, питание, биржевые транзакции',
      stats: [
        { label: 'Совокупные расходы', value: formatCurrency(totalExp), color: 'text-rose-500', desc: '100% затрат' },
        { label: 'Крупнейшая статья', value: topExp.name, color: 'text-primary', desc: formatCurrency(topExp.value) },
        { label: 'Количество статей', value: `${expensePieData.length} категорий`, color: 'text-foreground', desc: 'Аналитический учет' },
        { label: 'Всего расходных ордеров', value: `${expCount} операций`, color: 'text-muted-foreground', desc: 'Списания из кассы' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expensePieData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={4}
              dataKey="value"
            >
              {expensePieData.map((entry, index) => (
                <Cell key={`cell-max-exp-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name, props) => [formatCurrency(val), props.payload.name]}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      ),
      tableData: expensePieData.map(e => ({
        ...e,
        share: totalExp ? ((e.value / totalExp) * 100).toFixed(1) : 0,
        ordersCount: transactions.filter(t => t.type === 'expense' && (catNames[t.category] === e.name || t.category === e.name)).length
      })),
      columns: [
        { key: 'name', label: 'Статья затрат', render: (v, r) => (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="font-semibold text-foreground">{v}</span>
          </div>
        )},
        { key: 'value', label: 'Сумма расходов', align: 'right', render: (v) => <span className="font-bold text-rose-500">{formatCurrency(v)}</span> },
        { key: 'ordersCount', label: 'Кол-во операций', align: 'center', render: (v) => `${v} ордеров` },
        { key: 'share', label: 'Доля в расходах', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> }
      ]
    });
  };

  const handleMaximizeDebtors = () => {
    const totalD = totalDebt || debts.reduce((a, b) => a + (b.debt_amount || 0), 0);
    const topDebtor = [...debts].sort((a, b) => b.debt_amount - a.debt_amount)[0] || { name: '—', debt_amount: 0 };
    const avgDebt = debts.length ? Math.round(totalD / debts.length) : 0;

    setMaximizeModal({
      isOpen: true,
      title: 'Дебиторская задолженность контрагентов',
      subtitle: 'Полный реестр покупателей с неоплаченными отгрузками цемента и превышением лимита доверия',
      stats: [
        { label: 'Совокупный долг', value: formatCurrency(totalD), color: 'text-destructive', desc: 'Требуется взыскание' },
        { label: 'Количество должников', value: `${debts.length} компаний`, color: 'text-foreground', desc: 'В красной зоне' },
        { label: 'Крупнейший должник', value: topDebtor.name, color: 'text-primary', desc: formatCurrency(topDebtor.debt_amount) },
        { label: 'Средняя задолженность', value: formatCurrency(avgDebt), color: 'text-muted-foreground', desc: 'На одного контрагента' }
      ],
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={debts.slice(0, 8).map(d => ({
            name: d.name.replace('ООО ', '').replace('ИП ', '').replace(/«|»/g, ''),
            debt: d.debt_amount
          }))} layout="vertical" margin={{ top: 10, right: 40, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridColor} opacity={0.6} />
            <XAxis type="number" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: chartTheme.dataTextColor }} width={130} />
            <Tooltip
              formatter={(val) => [formatCurrency(val), 'Долг']}
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
            />
            <Bar dataKey="debt" fill="#f43f5e" radius={[0, 8, 8, 0]}>
              <LabelList dataKey="debt" position="right" formatter={(v) => `${(v/1000000).toFixed(1)}M`} style={{ fontSize: '11px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
      tableData: debts.map(d => ({
        ...d,
        share: totalD ? ((d.debt_amount / totalD) * 100).toFixed(1) : 0
      })),
      columns: [
        { key: 'name', label: 'Контрагент', render: (v) => <span className="font-semibold text-foreground">{v}</span> },
        { key: 'phone', label: 'Телефон', render: (v) => <span className="text-muted-foreground">{v || '—'}</span> },
        { key: 'debt_amount', label: 'Сумма долга', align: 'right', render: (v) => <span className="font-bold text-destructive">{formatCurrency(v)}</span> },
        { key: 'share', label: 'Доля в портфеле', align: 'right', render: (v) => <Badge variant="outline" className="text-[10px]">{v}%</Badge> },
        { key: 'status', label: 'Статус', align: 'center', render: () => <Badge variant="destructive" className="text-[10px]">В долгу</Badge> }
      ]
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <PrintHeader
        title="Финансовый отчет"
        subtitle={`На дату: ${new Date().toLocaleDateString('ru-RU')}`}
      />

      {/* Компактный заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 no-print">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Касса и Финансы
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="h-7 px-2.5 text-xs font-medium"
          >
            <Printer className="h-3 w-3 mr-1" />
            Печать
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-7 px-2.5 text-xs font-medium"
          >
            <Download className="h-3 w-3 mr-1" />
            Экспорт
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('broker')}
            className="h-7 px-2.5 text-xs font-medium"
          >
            <Landmark className="h-3 w-3 mr-1" />
            Биржа
          </Button>

          <Button
            size="sm"
            onClick={() => setIncomeModal(true)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            <Plus className="h-3 w-3 mr-1" />
            Приход
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpenseModal(true)}
            className="h-7 px-2.5 text-xs font-medium border-border"
          >
            <Plus className="h-3 w-3 mr-1" />
            Расход
          </Button>
        </div>
      </div>

      {/* 4 финансовые карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Поступления"
          value={`+${formatCurrency(summary?.totalIncome || 0)}`}
          subtitle="Оплаты за цемент и доставку"
          icon={Wallet}
          iconBg="bg-tint-mint text-emerald-600 border-emerald-200/60 dark:border-emerald-800/40"
        />
        <StatCard
          title="Расходы"
          value={`-${formatCurrency(summary?.totalExpense || 0)}`}
          subtitle="Заводы, топливо, запчасти, зп"
          icon={Wallet}
          iconBg="bg-tint-rose text-rose-600 border-rose-200/60 dark:border-rose-800/40"
        />
        <StatCard
          title="Остаток в кассе"
          value={formatCurrency(summary?.netCash || 0)}
          subtitle="Фактический баланс"
          icon={DollarSign}
          iconBg="bg-tint-lavender text-primary border-purple-200/60 dark:border-purple-800/40"
        />
        <StatCard
          title="Брокерский счет"
          value={formatCurrency(summary?.brokerBalance || brokerData?.balance || 0)}
          subtitle="Депозит на бирже"
          icon={Landmark}
          iconBg="bg-tint-sky text-sky-600 border-sky-200/60 dark:border-sky-800/40"
        />
      </div>

      {/* ФИНАНСОВЫЕ ГРАФИКИ: Баланс потоков и Структура расходов (Скрыты при печати) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 no-print chart-card">
        {/* График 1: Приход vs Расход vs Баланс */}
        <Card className="lg:col-span-7 border-border">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Денежные потоки (сум)</span>
              <button
                onClick={handleMaximizeCashFlow}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                title="Развернуть денежные потоки"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowBarData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.textColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Сумма']}
                    contentStyle={chartTheme.tooltipStyle}
                    itemStyle={chartTheme.tooltipItemStyle}
                    labelStyle={chartTheme.tooltipLabelStyle}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="amount" position="top" formatter={(v) => `${(v/1000000).toFixed(1)}M`} style={{ fontSize: '10px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
                    {cashFlowBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* График 2: Структура расходов (Donut) */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Структура расходов</span>
              <button
                onClick={handleMaximizeExpenses}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                title="Развернуть структуру расходов"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {expensePieData.length > 0 ? (
              <div className="h-48 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-exp-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={chartTheme.tooltipStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] mt-1">
                  {expensePieData.slice(0, 4).map(item => (
                    <div key={item.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Нет расходов</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs (Notion pill-tabs) */}
      <div className="inline-flex items-center gap-1.5 no-print">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
            activeTab === 'transactions'
              ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
              : 'bg-transparent text-steel border-hairline hover:text-foreground'
          }`}
        >
          Операции ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
            activeTab === 'debts'
              ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
              : 'bg-transparent text-steel border-hairline hover:text-foreground'
          }`}
        >
          Долги клиентов ({debts.length})
        </button>
        <button
          onClick={() => setActiveTab('broker')}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
            activeTab === 'broker'
              ? 'bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] border-transparent'
              : 'bg-transparent text-steel border-hairline hover:text-foreground'
          }`}
        >
          Брокерский счет
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border text-foreground text-xs font-medium no-print">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. ЖУРНАЛ КАССЫ (Notion Database Table) */}
      {activeTab === 'transactions' && (
        <Card className="border-hairline rounded-lg">
          <CardHeader className="p-4 pb-2 border-b border-hairline bg-surface">
            <CardTitle className="text-sm font-semibold text-charcoal dark:text-foreground">Журнал операций</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface text-steel font-medium">
                    <th className="py-2.5 px-3">Дата</th>
                    <th className="py-2.5 px-2">Тип</th>
                    <th className="py-2.5 px-2">Статья</th>
                    <th className="py-2.5 px-3">Контрагент / Машина</th>
                    <th className="py-2.5 px-2">Оплата</th>
                    <th className="py-2.5 px-3 text-right">Сумма</th>
                    <th className="py-2.5 px-3">Инфо</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface/60 transition-colors">
                      <td className="py-2.5 px-3 text-steel">{formatDate(tx.date)}</td>
                      <td className="py-2.5 px-2">
                        {tx.transaction_type === 'income' ? (
                          <Badge variant="mint">Приход</Badge>
                        ) : (
                          <Badge variant="rose">Расход</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {tx.category === 'cement_sale' ? 'Продажа цемента' :
                         tx.category === 'logistics_service' ? 'Доставка' :
                         tx.category === 'debt_repayment' ? 'Погашение долга' :
                         tx.category === 'gas' ? 'Топливо / Метан' :
                         tx.category === 'spare_parts' ? 'Запчасти / ТО' :
                         tx.category === 'salary' ? 'Зарплата' :
                         tx.category === 'lunch' ? 'Обеды' :
                         tx.category === 'factory_payment' ? 'Оплата заводу' :
                         tx.category === 'broker_deposit' ? 'Депозит биржи' : tx.category}
                      </td>
                      <td className="py-2.5 px-3">
                        {tx.client_name ? (
                          <span className="font-semibold text-charcoal dark:text-foreground">{tx.client_name}</span>
                        ) : tx.factory_name ? (
                          <span className="text-foreground">{tx.factory_name}</span>
                        ) : tx.vehicle_plate || tx.vehicle_number ? (
                          <span className="font-mono text-steel">{tx.vehicle_plate || tx.vehicle_number}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-steel">
                        {tx.payment_method === 'cash' ? 'Наличные' : tx.payment_method === 'transfer' ? 'Перечисление' : 'Карта'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-medium ${tx.transaction_type === 'income' ? 'text-brand-green font-semibold' : 'text-steel'}`}>
                        {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_uzs)}
                      </td>
                      <td className="py-2.5 px-3 text-steel text-[11px] truncate max-w-[140px]">{tx.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. ДОЛГИ КЛИЕНТОВ С ГРАФИКОМ */}
      {activeTab === 'debts' && (
        <div className="space-y-4">
          {/* График задолженности (Скрыт при печати) */}
          {topDebtorsChartData.length > 0 && (
            <Card className="border-border no-print chart-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Структура задолженности по контрагентам</span>
                  <button
                    onClick={handleMaximizeDebtors}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                    title="Развернуть структуру задолженности"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDebtorsChartData} layout="vertical" margin={{ top: 5, right: 35, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridColor} opacity={0.6} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.textColor }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: chartTheme.dataTextColor }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Долг']}
                        contentStyle={chartTheme.tooltipStyle}
                        itemStyle={chartTheme.tooltipItemStyle}
                        labelStyle={chartTheme.tooltipLabelStyle}
                      />
                      <Bar dataKey="debt" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="debt" position="right" formatter={(v) => `${(v/1000000).toFixed(1)}M`} style={{ fontSize: '10px', fontWeight: 600, fill: chartTheme.dataTextColor }} />
                        {topDebtorsChartData.map((entry, index) => (
                          <Cell key={`cell-debt-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Таблица должников (Notion Database Table) */}
          <Card className="border-hairline rounded-lg">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-hairline bg-surface">
              <CardTitle className="text-sm font-semibold text-charcoal dark:text-foreground">Список должников</CardTitle>
              <Badge variant="rose">Общий долг: {formatCurrency(totalDebt)}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-surface text-steel font-medium">
                      <th className="py-2.5 px-3">Клиент</th>
                      <th className="py-2.5 px-2">Телефон</th>
                      <th className="py-2.5 px-2 text-center">Сделок</th>
                      <th className="py-2.5 px-2">Посл. отгрузка</th>
                      <th className="py-2.5 px-3 text-right">Сумма долга</th>
                      <th className="py-2.5 px-3 text-center no-print">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {debts.map((client) => (
                      <tr key={client.id} className="hover:bg-surface/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-charcoal dark:text-foreground">
                          {client.name}
                          {client.company_name && <span className="block text-[10px] text-steel font-normal">{client.company_name}</span>}
                        </td>
                        <td className="py-2.5 px-2 text-steel">{client.phone || '—'}</td>
                        <td className="py-2.5 px-2 text-center font-medium">{client.unpaid_sales_count}</td>
                        <td className="py-2.5 px-2 text-steel">{formatDate(client.last_sale_date) || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-destructive">
                          {formatCurrency(client.debt_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRepayModalClient(client);
                              setRepayAmount(client.debt_amount.toString());
                            }}
                            className="h-6 px-2 text-xs font-medium"
                          >
                            Погасить
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {debts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-steel">Долгов нет</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. БРОКЕРСКИЙ СЧЕТ (Notion Database Table) */}
      {activeTab === 'broker' && (
        <Card className="border-hairline rounded-lg">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-hairline bg-surface">
            <CardTitle className="text-sm font-semibold text-charcoal dark:text-foreground">Брокерский счет и депозиты</CardTitle>
            <Badge variant="outline">Баланс: {formatCurrency(brokerData?.balance || 0)}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface text-steel font-medium">
                    <th className="py-2.5 px-3">Дата</th>
                    <th className="py-2.5 px-3">Тип</th>
                    <th className="py-2.5 px-3">Тикет / Завод</th>
                    <th className="py-2.5 px-4 text-right">Сумма (сум)</th>
                    <th className="py-2.5 px-4">Примечание</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {brokerData?.history?.map((b) => (
                    <tr key={b.id} className="hover:bg-surface/60 transition-colors">
                      <td className="py-2.5 px-3 text-steel">{formatDate(b.date)}</td>
                      <td className="py-2.5 px-3">
                        {b.type === 'deposit' && <Badge variant="mint">Пополнение</Badge>}
                        {b.type === 'ticket_return' && <Badge variant="lavender">Возврат остатка</Badge>}
                        {b.type === 'ticket_allocation' && <Badge variant="rose">Списание на квоту</Badge>}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {b.ticket_number ? `Тикет ${b.ticket_number} (${b.factory_name || ''})` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-foreground">
                        {formatCurrency(b.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-steel">{b.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* МОДАЛКА ПРИХОДА */}
      <Modal isOpen={incomeModal} onClose={() => setIncomeModal(false)} title="Регистрация поступления средств">
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Дата" required value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            <Select label="Категория" value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}>
              <option value="cement_sale">Оплата за цемент</option>
              <option value="logistics_service">Оплата доставки</option>
              <option value="debt_repayment">Погашение долга</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Клиент" value={incomeForm.client_id} onChange={e => setIncomeForm({ ...incomeForm, client_id: e.target.value })}>
              <option value="">Выберите клиента...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Вид оплаты" value={incomeForm.payment_method} onChange={e => setIncomeForm({ ...incomeForm, payment_method: e.target.value })}>
              <option value="cash">Наличные</option>
              <option value="transfer">Перечисление</option>
              <option value="card">Карта</option>
            </Select>
          </div>
          <Input type="number" step="1" min="1" label="Сумма (сум)" required value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
          <Input type="text" label="Комментарий" value={incomeForm.comment} onChange={e => setIncomeForm({ ...incomeForm, comment: e.target.value })} />
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIncomeModal(false)}>Отмена</Button>
            <Button type="submit" isLoading={submitting}>Провести приход</Button>
          </div>
        </form>
      </Modal>

      {/* МОДАЛКА РАСХОДА */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Оформление расхода средств">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="inline-flex w-full items-center rounded-lg border border-border bg-muted p-1 text-muted-foreground text-xs">
            <button type="button" onClick={() => setExpenseScope('cement')} className={`flex-1 rounded-md py-1.5 font-medium transition-all ${expenseScope === 'cement' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'}`}>
              Цемент (Оплата заводу / Депозит)
            </button>
            <button type="button" onClick={() => setExpenseScope('logistics')} className={`flex-1 rounded-md py-1.5 font-medium transition-all ${expenseScope === 'logistics' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'}`}>
              Логистика (Газ, запчасти, зп, обед)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Дата" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            {expenseScope === 'cement' ? (
              <Select label="Категория" value={expenseForm.cement_category} onChange={e => setExpenseForm({ ...expenseForm, cement_category: e.target.value })}>
                <option value="factory_payment">Оплата заводу</option>
                <option value="broker_deposit">Пополнение брокерского счета</option>
              </Select>
            ) : (
              <Select label="Категория" value={expenseForm.logistics_category} onChange={e => setExpenseForm({ ...expenseForm, logistics_category: e.target.value })}>
                <option value="gas">Топливо / Метан</option>
                <option value="spare_parts">Запчасти и ТО</option>
                <option value="salary">Зарплата водителям</option>
                <option value="lunch">Питание / обеды</option>
              </Select>
            )}
          </div>

          <Input type="number" step="1" min="1" label="Сумма (сум)" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
          <Input type="text" label="Комментарий" value={expenseForm.comment} onChange={e => setExpenseForm({ ...expenseForm, comment: e.target.value })} />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setExpenseModal(false)}>Отмена</Button>
            <Button type="submit" isLoading={submitting}>Провести расход</Button>
          </div>
        </form>
      </Modal>

      {/* МОДАЛКА ПОГАШЕНИЯ ДОЛГА */}
      <Modal isOpen={!!repayModalClient} onClose={() => setRepayModalClient(null)} title="Погашение задолженности клиентом">
        <form onSubmit={handleRepayDebt} className="space-y-4">
          <div className="p-3 rounded-md bg-muted text-xs">
            <span className="text-muted-foreground">Клиент: </span>
            <strong className="text-foreground">{repayModalClient?.name}</strong>
            <span className="block mt-1 text-destructive font-bold">Текущий долг: {formatCurrency(repayModalClient?.debt_amount || 0)}</span>
          </div>

          <Input type="number" step="1" min="1" max={repayModalClient?.debt_amount} label="Сумма погашения (сум)" required value={repayAmount} onChange={e => setRepayAmount(e.target.value)} />
          <Select label="Способ внесения" value={repayMethod} onChange={e => setRepayMethod(e.target.value)}>
            <option value="cash">Наличные в кассу</option>
            <option value="transfer">Банковский перевод</option>
            <option value="card">Карта</option>
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRepayModalClient(null)}>Отмена</Button>
            <Button type="submit" isLoading={submitting}>Погасить задолженность</Button>
          </div>
        </form>
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
