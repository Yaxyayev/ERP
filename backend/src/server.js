require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { db } = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Базовый маршрут проверки жизнеспособности (Health check)
app.get('/api/health', (req, res) => {
  try {
    const check = db.prepare('SELECT 1 as healthy').get();
    res.json({
      status: 'ok',
      db: check.healthy === 1 ? 'connected' : 'error',
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Подключение всех API маршрутов
app.use('/api', apiRoutes);

// Раздача статики фронтенда (Production Single-Port Deployment)
const fs = require('fs');
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Сервер «ERP Цемент» запущен на порту ${PORT}`);
  console.log(` База данных SQLite: WAL mode, Foreign Keys ON`);
  console.log(` Эндпоинт бэкапа: http://localhost:${PORT}/api/backup`);
  console.log(` Health check:    http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

module.exports = { app, server };
