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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground antialiased relative overflow-hidden">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
          className="rounded-full bg-card/70 backdrop-blur-md border border-border/60 hover:bg-card shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </Button>
      </div>

      {/* LEFT 50%: Interactive 3D WebGL Scene */}
      <div className="w-full lg:w-1/2 min-h-[420px] lg:min-h-screen relative bg-gradient-to-br from-muted/30 via-background to-primary/5 border-b lg:border-b-0 lg:border-r border-border/80 flex flex-col justify-center overflow-hidden">
        <Interactive3DScene />
      </div>

      {/* RIGHT 50%: Auth Form */}
      <div className="w-full lg:w-1/2 min-h-[500px] lg:min-h-screen flex flex-col justify-center items-center p-6 sm:p-12 z-10 bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
              <Factory className="h-4 w-4" />
              <span>ERP Цемент v4.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Вход в рабочий кабинет
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Автоматизированная система управления поставками, складом и логистикой
            </p>
          </div>

          {/* Login Card */}
          <Card className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/5">
            <CardHeader className="space-y-1.5 p-6 pb-4">
              <CardTitle className="text-lg font-bold tracking-tight">Авторизация</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Введите учетные данные сотрудника
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-6 pt-0">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Имя пользователя
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex h-10 w-full rounded-xl bg-muted/40 border-0 ring-1 ring-border/80 px-3.5 py-2 text-sm transition-all text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-card pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-10 w-full rounded-xl bg-muted/40 border-0 ring-1 ring-border/80 px-3.5 py-2 text-sm transition-all text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-card pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all shadow-xs"
                >
                  Войти в систему
                </Button>
              </form>

              <div className="pt-2">
                <div className="p-3 bg-muted/40 border border-border/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground block">Тестовые реквизиты администратора:</span>
                    <div className="font-mono text-xs font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary font-bold">admin</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>admin2026!</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('admin2026!');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                  >
                    Заполнить
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0 justify-center">
              <p className="text-[11px] text-muted-foreground text-center flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Безопасная защищенная сессия • Шифрование данных
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
