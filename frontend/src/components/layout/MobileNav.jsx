import { X, LayoutDashboard, Package, ArrowDownToLine, ShoppingCart, Wallet, Settings, Shield, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function MobileNav({ isOpen, onClose, activeTab, onSelectTab }) {
  const { user } = useAuth();
  if (!isOpen) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд и Графы', icon: LayoutDashboard },
    { id: 'warehouse', label: 'Склад и Силосы', icon: Package },
    { id: 'arrivals', label: 'Приход товаров', icon: ArrowDownToLine },
    { id: 'sales', label: 'Продажи и Рейсы', icon: ShoppingCart },
    { id: 'finances', label: 'Касса и Долги', icon: Wallet },
    ...(user?.role === 'admin' ? [{ id: 'users_audit', label: 'Пользователи и Аудит', icon: Shield }] : []),
    { id: 'directories', label: 'Справочники', icon: Settings },
    { id: 'knowledge', label: 'База знаний (Wiki)', icon: BookOpen }
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-surface border-r border-hairline p-3 flex flex-col justify-between shadow-notion-modal animate-in slide-in-from-left duration-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[4px] bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] flex items-center justify-center font-bold text-[10px]">
                N
              </div>
              <span className="font-semibold text-xs tracking-tight text-foreground">ERP Цемент</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:bg-card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-[#eae8e5] dark:bg-[#2d2d2d] text-foreground font-semibold'
                      : 'text-foreground/80 hover:bg-[#eae8e5]/60 dark:hover:bg-[#2d2d2d]/60 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-[#5645d4]' : 'text-muted-foreground')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pt-2 border-t border-hairline">
          Notion Workspace • ERP Цемент
        </div>
      </div>
    </div>
  );
}
