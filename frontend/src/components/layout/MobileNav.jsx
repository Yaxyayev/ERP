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
        className="fixed inset-0 notion-modal-backdrop transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-surface/95 backdrop-blur-xl border-r border-hairline p-3 flex flex-col justify-between shadow-notion-modal animate-in slide-in-from-left duration-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                N
              </div>
              <span className="font-semibold text-xs tracking-tight text-charcoal dark:text-foreground">ERP Цемент</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-steel hover:bg-card hover:text-foreground transition-colors shrink-0"
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
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer group',
                    isActive
                      ? 'bg-[#ede9e3] dark:bg-[#2d2d2c] text-charcoal dark:text-foreground font-semibold shadow-2xs'
                      : 'text-charcoal/80 dark:text-foreground/80 hover:bg-[#efedea]/70 dark:hover:bg-[#2d2d2c]/60 hover:text-foreground font-normal'
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-tint-lavender text-primary"
                      : "text-steel group-hover:text-charcoal dark:group-hover:text-foreground group-hover:bg-white/60 dark:group-hover:bg-white/10"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">{item.label}</span>
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
