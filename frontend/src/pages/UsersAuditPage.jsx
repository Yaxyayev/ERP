import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Shield, Activity, UserPlus, Search, Filter, 
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Key, 
  FileText, Download, Edit2, Trash2, Lock, Eye, LogIn, 
  ShoppingBag, Truck, DollarSign, Database, ChevronRight, X
} from 'lucide-react';
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
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
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

  // Role Badge Helper
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            Администратор
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" />
            Оператор склада
          </span>
        );
      case 'accountant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            Бухгалтер
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3 h-3 text-slate-500" />
            Наблюдатель
          </span>
        );
    }
  };

  // Action Badge Helper for Audit Log
  const renderActionBadge = (action) => {
    if (action.startsWith('LOGIN_SUCCESS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Вход в систему
        </span>
      );
    }
    if (action.startsWith('LOGIN_FAILED') || action.startsWith('LOGIN_BLOCKED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> Ошибка входа
        </span>
      );
    }
    if (action.startsWith('SALE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShoppingBag className="w-3 h-3 text-indigo-600" /> Продажа
        </span>
      );
    }
    if (action.startsWith('ARRIVAL') || action.startsWith('TICKET')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Truck className="w-3 h-3 text-amber-600" /> Склад / Тикет
        </span>
      );
    }
    if (action.startsWith('FINANCE') || action.startsWith('DEBT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
          <DollarSign className="w-3 h-3 text-teal-600" /> Касса / Долг
        </span>
      );
    }
    if (action.startsWith('USER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Users className="w-3 h-3 text-purple-600" /> Пользователи
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Activity className="w-3 h-3 text-slate-500" /> {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
          notification.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-600" />
            Центр управления и безопасности
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Управление учетными записями персонала, ролями доступа и прозрачный аудит всех действий в системе
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Пользователи
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Журнал аудита
            <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              Live
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-medium text-slate-500">Всего аккаунтов</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{users.length}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-medium text-slate-500">Активных</span>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-medium text-slate-500">Администраторов</span>
                <p className="text-xl font-bold text-purple-600 mt-0.5">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-medium text-slate-500">Операторов & Кассы</span>
                <p className="text-xl font-bold text-blue-600 mt-0.5">
                  {users.filter(u => u.role === 'operator' || u.role === 'accountant').length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={loadUsers}
                disabled={usersLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                title="Обновить список"
              >
                <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleOpenCreateUser}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                Добавить пользователя
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Сотрудник / ФИО</th>
                    <th className="py-3.5 px-4">Логин</th>
                    <th className="py-3.5 px-4">Роль доступа</th>
                    <th className="py-3.5 px-4">Телефон</th>
                    <th className="py-3.5 px-4">Последний вход</th>
                    <th className="py-3.5 px-4">Статус</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading && users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Загрузка пользователей...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                              {u.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.full_name}</div>
                              <div className="text-xs text-slate-500">{u.role_title || 'Сотрудник'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/70 px-2 py-1 rounded">
                            @{u.username}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderRoleBadge(u.role)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {u.phone || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {u.last_login ? u.last_login : 'Не входил'}
                        </td>
                        <td className="py-3.5 px-4">
                          {u.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Активен
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Заблокирован
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition"
                              title="Редактировать пользователя"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {u.username !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`p-1.5 rounded-md transition ${
                                    u.status === 'active' 
                                      ? 'hover:bg-amber-50 text-slate-500 hover:text-amber-600'
                                      : 'hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'
                                  }`}
                                  title={u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                                  title="Удалить аккаунт"
                                >
                                  <Trash2 className="w-4 h-4" />
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
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT & ACTIVITY LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-5">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Событий за сегодня</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{auditStats.total_today || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Входов в систему</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{auditStats.logins_today || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <LogIn className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Складских и продаж</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{auditStats.operations_today || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Предупреждений / Сбоев</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{auditStats.security_alerts || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search, Filters, and Export */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAudit()}
                  placeholder="Поиск по действию, объекту, описанию или IP..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Action Filter */}
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

              {/* User Filter */}
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Все пользователи</option>
                {auditFilters.users.map(u => (
                  <option key={u} value={u}>@{u}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={loadAudit}
                disabled={auditLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition"
              >
                <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
              <button
                onClick={handleExportAuditCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                Экспорт в CSV
              </button>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Время</th>
                    <th className="py-3.5 px-4">Пользователь</th>
                    <th className="py-3.5 px-4">Тип действия</th>
                    <th className="py-3.5 px-4">Объект</th>
                    <th className="py-3.5 px-4">Детали операции</th>
                    <th className="py-3.5 px-4">IP адрес</th>
                    <th className="py-3.5 px-4 text-right">Инфо</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLoading && auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Загрузка журнала аудита...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        Записи аудита по заданным фильтрам не найдены
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                        onClick={() => setSelectedLogDetail(log)}
                      >
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {log.created_at || log.timestamp}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            @{log.username || 'система'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderActionBadge(log.action)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 text-xs">
                          {log.entity || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md truncate">
                          {log.details || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {log.ip || '127.0.0.1'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLogDetail(log);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            title="Подробнее"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL (CREATE / EDIT) */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                {editingUser ? `Редактирование @${editingUser.username}` : 'Создание нового пользователя'}
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {userFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{userFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ФИО сотрудника <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Азиз Рахимов"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Логин в системе <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: a.rakhimov"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {editingUser ? 'Новый пароль (оставьте пустым, если не меняется)' : 'Пароль *'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? '••••••••' : 'Задайте надежный пароль'}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Роль доступа</label>
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="operator">Оператор склада</option>
                    <option value="accountant">Бухгалтер</option>
                    <option value="admin">Администратор</option>
                    <option value="viewer">Наблюдатель</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Должность (титул)</label>
                  <input
                    type="text"
                    placeholder="Например: Старший смены"
                    value={userForm.role_title}
                    onChange={(e) => setUserForm({ ...userForm, role_title: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Контактный телефон</label>
                <input
                  type="text"
                  placeholder="+998 90 000-00-00"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {userSubmitting ? 'Сохранение...' : editingUser ? 'Сохранить изменения' : 'Создать учетную запись'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOG DETAIL MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Детали записи аудита #{selectedLogDetail.id}
              </h3>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">Дата и точное время:</span>
                  <p className="font-mono text-xs font-semibold text-slate-800 mt-0.5">
                    {selectedLogDetail.created_at || selectedLogDetail.timestamp}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Пользователь:</span>
                  <p className="font-semibold text-indigo-600 mt-0.5">
                    @{selectedLogDetail.username || 'система'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">Тип события:</span>
                  <div className="mt-1">{renderActionBadge(selectedLogDetail.action)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">IP адрес клиента:</span>
                  <p className="font-mono text-xs text-slate-700 mt-1">
                    {selectedLogDetail.ip || '127.0.0.1'}
                  </p>
                </div>
              </div>

              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-400">Затронутый объект / Сущность:</span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {selectedLogDetail.entity || '—'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Полный текст операции:</span>
                <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-words leading-relaxed">
                  {selectedLogDetail.details || 'Детали отсутствуют'}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
