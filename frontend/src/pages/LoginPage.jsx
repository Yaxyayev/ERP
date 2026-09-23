import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Interactive3DScene } from '../components/common/Interactive3DScene';
import { Lock, User, AlertCircle, ShieldCheck, Sun, Moon, Factory } from 'lucide-react';

export function LoginPage({ theme, toggleTheme }) {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-canvas text-foreground antialiased relative overflow-hidden">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
          className="rounded-md bg-canvas/80 backdrop-blur-md border border-hairline text-steel hover:text-foreground h-8 w-8"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-brand-yellow" />
          ) : (
            <Moon className="h-4 w-4 text-charcoal" />
          )}
        </Button>
      </div>

      {/* LEFT 50%: Notion Deep Navy Hero Band (#0a1530) with 3D Scene */}
      <div className="w-full lg:w-1/2 min-h-[420px] lg:min-h-screen relative bg-[#0a1530] border-b lg:border-b-0 lg:border-r border-[#1a2a52] flex flex-col justify-center overflow-hidden">
        {/* Decorative sticky-note pastel tags overlay */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2 pointer-events-none">
          <span className="notion-tag notion-tag-mint text-xs font-medium px-2.5 py-1 rounded">
            Склад: 89% заполнение
          </span>
          <span className="notion-tag notion-tag-peach text-xs font-medium px-2.5 py-1 rounded">
            ТТН #1042 активна
          </span>
        </div>

        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 pointer-events-none hidden sm:flex">
          <span className="notion-tag notion-tag-lavender text-xs font-medium px-2.5 py-1 rounded">
            Биржевые квоты
          </span>
          <span className="notion-tag notion-tag-sky text-xs font-medium px-2.5 py-1 rounded">
            Цементовозы онлайн
          </span>
        </div>

        <Interactive3DScene />
      </div>

      {/* RIGHT 50%: Notion Workspace Login Form */}
      <div className="w-full lg:w-1/2 min-h-[500px] lg:min-h-screen flex flex-col justify-center items-center p-6 sm:p-12 z-10 bg-canvas">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2.5">
              {/* Notion N logo */}
              <div className="h-8 w-8 rounded-md bg-[#1a1a1a] dark:bg-[#e3e2de] text-white dark:text-[#1a1a1a] flex items-center justify-center font-bold text-base shadow-2xs font-serif">
                N
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-steel">
                ERP Цемент • Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal dark:text-foreground">
              Вход в рабочее пространство
            </h1>
            <p className="text-xs sm:text-sm text-steel">
              Автоматизированная система управления поставками, складом и логистикой
            </p>
          </div>

          {/* Login Card */}
          <Card className="rounded-lg border border-hairline bg-surface shadow-notion-card">
            <CardHeader className="space-y-1 p-5 pb-3">
              <CardTitle className="text-base font-semibold text-charcoal dark:text-foreground">Авторизация</CardTitle>
              <CardDescription className="text-xs text-steel">
                Введите учетные данные сотрудника
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-5 pt-0">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-tint-rose border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal dark:text-foreground block">
                    Имя пользователя
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-steel" />
                    <input
                      type="text"
                      required
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex h-10 w-full rounded-md bg-canvas border border-hairline-strong px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary pl-9 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal dark:text-foreground block">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-steel" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-10 w-full rounded-md bg-canvas border border-hairline-strong px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary pl-9 transition-colors"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full h-10 rounded-md bg-primary text-white hover:bg-primary-pressed font-medium text-sm transition-colors"
                >
                  Войти в систему
                </Button>
              </form>

              <div className="pt-2">
                <div className="p-3 bg-canvas border border-hairline rounded-md flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-steel block">Тестовые реквизиты администратора:</span>
                    <div className="font-mono text-xs font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary font-bold">admin</span>
                      <span className="text-steel/50">•</span>
                      <span>admin2026!</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('admin2026!');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-tint-lavender text-primary hover:bg-tint-lavender/80 transition-colors"
                  >
                    Заполнить
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0 pb-4 justify-center border-t border-hairline mt-2 pt-3">
              <p className="text-[11px] text-steel text-center flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
                Безопасная защищенная сессия • Шифрование данных
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
