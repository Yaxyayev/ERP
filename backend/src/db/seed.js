const { db } = require('../config/database');

function seedDatabase() {
  console.log('--- Наполнение базы данных первоначальными данными (Seed) ---');

  const checkFactory = db.prepare('SELECT count(*) as count FROM factories').get();
  if (checkFactory.count > 0) {
    console.log('База данных уже содержит данные, пропускаем seed.');
    return;
  }

  const transaction = db.transaction(() => {
    // 1. Заводы-производители
    const insertFactory = db.prepare(`
      INSERT INTO factories (name, contact_person, phone, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const f1 = insertFactory.run('Кызылкумцемент (Навои)', 'Алишер Каримов', '+998 90 123-45-67', 'г. Навои, Промзона', 'Крупнейший завод сухого способа');
    const f2 = insertFactory.run('Бекабадцемент', 'Бахтиёр Усманов', '+998 91 234-56-78', 'г. Бекабад', 'Высокомарочный цемент М500');
    const f3 = insertFactory.run('Алмалыкский цементный завод', 'Джамшид Рахимов', '+998 93 345-67-89', 'г. Алмалык', 'Стабильные поставки навалом и в таре');

    // 2. Клиенты (с балансами и долгами)
    const insertClient = db.prepare(`
      INSERT INTO clients (name, phone, company_name, balance, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const c1 = insertClient.run('ООО «Samarkand Stroy»', '+998 97 111-22-33', 'Samarkand Stroy', -35000000, 'Крупный застройщик, дебиторский долг 35 млн сум');
    const c2 = insertClient.run('ЧП «Golden Concrete»', '+998 90 444-55-66', 'Golden Concrete', 0, 'Бетонный завод, оплата день в день');
    const c3 = insertClient.run('OOO «Modern House»', '+998 99 777-88-99', 'Modern House', -18500000, 'Строительство жилого комплекса, долг 18.5 млн сум');
    const c4 = insertClient.run('ИП «Рустамов Улугбек»', '+998 91 555-66-77', 'Частный сектор', 5000000, 'Авансовая переплата 5 млн сум');

    // 3. Автотранспорт (Собственные и наёмные цементовозы / длинномеры)
    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (plate_number, model, client_id, is_company_owned, driver_name, driver_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const v1 = insertVehicle.run('01 A 777 AA', 'HOWO Цементовоз (35т)', null, 1, 'Шавкат Мирзаев', '+998 90 999-11-22', 'Собственный цементовоз автопарка');
    const v2 = insertVehicle.run('10 B 888 BB', 'MAN Тягач бортовой (30т)', null, 1, 'Фарход Касымов', '+998 91 888-22-33', 'Собственная машина для перевозки мешков');
    const v3 = insertVehicle.run('30 C 555 CC', 'ISUZU Самосвал (15т)', null, 1, 'Отабек Саидов', '+998 93 777-33-44', 'Городская развозка');
    const v4 = insertVehicle.run('01 K 123 XY', 'DAF Цементовоз наёмный (40т)', null, 0, 'Сергей Воронов (наёмный)', '+998 94 666-44-55', 'Наёмный транспорт перевозчика');

    // 4. Каталог товаров
    const insertProduct = db.prepare(`
      INSERT INTO products (name, category, cement_grade, packaging_type, unit, current_stock, min_stock_alert, purchase_price, selling_price, factory_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const p1 = insertProduct.run('Цемент М-500 Д0 (Навал)', 'cement', 'M500', 'bulk', 'т', 180.5, 30.0, 780000, 890000, f2.lastInsertRowid);
    const p2 = insertProduct.run('Цемент М-400 Д20 (Навал)', 'cement', 'M400', 'bulk', 'т', 240.0, 40.0, 690000, 790000, f1.lastInsertRowid);
    const p3 = insertProduct.run('Цемент М-500 в мешках (50 кг)', 'cement', 'M500', 'bag', 'т', 65.0, 20.0, 840000, 960000, f2.lastInsertRowid);
    const p4 = insertProduct.run('Цемент М-400 в мешках (50 кг)', 'cement', 'M400', 'bag', 'т', 92.0, 25.0, 750000, 860000, f3.lastInsertRowid);
    const p5 = insertProduct.run('Мешки бумажные трехслойные (50 кг)', 'packaging', null, 'bag', 'шт', 4500, 1000, 3200, 4200, null);
    const p6 = insertProduct.run('Пластификатор для бетона суперпласт', 'additive', null, 'none', 'кг', 1200, 300, 22000, 28000, null);

    // 5. Заводские тикеты (квоты)
    const insertTicket = db.prepare(`
      INSERT INTO tickets (ticket_number, factory_id, product_id, initial_tonnage, remaining_tonnage, price_per_ton, total_amount, remaining_amount, status, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const t1 = insertTicket.run('TKT-2026-001', f1.lastInsertRowid, p2.lastInsertRowid, 100.0, 65.0, 690000, 69000000, 44850000, 'active', 'Оплаченная квота Кызылкумцемент М400');
    const t2 = insertTicket.run('TKT-2026-002', f2.lastInsertRowid, p1.lastInsertRowid, 80.0, 80.0, 780000, 62400000, 62400000, 'active', 'Квота Бекабадцемент М500 навал');

    // 6. Первоначальные движения по складу (для формирования остатков)
    const insertStock = db.prepare(`
      INSERT INTO stock_movements (date, product_id, movement_type, quantity, unit_price, total_price, reference_type, reference_id, vehicle_number, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const today = new Date().toISOString().split('T')[0];
    insertStock.run(today, p1.lastInsertRowid, 'in', 180.5, 780000, 140790000, 'arrival', null, '01 A 777 AA', 'Начальный ввод остатка');
    insertStock.run(today, p2.lastInsertRowid, 'in', 240.0, 690000, 165600000, 'arrival', null, '01 K 123 XY', 'Начальный ввод остатка');
    insertStock.run(today, p3.lastInsertRowid, 'in', 65.0, 840000, 54600000, 'arrival', null, '10 B 888 BB', 'Начальный ввод остатка');
    insertStock.run(today, p4.lastInsertRowid, 'in', 92.0, 750000, 69000000, 'arrival', null, '10 B 888 BB', 'Начальный ввод остатка');

    // 7. Пример совершенной продажи
    const insertSale = db.prepare(`
      INSERT INTO sales (
        sale_number, date, client_id, sale_type, factory_id, product_id, packaging_type,
        tonnage, price_per_ton, cement_amount, delivery_type, vehicle_id, vehicle_number,
        is_company_vehicle, logistics_rate_per_ton, logistics_amount, total_amount,
        warehouse_source, payment_status, paid_amount, debt_amount, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const s1 = insertSale.run(
      'SL-2026-001', today, c1.lastInsertRowid, 'cement', f2.lastInsertRowid, p1.lastInsertRowid, 'bulk',
      35.0, 890000, 31150000, 'delivery', v1.lastInsertRowid, '01 A 777 AA',
      1, 70000, 2450000, 33600000,
      'warehouse', 'debt', 0, 33600000, 'Поставка на объект в долг'
    );

    // 8. Денежные движения кассы (приходы и расходы)
    const insertCash = db.prepare(`
      INSERT INTO cash_transactions (
        date, transaction_type, category, client_id, factory_id, vehicle_id, vehicle_number,
        currency, exchange_rate, amount_original, amount_uzs, payment_method, sale_id, is_broker_account, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Приход за цемент от ИП Рустамов
    insertCash.run(today, 'income', 'cement_sale', c4.lastInsertRowid, null, null, null, 'UZS', 1.0, 5000000, 5000000, 'cash', null, 0, 'Предоплата за цемент');
    // Расход на логистику (газ и запчасти)
    insertCash.run(today, 'expense', 'gas', null, null, v1.lastInsertRowid, '01 A 777 AA', 'UZS', 1.0, 650000, 650000, 'cash', null, 0, 'Заправка метаном цементовоза');
    insertCash.run(today, 'expense', 'spare_parts', null, null, v2.lastInsertRowid, '10 B 888 BB', 'UZS', 1.0, 1200000, 1200000, 'card', null, 0, 'Замена фильтров и масла');
    // Пополнение брокерского счета
    insertCash.run(today, 'expense', 'broker_deposit', null, f1.lastInsertRowid, null, null, 'UZS', 1.0, 50000000, 50000000, 'transfer', null, 1, 'Пополнение депозита завода Кызылкумцемент');

    // Лог брокерского счета
    const insertBroker = db.prepare(`
      INSERT INTO broker_account_logs (date, type, amount, ticket_id, comment)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertBroker.run(today, 'deposit', 50000000, null, 'Пополнение брокерского счета через расчетный счет');

    console.log('База данных успешно наполнена демонстрационными данными!');
  });

  transaction();
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
