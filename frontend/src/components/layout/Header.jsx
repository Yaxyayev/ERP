import React, { useState } from 'react';
import { Sun, Moon, Database, Menu, CheckCircle2, AlertCircle, Loader2, LogOut, PanelLeftClose, PanelLeft, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Header({ theme, toggleTheme, onOpenMobileMenu, isSidebarHidden, onToggleSidebar, onOpenSearch }) {
  const { user, logout } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);

  const handleDownloadBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupMessage(null);
      const filename = await api.downloadBackup();
      setBackupMessage({ type: 'success', text: `Резервная копия сохранена: ${filename}` });
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err) {
      setBackupMessage({ type: 'error', text: err.message || 'Ошибка создания бэкапа' });
      setTimeout(() => setBackupMessage(null), 5000);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <header className="shrink-0 sticky top-0 z-40 w-full border-b border-hairline bg-background/95 backdrop-blur-xs px-3 sm:px-5 py-2 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu + Notion Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
            id="mobile-menu-btn"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center gap-1.5 p-1 px-1.5 rounded-md text-muted-foreground hover:bg-surface hover:text-foreground transition-colors border border-hairline"
            title={isSidebarHidden ? "Развернуть боковое меню (⌘B)" : "Свернуть боковое меню (⌘B)"}
            id="sidebar-toggle-btn"
          >
            {isSidebarHidden ? (
              <>
                <PanelLeft className="h-3.5 w-3.5 text-[#5645d4]" />
                <span className="text-[11px] font-medium">Меню</span>
              </>
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Notion Title & Breadcrumb */}
          <div className="flex items-center gap-1.5 pl-1 text-xs">
            <span className="font-semibold text-foreground tracking-tight">ERP Цемент</span>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-muted-foreground hidden sm:inline">Workspace</span>
          </div>
        </div>

        {/* Center: Search pill (DESIGN.md search-pill: surface bg, steel text, 8px rounded, 1px hairline) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:flex items-center text-xs text-[#787671] bg-surface hover:bg-[#eae8e5] dark:hover:bg-[#282828] rounded-md px-3 py-1.5 gap-2 border border-hairline w-64 lg:w-72 justify-between transition-colors text-left group cursor-pointer"
          title="Глобальный поиск (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs transition-colors">Поиск по системе...</span>
          </div>
          <kbd className="text-[10px] bg-background text-muted-foreground border border-hairline px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Backup Feedback */}
          {backupMessage && (
            <div
              className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border animate-in fade-in ${
                backupMessage.type === 'success'
                  ? 'bg-surface border-hairline text-foreground'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {backupMessage.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          {/* Backup Button (Notion Secondary Outline) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBackup}
            disabled={isBackingUp}
            id="backup-btn"
            className="h-[30px] px-2.5 text-xs font-medium"
            title="Скачать актуальный .sqlite файл базы данных"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Снапшот...</span>
              </>
            ) : (
              <>
                <Database className="mr-1.5 h-3 w-3 text-muted-foreground" />
                <span className="hidden sm:inline">Бэкап (.sqlite)</span>
                <span className="sm:hidden">Бэкап</span>
              </>
            )}
          </Button>

          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="h-[30px] w-[30px]"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            )}
          </Button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-hairline">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-foreground leading-none">{user.fullName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{user.roleTitle}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-[30px] w-[30px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Выйти из системы"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
