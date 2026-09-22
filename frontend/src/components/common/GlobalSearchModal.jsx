import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ShoppingCart,
  Wallet,
  Settings,
  Users,
  Truck,
  Building2,
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [factories, setFactories] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, pRes, vRes, fRes, sRes] = await Promise.all([
        api.getClients().catch(() => ({ data: [] })),
        api.getProducts().catch(() => ({ data: [] })),
        api.getVehicles().catch(() => ({ data: [] })),
        api.getFactories().catch(() => ({ data: [] })),
        api.getSales({ limit: 50 }).catch(() => ({ data: [] }))
      ]);
      setClients(cRes.data || []);
      setProducts(pRes.data || []);
      setVehicles(vRes.data || []);
      setFactories(fRes.data || []);
      setSales(sRes.data || []);
    } catch (err) {
      console.error('Ошибка загрузки данных для поиска:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // 1. Разделы навигации
  const navigationItems = [
    { id: 'dashboard', title: 'Дашборд и Аналитика', category: 'Разделы', icon: LayoutDashboard, desc: 'Общая сводка, графики, KPI и схема процессов' },
    { id: 'warehouse', title: 'Склад и Квоты', category: 'Разделы', icon: Package, desc: 'Каталог марок цемента, тары и учет остатков' },
    { id: 'arrivals', title: 'Приход товаров', category: 'Разделы', icon: ArrowDownToLine, desc: 'Поступления цемента с заводов-изготовителей' },
    { id: 'sales', title: 'Продажи и Рейсы', category: 'Разделы', icon: ShoppingCart, desc: 'Оформление отгрузок, накладных и доставка' },
    { id: 'finances', title: 'Касса и Финансы', category: 'Разделы', icon: Wallet, desc: 'Приходные/расходные кассовые ордера, дебиторская задолженность' },
    { id: 'directories', title: 'Справочники системы', category: 'Разделы', icon: Settings, desc: 'База клиентов, автопарк, заводы и номенклатура' }
  ].filter(item => !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q));

  // 2. Клиенты
  const filteredClients = clients.filter(c =>
    !q || c.name.toLowerCase().includes(q) || (c.company_name && c.company_name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q))
  ).slice(0, 5);

  // 3. Товары
  const filteredProducts = products.filter(p =>
    !q || p.name.toLowerCase().includes(q) || (p.cement_grade && p.cement_grade.toLowerCase().includes(q))
  ).slice(0, 5);

  // 4. Машины
  const filteredVehicles = vehicles.filter(v =>
    !q || v.plate_number.toLowerCase().includes(q) || (v.driver_name && v.driver_name.toLowerCase().includes(q)) || (v.model && v.model.toLowerCase().includes(q))
  ).slice(0, 5);

  // 5. Продажи / накладные
  const filteredSales = sales.filter(s =>
    !q || String(s.id).includes(q) || (s.client_name && s.client_name.toLowerCase().includes(q)) || (s.vehicle_number && s.vehicle_number.toLowerCase().includes(q))
  ).slice(0, 5);

  const hasResults = navigationItems.length > 0 || filteredClients.length > 0 || filteredProducts.length > 0 || filteredVehicles.length > 0 || filteredSales.length > 0;

  const handleSelectTab = (tabId) => {
    onNavigate(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Search Palette Container */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl text-card-foreground overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150 z-10">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/20">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по системе: клиенты, товары, машины, накладные, разделы..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {/* Разделы навигации */}
          {navigationItems.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Разделы ERP
              </div>
              <div className="space-y-1">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">{item.title}</div>
                          <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Контрагенты / Клиенты */}
          {filteredClients.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                Клиенты и контрагенты ({filteredClients.length})
              </div>
              <div className="space-y-1">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectTab('directories')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                        К
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.company_name ? `${c.company_name} • ` : ''}{c.phone || 'Телефон не указан'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-semibold ${c.balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {formatCurrency(c.balance)}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Баланс</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Каталог товаров */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3 w-3" />
                Номенклатура и Цемент ({filteredProducts.length})
              </div>
              <div className="space-y-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectTab('warehouse')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                        Ц
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.category === 'cement' ? 'Цемент' : 'Материал'} • {p.packaging_type === 'bulk' ? 'Навал' : 'Мешки'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-foreground">{formatNumber(p.current_stock)} {p.unit}</div>
                      <span className="text-[10px] text-muted-foreground">{formatCurrency(p.selling_price)} / {p.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Автопарк */}
          {filteredVehicles.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3 w-3" />
                Автопарк и машины ({filteredVehicles.length})
              </div>
              <div className="space-y-1">
                {filteredVehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectTab('directories')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                        <Truck className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{v.plate_number}</div>
                        <div className="text-[11px] text-muted-foreground">{v.model || 'Тягач'} • {v.driver_name || 'Водитель не назначен'}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {v.capacity_tons ? `${v.capacity_tons} т` : '—'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Продажи / Накладные */}
          {filteredSales.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Сделки и накладные ({filteredSales.length})
              </div>
              <div className="space-y-1">
                {filteredSales.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectTab('sales')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold text-xs shrink-0">
                        #{s.id}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{s.client_name || 'Клиент'}</div>
                        <div className="text-[11px] text-muted-foreground">{s.date} • {formatNumber(s.tonnage)} т</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-foreground">{formatCurrency(s.total_amount)}</div>
                      <Badge variant={s.payment_status === 'paid' ? 'success' : s.payment_status === 'debt' ? 'destructive' : 'warning'} className="text-[10px]">
                        {s.payment_status === 'paid' ? 'Оплачено' : s.payment_status === 'debt' ? 'В долг' : 'Частично'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasResults && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Ничего не найдено по запросу «{query}»
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 px-4 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Нажмите на результат для быстрого перехода</span>
          <div className="flex items-center gap-2">
            <span>Навигация: <b>⌘K</b></span>
            <span>Закрыть: <b>ESC</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
