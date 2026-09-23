import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Страницы
import { DashboardPage } from './pages/DashboardPage';
import { WarehousePage } from './pages/WarehousePage';
import { ArrivalsPage } from './pages/ArrivalsPage';
import { SalesPage } from './pages/SalesPage';
import { FinancePage } from './pages/FinancePage';
import { DirectoriesPage } from './pages/DirectoriesPage';
import UsersAuditPage from './pages/UsersAuditPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';

function AppContent({ theme, toggleTheme }) {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Состояние видимости бокового меню (прячущееся меню)
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  // Компактный режим (иконки vs полная ширина)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('erp-sidebar-collapsed') === 'true';
  });

  const toggleSidebarHidden = () => {
    setIsSidebarHidden(prev => !prev);
  };

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('erp-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Горячие клавиши: Cmd+B (меню), Cmd+K (поиск)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarHidden();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Если пользователь не авторизован - показываем форму логина
  if (!isAuthenticated) {
    return <LoginPage theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground antialiased transition-colors duration-200 overflow-hidden">
      {/* Шапка с профилем пользователя, поиском, темой, кнопкой скрытия меню и бэкапом */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        isSidebarHidden={isSidebarHidden}
        onToggleSidebar={toggleSidebarHidden}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Прячущаяся боковая панель для десктопа (строго фиксированная по высоте) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isHidden={isSidebarHidden}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onHideSidebar={() => setIsSidebarHidden(true)}
          className="hidden lg:flex"
        />

        {/* Мобильная шторка */}
        <MobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Рабочая область страницы со своим независимым скроллом */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full transition-all">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'warehouse' && (
            <WarehousePage onNavigateToArrivals={() => setActiveTab('arrivals')} />
          )}
          {activeTab === 'arrivals' && <ArrivalsPage />}
          {activeTab === 'sales' && <SalesPage />}
          {activeTab === 'finances' && <FinancePage />}
          {activeTab === 'directories' && <DirectoriesPage />}
          {activeTab === 'users_audit' && <UsersAuditPage currentUser={user} />}
          {activeTab === 'knowledge' && <KnowledgeBasePage />}
        </main>
      </div>

      {/* Модальное окно глобального поиска Command Palette */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
      />
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('erp-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('erp-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthProvider>
      <AppContent theme={theme} toggleTheme={toggleTheme} />
    </AuthProvider>
  );
}
