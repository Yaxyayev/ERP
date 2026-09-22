import React, { useState } from 'react';
import {
  Factory,
  Ticket,
  Warehouse,
  Truck,
  Users,
  Wallet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  Fuel,
  Wrench,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatNumber } from '../../lib/utils';

export function ProcessGraph({ pipelineStats, turnover, profit, debts, onNavigate }) {
  const [selectedNode, setSelectedNode] = useState('tickets');

  const nodes = [
    {
      id: 'factories',
      title: '1. Заводы',
      icon: Factory,
      metric: `${pipelineStats?.factories || 3} завода`,
      submetric: 'Поставщики цемента',
      badge: 'Сырье',
      badgeVariant: 'outline',
      description: 'Кызылкумцемент, Навоийазот, Бекабадцемент. Первичные поставки по биржевым контрактам.'
    },
    {
      id: 'tickets',
      title: '2. Тикеты / Биржа',
      icon: Ticket,
      metric: `${formatNumber(pipelineStats?.tickets?.remaining_tonnage || 0)} т`,
      submetric: formatCurrency(pipelineStats?.tickets?.remaining_amount || 0),
      badge: `${pipelineStats?.tickets?.count || 0} квот`,
      badgeVariant: 'secondary',
      description: 'Электронные тикеты с завода. Списание квот при отгрузках. Возврат неиспользованных тикетов на брокерский счет.'
    },
    {
      id: 'warehouse',
      title: '3. Склад / Силосы',
      icon: Warehouse,
      metric: `${formatNumber(pipelineStats?.warehouse?.total_cement_stock || 0)} т`,
      submetric: `Навал: ${formatNumber(pipelineStats?.warehouse?.bulk_stock || 0)}т • Мешки: ${formatNumber(pipelineStats?.warehouse?.bag_stock || 0)}т`,
      badge: 'Остаток',
      badgeVariant: 'outline',
      description: 'Фактический склад цемента, мешков и добавок. Автоматическая блокировка отгрузок при нехватке остатков.'
    },
    {
      id: 'logistics',
      title: '4. Автопарк',
      icon: Truck,
      metric: `${pipelineStats?.fleet?.count || 0} машины`,
      submetric: `Выручка: ${formatCurrency(turnover?.logistics || 0)}`,
      badge: 'Логистика',
      badgeVariant: 'secondary',
      description: 'Собственные и наемные цементовозы. Учет путевых расходов: газ/топливо, запчасти, питание, зарплата водителя.'
    },
    {
      id: 'clients',
      title: '5. Покупатели',
      icon: Users,
      metric: `${formatNumber(turnover?.totalTonnage || 0)} т`,
      submetric: `Сделки: ${formatCurrency(turnover?.total || 0)}`,
      badge: `${pipelineStats?.clients || 0} клиентов`,
      badgeVariant: 'outline',
      description: 'Строительные организации, ЖБИ-заводы и оптовики. Оформление поставок с выбором условий оплаты.'
    },
    {
      id: 'finance',
      title: '6. Касса и Долги',
      icon: Wallet,
      metric: formatCurrency(profit?.total || 0),
      submetric: `Долги клиентов: ${formatCurrency(debts?.totalDebt || 0)}`,
      badge: debts?.debtorsCount ? `${debts.debtorsCount} должников` : 'Баланс',
      badgeVariant: debts?.totalDebt > 0 ? 'destructive' : 'secondary',
      description: 'Кассовый поток предприятия. Контроль дебиторской задолженности и погашение долговых обязательств.'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Visual Pipeline Graph: High contrast, clean shadcn style */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold">Схема процессов и движения ресурсов (ERP-граф)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Нажмите на любой этап технологической цепочки для просмотра параметров
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-muted-foreground">Активный поток</span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Responsive Node Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 relative">
            {nodes.map((node, idx) => {
              const Icon = node.icon;
              const isSelected = selectedNode === node.id;

              return (
                <div key={node.id} className="relative group">
                  <div
                    onClick={() => setSelectedNode(node.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all duration-150 h-full flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary/60 bg-primary/10 shadow-xs ring-1 ring-primary/30'
                        : 'border-border/80 bg-card hover:border-primary/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge variant={node.badgeVariant} className="text-[10px] px-1.5 py-0">
                          {node.badge}
                        </Badge>
                      </div>

                      <div className="text-xs font-semibold text-foreground tracking-tight">
                        {node.title}
                      </div>

                      <div className="mt-1 text-sm font-bold text-foreground truncate">
                        {node.metric}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground truncate">
                      {node.submetric}
                    </div>
                  </div>

                  {/* Flow Arrow (visible on larger screens between nodes) */}
                  {idx < nodes.length - 1 && (
                    <div className="hidden xl:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/40 pointer-events-none">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Node Details Drawer */}
          {selectedNode && (
            <div className="mt-4 p-3.5 rounded-lg border border-border bg-muted/40 text-xs">
              {nodes.map(n => {
                if (n.id !== selectedNode) return null;
                const Icon = n.icon;
                return (
                  <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-md bg-background border border-border shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{n.title}</span>
                          <span className="text-muted-foreground font-normal">• {n.metric}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 leading-relaxed max-w-3xl">
                          {n.description}
                        </p>
                      </div>
                    </div>

                    {onNavigate && (
                      <button
                        onClick={() => {
                          if (n.id === 'factories' || n.id === 'clients') onNavigate('directories');
                          else if (n.id === 'tickets' || n.id === 'warehouse') onNavigate('warehouse');
                          else if (n.id === 'logistics' || n.id === 'clients') onNavigate('sales');
                          else if (n.id === 'finance') onNavigate('finances');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground font-medium text-xs self-start sm:self-center shrink-0 transition-colors"
                      >
                        <span>Перейти в модуль</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
