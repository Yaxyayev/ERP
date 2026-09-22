const { db } = require('../config/database');
const { logAudit } = require('../services/auditService');
const { getUserFromReq } = require('../utils/getUserFromReq');

// 1. Получение остатков на складе (фактический склад)
function getStocks(req, res) {
  try {
    const products = db.prepare(`
      SELECT 
        p.*,
        f.name as factory_name,
        CASE WHEN p.current_stock <= p.min_stock_alert THEN 1 ELSE 0 END as is_low_stock
      FROM products p
      LEFT JOIN factories f ON p.factory_id = f.id
      WHERE p.is_active = 1
      ORDER BY p.category ASC, p.name ASC
    `).all();

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Получение списка тикетов (квот на заводах)
function getTickets(req, res) {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        t.*,
        f.name as factory_name,
        p.name as product_name,
        p.cement_grade,
        p.packaging_type
      FROM tickets t
      JOIN factories f ON t.factory_id = f.id
      JOIN products p ON t.product_id = p.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.id DESC';

    const tickets = db.prepare(query).all(...params);
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 3. Список поступлений (приходов)
function getArrivals(req, res) {
  try {
    const arrivals = db.prepare(`
      SELECT 
        a.*,
        f.name as factory_name,
        p.name as product_name,
        p.cement_grade
      FROM arrivals a
      JOIN factories f ON a.factory_id = f.id
      JOIN products p ON a.product_id = p.id
      ORDER BY a.date DESC, a.id DESC
      LIMIT 100
    `).all();

    res.json({ success: true, data: arrivals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 4. Оформление нового прихода (Оприходование на склад или открытие тикета)
function createArrival(req, res) {
  try {
    const {
      date, factory_id, product_id, packaging_type,
      tonnage, price_per_ton, total_amount,
      vehicle_number, destination, ticket_number, comment
    } = req.body;

    if (!date || !factory_id || !product_id || !tonnage || !price_per_ton || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Заполните обязательные поля: дата, завод, товар, тоннаж, цена за тонну, назначение (склад/напрямую/тикет)'
      });
    }

    const qty = Number(tonnage);
    const price = Number(price_per_ton);
    const total = total_amount ? Number(total_amount) : qty * price;

    if (qty <= 0 || price < 0) {
      return res.status(400).json({ success: false, error: 'Тоннаж и цена должны быть положительными числами' });
    }

    if (destination === 'ticket' && !ticket_number) {
      return res.status(400).json({ success: false, error: 'При оформлении в тикет необходимо указать номер тикета' });
    }

    // Транзакция оприходования
    const createArrivalTx = db.transaction(() => {
      // 1. Создание записи в arrivals
      const insertArrival = db.prepare(`
        INSERT INTO arrivals (
          date, factory_id, product_id, packaging_type, tonnage,
          price_per_ton, total_amount, vehicle_number, destination, ticket_number, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const arrivalResult = insertArrival.run(
        date, factory_id, product_id, packaging_type || null, qty,
        price, total, vehicle_number || null, destination, ticket_number || null, comment || null
      );

      const arrivalId = arrivalResult.lastInsertRowid;

      // 2. Действия в зависимости от назначения:
      if (destination === 'warehouse') {
        // Поступление на склад: увеличиваем остаток товара
        const updateStock = db.prepare(`
          UPDATE products 
          SET current_stock = current_stock + ? 
          WHERE id = ?
        `);
        updateStock.run(qty, product_id);

        // Фиксируем движение по складу
        const insertStockMovement = db.prepare(`
          INSERT INTO stock_movements (
            date, product_id, movement_type, quantity, unit_price,
            total_price, reference_type, reference_id, vehicle_number, comment
          ) VALUES (?, ?, 'in', ?, ?, ?, 'arrival', ?, ?, ?)
        `);
        insertStockMovement.run(
          date, product_id, qty, price, total,
          arrivalId, vehicle_number || null, comment || 'Поступление на склад'
        );
      } else if (destination === 'ticket') {
        // Создание заводской квоты (тикета)
        const insertTicket = db.prepare(`
          INSERT INTO tickets (
            ticket_number, factory_id, product_id, initial_tonnage,
            remaining_tonnage, price_per_ton, total_amount, remaining_amount, status, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `);
        insertTicket.run(
          ticket_number.trim(), factory_id, product_id, qty,
          qty, price, total, total, comment || `Оформлен приходом #${arrivalId}`
        );
      }

      return arrivalId;
    });

    const newArrivalId = createArrivalTx();

    const currentUser = getUserFromReq(req);
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logAudit(
      currentUser.id,
      currentUser.username,
      'ARRIVAL_CREATE',
      `Приход #${newArrivalId}`,
      `Оприходовано ${qty} т. Назначение: ${destination === 'warehouse' ? 'Склад (Силос)' : destination === 'ticket' ? `Тикет (${ticket_number})` : 'Прямая отгрузка'} на сумму ${total.toLocaleString()} сум`,
      clientIp
    );

    res.status(201).json({
      success: true,
      message: 'Приход успешно сохранен',
      arrivalId: newArrivalId
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// 5. Возврат неиспользованного остатка тикета на брокерский счет
function returnTicket(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const returnTx = db.transaction(() => {
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
      if (!ticket) {
        throw new Error('Тикет не найден');
      }

      if (ticket.status !== 'active') {
        throw new Error(`Тикет уже закрыт или возвращен (статус: ${ticket.status})`);
      }

      if (ticket.remaining_tonnage <= 0) {
        throw new Error('По данному тикету нет доступного остатка для возврата');
      }

      const refundAmount = ticket.remaining_tonnage * ticket.price_per_ton;
      const today = new Date().toISOString().split('T')[0];

      // Закрываем тикет со статусом 'returned'
      db.prepare(`
        UPDATE tickets
        SET status = 'returned', remaining_tonnage = 0, remaining_amount = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      // Логируем возврат на брокерский счет
      db.prepare(`
        INSERT INTO broker_account_logs (date, type, amount, ticket_id, comment)
        VALUES (?, 'ticket_return', ?, ?, ?)
      `).run(today, refundAmount, id, comment || `Возврат денег за неиспользованный остаток по тикету ${ticket.ticket_number}`);

      // Добавляем запись в общую кассу (брокерский счет)
      db.prepare(`
        INSERT INTO cash_transactions (
          date, transaction_type, category, factory_id, currency,
          exchange_rate, amount_original, amount_uzs, payment_method,
          is_broker_account, comment
        ) VALUES (?, 'income', 'broker_deposit', ?, 'UZS', 1.0, ?, ?, 'transfer', 1, ?)
      `).run(
        today, ticket.factory_id, refundAmount, refundAmount,
        `Возврат средств с тикета ${ticket.ticket_number} на брокерский счет`
      );

      return {
        ticketNumber: ticket.ticket_number,
        refundAmount,
        tonnageReturned: ticket.remaining_tonnage
      };
    });

    const result = returnTx();

    const currentUser = getUserFromReq(req);
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logAudit(
      currentUser.id,
      currentUser.username,
      'TICKET_RETURN',
      `Тикет #${result.ticketNumber}`,
      `Возвращен остаток квоты ${result.tonnageReturned} т на сумму ${result.refundAmount.toLocaleString()} сум на брокерский счет`,
      clientIp
    );

    res.json({
      success: true,
      message: `Остаток тикета ${result.ticketNumber} успешно возвращен на брокерский счет`,
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// 6. Аудит истории движений по складу
function getStockMovements(req, res) {
  try {
    const movements = db.prepare(`
      SELECT 
        sm.*,
        p.name as product_name,
        p.cement_grade,
        p.unit
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.date DESC, sm.id DESC
      LIMIT 150
    `).all();

    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getStocks,
  getTickets,
  getArrivals,
  createArrival,
  returnTicket,
  getStockMovements
};
