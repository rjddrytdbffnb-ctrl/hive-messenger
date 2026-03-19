// database.js
require('dotenv').config();
const { Pool } = require('pg');

// ИСПРАВЛЕНО: используем DATABASE_URL для Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  // Настройки пула подключений
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Увеличено для Railway
});

// Обработка ошибок пула
pool.on('error', (err, client) => {
  console.error('❌ Неожиданная ошибка PostgreSQL:', err);
});

// Проверка подключения при старте
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    console.error('   Проверьте переменную DATABASE_URL');
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
        // Не прерываем если таблицы уже существуют
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }
    
    console.log('✅ Все миграции выполнены успешно!\n');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('ℹ️  Папка migrations не найдена, пропускаем миграции\n');
    } else {
      console.error('❌ Ошибка миграций:', err.message);
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