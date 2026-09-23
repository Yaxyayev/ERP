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
  BookOpen,
  Factory
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
      title: 'Склад и Производство',
      items: [
        {
          id: 'warehouse',
          label: 'Склад и Силосы',
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
      title: 'Система',
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
          label: 'База знаний (Wiki)',
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
        'border-r border-hairline bg-surface flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 select-none z-30 overflow-hidden h-full overflow-y-auto',
        isCollapsed ? 'w-14 p-2' : 'w-56 p-2.5',
        className
      )}
    >
      <div className="space-y-3 w-full">
        {/* Notion Workspace Header in Sidebar */}
        <div className={cn('flex items-center justify-between px-1.5 py-1', isCollapsed && 'justify-center px-0')}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-[4px] bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] flex items-center justify-center font-bold text-[10px] shrink-0">
                N
              </div>
              <span className="font-semibold text-xs tracking-tight text-foreground truncate">
                ERP Цемент
              </span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-[4px] bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] flex items-center justify-center font-bold text-xs shrink-0">
              N
            </div>
          )}

          <div className="flex items-center gap-0.5">
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-muted-foreground hover:bg-[#eae8e5] dark:hover:bg-[#2d2d2d] hover:text-foreground transition-colors"
              title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            >
              {isCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
            </button>
            {!isCollapsed && onHideSidebar && (
              <button
                onClick={onHideSidebar}
                className="p-1 rounded-md text-muted-foreground hover:bg-[#eae8e5] dark:hover:bg-[#2d2d2d] hover:text-foreground transition-colors"
                title="Спрятать меню (⌘B)"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Notion Sidebar Navigation Groups */}
        <nav className="space-y-3">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[11px] font-semibold text-steel/80 tracking-wide">
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
                      'w-full flex items-center rounded-md transition-colors duration-100 cursor-pointer',
                      isCollapsed ? 'justify-center p-2' : 'gap-2 px-2 py-1.5 text-xs',
                      isActive
                        ? 'bg-[#eae8e5] dark:bg-[#2d2d2d] text-foreground font-semibold'
                        : 'text-foreground/80 hover:bg-[#eae8e5]/60 dark:hover:bg-[#2d2d2d]/60 hover:text-foreground font-normal'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-[#5645d4]' : 'text-muted-foreground')} />
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

      {/* Notion Sidebar Footer: Workspace version */}
      {!isCollapsed && (
        <div className="px-2 py-1.5 text-[11px] text-muted-foreground border-t border-hairline/60 flex items-center justify-between">
          <span>Notion Workspace</span>
          <span className="font-mono text-[10px] opacity-75">v4.0</span>
        </div>
      )}
    </aside>
  );
}
