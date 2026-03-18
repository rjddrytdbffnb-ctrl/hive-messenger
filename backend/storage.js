const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// Функция для загрузки данных из файла
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
  
  // Возвращаем данные по умолчанию если файла нет
  return {
    users: [],
    messages: [],
    chats: [
      { id: 'general', name: '💬 Общий чат', type: 'public' },
      { id: 'random', name: '🎉 Неформальный чат', type: 'public' },
      { id: 'projects', name: '📁 Проекты', type: 'public' }
    ]
  };
}

// Функция для сохранения данных в файл
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('✅ Данные сохранены в файл');
  } catch (error) {
    console.error('❌ Ошибка сохранения данных:', error);
  }
}

// Инициализация данных
let appData = loadData();

module.exports = {
  get users() {
    return appData.users;
  },
  set users(newUsers) {
    appData.users = newUsers;
    saveData(appData);
  },
  
  get messages() {
    return appData.messages;
  },
  set messages(newMessages) {
    appData.messages = newMessages;
    saveData(appData);
  },
  
  get chats() {
    return appData.chats;
  },
  set chats(newChats) {
    appData.chats = newChats;
    saveData(appData);
  },
  
  // Методы для добавления данных
  addUser(user) {
    appData.users.push(user);
    saveData(appData);
  },
  
  addMessage(message) {
    appData.messages.push(message);
    saveData(appData);
  },
  
  // Метод для полного обновления данных
  updateData(newData) {
    appData = newData;
    saveData(appData);
  },
  
  // Метод для получения всех данных
  getAllData() {
    return appData;
  }
};