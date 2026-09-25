const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('erp_auth_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Ошибка сервера: ${response.status}`);
  }

  return data;
}

export const api = {
  // Авторизация
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  // Справочники
  getFactories: () => request('/directories/factories'),
  createFactory: (data) => request('/directories/factories', { method: 'POST', body: JSON.stringify(data) }),
  updateFactory: (id, data) => request(`/directories/factories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFactory: (id) => request(`/directories/factories/${id}`, { method: 'DELETE' }),

  getClients: () => request('/directories/clients'),
  createClient: (data) => request('/directories/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/directories/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/directories/clients/${id}`, { method: 'DELETE' }),

  getVehicles: () => request('/directories/vehicles'),
  createVehicle: (data) => request('/directories/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/directories/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/directories/vehicles/${id}`, { method: 'DELETE' }),

  getProducts: () => request('/directories/products'),
  createProduct: (data) => request('/directories/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/directories/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/directories/products/${id}`, { method: 'DELETE' }),

  // Склад и приход
  getStocks: () => request('/warehouse/stocks'),
  getTickets: (status) => request(`/warehouse/tickets${status ? `?status=${status}` : ''}`),
  getArrivals: () => request('/warehouse/arrivals'),
  createArrival: (data) => request('/warehouse/arrivals', { method: 'POST', body: JSON.stringify(data) }),
  returnTicket: (id, comment) => request(`/warehouse/tickets/${id}/return`, { method: 'POST', body: JSON.stringify({ comment }) }),
  getStockMovements: () => request('/warehouse/movements'),

  // Продажи
  getSales: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/sales${q ? `?${q}` : ''}`);
  },
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),

  // Финансы и касса
  getTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/finance/transactions${q ? `?${q}` : ''}`);
  },
  createTransaction: (data) => request('/finance/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getDebts: () => request('/finance/debts'),
  repayDebt: (data) => request('/finance/debts/repay', { method: 'POST', body: JSON.stringify(data) }),
  adjustDebt: (data) => request('/finance/debts/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getBrokerAccount: () => request('/finance/broker'),

  // Отчеты и дашборды
  getDashboardSummary: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/dashboard${q ? `?${q}` : ''}`);
  },
  getClientHistory: (id) => request(`/reports/client/${id}`),
  getVehicleHistory: (id) => request(`/reports/vehicle/${id}`),
  getFactoryHistory: (id) => request(`/reports/factory/${id}`),

  // Пользователи и безопасность
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Журнал аудита действий
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/audit${q ? `?${q}` : ''}`);
  },
  cleanupAuditLogs: (days = 90) => request('/audit/cleanup', { method: 'POST', body: JSON.stringify({ days }) }),

  // Резервное копирование базы данных
  downloadBackup: async () => {
    const res = await fetch('/api/backup');
    if (!res.ok) throw new Error('Не удалось скачать резервную копию базы данных');
    
    // Получение имени файла из заголовков или генерация по умолчанию
    const disposition = res.headers.get('content-disposition');
    let filename = `erp_cement_backup_${new Date().toISOString().slice(0, 10)}.sqlite`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
    return filename;
  },

  // Обнуление и сброс базы данных
  resetDatabase: (data = {}) => request('/system/reset-database', { method: 'POST', body: JSON.stringify(data) })
};
