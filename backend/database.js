// database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'corp_messenger',
  password: process.env.DB_PASSWORD || '0000',
  port: process.env.DB_PORT || 5432,
  // Настройки пула подключений
  max: 20, // максимум подключений
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Обработка ошибок пула
pool.on('error', (err, client) => {
  console.error('❌ Неожиданная ошибка PostgreSQL:', err);
  process.exit(-1);
});

// Проверка подключения при старте
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    console.error('   Проверьте настройки в .env файле');
    process.exit(1);
  } else {
    console.log('✅ PostgreSQL подключена успешно!');
    console.log(`   📅 Время сервера БД: ${res.rows[0].now}`);
  }
});

// Функция для выполнения миграций
async function runMigrations() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    console.log('\n🔄 Запуск миграций...');
    
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`   ✅ ${file}`);
      } catch (err) {
        console.error(`   ❌ Ошибка в ${file}:`, err.message);
        throw err;
      }
    }
    
    console.log('✅ Все миграции выполнены успешно!\n');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('ℹ️  Папка migrations не найдена, пропускаем миграции\n');
    } else {
      throw err;
    }
  }
}

// Функция для graceful shutdown
async function closePool() {
  try {
    await pool.end();
    console.log('✅ Подключения к PostgreSQL закрыты');
  } catch (err) {
    console.error('❌ Ошибка при закрытии подключений:', err);
  }
}

// Обработка завершения процесса
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

module.exports = { pool, runMigrations, closePool };
