import React, { useState } from 'react';
import { Sun, Moon, Database, Menu, CheckCircle2, AlertCircle, Loader2, LogOut, User, PanelLeftClose, PanelLeft, Search, Factory } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
    <header className="shrink-0 sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu button + Brand + Collapse button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            id="mobile-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center gap-1.5 p-1.5 px-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/60"
            title={isSidebarHidden ? "Развернуть боковое меню (⌘B)" : "Свернуть боковое меню (⌘B)"}
            id="sidebar-toggle-btn"
          >
            {isSidebarHidden ? (
              <>
                <PanelLeft className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium">Меню</span>
              </>
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-xs">
              <Factory className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
                ERP ЦЕМЕНТ
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Documentation / Records (Clickable Command Palette trigger) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:flex items-center text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 rounded-xl px-3 py-1.5 gap-2 border border-border/60 w-64 lg:w-80 justify-between transition-colors text-left group"
          title="Глобальный поиск (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-muted-foreground group-hover:text-foreground text-xs transition-colors">Поиск по системе...</span>
          </div>
          <kbd className="text-[10px] bg-background text-muted-foreground border border-border/80 px-1.5 py-0.5 rounded font-mono shadow-2xs group-hover:border-primary/50 transition-colors">
            ⌘K
          </kbd>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backup Feedback Banner */}
          {backupMessage && (
            <div
              className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border animate-in fade-in ${
                backupMessage.type === 'success'
                  ? 'bg-muted border-border text-foreground'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {backupMessage.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          {/* Backup Button (Pure shadcn button) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBackup}
            disabled={isBackingUp}
            id="backup-btn"
            className="h-8 px-2.5 text-xs font-medium"
            title="Скачать актуальный .sqlite файл базы данных"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Снапшот...</span>
              </>
            ) : (
              <>
                <Database className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Бэкап базы (.sqlite)</span>
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
            className="h-8 w-8"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </Button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-foreground leading-none">{user.fullName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{user.roleTitle}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Выйти из системы"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
