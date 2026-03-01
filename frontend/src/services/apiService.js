// apiService.js - сервис для работы с API бэкенда

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  // Загружаем токен из localStorage при создании
  loadToken() {
    this.token = localStorage.getItem('authToken');
  }

  // Сохраняем токен
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Удаляем токен (при выходе)
  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Базовый метод для HTTP запросов
  async request(url, options = {}) {
    // Загружаем актуальный токен
    this.loadToken();
    
    // Подготавливаем заголовки
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Добавляем токен авторизации, если он есть
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      // Парсим JSON ответ
      const data = await response.json();

      // Если статус не успешный, выбрасываем ошибку
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
      return data;

    } catch (error) {
      console.error(`❌ API Error: ${options.method || 'GET'} ${url}`, error);
      
      // Если ошибка 401 (Unauthorized), удаляем токен
      if (error.message.includes('401')) {
        this.removeToken();
        // Можно добавить редирект на страницу входа
        window.dispatchEvent(new Event('unauthorized'));
      }
      
      throw error;
    }
  }

  // 🔐 АУТЕНТИФИКАЦИЯ

  // Вход пользователя
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // Сохраняем токен после успешного входа
    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  // Регистрация пользователя
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    // Сохраняем токен после успешной регистрации
    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  // Выход пользователя
  logout() {
    this.removeToken();
    return Promise.resolve({ message: 'Logged out successfully' });
  }

  // 👥 ПОЛЬЗОВАТЕЛИ

  // Получить текущего пользователя
  async getCurrentUser() {
    return this.request('/users/me');
  }

  // Получить всех пользователей
  async getUsers() {
    return this.request('/users');
  }

  // 💬 ЧАТЫ

  // Получить все чаты
  async getChats() {
    return this.request('/chats');
  }

  // Создать новый чат
  async createChat(name, type = 'department') {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify({ name, type })
    });
  }

  // 📝 СООБЩЕНИЯ

  // Получить сообщения чата
  async getMessages(chatId) {
    return this.request(`/chats/${chatId}/messages`);
  }

  // Отправить сообщение
  async sendMessage(chatId, text) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  // 🔔 УВЕДОМЛЕНИЯ

  // Получить уведомления
  async getNotifications() {
    return this.request('/notifications');
  }

  // Отметить уведомление как прочитанное
  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // 😊 РЕАКЦИИ

  // Получить реакции сообщения
  async getMessageReactions(messageId) {
    return this.request(`/messages/${messageId}/reactions`);
  }

  // 🔍 ПОИСК

  // Поиск сообщений в чате
  async searchMessages(chatId, query) {
    return this.request(`/chats/${chatId}/search?query=${encodeURIComponent(query)}`);
  }

  // 📊 СТАТИСТИКА

  // Получить статистику чата
  async getChatStats(chatId) {
    return this.request(`/chats/${chatId}/stats`);
  }
}

// Создаем единственный экземпляр (синглтон)
const apiService = new ApiService();

export default apiService;