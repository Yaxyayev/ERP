const { db } = require('../config/database');
const { logAudit } = require('../services/auditService');
const { getUserFromReq } = require('../utils/getUserFromReq');

// 1. Получение денежных движений (касса, банк, брокерский счет)
function getTransactions(req, res) {
  try {
    const { startDate, endDate, transactionType, category, isBroker } = req.query;
    let query = `
      SELECT 
        ct.*,
        c.name as client_name,
        f.name as factory_name,
        v.plate_number as vehicle_plate
      FROM cash_transactions ct
      LEFT JOIN clients c ON ct.client_id = c.id
      LEFT JOIN factories f ON ct.factory_id = f.id
      LEFT JOIN vehicles v ON ct.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND ct.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ct.date <= ?';
      params.push(endDate);
    }
    if (transactionType) {
      query += ' AND ct.transaction_type = ?';
      params.push(transactionType);
    }
    if (category) {
      query += ' AND ct.category = ?';
      params.push(category);
    }
    if (isBroker !== undefined) {
      query += ' AND ct.is_broker_account = ?';
      params.push(Number(isBroker));
    }

    query += ' ORDER BY ct.date DESC, ct.id DESC LIMIT 200';

    const transactions = db.prepare(query).all(...params);

    // Подсчет итогов по кассе
    const totals = db.prepare(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'income' AND is_broker_account = 0 THEN amount_uzs ELSE 0 END) as total_income,
        SUM(CASE WHEN transaction_type = 'expense' AND is_broker_account = 0 THEN amount_uzs ELSE 0 END) as total_expense,
        SUM(CASE WHEN is_broker_account = 1 AND transaction_type = 'income' THEN amount_uzs ELSE 0 END) -
        SUM(CASE WHEN is_broker_account = 1 AND transaction_type = 'expense' THEN amount_uzs ELSE 0 END) as broker_balance
      FROM cash_transactions
    `).get();

    res.json({
      success: true,
      data: transactions,
      summary: {
        totalIncome: totals.total_income || 0,
        totalExpense: totals.total_expense || 0,
        netCash: (totals.total_income || 0) - (totals.total_expense || 0),
        brokerBalance: totals.broker_balance || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Создание нового денежного движения (Приход или Расход)
function createTransaction(req, res) {
  try {
    const {
      date,
      transaction_type, // 'income' | 'expense'
      category,
      client_id,
      factory_id,
      vehicle_id,
      vehicle_number,
      currency, // 'UZS' | 'USD'
      exchange_rate,
      amount,
      payment_method, // 'cash' | 'transfer' | 'card'
      is_broker_account,
      comment
    } = req.body;

    if (!date || !transaction_type || !category || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Заполните дату, тип операции, категорию и сумму'
      });
    }

    const { cleanNumber } = require('../utils/numberUtils');
    const cur = currency === 'USD' ? 'USD' : 'UZS';
    const rate = cleanNumber(exchange_rate, 1.0);
    const originalAmount = cleanNumber(amount);
    const amountUzs = cur === 'USD' ? originalAmount * rate : originalAmount;
    const isBroker = is_broker_account ? 1 : (category === 'broker_deposit' ? 1 : 0);

    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO cash_transactions (
          date, transaction_type, category, client_id, factory_id,
          vehicle_id, vehicle_number, currency, exchange_rate,
          amount_original, amount_uzs, payment_method, is_broker_account, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        date,
        transaction_type,
        category,
        client_id ? Number(client_id) : null,
        factory_id ? Number(factory_id) : null,
        vehicle_id ? Number(vehicle_id) : null,
        vehicle_number || null,
        cur,
        rate,
        originalAmount,
        amountUzs,
        payment_method || 'cash',
        isBroker,
        comment || null
      );

      // Если это пополнение брокерского счета или возврат, логируем в broker_account_logs
      if (category === 'broker_deposit') {
        db.prepare(`
          INSERT INTO broker_account_logs (date, type, amount, comment)
          VALUES (?, 'deposit', ?, ?)
        `).run(date, amountUzs, comment || 'Пополнение брокерского счета');
      }

      // Если это поступление от клиента по погашению долга, обновляем баланс клиента и сделки
      if (transaction_type === 'income' && client_id && (category === 'debt_repayment' || category === 'cement_sale')) {
        db.prepare(`
          UPDATE clients 
          SET balance = balance + ? 
          WHERE id = ?
        `).run(amountUzs, client_id);

        let remainingRepay = amountUzs;
        const unpaidSales = db.prepare(`
          SELECT id, total_amount, paid_amount, debt_amount 
          FROM sales 
          WHERE client_id = ? AND debt_amount > 0 
          ORDER BY date ASC, id ASC
        `).all(client_id);

        for (const sale of unpaidSales) {
          if (remainingRepay <= 0) break;
          const toPayForSale = Math.min(sale.debt_amount, remainingRepay);
          const newPaidAmount = sale.paid_amount + toPayForSale;
          const newDebtAmount = Math.max(0, sale.debt_amount - toPayForSale);
          const newStatus = newDebtAmount === 0 ? 'paid' : 'partial';

          db.prepare(`
            UPDATE sales 
            SET paid_amount = ?, debt_amount = ?, payment_status = ? 
            WHERE id = ?
          `).run(newPaidAmount, newDebtAmount, newStatus, sale.id);

          remainingRepay -= toPayForSale;
        }
      }

      return result.lastInsertRowid;
    });

    const newTxId = tx();

    const currentUser = getUserFromReq(req);
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logAudit(
      currentUser.id,
      currentUser.username,
      transaction_type === 'income' ? 'FINANCE_INCOME' : 'FINANCE_EXPENSE',
      `Кассовый ордер #${newTxId}`,
      `${transaction_type === 'income' ? 'Приход' : 'Расход'}: ${amountUzs.toLocaleString()} сум [Категория: ${category}] (${payment_method || 'наличные'})`,
      clientIp
    );

    res.status(201).json({
      success: true,
      message: 'Финансовая операция успешно сохранена',
      transactionId: newTxId
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// 3. Отслеживание дебиторской задолженности (долги клиентов)
function getDebts(req, res) {
  try {
    const clientsWithDebts = db.prepare(`
      SELECT 
        c.*,
        ABS(c.balance) as debt_amount,
        (SELECT MAX(s.date) FROM sales s WHERE s.client_id = c.id) as last_sale_date,
        (SELECT COUNT(*) FROM sales s WHERE s.client_id = c.id AND s.debt_amount > 0) as unpaid_sales_count
      FROM clients c
      WHERE c.balance < 0
      ORDER BY c.balance ASC
    `).all();

    const totalDebt = clientsWithDebts.reduce((sum, c) => sum + Math.abs(c.balance), 0);

    res.json({
      success: true,
      totalDebt,
      data: clientsWithDebts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 4. Погашение задолженности клиентом
function repayDebt(req, res) {
  try {
    const { cleanNumber } = require('../utils/numberUtils');
    const { client_id, amount, date, payment_method, comment } = req.body;

    const repaySum = cleanNumber(amount);
    if (!client_id || repaySum <= 0) {
      return res.status(400).json({ success: false, error: 'Укажите клиента и положительную сумму погашения' });
    }

    const opDate = date || new Date().toISOString().split('T')[0];

    const repayTx = db.transaction(() => {
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
      if (!client) {
        throw new Error('Клиент не найден');
      }

      // Увеличиваем баланс (уменьшаем дебиторскую задолженность)
      db.prepare(`
        UPDATE clients 
        SET balance = balance + ? 
        WHERE id = ?
      `).run(repaySum, client_id);

      // Фиксируем поступление в кассу
      db.prepare(`
        INSERT INTO cash_transactions (
          date, transaction_type, category, client_id, currency,
          exchange_rate, amount_original, amount_uzs, payment_method,
          is_broker_account, comment
        ) VALUES (?, 'income', 'debt_repayment', ?, 'UZS', 1.0, ?, ?, ?, 0, ?)
      `).run(
        opDate, client_id, repaySum, repaySum,
        payment_method || 'cash',
        comment || `Погашение дебиторской задолженности клиентом ${client.name}`
      );

      // Погашаем открытые сделки в долг по очереди (FIFO)
      let remainingRepay = repaySum;
      const unpaidSales = db.prepare(`
        SELECT id, total_amount, paid_amount, debt_amount 
        FROM sales 
        WHERE client_id = ? AND debt_amount > 0 
        ORDER BY date ASC, id ASC
      `).all(client_id);

      for (const sale of unpaidSales) {
        if (remainingRepay <= 0) break;
        const toPayForSale = Math.min(sale.debt_amount, remainingRepay);
        const newPaidAmount = sale.paid_amount + toPayForSale;
        const newDebtAmount = Math.max(0, sale.debt_amount - toPayForSale);
        const newStatus = newDebtAmount === 0 ? 'paid' : 'partial';

        db.prepare(`
          UPDATE sales 
          SET paid_amount = ?, debt_amount = ?, payment_status = ? 
          WHERE id = ?
        `).run(newPaidAmount, newDebtAmount, newStatus, sale.id);

        remainingRepay -= toPayForSale;
      }

      const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
      return updatedClient;
    });

    const client = repayTx();

    const currentUser = getUserFromReq(req);
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logAudit(
      currentUser.id,
      currentUser.username,
      'DEBT_REPAY',
      `Клиент: ${client.name}`,
      `Погашен долг на сумму ${repaySum.toLocaleString()} сум (${payment_method || 'наличные'}). Текущий баланс клиента: ${Number(client.balance).toLocaleString()} сум`,
      clientIp
    );

    res.json({
      success: true,
      message: 'Задолженность успешно погашена и учтена в кассе',
      data: client
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// 4.1. Ручная фиксация / корректировка долга клиента
function adjustDebt(req, res) {
  try {
    const { cleanNumber } = require('../utils/numberUtils');
    const { client_id, amount, action, comment } = req.body;

    const numAmount = cleanNumber(amount);
    if (!client_id || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Укажите клиента и положительную сумму' });
    }

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    // action: 'add_debt' (увеличить долг, уменьшить balance) или 'reduce_debt' (уменьшить долг)
    const delta = action === 'add_debt' ? -numAmount : numAmount;

    db.prepare(`
      UPDATE clients 
      SET balance = balance + ? 
      WHERE id = ?
    `).run(delta, client_id);

    const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);

    const currentUser = getUserFromReq(req);
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logAudit(
      currentUser.id,
      currentUser.username,
      'DEBT_ADJUST',
      `Клиент: ${client.name}`,
      `${action === 'add_debt' ? 'Зафиксирован долг' : 'Списан долг'} на сумму ${numAmount.toLocaleString()} сум. Новый баланс: ${Number(updatedClient.balance).toLocaleString()} сум. Примечание: ${comment || '—'}`,
      clientIp
    );

    res.json({
      success: true,
      message: 'Задолженность клиента успешно обновлена',
      data: updatedClient
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// 5. Данные брокерского счета
function getBrokerAccount(req, res) {
  try {
    const logs = db.prepare(`
      SELECT 
        bl.*,
        t.ticket_number,
        f.name as factory_name
      FROM broker_account_logs bl
      LEFT JOIN tickets t ON bl.ticket_id = t.id
      LEFT JOIN factories f ON t.factory_id = f.id
      ORDER BY bl.date DESC, bl.id DESC
      LIMIT 100
    `).all();

    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'ticket_return') THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'ticket_allocation' THEN amount ELSE 0 END), 0) as current_balance,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposited,
        COALESCE(SUM(CASE WHEN type = 'ticket_return' THEN amount ELSE 0 END), 0) as total_returned
      FROM broker_account_logs
    `).get();

    res.json({
      success: true,
      balance: stats.current_balance,
      totalDeposited: stats.total_deposited,
      totalReturned: stats.total_returned,
      history: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getTransactions,
  createTransaction,
  getDebts,
  repayDebt,
  adjustDebt,
  getBrokerAccount
};
