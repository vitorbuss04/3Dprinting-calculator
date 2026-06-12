import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // we will use crypto.randomUUID() which is built-in node

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'calc_user',
  password: process.env.DB_PASSWORD || 'calc_password',
  database: process.env.DB_NAME || 'print3d_calc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate UUID (standard crypto module has randomUUID from Node 14.17+)
import crypto from 'crypto';
const generateUUID = () => crypto.randomUUID();

// Helper to convert DECIMAL values (returned as strings in mysql2) to numbers
const parseRowNumbers = (row, fields) => {
  const parsed = { ...row };
  for (const field of fields) {
    if (parsed[field] !== undefined && parsed[field] !== null) {
      parsed[field] = Number(parsed[field]);
    }
  }
  return parsed;
};

// --- AUTHENTICATION ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const userId = generateUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, email, passwordHash]
    );

    // Create default global settings for the new user
    const settingsId = generateUUID();
    await pool.query(
      'INSERT INTO global_settings (id, user_id, electricity_cost, currency_symbol) VALUES (?, ?, 0.85, "R$")',
      [settingsId, userId]
    );

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      user: { id: userId, email },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Erro no servidor durante o cadastro' });
  }
});

// Signin
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Email ou senha inválidos' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Erro no servidor durante o login' });
  }
});

// Me (Verify token)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update Password
app.post('/api/auth/update-password', authenticateToken, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Nova senha é obrigatória' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users WHERE id = ?', [passwordHash, req.user.id]);
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Erro ao atualizar a senha' });
  }
});

// --- PRINTERS ---
app.get('/api/printers', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM printers WHERE user_id = ?', [req.user.id]);
    const printers = rows.map(r => parseRowNumbers(r, [
      'acquisition_cost', 'lifespan_hours', 'power_consumption', 'maintenance_cost_per_hour'
    ]));
    res.json(printers);
  } catch (error) {
    console.error('Get printers error:', error);
    res.status(500).json({ error: 'Erro ao buscar impressoras' });
  }
});

app.post('/api/printers', authenticateToken, async (req, res) => {
  const { id, name, acquisition_cost, lifespan_hours, power_consumption, maintenance_cost_per_hour } = req.body;
  const printerId = id || generateUUID();
  try {
    await pool.query(
      `INSERT INTO printers (id, user_id, name, acquisition_cost, lifespan_hours, power_consumption, maintenance_cost_per_hour)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [printerId, req.user.id, name, acquisition_cost, lifespan_hours, power_consumption, maintenance_cost_per_hour]
    );
    res.status(201).json({ id: printerId, message: 'Impressora adicionada com sucesso' });
  } catch (error) {
    console.error('Add printer error:', error);
    res.status(500).json({ error: 'Erro ao adicionar impressora' });
  }
});

app.put('/api/printers/:id', authenticateToken, async (req, res) => {
  const { name, acquisition_cost, lifespan_hours, power_consumption, maintenance_cost_per_hour } = req.body;
  try {
    await pool.query(
      `UPDATE printers 
       SET name = ?, acquisition_cost = ?, lifespan_hours = ?, power_consumption = ?, maintenance_cost_per_hour = ?
       WHERE id = ? AND user_id = ?`,
      [name, acquisition_cost, lifespan_hours, power_consumption, maintenance_cost_per_hour, req.params.id, req.user.id]
    );
    res.json({ message: 'Impressora atualizada com sucesso' });
  } catch (error) {
    console.error('Update printer error:', error);
    res.status(500).json({ error: 'Erro ao atualizar impressora' });
  }
});

app.delete('/api/printers/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM printers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Impressora removida com sucesso' });
  } catch (error) {
    console.error('Delete printer error:', error);
    res.status(500).json({ error: 'Erro ao remover impressora' });
  }
});

// --- MATERIALS ---
app.get('/api/materials', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materials WHERE user_id = ?', [req.user.id]);
    const materials = rows.map(r => parseRowNumbers(r, [
      'spool_price', 'spool_weight', 'current_stock'
    ]));
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Erro ao buscar materiais' });
  }
});

app.post('/api/materials', authenticateToken, async (req, res) => {
  const { id, type, name, color, spool_price, spool_weight, current_stock } = req.body;
  const materialId = id || generateUUID();
  try {
    await pool.query(
      `INSERT INTO materials (id, user_id, type, name, color, spool_price, spool_weight, current_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [materialId, req.user.id, type, name, color, spool_price, spool_weight, current_stock]
    );
    res.status(201).json({ id: materialId, message: 'Material adicionado com sucesso' });
  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ error: 'Erro ao adicionar material' });
  }
});

app.put('/api/materials/:id', authenticateToken, async (req, res) => {
  const { type, name, color, spool_price, spool_weight, current_stock } = req.body;
  try {
    await pool.query(
      `UPDATE materials 
       SET type = ?, name = ?, color = ?, spool_price = ?, spool_weight = ?, current_stock = ?
       WHERE id = ? AND user_id = ?`,
      [type, name, color, spool_price, spool_weight, current_stock, req.params.id, req.user.id]
    );
    res.json({ message: 'Material atualizado com sucesso' });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Erro ao atualizar material' });
  }
});

app.delete('/api/materials/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM materials WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Material removido com sucesso' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Erro ao remover material' });
  }
});

// --- SETTINGS ---
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM global_settings WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.json({ electricity_cost: 0.85, currency_symbol: 'R$' });
    }
    res.json(parseRowNumbers(rows[0], ['electricity_cost']));
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  const { electricity_cost, currency_symbol } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM global_settings WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE global_settings SET electricity_cost = ?, currency_symbol = ? WHERE user_id = ?',
        [electricity_cost, currency_symbol, req.user.id]
      );
    } else {
      const id = generateUUID();
      await pool.query(
        'INSERT INTO global_settings (id, user_id, electricity_cost, currency_symbol) VALUES (?, ?, ?, ?)',
        [id, req.user.id, electricity_cost, currency_symbol]
      );
    }
    res.json({ message: 'Configurações salvas com sucesso' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// --- FOLDERS ---
app.get('/api/folders', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM project_folders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Erro ao buscar pastas' });
  }
});

app.post('/api/folders', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const id = generateUUID();
  try {
    await pool.query(
      'INSERT INTO project_folders (id, user_id, name) VALUES (?, ?, ?)',
      [id, req.user.id, name]
    );
    const [rows] = await pool.query('SELECT * FROM project_folders WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Erro ao criar pasta' });
  }
});

app.put('/api/folders/:id', authenticateToken, async (req, res) => {
  const { name, status } = req.body;
  try {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.params.id, req.user.id);
    await pool.query(
      `UPDATE project_folders SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    res.json({ message: 'Pasta atualizada com sucesso' });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Erro ao atualizar pasta' });
  }
});

app.delete('/api/folders/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM project_folders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Pasta removida com sucesso' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Erro ao remover pasta' });
  }
});

// --- PROJECTS ---
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY date DESC',
      [req.user.id]
    );

    const projects = rows.map(r => {
      const parsed = parseRowNumbers(r, [
        'print_time_hours', 'print_time_minutes', 'model_weight', 'failure_rate',
        'labor_time_hours', 'labor_time_minutes', 'labor_hourly_rate', 'markup'
      ]);
      // Parse result from JSON field
      if (parsed.result && typeof parsed.result === 'string') {
        try {
          parsed.result = JSON.parse(parsed.result);
        } catch (e) {
          console.warn('Error parsing result JSON string:', e);
        }
      }
      return parsed;
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  const {
    id, name, date, printer_id, material_id, print_time_hours, print_time_minutes,
    model_weight, failure_rate, labor_time_hours, labor_time_minutes, labor_hourly_rate,
    markup, result, folder_id
  } = req.body;

  const projectId = id || generateUUID();
  // Ensure date is formatted properly for MySQL TIMESTAMP
  const mysqlDate = date ? new Date(date).toISOString().slice(0, 19).replace('T', ' ') : null;

  try {
    await pool.query(
      `INSERT INTO projects (
        id, user_id, name, date, printer_id, material_id, print_time_hours, print_time_minutes,
        model_weight, failure_rate, labor_time_hours, labor_time_minutes, labor_hourly_rate,
        markup, result, folder_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, req.user.id, name, mysqlDate, printer_id, material_id, print_time_hours, print_time_minutes,
        model_weight, failure_rate, labor_time_hours, labor_time_minutes, labor_hourly_rate,
        markup, JSON.stringify(result), folder_id || null
      ]
    );
    res.status(201).json({ id: projectId, message: 'Projeto criado com sucesso' });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const {
    name, printer_id, material_id, print_time_hours, print_time_minutes,
    model_weight, failure_rate, labor_time_hours, labor_time_minutes, labor_hourly_rate,
    markup, result, folder_id
  } = req.body;

  try {
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (printer_id !== undefined) { fields.push('printer_id = ?'); values.push(printer_id); }
    if (material_id !== undefined) { fields.push('material_id = ?'); values.push(material_id); }
    if (print_time_hours !== undefined) { fields.push('print_time_hours = ?'); values.push(print_time_hours); }
    if (print_time_minutes !== undefined) { fields.push('print_time_minutes = ?'); values.push(print_time_minutes); }
    if (model_weight !== undefined) { fields.push('model_weight = ?'); values.push(model_weight); }
    if (failure_rate !== undefined) { fields.push('failure_rate = ?'); values.push(failure_rate); }
    if (labor_time_hours !== undefined) { fields.push('labor_time_hours = ?'); values.push(labor_time_hours); }
    if (labor_time_minutes !== undefined) { fields.push('labor_time_minutes = ?'); values.push(labor_time_minutes); }
    if (labor_hourly_rate !== undefined) { fields.push('labor_hourly_rate = ?'); values.push(labor_hourly_rate); }
    if (markup !== undefined) { fields.push('markup = ?'); values.push(markup); }
    if (result !== undefined) { fields.push('result = ?'); values.push(JSON.stringify(result)); }
    if (folder_id !== undefined) { fields.push('folder_id = ?'); values.push(folder_id || null); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.params.id, req.user.id);
    await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    res.json({ message: 'Projeto atualizado com sucesso' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Projeto removido com sucesso' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Erro ao remover projeto' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
