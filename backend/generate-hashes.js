// generate-hashes.js
// Запуск: node generate-hashes.js
// Скопируйте хеш в init.sql вместо '$2b$10$YourHashedPasswordHere'

const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n========================================');
  console.log('Пароль для всех тестовых пользователей:');
  console.log(`  ${password}`);
  console.log('\nBcrypt hash (вставьте в init.sql):');
  console.log(`  ${hash}`);
  console.log('\nЗамените ВСЕ вхождения:');
  console.log(`  $2b$10$YourHashedPasswordHere`);
  console.log(`  на:`);
  console.log(`  ${hash}`);
  console.log('========================================\n');
}

generateHashes();
