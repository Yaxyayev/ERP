import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Activity, UserPlus, Search, 
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, 
  Download, Edit2, Trash2, Lock, Eye, LogIn, 
  ShoppingBag, Truck, DollarSign, ChevronRight, X, Database
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ResetDatabaseModal } from '../components/common/ResetDatabaseModal';
import { api } from '../api/client';

export default function UsersAuditPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit' | 'database'
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
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

  // Role Badge (Notion Pastel Tags)
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="lavender">
            <Shield className="w-3 h-3 mr-1 inline" />
            Администратор
          </Badge>
        );
      case 'operator':
        return (
          <Badge variant="sky">
            <Truck className="w-3 h-3 mr-1 inline" />
            Оператор склада
          </Badge>
        );
      case 'accountant':
        return (
          <Badge variant="mint">
            <DollarSign className="w-3 h-3 mr-1 inline" />
            Бухгалтер
          </Badge>
        );
      case 'viewer':
      default:
        return (
          <Badge variant="gray">
            <Eye className="w-3 h-3 mr-1 inline" />
            Наблюдатель
          </Badge>
        );
    }
  };

  // Action Badge for Audit Log (Notion Pastel Tags)
  const renderActionBadge = (action) => {
    if (action.startsWith('LOGIN_SUCCESS')) {
      return (
        <Badge variant="mint">
          <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Вход в систему
        </Badge>
      );
    }
    if (action.startsWith('LOGIN_FAILED') || action.startsWith('LOGIN_BLOCKED')) {
      return (
        <Badge variant="rose">
          <AlertTriangle className="w-3 h-3 mr-1 inline" /> Ошибка входа
        </Badge>
      );
    }
    if (action.startsWith('SALE')) {
      return (
        <Badge variant="sky">
          <ShoppingBag className="w-3 h-3 mr-1 inline" /> Продажа
        </Badge>
      );
    }
    if (action.startsWith('ARRIVAL') || action.startsWith('TICKET')) {
      return (
        <Badge variant="peach">
          <Truck className="w-3 h-3 mr-1 inline" /> Склад / Тикет
        </Badge>
      );
    }
    if (action.startsWith('FINANCE') || action.startsWith('DEBT')) {
      return (
        <Badge variant="mint">
          <DollarSign className="w-3 h-3 mr-1 inline" /> Касса / Долг
        </Badge>
      );
    }
    if (action.startsWith('USER')) {
      return (
        <Badge variant="lavender">
          <Users className="w-3 h-3 mr-1 inline" /> Пользователи
        </Badge>
      );
    }
    return (
      <Badge variant="gray">
        <Activity className="w-3 h-3 mr-1 inline" /> {action}
      </Badge>
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
          <h1 className="text-xl font-bold tracking-tight text-charcoal dark:text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Пользователи и Аудит
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Управление учетными записями персонала и журнал всех действий в системе
          </p>
        </div>

        {/* Tab Switcher (Notion Pill-tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`pill-tab ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            Пользователи ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pill-tab ${activeTab === 'audit' ? 'active' : ''}`}
          >
            <Activity className="w-3.5 h-3.5 inline mr-1.5" />
            Журнал аудита
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-tint-mint text-emerald-600 dark:text-emerald-300">
              Live
            </span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pill-tab ${activeTab === 'database' ? 'active' : ''}`}
          >
            <Database className="w-3.5 h-3.5 inline mr-1.5" />
            База данных и Сброс
          </button>
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Top KPI row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card">
                <span className="text-[11px] font-medium text-steel">Всего аккаунтов</span>
                <p className="text-xl font-bold text-charcoal dark:text-foreground mt-0.5">{users.length}</p>
              </Card>
              <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card">
                <span className="text-[11px] font-medium text-steel">Активных</span>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </Card>
              <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card">
                <span className="text-[11px] font-medium text-steel">Администраторов</span>
                <p className="text-xl font-bold text-primary mt-0.5">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </Card>
              <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card">
                <span className="text-[11px] font-medium text-steel">Операторы & Касса</span>
                <p className="text-xl font-bold text-charcoal dark:text-foreground mt-0.5">
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
                className="h-8 w-8 rounded-md"
                title="Обновить список"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleOpenCreateUser}
                className="h-8 px-3 text-xs font-medium rounded-md"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Добавить пользователя
              </Button>
            </div>
          </div>

          {/* Users Table (Notion Database Table) */}
          <Card className="border-hairline rounded-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-surface text-steel font-medium">
                      <th className="py-2.5 px-4">Сотрудник / ФИО</th>
                      <th className="py-2.5 px-3">Логин</th>
                      <th className="py-2.5 px-3">Роль доступа</th>
                      <th className="py-2.5 px-3">Телефон</th>
                      <th className="py-2.5 px-3">Последний вход</th>
                      <th className="py-2.5 px-3">Статус</th>
                      <th className="py-2.5 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {usersLoading && users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-steel">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                          Загрузка пользователей...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-steel">
                          Пользователи не найдены
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-surface/60 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-tint-lavender text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {u.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-charcoal dark:text-foreground">{u.full_name}</div>
                                <div className="text-[11px] text-steel">{u.role_title || 'Сотрудник'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[11px] font-medium text-charcoal dark:text-foreground bg-surface px-1.5 py-0.5 rounded border border-hairline">
                              @{u.username}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {renderRoleBadge(u.role)}
                          </td>
                          <td className="py-2.5 px-3 text-steel">
                            {u.phone || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-steel">
                            {u.last_login ? u.last_login : 'Не входил'}
                          </td>
                          <td className="py-2.5 px-3">
                            {u.status === 'active' ? (
                              <Badge variant="mint">
                                <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Активен
                              </Badge>
                            ) : (
                              <Badge variant="rose">
                                <XCircle className="w-3 h-3 mr-1 inline" /> Заблокирован
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditUser(u)}
                                className="h-7 w-7 rounded-md text-steel hover:text-foreground"
                                title="Редактировать пользователя"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              {u.username !== 'admin' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`h-7 w-7 rounded-md ${
                                      u.status === 'active' 
                                        ? 'text-steel hover:text-amber-500'
                                        : 'text-steel hover:text-emerald-500'
                                    }`}
                                    title={u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteUser(u)}
                                    className="h-7 w-7 rounded-md text-steel hover:text-destructive"
                                    title="Удалить аккаунт"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
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
            <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-steel">Событий за сегодня</p>
                <p className="text-xl font-bold text-charcoal dark:text-foreground mt-0.5">{auditStats.total_today || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-tint-lavender flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
            </Card>

            <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-steel">Входов в систему</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{auditStats.logins_today || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-tint-mint flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                <LogIn className="w-4 h-4" />
              </div>
            </Card>

            <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-steel">Склад и Продажи</p>
                <p className="text-xl font-bold text-charcoal dark:text-foreground mt-0.5">{auditStats.operations_today || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-tint-sky flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-2xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </Card>

            <Card className="border-hairline rounded-lg p-3.5 shadow-notion-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-steel">Предупреждений / Сбоев</p>
                <p className="text-xl font-bold text-destructive mt-0.5">{auditStats.security_alerts || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-tint-rose flex items-center justify-center text-destructive shrink-0 shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </Card>
          </div>

          {/* Search, Filters & Export */}
          <Card className="border-hairline rounded-lg shadow-notion-card">
            <CardContent className="p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAudit()}
                    placeholder="Поиск по действию, объекту или IP..."
                    className="flex h-8 w-full rounded-md border border-hairline bg-surface px-3 py-1 text-xs text-charcoal dark:text-foreground placeholder:text-steel pl-8 focus-visible:outline-none focus:border-primary"
                  />
                </div>

                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="h-8 rounded-md border border-hairline bg-surface px-2.5 text-xs text-charcoal dark:text-foreground focus:outline-none focus:border-primary"
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
                  className="h-8 rounded-md border border-hairline bg-surface px-2.5 text-xs text-charcoal dark:text-foreground focus:outline-none focus:border-primary"
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
                  className="h-8 px-2.5 text-xs rounded-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${auditLoading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAuditCSV}
                  className="h-8 px-2.5 text-xs rounded-md text-emerald-600 dark:text-emerald-400 border-hairline hover:bg-tint-mint"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Table (Notion Database Table) */}
          <Card className="border-hairline rounded-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-surface text-steel font-medium">
                      <th className="py-2.5 px-4">Время</th>
                      <th className="py-2.5 px-3">Пользователь</th>
                      <th className="py-2.5 px-3">Тип действия</th>
                      <th className="py-2.5 px-3">Объект</th>
                      <th className="py-2.5 px-3">Детали операции</th>
                      <th className="py-2.5 px-3">IP адрес</th>
                      <th className="py-2.5 px-4 text-right">Инфо</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {auditLoading && auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-steel">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                          Загрузка журнала аудита...
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-steel">
                          Записи аудита не найдены
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr 
                          key={log.id} 
                          className="hover:bg-surface/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedLogDetail(log)}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] text-steel whitespace-nowrap">
                            {log.created_at || log.timestamp}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-charcoal dark:text-foreground text-[11px] bg-surface px-1.5 py-0.5 rounded border border-hairline">
                              @{log.username || 'система'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {renderActionBadge(log.action)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-charcoal dark:text-foreground">
                            {log.entity || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-steel max-w-md truncate">
                            {log.details || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-steel whitespace-nowrap">
                            {log.ip || '127.0.0.1'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLogDetail(log);
                              }}
                              className="h-7 w-7 rounded-md text-steel hover:text-foreground"
                              title="Подробнее"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
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

      {/* TAB 3: DATABASE & RESET */}
      {activeTab === 'database' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Резервное копирование */}
            <Card className="border-border">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-tint-mint text-emerald-600 dark:text-emerald-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Резервная копия базы данных</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Мгновенное скачивание файла .sqlite на ваш компьютер
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Система использует атомарный SQLite Backup API без остановки сервера. Скачанный файл содержит 100% актуальных данных и может использоваться для точки восстановления.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const filename = await api.downloadBackup();
                      showNotification('success', `Бэкап сохранен: ${filename}`);
                    } catch (e) {
                      showNotification('error', e.message);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-xs h-9"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Скачать актуальный бэкап (.sqlite)
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Полный сброс и обнуление данных */}
            <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10">
              <CardHeader className="p-4 pb-2 border-b border-rose-200/60 dark:border-rose-900/40">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-tint-rose text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-destructive">Полное обнуление данных в БД</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Очистка всех продаж, приходов, остатков и контрагентов
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Позволяет быстро очистить базу без подключения по SSH к серверу. Учетная запись <code className="font-mono bg-background px-1 py-0.5 rounded border border-hairline text-foreground">admin</code> будет сохранена. Перед сбросом создается страховочный бэкап.
                </p>
                <Button
                  onClick={() => setIsResetModalOpen(true)}
                  size="sm"
                  className="w-full justify-center text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Обнулить все данные в БД...
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Card 3: Технические параметры хранилища */}
          <Card className="border-border">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-sm font-semibold">Параметры и состояние хранилища</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-hairline bg-surface">
                  <span className="text-steel block text-[11px]">Движок базы данных</span>
                  <span className="font-semibold text-foreground mt-0.5 block">SQLite 3 (WAL mode)</span>
                </div>
                <div className="p-3 rounded-lg border border-hairline bg-surface">
                  <span className="text-steel block text-[11px]">Файл базы на сервере</span>
                  <span className="font-mono text-foreground mt-0.5 block truncate text-[11px]">data/erp_cement.sqlite</span>
                </div>
                <div className="p-3 rounded-lg border border-hairline bg-surface">
                  <span className="text-steel block text-[11px]">Контроль целостности</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Foreign Keys ON</span>
                </div>
                <div className="p-3 rounded-lg border border-hairline bg-surface">
                  <span className="text-steel block text-[11px]">Главный Администратор</span>
                  <span className="font-mono text-primary mt-0.5 block">admin (сохраняется)</span>
                </div>
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
            <div className="p-3 bg-tint-rose border border-destructive/20 rounded-md text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{userFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-steel mb-1.5">
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
              <label className="block text-xs font-medium text-steel mb-1.5">
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
            <label className="block text-xs font-medium text-steel mb-1.5">
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
              <label className="block text-xs font-medium text-steel mb-1.5">Роль доступа</label>
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
                className="flex h-9 w-full rounded-md border border-hairline bg-surface px-3 text-xs text-charcoal dark:text-foreground focus:outline-none focus:border-primary"
              >
                <option value="operator">Оператор склада</option>
                <option value="accountant">Бухгалтер</option>
                <option value="admin">Администратор</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-steel mb-1.5">Должность</label>
              <Input
                placeholder="Старший смены"
                value={userForm.role_title}
                onChange={(e) => setUserForm({ ...userForm, role_title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-steel mb-1.5">Контактный телефон</label>
            <Input
              placeholder="+998 90 000-00-00"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-hairline">
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
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-hairline">
              <div>
                <span className="text-steel block text-[11px]">Дата и точное время:</span>
                <p className="font-mono font-semibold text-charcoal dark:text-foreground mt-0.5">
                  {selectedLogDetail.created_at || selectedLogDetail.timestamp}
                </p>
              </div>
              <div>
                <span className="text-steel block text-[11px]">Пользователь:</span>
                <p className="font-semibold text-primary mt-0.5">
                  @{selectedLogDetail.username || 'система'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-hairline">
              <div>
                <span className="text-steel block text-[11px]">Тип действия:</span>
                <div className="mt-1">{renderActionBadge(selectedLogDetail.action)}</div>
              </div>
              <div>
                <span className="text-steel block text-[11px]">IP адрес клиента:</span>
                <p className="font-mono text-steel mt-1">
                  {selectedLogDetail.ip || '127.0.0.1'}
                </p>
              </div>
            </div>

            <div className="pb-3 border-b border-hairline">
              <span className="text-steel block text-[11px]">Затронутый объект / Сущность:</span>
              <p className="font-medium text-charcoal dark:text-foreground mt-0.5">
                {selectedLogDetail.entity || '—'}
              </p>
            </div>

            <div>
              <span className="text-steel block text-[11px]">Полный текст операции:</span>
              <div className="mt-1 p-3 bg-surface border border-hairline rounded-md font-mono text-[11px] text-charcoal dark:text-foreground break-words leading-relaxed">
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

      {/* Модальное окно полного обнуления БД */}
      <ResetDatabaseModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
