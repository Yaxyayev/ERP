import { X, LayoutDashboard, Package, ArrowDownToLine, ShoppingCart, Wallet, Settings, Factory, Shield, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function MobileNav({ isOpen, onClose, activeTab, onSelectTab }) {
  const { user } = useAuth();
  if (!isOpen) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд и Графы', icon: LayoutDashboard },
    { id: 'warehouse', label: 'Склад', icon: Package },
    { id: 'arrivals', label: 'Приход', icon: ArrowDownToLine },
    { id: 'sales', label: 'Продажи', icon: ShoppingCart },
    { id: 'finances', label: 'Финансы', icon: Wallet },
    ...(user?.role === 'admin' ? [{ id: 'users_audit', label: 'Пользователи и Аудит', icon: Shield }] : []),
    { id: 'directories', label: 'Справочники', icon: Settings },
    { id: 'knowledge', label: 'База знаний (Справка)', icon: BookOpen }
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-background border-r border-border p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-xs">
                <Factory className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">ERP ЦЕМЕНТ</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1">
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
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    isActive
                      ? 'bg-primary/20 text-foreground font-semibold border border-primary/30 shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="text-center text-[11px] text-muted-foreground pt-3 border-t border-border">
          ERP «Цемент» © 2026
        </div>
      </div>
    </div>
  );
}
