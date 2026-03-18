// socketService.js
import { io } from 'socket.io-client';

const WS_URL = 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('❌ Нет токена для подключения WebSocket');
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket подключен');
      this.socket.emit('join_chats');
      this.socket.emit('join_user_room');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket отключен');
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket ошибка:', error);
    });

    // Автоматически подписываемся на сохраненные обработчики
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    this.listeners.set(event, callback);
    
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    this.listeners.delete(event);
    
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error('❌ WebSocket не подключен');
    }
  }

  // Вспомогательные методы
  sendMessage(chatId, text) {
    this.emit('send_message', { chatId, text });
  }

  startTyping(chatId) {
    this.emit('typing_start', { chatId });
  }

  stopTyping(chatId) {
    this.emit('typing_stop', { chatId });
  }

  addReaction(messageId, emoji) {
    this.emit('add_reaction', { messageId, emoji });
  }
}

export default new SocketService();
