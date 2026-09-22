import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ShoppingCart,
  Wallet,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Shield,
  BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ activeTab, onSelectTab, isHidden, isCollapsed, onToggleCollapse, onHideSidebar, className }) {
  const { user } = useAuth();

  const menuGroups = [
    {
      title: 'Обзор',
      items: [
        {
          id: 'dashboard',
          label: 'Дашборд и Графы',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: 'Склад и Логистика',
      items: [
        {
          id: 'warehouse',
          label: 'Склад и Квоты',
          icon: Package
        },
        {
          id: 'arrivals',
          label: 'Приход товаров',
          icon: ArrowDownToLine
        },
        {
          id: 'sales',
          label: 'Продажи и Рейсы',
          icon: ShoppingCart
        }
      ]
    },
    {
      title: 'Финансы',
      items: [
        {
          id: 'finances',
          label: 'Касса и Долги',
          icon: Wallet
        }
      ]
    },
    {
      title: 'Система и Справка',
      items: [
        ...(user?.role === 'admin' ? [{
          id: 'users_audit',
          label: 'Пользователи и Аудит',
          icon: Shield
        }] : []),
        {
          id: 'directories',
          label: 'Справочники',
          icon: Settings
        },
        {
          id: 'knowledge',
          label: 'База знаний (Справка)',
          icon: BookOpen
        }
      ]
    }
  ];

  if (isHidden) {
    return null;
  }

  return (
    <aside
      className={cn(
        'border-r border-border/80 bg-card/90 backdrop-blur-md flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 select-none z-30 overflow-hidden h-full overflow-y-auto',
        isCollapsed ? 'w-16 p-2' : 'w-60 p-3',
        className
      )}
    >
      <div className="space-y-4 w-full">
        {/* Шапка бокового меню с кнопками сворачивания и скрытия */}
        <div className={cn('flex items-center justify-between px-1', isCollapsed && 'justify-center px-0')}>
          {!isCollapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Навигация
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isCollapsed ? 'Развернуть меню' : 'Компактный режим (иконки)'}
            >
              {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            {!isCollapsed && onHideSidebar && (
              <button
                onClick={onHideSidebar}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Спрятать меню (⌘B)"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Навигация с группировкой */}
        <nav className="space-y-3">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    id={`nav-${item.id}`}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center rounded-xl transition-all duration-150',
                      isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2 text-xs',
                      isActive
                        ? 'bg-primary/25 text-foreground font-semibold border border-primary/30 shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

    </aside>
  );
}
