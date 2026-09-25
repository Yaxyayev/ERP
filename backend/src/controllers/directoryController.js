const { db } = require('../config/database');

// --- ЗАВОДЫ ---
function getFactories(req, res) {
  try {
    const factories = db.prepare('SELECT * FROM factories ORDER BY id DESC').all();
    res.json({ success: true, data: factories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function createFactory(req, res) {
  try {
    const { name, contact_person, phone, address, notes } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Название завода обязательно' });
    }
    const stmt = db.prepare(`
      INSERT INTO factories (name, contact_person, phone, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, contact_person || null, phone || null, address || null, notes || null);
    const newFactory = db.prepare('SELECT * FROM factories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newFactory });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function updateFactory(req, res) {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, address, notes } = req.body;
    const stmt = db.prepare(`
      UPDATE factories
      SET name = ?, contact_person = ?, phone = ?, address = ?, notes = ?
      WHERE id = ?
    `);
    const result = stmt.run(name, contact_person, phone, address, notes, id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Завод не найден' });
    }
    const updated = db.prepare('SELECT * FROM factories WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function deleteFactory(req, res) {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM factories WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Завод не найден' });
    }
    res.json({ success: true, message: 'Завод удален' });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Нельзя удалить завод, связанный с товарами или тикетами' });
  }
}

// --- КЛИЕНТЫ ---
function getClients(req, res) {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY id DESC').all();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function createClient(req, res) {
  try {
    const { cleanNumber } = require('../utils/numberUtils');
    const { name, phone, company_name, balance, initial_debt, notes } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Имя клиента обязательно' });
    }
    let clientBalance = cleanNumber(balance);
    if (initial_debt && cleanNumber(initial_debt) > 0) {
      clientBalance = -cleanNumber(initial_debt);
    }

    const stmt = db.prepare(`
      INSERT INTO clients (name, phone, company_name, balance, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, phone || null, company_name || null, clientBalance, notes || null);
    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function updateClient(req, res) {
  try {
    const { cleanNumber } = require('../utils/numberUtils');
    const { id } = req.params;
    const { name, phone, company_name, balance, initial_debt, notes } = req.body;
    
    let stmt;
    let result;
    if (initial_debt !== undefined && initial_debt !== null && initial_debt !== '') {
      stmt = db.prepare(`
        UPDATE clients
        SET name = ?, phone = ?, company_name = ?, balance = ?, notes = ?
        WHERE id = ?
      `);
      result = stmt.run(name, phone, company_name, -cleanNumber(initial_debt), notes, id);
    } else if (balance !== undefined && balance !== null && balance !== '') {
      stmt = db.prepare(`
        UPDATE clients
        SET name = ?, phone = ?, company_name = ?, balance = ?, notes = ?
        WHERE id = ?
      `);
      result = stmt.run(name, phone, company_name, cleanNumber(balance), notes, id);
    } else {
      stmt = db.prepare(`
        UPDATE clients
        SET name = ?, phone = ?, company_name = ?, notes = ?
        WHERE id = ?
      `);
      result = stmt.run(name, phone, company_name, notes, id);
    }

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }
    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function deleteClient(req, res) {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }
    res.json({ success: true, message: 'Клиент удален' });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Нельзя удалить клиента, у которого есть сделки' });
  }
}

// --- МАШИНЫ ---
function getVehicles(req, res) {
  try {
    const vehicles = db.prepare(`
      SELECT v.*, c.name as client_name 
      FROM vehicles v
      LEFT JOIN clients c ON v.client_id = c.id
      ORDER BY v.id DESC
    `).all();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function createVehicle(req, res) {
  try {
    const { plate_number, model, client_id, is_company_owned, driver_name, driver_phone, notes } = req.body;
    if (!plate_number) {
      return res.status(400).json({ success: false, error: 'Гос. номер машины обязателен' });
    }
    const stmt = db.prepare(`
      INSERT INTO vehicles (plate_number, model, client_id, is_company_owned, driver_name, driver_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      plate_number.toUpperCase().trim(),
      model || null,
      client_id ? Number(client_id) : null,
      is_company_owned === 0 ? 0 : 1,
      driver_name || null,
      driver_phone || null,
      notes || null
    );
    const newVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newVehicle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function updateVehicle(req, res) {
  try {
    const { id } = req.params;
    const { plate_number, model, client_id, is_company_owned, driver_name, driver_phone, notes } = req.body;
    const stmt = db.prepare(`
      UPDATE vehicles
      SET plate_number = ?, model = ?, client_id = ?, is_company_owned = ?, driver_name = ?, driver_phone = ?, notes = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      plate_number.toUpperCase().trim(),
      model,
      client_id ? Number(client_id) : null,
      is_company_owned === 0 ? 0 : 1,
      driver_name,
      driver_phone,
      notes,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Транспортное средство не найдено' });
    }
    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function deleteVehicle(req, res) {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM vehicles WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Машина не найдена' });
    }
    res.json({ success: true, message: 'Машина удалена' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// --- ТОВАРЫ ---
function getProducts(req, res) {
  try {
    const products = db.prepare(`
      SELECT p.*, f.name as factory_name
      FROM products p
      LEFT JOIN factories f ON p.factory_id = f.id
      ORDER BY p.id DESC
    `).all();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function createProduct(req, res) {
  try {
    let {
      name, category, cement_grade, packaging_type, unit,
      current_stock, min_stock_alert, purchase_price, selling_price, factory_id
    } = req.body;

    category = category || 'cement';
    unit = unit || 'т';
    packaging_type = packaging_type || 'bulk';

    if (!name) {
      let facName = '';
      if (factory_id) {
        const fac = db.prepare('SELECT name FROM factories WHERE id = ?').get(factory_id);
        if (fac) facName = fac.name;
      }
      const grade = cement_grade ? ` ${cement_grade}` : '';
      name = `${facName ? facName + ' ' : ''}Цемент${grade}`.trim() || 'Цемент';
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        name, category, cement_grade, packaging_type, unit,
        current_stock, min_stock_alert, purchase_price, selling_price, factory_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category,
      cement_grade || null,
      packaging_type,
      unit,
      Number(current_stock) || 0,
      Number(min_stock_alert) || 0,
      Number(purchase_price) || 0,
      Number(selling_price) || 0,
      factory_id ? Number(factory_id) : null
    );

    const newProd = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newProd });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name, category, cement_grade, packaging_type, unit,
      min_stock_alert, purchase_price, selling_price, factory_id, is_active
    } = req.body;

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, category = ?, cement_grade = ?, packaging_type = ?, unit = ?,
          min_stock_alert = ?, purchase_price = ?, selling_price = ?, factory_id = ?, is_active = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      category,
      cement_grade,
      packaging_type,
      unit,
      Number(min_stock_alert) || 0,
      Number(purchase_price) || 0,
      Number(selling_price) || 0,
      factory_id ? Number(factory_id) : null,
      is_active !== undefined ? Number(is_active) : 1,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Товар не найден' });
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Товар не найден' });
    }
    res.json({ success: true, message: 'Товар удален' });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Нельзя удалить товар, участвующий в операциях склада или продаж' });
  }
}

module.exports = {
  getFactories, createFactory, updateFactory, deleteFactory,
  getClients, createClient, updateClient, deleteClient,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getProducts, createProduct, updateProduct, deleteProduct
};
