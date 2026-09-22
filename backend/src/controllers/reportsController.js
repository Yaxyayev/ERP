const { db } = require('../config/database');

// 1. Сводные данные дашборда и аналитики
function getDashboardSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = ' AND s.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = ' AND s.date >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = ' AND s.date <= ?';
      params.push(endDate);
    }

    // 1. Общий оборот: Цемент vs Логистика
    const turnoverStats = db.prepare(`
      SELECT 
        COALESCE(SUM(s.cement_amount), 0) as cement_turnover,
        COALESCE(SUM(s.logistics_amount), 0) as logistics_turnover,
        COALESCE(SUM(s.total_amount), 0) as total_turnover,
        COALESCE(SUM(s.tonnage), 0) as total_cement_tonnage
      FROM sales s
      WHERE 1=1 ${dateFilter}
    `).get(...params);

    // 2. Детализация оборота цемента по заводам и типу упаковки (навал / мешок)
    const cementByFactory = db.prepare(`
      SELECT 
        COALESCE(f.name, 'Без завода') as factory_name,
        COALESCE(SUM(CASE WHEN s.packaging_type = 'bulk' THEN s.tonnage ELSE 0 END), 0) as bulk_tonnage,
        COALESCE(SUM(CASE WHEN s.packaging_type = 'bag' THEN s.tonnage ELSE 0 END), 0) as bag_tonnage,
        COALESCE(SUM(s.tonnage), 0) as total_factory_tonnage,
        COALESCE(SUM(s.cement_amount), 0) as total_cement_amount
      FROM sales s
      LEFT JOIN factories f ON s.factory_id = f.id
      WHERE s.sale_type = 'cement' ${dateFilter}
      GROUP BY s.factory_id
      ORDER BY total_cement_amount DESC
    `).all(...params);

    // 3. Детализация логистики по машинам (выручка)
    const logisticsByVehicle = db.prepare(`
      SELECT 
        COALESCE(s.vehicle_number, 'Не указана') as vehicle_number,
        v.model as vehicle_model,
        s.is_company_vehicle,
        COUNT(s.id) as trips_count,
        COALESCE(SUM(s.tonnage), 0) as total_tonnage,
        COALESCE(SUM(s.logistics_amount), 0) as total_revenue
      FROM sales s
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.logistics_amount > 0 ${dateFilter}
      GROUP BY s.vehicle_number
      ORDER BY total_revenue DESC
    `).all(...params);

    // 4. Расходы на логистику (газ, запчасти, зп, обед)
    let expenseDateFilter = '';
    const expenseParams = [];
    if (startDate && endDate) {
      expenseDateFilter = ' AND ct.date BETWEEN ? AND ?';
      expenseParams.push(startDate, endDate);
    } else if (startDate) {
      expenseDateFilter = ' AND ct.date >= ?';
      expenseParams.push(startDate);
    } else if (endDate) {
      expenseDateFilter = ' AND ct.date <= ?';
      expenseParams.push(endDate);
    }

    const logisticsExpenses = db.prepare(`
      SELECT 
        category,
        COALESCE(SUM(amount_uzs), 0) as total_expense
      FROM cash_transactions ct
      WHERE transaction_type = 'expense' 
        AND category IN ('gas', 'spare_parts', 'salary', 'lunch')
        ${expenseDateFilter}
      GROUP BY category
    `).all(...expenseParams);

    const totalLogisticsExpense = logisticsExpenses.reduce((sum, item) => sum + item.total_expense, 0);

    // 5. Расчет ориентировочной прибыли
    // Цемент: выручка за цемент минус себестоимость закупки
    const cementCostData = db.prepare(`
      SELECT 
        COALESCE(SUM(s.tonnage * COALESCE(p.purchase_price, s.price_per_ton * 0.88)), 0) as total_purchase_cost
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.sale_type = 'cement' ${dateFilter}
    `).get(...params);

    const cementProfit = turnoverStats.cement_turnover - (cementCostData.total_purchase_cost || 0);
    const logisticsProfit = turnoverStats.logistics_turnover - totalLogisticsExpense;

    // 6. Рейтинг «Лучшие клиенты» (объем, оплачено, прибыль)
    const topClients = db.prepare(`
      SELECT 
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone,
        c.balance as client_balance,
        COALESCE(SUM(s.tonnage), 0) as total_tonnage_bought,
        COALESCE(SUM(s.total_amount), 0) as total_sales_amount,
        COALESCE(SUM(s.paid_amount), 0) as total_paid_amount,
        COALESCE(SUM(s.debt_amount), 0) as total_debt_generated,
        COALESCE(SUM(s.cement_amount - (s.tonnage * COALESCE(p.purchase_price, s.price_per_ton * 0.88))), 0) as estimated_profit
      FROM clients c
      JOIN sales s ON s.client_id = c.id
      LEFT JOIN products p ON s.product_id = p.id
      WHERE 1=1 ${dateFilter}
      GROUP BY c.id
      ORDER BY total_sales_amount DESC
      LIMIT 10
    `).all(...params);

    // 7. Сводка долгов
    const debtsSummary = db.prepare(`
      SELECT 
        COUNT(*) as debtors_count,
        COALESCE(SUM(ABS(balance)), 0) as total_receivable_debt
      FROM clients
      WHERE balance < 0
    `).get();

    // 8. Динамика продаж по датам (для графика временного ряда)
    const salesTimeline = db.prepare(`
      SELECT 
        s.date,
        COALESCE(SUM(s.tonnage), 0) as tonnage,
        COALESCE(SUM(s.total_amount), 0) as total_amount,
        COALESCE(SUM(s.cement_amount), 0) as cement_amount,
        COALESCE(SUM(s.logistics_amount), 0) as logistics_amount
      FROM sales s
      WHERE 1=1 ${dateFilter}
      GROUP BY s.date
      ORDER BY s.date ASC
    `).all(...params);

    // 9. Статистика для графа бизнес-процессов (Pipeline Node Graph)
    const activeTicketsSummary = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(remaining_tonnage), 0) as remaining_tonnage,
        COALESCE(SUM(remaining_amount), 0) as remaining_amount
      FROM tickets
      WHERE status = 'active'
    `).get();

    const warehouseSummary = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN category = 'cement' AND packaging_type = 'bulk' THEN current_stock ELSE 0 END), 0) as bulk_stock,
        COALESCE(SUM(CASE WHEN category = 'cement' AND packaging_type = 'bag' THEN current_stock ELSE 0 END), 0) as bag_stock,
        COALESCE(SUM(CASE WHEN category = 'cement' THEN current_stock ELSE 0 END), 0) as total_cement_stock,
        COALESCE(SUM(CASE WHEN category = 'packaging' THEN current_stock ELSE 0 END), 0) as packaging_stock,
        COALESCE(SUM(CASE WHEN category = 'additive' THEN current_stock ELSE 0 END), 0) as additive_stock
      FROM products
    `).get();

    const fleetSummary = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN is_company_owned = 1 THEN 1 ELSE 0 END), 0) as company_vehicles
      FROM vehicles
    `).get();

    const factoriesSummary = db.prepare('SELECT COUNT(*) as count FROM factories').get();
    const clientsSummary = db.prepare('SELECT COUNT(*) as count FROM clients').get();

    const cashSummary = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount_uzs ELSE -amount_uzs END), 0) as net_cash
      FROM cash_transactions
    `).get();

    const brokerSummary = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'ticket_return') THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'ticket_allocation' THEN amount ELSE 0 END), 0) as balance
      FROM broker_account_logs
    `).get();

    res.json({
      success: true,
      turnover: {
        total: turnoverStats.total_turnover,
        cement: turnoverStats.cement_turnover,
        logistics: turnoverStats.logistics_turnover,
        totalTonnage: turnoverStats.total_cement_tonnage
      },
      profit: {
        total: cementProfit + logisticsProfit,
        cementProfit,
        logisticsProfit,
        logisticsExpense: totalLogisticsExpense,
        logisticsExpensesDetail: logisticsExpenses
      },
      debts: {
        totalDebt: debtsSummary.total_receivable_debt,
        debtorsCount: debtsSummary.debtors_count
      },
      cementByFactory,
      logisticsByVehicle,
      topClients,
      salesTimeline,
      pipelineStats: {
        factories: factoriesSummary.count,
        tickets: activeTicketsSummary,
        warehouse: warehouseSummary,
        fleet: fleetSummary,
        clients: clientsSummary.count,
        cash: cashSummary.net_cash,
        brokerBalance: brokerSummary?.balance || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 2. История по конкретному клиенту
function getClientHistory(req, res) {
  try {
    const { id } = req.params;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    const history = db.prepare(`
      SELECT 
        s.*,
        f.name as factory_name,
        p.name as product_name,
        p.cement_grade
      FROM sales s
      LEFT JOIN factories f ON s.factory_id = f.id
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.client_id = ?
      ORDER BY s.date DESC, s.id DESC
    `).all(id);

    const payments = db.prepare(`
      SELECT * FROM cash_transactions
      WHERE client_id = ? AND transaction_type = 'income'
      ORDER BY date DESC, id DESC
    `).all(id);

    res.json({
      success: true,
      client,
      sales: history,
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 3. История по конкретной машине
function getVehicleHistory(req, res) {
  try {
    const { id } = req.params;
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Транспортное средство не найдено' });
    }

    const shipments = db.prepare(`
      SELECT 
        s.*,
        c.name as client_name,
        f.name as factory_name,
        p.name as product_name
      FROM sales s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN factories f ON s.factory_id = f.id
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.vehicle_id = ? OR s.vehicle_number = ?
      ORDER BY s.date DESC, s.id DESC
    `).all(id, vehicle.plate_number);

    const expenses = db.prepare(`
      SELECT * FROM cash_transactions
      WHERE (vehicle_id = ? OR vehicle_number = ?) AND transaction_type = 'expense'
      ORDER BY date DESC, id DESC
    `).all(id, vehicle.plate_number);

    res.json({
      success: true,
      vehicle,
      shipments,
      expenses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 4. История по заводу
function getFactoryHistory(req, res) {
  try {
    const { id } = req.params;
    const factory = db.prepare('SELECT * FROM factories WHERE id = ?').get(id);
    if (!factory) {
      return res.status(404).json({ success: false, error: 'Завод не найден' });
    }

    const arrivals = db.prepare(`
      SELECT 
        a.*,
        p.name as product_name,
        p.cement_grade
      FROM arrivals a
      JOIN products p ON a.product_id = p.id
      WHERE a.factory_id = ?
      ORDER BY a.date DESC, a.id DESC
    `).all(id);

    const tickets = db.prepare(`
      SELECT 
        t.*,
        p.name as product_name
      FROM tickets t
      JOIN products p ON t.product_id = p.id
      WHERE t.factory_id = ?
      ORDER BY t.id DESC
    `).all(id);

    const payments = db.prepare(`
      SELECT * FROM cash_transactions
      WHERE factory_id = ?
      ORDER BY date DESC, id DESC
    `).all(id);

    res.json({
      success: true,
      factory,
      arrivals,
      tickets,
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getDashboardSummary,
  getClientHistory,
  getVehicleHistory,
  getFactoryHistory
};
