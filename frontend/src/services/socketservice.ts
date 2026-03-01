import io from 'socket.io-client';

class SocketService {
  private socket: any = null;

  connect(token?: string) {
    const SOCKET_URL = 'http://localhost:5000';

    const options: any = {
      transports: ['websocket', 'polling']
    };

    // Добавляем токен аутентификации, если есть
    if (token) {
      options.auth = {
        token: token
      };
    }

    this.socket = io(SOCKET_URL, options);

    this.socket.on('connect', () => {
      console.log('✅ WebSocket подключен:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket отключен:', reason);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Ошибка подключения WebSocket:', error);
    });

    return this.socket;
  }

  // ДОБАВЛЯЕМ МЕТОД DISCONNECT
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket отключен вручную');
    }
  }

  getSocket() {
    return this.socket;
  }

  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  sendMessage(messageData: {
    text: string;
    sender: string;
    chatId: string;
  }) {
    if (this.socket) {
      this.socket.emit('send_message', messageData);
    }
  }

  onReceiveMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Новый метод для загрузки истории сообщений
  async loadChatHistory(chatId: string) {
    try {
      // Здесь будет реальный API вызов, когда добавим чат-сервис
      console.log('Загрузка истории для чата:', chatId);
      return [];
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error);
      return [];
    }
  }

  // Новый метод для получения списка чатов
  async getChats() {
    try {
      // Здесь будет реальный API вызов
      console.log('Загрузка списка чатов');
      return [
        { id: 'general', name: '💬 Общий чат', type: 'public' },
        { id: 'random', name: '🎉 Неформальный чат', type: 'public' },
        { id: 'projects', name: '📁 Проекты', type: 'public' }
      ];
    } catch (error) {
      console.error('Ошибка загрузки списка чатов:', error);
      return [];
    }
  }
}

export default new SocketService();