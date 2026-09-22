const http = require('http');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PORT = 5001;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          bodyBuffer,
          bodyText: bodyBuffer.toString('utf8')
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n===== ЗАПУСК КОМПЛЕКСНОЙ ВЕРИФИКАЦИИ БЭКЕНДА И СУБД =====\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Проверка /api/health
    const healthRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    });
    const health = JSON.parse(healthRes.bodyText);
    assert(healthRes.statusCode === 200 && health.status === 'ok' && health.db === 'connected', 'Эндпоинт /api/health возвращает статус ok и подключение к SQLite');

    // 2. Проверка получения каталога товаров
    const prodRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/directories/products',
      method: 'GET'
    });
    const prodData = JSON.parse(prodRes.bodyText);
    assert(prodRes.statusCode === 200 && prodData.data.length > 0, `Каталог товаров загружен (${prodData.data.length} товаров)`);

    const testProduct = prodData.data.find(p => p.category === 'cement' && p.current_stock > 10);
    assert(!!testProduct, `Найден товар с остатком для тестов: "${testProduct.name}" (остаток: ${testProduct.current_stock} т)`);

    // 3. Получение списка клиентов
    const clientRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/directories/clients',
      method: 'GET'
    });
    const clientData = JSON.parse(clientRes.bodyText);
    const testClient = clientData.data[0];
    assert(clientRes.statusCode === 200 && testClient, `Клиенты загружены. Тестовый клиент: ${testClient.name}`);

    // 4. ТЕСТ ТРАНЗАКЦИИ: Успешная продажа с автоматическим списанием со склада и долгом
    const initialStock = testProduct.current_stock;
    const initialClientBalance = testClient.balance;
    const orderTonnage = 10.0;
    const pricePerTon = testProduct.selling_price;
    const totalAmount = orderTonnage * pricePerTon;

    const salePayload = {
      date: new Date().toISOString().split('T')[0],
      client_id: testClient.id,
      sale_type: 'cement',
      factory_id: testProduct.factory_id,
      product_id: testProduct.id,
      packaging_type: testProduct.packaging_type,
      tonnage: orderTonnage,
      price_per_ton: pricePerTon,
      cement_amount: totalAmount,
      delivery_type: 'pickup',
      total_amount: totalAmount,
      warehouse_source: 'warehouse',
      payment_status: 'debt',
      paid_amount: 0,
      comment: 'Автоматический тест списания и долга'
    };

    const saleRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/sales',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, salePayload);

    const saleResult = JSON.parse(saleRes.bodyText);
    assert(saleRes.statusCode === 201 && saleResult.success === true, `Продажа успешно создана: ${saleResult.data.saleNumber}`);

    // Проверяем, что остаток на складе уменьшился ровно на orderTonnage
    const updatedProdRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/directories/products',
      method: 'GET'
    });
    const updatedProduct = JSON.parse(updatedProdRes.bodyText).data.find(p => p.id === testProduct.id);
    assert(
      Math.abs(updatedProduct.current_stock - (initialStock - orderTonnage)) < 0.001,
      `Остаток товара корректно списан: было ${initialStock}, стало ${updatedProduct.current_stock}`
    );

    // Проверяем, что баланс клиента уменьшился на сумму долга
    const updatedClientRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/directories/clients',
      method: 'GET'
    });
    const updatedClient = JSON.parse(updatedClientRes.bodyText).data.find(c => c.id === testClient.id);
    assert(
      Math.abs(updatedClient.balance - (initialClientBalance - totalAmount)) < 0.001,
      `Баланс клиента изменился на сумму сделки: было ${initialClientBalance}, стало ${updatedClient.balance}`
    );

    // 5. ТЕСТ ЗАЩИТЫ ОТ СПИСАНИЯ ПРИ НЕХВАТКЕ ТОВАРА (Транзакция должна упасть и откатиться)
    const excessiveTonnage = updatedProduct.current_stock + 999999;
    const invalidSalePayload = {
      date: new Date().toISOString().split('T')[0],
      client_id: testClient.id,
      sale_type: 'cement',
      factory_id: testProduct.factory_id,
      product_id: testProduct.id,
      tonnage: excessiveTonnage,
      price_per_ton: pricePerTon,
      cement_amount: excessiveTonnage * pricePerTon,
      delivery_type: 'pickup',
      total_amount: excessiveTonnage * pricePerTon,
      warehouse_source: 'warehouse',
      payment_status: 'paid',
      paid_amount: excessiveTonnage * pricePerTon,
      comment: 'Попытка списать больше товара, чем есть на складе'
    };

    const failSaleRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/sales',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, invalidSalePayload);

    const failSaleResult = JSON.parse(failSaleRes.bodyText);
    assert(
      failSaleRes.statusCode === 400 && failSaleResult.success === false && failSaleResult.error.includes('ОТГРУЗКА ЗАБЛОКИРОВАНА'),
      `Защита от нехватки товара сработала успешно: "${failSaleResult.error}"`
    );

    // 6. Проверка дашборда и аналитики
    const reportRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports/dashboard',
      method: 'GET'
    });
    const reportData = JSON.parse(reportRes.bodyText);
    assert(
      reportRes.statusCode === 200 && reportData.success && reportData.turnover.total > 0,
      `Дашборд отчетов сформирован: общий оборот = ${reportData.turnover.total.toLocaleString()} сум, дебиторка = ${reportData.debts.totalDebt.toLocaleString()} сум`
    );

    // 7. ТЕСТ ЭНДПОИНТА РЕЗЕРВНОГО КОПИРОВАНИЯ (GET /api/backup)
    console.log('\n--- Тестирование скачивания резервной копии SQLite ---');
    const backupRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/backup',
      method: 'GET'
    });

    assert(backupRes.statusCode === 200, `Эндпоинт GET /api/backup вернул статус 200`);
    assert(
      backupRes.headers['content-disposition'] && backupRes.headers['content-disposition'].includes('.sqlite'),
      `Заголовок Content-Disposition содержит файл .sqlite: ${backupRes.headers['content-disposition']}`
    );

    // Сохраняем полученный файл бэкапа и проверяем через PRAGMA integrity_check
    const testBackupFile = path.resolve(__dirname, '../data/test_downloaded_backup.sqlite');
    fs.writeFileSync(testBackupFile, backupRes.bodyBuffer);

    const backupDb = new Database(testBackupFile);
    const integrity = backupDb.prepare('PRAGMA integrity_check').get();
    const backupClientsCount = backupDb.prepare('SELECT count(*) as count FROM clients').get();
    backupDb.close();
    fs.unlinkSync(testBackupFile);

    assert(integrity.integrity_check === 'ok', `Файл резервной копии прошел PRAGMA integrity_check: "${integrity.integrity_check}"`);
    assert(backupClientsCount.count > 0, `В восстановленной базе бэкапа присутствуют данные (${backupClientsCount.count} клиентов)`);

  } catch (err) {
    console.error('Ошибка выполнения тестов:', err);
    failed++;
  }

  console.log(`\nИТОГИ ТЕСТИРОВАНИЯ: Пройдено: ${passed}, Ошибок: ${failed}\n`);
  return failed === 0;
}

// Запускаем локальный сервер в тестовом режиме
const { server } = require('./server');

setTimeout(async () => {
  const success = await runTests();
  server.close(() => {
    process.exit(success ? 0 : 1);
  });
}, 1000);
