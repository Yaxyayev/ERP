const express = require('express');
const router = express.Router();

const directoryCtrl = require('../controllers/directoryController');
const warehouseCtrl = require('../controllers/warehouseController');
const salesCtrl = require('../controllers/salesController');
const financeCtrl = require('../controllers/financeController');
const reportsCtrl = require('../controllers/reportsController');
const backupCtrl = require('../controllers/backupController');
const authCtrl = require('../controllers/authController');
const userCtrl = require('../controllers/userController');
const auditCtrl = require('../controllers/auditController');

// 0. Авторизация и пользователи
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authCtrl.getMe);
router.get('/users', userCtrl.getUsers);
router.post('/users', userCtrl.createUser);
router.put('/users/:id', userCtrl.updateUser);
router.delete('/users/:id', userCtrl.deleteUser);

// 0.1 Аудит и журнал безопасности
router.get('/audit', auditCtrl.getAuditLogs);
router.post('/audit/cleanup', auditCtrl.cleanupAuditLogs);

// 1. Резервное копирование и управление базой данных
router.get('/backup', backupCtrl.downloadBackup);
router.post('/system/reset-database', backupCtrl.resetDatabase);

// 2. Справочники
// Заводы
router.get('/directories/factories', directoryCtrl.getFactories);
router.post('/directories/factories', directoryCtrl.createFactory);
router.put('/directories/factories/:id', directoryCtrl.updateFactory);
router.delete('/directories/factories/:id', directoryCtrl.deleteFactory);

// Клиенты
router.get('/directories/clients', directoryCtrl.getClients);
router.post('/directories/clients', directoryCtrl.createClient);
router.put('/directories/clients/:id', directoryCtrl.updateClient);
router.delete('/directories/clients/:id', directoryCtrl.deleteClient);

// Машины
router.get('/directories/vehicles', directoryCtrl.getVehicles);
router.post('/directories/vehicles', directoryCtrl.createVehicle);
router.put('/directories/vehicles/:id', directoryCtrl.updateVehicle);
router.delete('/directories/vehicles/:id', directoryCtrl.deleteVehicle);

// Товары и материалы
router.get('/directories/products', directoryCtrl.getProducts);
router.post('/directories/products', directoryCtrl.createProduct);
router.put('/directories/products/:id', directoryCtrl.updateProduct);
router.delete('/directories/products/:id', directoryCtrl.deleteProduct);

// 3. Склад и приход
router.get('/warehouse/stocks', warehouseCtrl.getStocks);
router.get('/warehouse/tickets', warehouseCtrl.getTickets);
router.get('/warehouse/arrivals', warehouseCtrl.getArrivals);
router.post('/warehouse/arrivals', warehouseCtrl.createArrival);
router.post('/warehouse/tickets/:id/return', warehouseCtrl.returnTicket);
router.get('/warehouse/movements', warehouseCtrl.getStockMovements);

// 4. Продажи и отгрузки (транзакционные сделки)
router.get('/sales', salesCtrl.getSales);
router.post('/sales', salesCtrl.createSale);

// 5. Финансы, касса и задолженности
router.get('/finance/transactions', financeCtrl.getTransactions);
router.post('/finance/transactions', financeCtrl.createTransaction);
router.get('/finance/debts', financeCtrl.getDebts);
router.post('/finance/debts/repay', financeCtrl.repayDebt);
router.post('/finance/debts/adjust', financeCtrl.adjustDebt);
router.get('/finance/broker', financeCtrl.getBrokerAccount);

// 6. Аналитика, отчеты и дашборды
router.get('/reports/dashboard', reportsCtrl.getDashboardSummary);
router.get('/reports/client/:id', reportsCtrl.getClientHistory);
router.get('/reports/vehicle/:id', reportsCtrl.getVehicleHistory);
router.get('/reports/factory/:id', reportsCtrl.getFactoryHistory);

module.exports = router;
