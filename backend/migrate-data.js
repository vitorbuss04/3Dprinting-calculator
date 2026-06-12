import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const runMigration = async () => {
  console.log('Iniciando migração de dados...');

  // Read dump file
  const dumpPath = path.join(__dirname, '../supabase_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`Erro: Arquivo de dump não encontrado em ${dumpPath}`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  // Database connection pool
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'calc_user',
    password: process.env.DB_PASSWORD || 'calc_password',
    database: process.env.DB_NAME || 'print3d_calc',
    multipleStatements: true
  });

  try {
    // Disable FK checks temporarily for bulk load
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Migrate Users
    console.log(`Migrando ${dump.users.length} usuários...`);
    for (const u of dump.users) {
      await connection.query(
        'REPLACE INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [u.id, u.email, u.encrypted_password]
      );
    }

    // 2. Migrate Folders
    console.log(`Migrando ${dump.folders.length} pastas...`);
    for (const f of dump.folders) {
      const mysqlDate = f.created_at ? new Date(f.created_at).toISOString().slice(0, 19).replace('T', ' ') : null;
      await connection.query(
        'REPLACE INTO project_folders (id, user_id, name, created_at, status) VALUES (?, ?, ?, ?, ?)',
        [f.id, f.user_id, f.name, mysqlDate, f.status || 'aguardando']
      );
    }

    // 3. Migrate Printers
    console.log(`Migrando ${dump.printers.length} impressoras...`);
    for (const p of dump.printers) {
      await connection.query(
        `REPLACE INTO printers (id, user_id, name, acquisition_cost, lifespan_hours, power_consumption, maintenance_cost_per_hour)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.user_id, p.name, p.acquisition_cost, p.lifespan_hours, p.power_consumption, p.maintenance_cost_per_hour]
      );
    }

    // 4. Migrate Materials
    console.log(`Migrando ${dump.materials.length} materiais...`);
    for (const m of dump.materials) {
      await connection.query(
        `REPLACE INTO materials (id, user_id, type, name, color, spool_price, spool_weight, current_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.user_id, m.type, m.name, m.color || '#000000', m.spool_price, m.spool_weight, m.current_stock]
      );
    }

    // 5. Migrate Settings
    console.log(`Migrando ${dump.settings.length} configurações globais...`);
    for (const s of dump.settings) {
      await connection.query(
        'REPLACE INTO global_settings (id, user_id, electricity_cost, currency_symbol) VALUES (?, ?, ?, ?)',
        [s.id, s.user_id, s.electricity_cost, s.currency_symbol]
      );
    }

    // 6. Migrate Projects
    console.log(`Migrando ${dump.projects.length} projetos...`);
    for (const pr of dump.projects) {
      const mysqlDate = pr.date ? new Date(pr.date).toISOString().slice(0, 19).replace('T', ' ') : null;
      await connection.query(
        `REPLACE INTO projects (
          id, user_id, name, date, printer_id, material_id, print_time_hours, print_time_minutes,
          model_weight, failure_rate, labor_time_hours, labor_time_minutes, labor_hourly_rate,
          markup, result, folder_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pr.id, pr.user_id, pr.name, mysqlDate, pr.printer_id, pr.material_id, pr.print_time_hours, pr.print_time_minutes,
          pr.model_weight, pr.failure_rate, pr.labor_time_hours, pr.labor_time_minutes, pr.labor_hourly_rate,
          pr.markup, JSON.stringify(pr.result), pr.folder_id || null
        ]
      );
    }

    // Re-enable FK checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await connection.end();
  }
};

runMigration();
