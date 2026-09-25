const { db } = require('../config/database');
const { logAudit } = require('../services/auditService');
const { getUserFromReq } = require('../utils/getUserFromReq');

// 1. Получение списка всех продаж и отгрузок
function getSales(req, res) {
  try {
    const { startDate, endDate, clientId, saleType } = req.query;
    let query = `
      SELECT 
        s.*,
        c.name as client_name,
        c.phone as client_phone,
        f.name as factory_name,
        p.name as product_name,
        p.cement_grade,
        v.plate_number as vehicle_plate
      FROM sales s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN factories f ON s.factory_id = f.id
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND s.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND s.date <= ?';
      params.push(endDate);
    }
    if (clientId) {
      query += ' AND s.client_id = ?';
      params.push(clientId);
    }
    if (saleType) {
      query += ' AND s.sale_type = ?';
      params.push(saleType);
    }

    query += ' ORDER BY s.date DESC, s.id DESC LIMIT 200';

    const sales = db.prepare(query).all(...params);
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Оформление сделки продажи с АТОМАРНОЙ транзакционной защитой
function createSale(req, res) {
  try {
    const {
      date,
      client_id,
      sale_type, // 'cement' | 'service_only'
      factory_id,
      product_id,
      packaging_type,
      tonnage,
      price_per_ton,
      cement_amount,
      delivery_type, // 'pickup' | 'delivery'
      vehicle_id,
      vehicle_number,
      is_company_vehicle,
      logistics_rate_per_ton,
      logistics_amount,
      total_amount,
      warehouse_source, // 'warehouse' | 'ticket' | 'direct'
      ticket_id,
      payment_status, // 'paid' | 'debt' | 'partial'
      paid_amount,
      payment_method, // 'cash' | 'transfer' | 'card'
      currency,
      exchange_rate,
      comment
    } = req.body;

    if (!date || !client_id || !sale_type) {
      return res.status(400).json({
        success: false,
        error: 'Обязательные поля: дата, клиент и тип продажи (цемент или услуга)'
      });
    }

    const { cleanNumber } = require('../utils/numberUtils');

    const qty = cleanNumber(tonnage);
    const price = cleanNumber(price_per_ton);
    const cementSum = cleanNumber(cement_amount, qty * price);
    const logRate = cleanNumber(logistics_rate_per_ton);
    const logisticsSum = cleanNumber(logistics_amount, delivery_type === 'delivery' ? qty * logRate : 0);
    const grandTotal = total_amount ? cleanNumber(total_amount) : (cementSum + logisticsSum);
    const paidSum = cleanNumber(paid_amount);
    const debtSum = Math.max(0, grandTotal - paidSum);

    if (grandTotal < 0 || paidSum < 0) {
      return res.status(400).json({ success: false, error: 'Суммы не могут быть отрицательными' });
    }

    // Выполнение в строгой транзакции
    const saleTransaction = db.transaction(() => {
      // 1. Проверяем клиента
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
      if (!client) {
        throw new Error('Указанный клиент не найден');
      }

      // 2. Если продажа цемента - проводим контроль остатков
      if (sale_type === 'cement') {
        if (!product_id || qty <= 0) {
          throw new Error('При продаже цемента необходимо указать товар и положительный объем');
        }

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
        if (!product) {
          throw new Error('Товар не найден в каталоге');
        }

        if (warehouse_source === 'warehouse') {
          // ЗАЩИТА ОТ ОТГРУЗКИ ПРИ НЕХВАТКЕ ТОВАРА НА СКЛАДЕ
          if (product.current_stock < qty) {
            throw new Error(
              `ОТГРУЗКА ЗАБЛОКИРОВАНА: Недостаточно товара «${product.name}» на складе! Доступно: ${product.current_stock} ${product.unit}, требуется: ${qty} ${product.unit}.`
            );
          }

          // Списание со склада
          db.prepare(`
            UPDATE products 
            SET current_stock = current_stock - ? 
            WHERE id = ?
          `).run(qty, product_id);

          // Запись в аудит склада
          db.prepare(`
            INSERT INTO stock_movements (
              date, product_id, movement_type, quantity, unit_price,
              total_price, reference_type, vehicle_number, comment
            ) VALUES (?, ?, 'out', ?, ?, ?, 'sale', ?, ?)
          `).run(
            date, product_id, qty, price, cementSum,
            vehicle_number || null, `Отгрузка клиенту ${client.name}`
          );

        } else if (warehouse_source === 'ticket') {
          // ЗАЩИТА ПРИ ОТГРУЗКЕ ПО ТИКЕТУ
          if (!ticket_id) {
            throw new Error('Для отгрузки по тикету необходимо выбрать тикет');
          }

          const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket_id);
          if (!ticket) {
            throw new Error('Тикет не найден');
          }
          if (ticket.status !== 'active') {
            throw new Error(`Тикет ${ticket.ticket_number} закрыт или возвращен`);
          }
          if (ticket.remaining_tonnage < qty) {
            throw new Error(
              `ОТГРУЗКА ЗАБЛОКИРОВАНА: Недостаточно квоты по тикету «${ticket.ticket_number}»! Доступно: ${ticket.remaining_tonnage} т, требуется: ${qty} т.`
            );
          }

          // Списание объема по тикету
          const newRemaining = ticket.remaining_tonnage - qty;
          const newRemainingAmount = newRemaining * ticket.price_per_ton;
          const newStatus = newRemaining <= 0 ? 'completed' : 'active';

          db.prepare(`
            UPDATE tickets 
            SET remaining_tonnage = ?, remaining_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(newRemaining, newRemainingAmount, newStatus, ticket_id);
        }
      }

      // 3. Генерация номера сделки
      const datePrefix = date.replace(/-/g, '').slice(2);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const saleNumber = `SL-${datePrefix}-${randomSuffix}`;

      // 4. Сохранение сделки в таблицу sales
      const insertSale = db.prepare(`
        INSERT INTO sales (
          sale_number, date, client_id, sale_type, factory_id, product_id,
          packaging_type, tonnage, price_per_ton, cement_amount,
          delivery_type, vehicle_id, vehicle_number, is_company_vehicle,
          logistics_rate_per_ton, logistics_amount, total_amount,
          warehouse_source, ticket_id, payment_status, paid_amount,
          debt_amount, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let finalPaidSum = paidSum;
      let finalDebtSum = debtSum;
      let finalStatus = payment_status;

      if (payment_status === 'debt') {
        finalPaidSum = 0;
        finalDebtSum = grandTotal;
        finalStatus = 'debt';
      } else if (payment_status === 'paid') {
        finalPaidSum = grandTotal;
        finalDebtSum = 0;
        finalStatus = 'paid';
      } else if (payment_status === 'partial') {
        finalPaidSum = Math.min(paidSum, grandTotal);
        finalDebtSum = Math.max(0, grandTotal - finalPaidSum);
        finalStatus = finalDebtSum > 0 ? 'partial' : 'paid';
      } else {
        finalStatus = finalPaidSum >= grandTotal ? 'paid' : (finalPaidSum > 0 ? 'partial' : 'debt');
      }

      const saleResult = insertSale.run(
        saleNumber, date, client_id, sale_type,
        factory_id || null, product_id || null, packaging_type || null,
        qty, price, cementSum,
        delivery_type || 'pickup', vehicle_id || null, vehicle_number || null,
        is_company_vehicle === 0 ? 0 : 1,
        logRate, logisticsSum, grandTotal,
        warehouse_source || null, ticket_id || null,
        finalStatus,
        finalPaidSum, finalDebtSum > 0 ? finalDebtSum : 0, comment || null
      );

      const saleId = saleResult.lastInsertRowid;

      // 5. Корректировка баланса клиента (фиксация дебиторской задолженности)
      if (finalDebtSum > 0) {
        db.prepare(`
          UPDATE clients 
          SET balance = balance - ? 
          WHERE id = ?
        `).run(finalDebtSum, client_id);
      }

      // 6. Проводка оплаты в кассу (если внесены деньги)
      if (finalPaidSum > 0) {
        const rate = cleanNumber(exchange_rate, 1.0);
        const cur = currency === 'USD' ? 'USD' : 'UZS';
        const amountUzs = cur === 'USD' ? finalPaidSum * rate : finalPaidSum;
        const cat = sale_type === 'cement' ? 'cement_sale' : 'logistics_service';

        db.prepare(`
          INSERT INTO cash_transactions (
            date, transaction_type, category, client_id, vehicle_id,
            vehicle_number, currency, exchange_rate, amount_original,
            amount_uzs, payment_method, sale_id, is_broker_account, comment
          ) VALUES (?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
          date, cat, client_id, vehicle_id || null,
          vehicle_number || null, cur, rate, paidSum,
          amountUzs, payment_method || 'cash', saleId,
          `Оплата сделки ${saleNumber}`
        );
      }

      return {
        saleId,
        saleNumber,
        grandTotal,
        paidSum,
        debtSum: Math.max(0, debtSum)
      };
    });

    const result = saleTransaction();

    // Запись в журнал аудита
    const currentUser = getUserFromReq(req);
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logAudit(
      currentUser.id,
      currentUser.username,
      'SALE_CREATE',
      `Сделка #${result.saleNumber}`,
      `Оформлена продажа на сумму ${Number(result.grandTotal).toLocaleString()} сум. Тоннаж: ${tonnage || 0} т. (Оплачено: ${Number(result.paidSum).toLocaleString()} сум, Долг: ${Number(result.debtSum).toLocaleString()} сум)`,
      clientIp
    );

    res.status(201).json({
      success: true,
      message: 'Сделка успешно оформлена и проведена в системе',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

module.exports = {
  getSales,
  createSale
};
