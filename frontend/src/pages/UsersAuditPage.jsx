import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Activity, UserPlus, Search, 
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, 
  Download, Edit2, Trash2, Lock, Eye, LogIn, 
  ShoppingBag, Truck, DollarSign, ChevronRight, X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { api } from '../api/client';

export default function UsersAuditPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit'
  
  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'operator',
    role_title: '',
    phone: ''
  });
  const [userFormError, setUserFormError] = useState('');
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState({ total_today: 0, logins_today: 0, security_alerts: 0, operations_today: 0 });
  const [auditFilters, setAuditFilters] = useState({ actions: [], users: [] });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Toast / notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      showNotification('error', err.message || 'Ошибка загрузки пользователей');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Audit Logs
  const loadAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await api.getAuditLogs({
        search: auditSearch,
        action: selectedAction,
        username: selectedUser,
        limit: 150
      });
      if (res.success) {
        setAuditLogs(res.data || []);
        if (res.stats) setAuditStats(res.stats);
        if (res.filters) setAuditFilters(res.filters);
      }
    } catch (err) {
      showNotification('error', err.message || 'Ошибка загрузки журнала аудита');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadAudit();
    }
  }, [activeTab, selectedAction, selectedUser]);

  // Handle user create / edit
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      full_name: '',
      role: 'operator',
      role_title: 'Оператор склада',
      phone: ''
    });
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: '',
      full_name: u.full_name,
      role: u.role,
      role_title: u.role_title || '',
      phone: u.phone || ''
    });
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserFormError('');

    if (!userForm.full_name.trim()) {
      setUserFormError('Укажите ФИО сотрудника');
      return;
    }

    if (!editingUser && (!userForm.username.trim() || !userForm.password.trim())) {
      setUserFormError('Укажите логин и пароль');
      return;
    }

    try {
      setUserSubmitting(true);
      if (editingUser) {
        const updatePayload = {
          full_name: userForm.full_name.trim(),
          role: userForm.role,
          role_title: userForm.role_title.trim(),
          phone: userForm.phone.trim()
        };
        if (userForm.password.trim()) {
          updatePayload.password = userForm.password.trim();
        }
        await api.updateUser(editingUser.id, updatePayload);
        showNotification('success', `Данные пользователя @${editingUser.username} обновлены`);
      } else {
        await api.createUser(userForm);
        showNotification('success', `Пользователь @${userForm.username} успешно создан`);
      }
      setUserModalOpen(false);
      loadUsers();
    } catch (err) {
      setUserFormError(err.message || 'Ошибка сохранения данных');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (u) => {
    if (u.username === 'admin') {
      showNotification('error', 'Главного администратора нельзя заблокировать');
      return;
    }
    const newStatus = u.status === 'active' ? 'blocked' : 'active';
    const confirmMsg = newStatus === 'blocked'
      ? `Заблокировать доступ пользователю ${u.full_name} (@${u.username})?`
      : `Разблокировать доступ пользователю ${u.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUser(u.id, { status: newStatus });
      showNotification('success', `Статус пользователя изменен на: ${newStatus === 'active' ? 'Активен' : 'Заблокирован'}`);
      loadUsers();
    } catch (err) {
      showNotification('error', err.message || 'Ошибка обновления статуса');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.username === 'admin' || u.id === 1) {
      showNotification('error', 'Главного администратора нельзя удалить');
      return;
    }

    if (!window.confirm(`Вы действительно хотите безвозвратно удалить аккаунт ${u.full_name} (@${u.username})?`)) {
      return;
    }

    try {
      await api.deleteUser(u.id);
      showNotification('success', `Пользователь @${u.username} удален`);
      loadUsers();
    } catch (err) {
      showNotification('error', err.message || 'Ошибка удаления');
    }
  };

  // Export audit to CSV
  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) {
      showNotification('error', 'Журнал аудита пуст для экспорта');
      return;
    }

    const headers = ['ID', 'Дата и время', 'Пользователь', 'Событие', 'Объект', 'Описание', 'IP'];
    const rows = auditLogs.map(l => [
      l.id,
      `"${l.created_at || l.timestamp || ''}"`,
      `"${l.username || 'система'}"`,
      `"${l.action || ''}"`,
      `"${(l.entity || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ip || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Журнал аудита успешно экспортирован в CSV');
  };

  // Role Badge
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 bg-indigo-500/10 text-[11px] font-medium">
            <Shield className="w-3 h-3 mr-1" />
            Администратор
          </Badge>
        );
      case 'operator':
        return (
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[11px] font-medium">
            <Truck className="w-3 h-3 mr-1" />
            Оператор склада
          </Badge>
        );
      case 'accountant':
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[11px] font-medium">
            <DollarSign className="w-3 h-3 mr-1" />
            Бухгалтер
          </Badge>
        );
      case 'viewer':
      default:
        return (
          <Badge variant="outline" className="border-border text-muted-foreground text-[11px]">
            <Eye className="w-3 h-3 mr-1" />
            Наблюдатель
          </Badge>
        );
    }
  };

  // Action Badge for Audit Log
  const renderActionBadge = (action) => {
    if (action.startsWith('LOGIN_SUCCESS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Вход в систему
        </span>
      );
    }
    if (action.startsWith('LOGIN_FAILED') || action.startsWith('LOGIN_BLOCKED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-destructive/15 text-destructive border border-destructive/30">
          <AlertTriangle className="w-3 h-3" /> Ошибка входа
        </span>
      );
    }
    if (action.startsWith('SALE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <ShoppingBag className="w-3 h-3" /> Продажа
        </span>
      );
    }
    if (action.startsWith('ARRIVAL') || action.startsWith('TICKET')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Truck className="w-3 h-3" /> Склад / Тикет
        </span>
      );
    }
    if (action.startsWith('FINANCE') || action.startsWith('DEBT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30">
          <DollarSign className="w-3 h-3" /> Касса / Долг
        </span>
      );
    }
    if (action.startsWith('USER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          <Users className="w-3 h-3" /> Пользователи
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
        <Activity className="w-3 h-3" /> {action}
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium animate-in fade-in ${
            feedback.type === 'error'
              ? 'bg-destructive/10 border-destructive/20 text-destructive'
              : 'bg-muted border-border text-foreground'
          }`}
        >
          {feedback.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Пользователи и Аудит
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Управление учетными записями персонала и журнал всех действий в системе
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted p-1 text-muted-foreground text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Пользователи ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'hover:text-foreground'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Журнал аудита
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
              Live
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Top KPI row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <Card className="border-border p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Всего аккаунтов</span>
                <p className="text-xl font-bold text-foreground mt-0.5">{users.length}</p>
              </Card>
              <Card className="border-border p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Активных</span>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </Card>
              <Card className="border-border p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Администраторов</span>
                <p className="text-xl font-bold text-indigo-400 mt-0.5">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </Card>
              <Card className="border-border p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground">Операторы & Касса</span>
                <p className="text-xl font-bold text-primary mt-0.5">
                  {users.filter(u => u.role === 'operator' || u.role === 'accountant').length}
                </p>
              </Card>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="icon"
                onClick={loadUsers}
                disabled={usersLoading}
                className="h-8 w-8"
                title="Обновить список"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleOpenCreateUser}
                className="h-8 px-3 text-xs font-medium"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Добавить пользователя
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium bg-muted/30">
                      <th className="py-2.5 px-4">Сотрудник / ФИО</th>
                      <th className="py-2.5 px-3">Логин</th>
                      <th className="py-2.5 px-3">Роль доступа</th>
                      <th className="py-2.5 px-3">Телефон</th>
                      <th className="py-2.5 px-3">Последний вход</th>
                      <th className="py-2.5 px-3">Статус</th>
                      <th className="py-2.5 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersLoading && users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-muted-foreground">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                          Загрузка пользователей...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-muted-foreground">
                          Пользователи не найдены
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-muted border border-border text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                                {u.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{u.full_name}</div>
                                <div className="text-[11px] text-muted-foreground">{u.role_title || 'Сотрудник'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                              @{u.username}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {renderRoleBadge(u.role)}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {u.phone || '—'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {u.last_login ? u.last_login : 'Не входил'}
                          </td>
                          <td className="py-3 px-3">
                            {u.status === 'active' ? (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Активен
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 text-[10px]">
                                <XCircle className="w-3 h-3 mr-1" /> Заблокирован
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Редактировать пользователя"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {u.username !== 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`p-1 rounded-md transition-colors ${
                                      u.status === 'active' 
                                        ? 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
                                        : 'text-muted-foreground hover:text-emerald-500 hover:bg-muted'
                                    }`}
                                    title={u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                                    title="Удалить аккаунт"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: AUDIT & ACTIVITY LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Событий за сегодня</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{auditStats.total_today || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-4 h-4" />
              </div>
            </Card>

            <Card className="border-border p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Входов в систему</p>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">{auditStats.logins_today || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <LogIn className="w-4 h-4" />
              </div>
            </Card>

            <Card className="border-border p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Склад и Продажи</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{auditStats.operations_today || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </Card>

            <Card className="border-border p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Предупреждений / Сбоев</p>
                <p className="text-xl font-bold text-destructive mt-0.5">{auditStats.security_alerts || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </Card>
          </div>

          {/* Search, Filters & Export */}
          <Card className="border-border">
            <CardContent className="p-3.5 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAudit()}
                    placeholder="Поиск по действию, объекту или IP..."
                    className="flex h-8 w-full rounded-lg border border-input bg-card px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 pl-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Все типы действий</option>
                  <option value="LOGIN_SUCCESS">Вход в систему</option>
                  <option value="LOGIN_FAILED">Ошибка входа</option>
                  <option value="SALE_CREATE">Оформление сделок</option>
                  <option value="ARRIVAL_CREATE">Оприходование склада</option>
                  <option value="TICKET_RETURN">Возврат тикетов</option>
                  <option value="FINANCE_INCOME">Приход в кассу</option>
                  <option value="FINANCE_EXPENSE">Расход из кассы</option>
                  <option value="DEBT_REPAY">Погашение долгов</option>
                  <option value="USER_CREATE">Создание пользователей</option>
                </select>

                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Все пользователи</option>
                  {auditFilters.users.map(u => (
                    <option key={u} value={u}>@{u}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAudit}
                  disabled={auditLoading}
                  className="h-8 px-2.5 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${auditLoading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAuditCSV}
                  className="h-8 px-2.5 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Table */}
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium bg-muted/30">
                      <th className="py-2.5 px-4">Время</th>
                      <th className="py-2.5 px-3">Пользователь</th>
                      <th className="py-2.5 px-3">Тип действия</th>
                      <th className="py-2.5 px-3">Объект</th>
                      <th className="py-2.5 px-3">Детали операции</th>
                      <th className="py-2.5 px-3">IP адрес</th>
                      <th className="py-2.5 px-4 text-right">Инфо</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLoading && auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-muted-foreground">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                          Загрузка журнала аудита...
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-muted-foreground">
                          Записи аудита не найдены
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr 
                          key={log.id} 
                          className="hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedLogDetail(log)}
                        >
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {log.created_at || log.timestamp}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-foreground text-[11px] bg-muted px-2 py-0.5 rounded border border-border">
                              @{log.username || 'система'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {renderActionBadge(log.action)}
                          </td>
                          <td className="py-3 px-3 font-medium text-foreground">
                            {log.entity || '—'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground max-w-md truncate">
                            {log.details || '—'}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {log.ip || '127.0.0.1'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLogDetail(log);
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Подробнее"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* USER MODAL (CREATE / EDIT) */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `Редактирование @${editingUser.username}` : 'Создание нового пользователя'}
        description="Заполните учетные данные и права доступа сотрудника"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {userFormError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{userFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              ФИО сотрудника <span className="text-destructive">*</span>
            </label>
            <Input
              required
              placeholder="Например: Азиз Рахимов"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Логин в системе <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="a.rakhimov"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().trim() })}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              {editingUser ? 'Новый пароль (оставьте пустым, если не меняется)' : 'Пароль *'}
            </label>
            <Input
              type="password"
              placeholder={editingUser ? '••••••••' : 'Задайте надежный пароль'}
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Роль доступа</label>
              <select
                value={userForm.role}
                onChange={(e) => {
                  const r = e.target.value;
                  setUserForm({
                    ...userForm,
                    role: r,
                    role_title: r === 'admin' ? 'Администратор' : r === 'operator' ? 'Оператор склада' : r === 'accountant' ? 'Бухгалтер' : 'Наблюдатель'
                  });
                }}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="operator">Оператор склада</option>
                <option value="accountant">Бухгалтер</option>
                <option value="admin">Администратор</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Должность</label>
              <Input
                placeholder="Старший смены"
                value={userForm.role_title}
                onChange={(e) => setUserForm({ ...userForm, role_title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Контактный телефон</label>
            <Input
              placeholder="+998 90 000-00-00"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={userSubmitting}
            >
              {userSubmitting ? 'Сохранение...' : editingUser ? 'Сохранить изменения' : 'Создать пользователя'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* AUDIT LOG DETAIL MODAL */}
      <Modal
        isOpen={!!selectedLogDetail}
        onClose={() => setSelectedLogDetail(null)}
        title={`Детали записи аудита #${selectedLogDetail?.id}`}
        description="Полная техническая информация о зарегистрированном действии"
        maxWidth="max-w-lg"
      >
        {selectedLogDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Дата и точное время:</span>
                <p className="font-mono font-semibold text-foreground mt-0.5">
                  {selectedLogDetail.created_at || selectedLogDetail.timestamp}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Пользователь:</span>
                <p className="font-semibold text-primary mt-0.5">
                  @{selectedLogDetail.username || 'система'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Тип действия:</span>
                <div className="mt-1">{renderActionBadge(selectedLogDetail.action)}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">IP адрес клиента:</span>
                <p className="font-mono text-muted-foreground mt-1">
                  {selectedLogDetail.ip || '127.0.0.1'}
                </p>
              </div>
            </div>

            <div className="pb-3 border-b border-border">
              <span className="text-muted-foreground block text-[11px]">Затронутый объект / Сущность:</span>
              <p className="font-medium text-foreground mt-0.5">
                {selectedLogDetail.entity || '—'}
              </p>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Полный текст операции:</span>
              <div className="mt-1 p-3 bg-muted border border-border rounded-xl font-mono text-[11px] text-foreground break-words leading-relaxed">
                {selectedLogDetail.details || 'Детали отсутствуют'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLogDetail(null)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
