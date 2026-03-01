import apiService from './services/apiService';

async function testApiService() {
  console.log('🧪 Тестируем apiService...');

  try {
    // 1. Тест входа
    console.log('1. Тестируем вход...');
    const loginResult = await apiService.login('alexey@company.com', 'password123');
    console.log('✅ Вход успешен:', loginResult);

    // 2. Тест получения чатов
    console.log('2. Тестируем получение чатов...');
    const chatsResult = await apiService.getChats();
    console.log('✅ Чаты получены:', chatsResult);

    // 3. Тест получения пользователей
    console.log('3. Тестируем получение пользователей...');
    const usersResult = await apiService.getUsers();
    console.log('✅ Пользователи получены:', usersResult);

    // 4. Тест отправки сообщения (если есть чаты)
    if (chatsResult.chats && chatsResult.chats.length > 0) {
      console.log('4. Тестируем отправку сообщения...');
      const messageResult = await apiService.sendMessage(
        chatsResult.chats[0].id, 
        'Тестовое сообщение из apiService!'
      );
      console.log('✅ Сообщение отправлено:', messageResult);
    }

    console.log('🎉 Все тесты пройдены успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Запускаем тест при загрузке файла
testApiService();