// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  // Подключиться с токеном
  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket подключён:', this.socket?.id);
      // Заходим во все комнаты чатов и личную комнату уведомлений
      this.socket?.emit('join_chats');
      this.socket?.emit('join_user_room');
      this.socket?.emit('user_online');
    });

    this.socket.on('disconnect', (reason: string) => {
  console.log('❌ Socket отключён:', reason);
});

this.socket.on('connect_error', (err: Error) => {
  console.error('⚠️ Ошибка подключения Socket:', err.message);
});

    return this.socket;
  }

  // Отключиться
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ============================================================
  // EMIT — отправляем события серверу
  // ============================================================

  joinChat(chatId: string) {
    this.socket?.emit('join_chat', chatId);
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', chatId);
  }

  sendTypingStart(chatId: string) {
    this.socket?.emit('typing_start', { chatId });
  }

  sendTypingStop(chatId: string) {
    this.socket?.emit('typing_stop', { chatId });
  }

  addReaction(messageId: string, emoji: string) {
    this.socket?.emit('add_reaction', { messageId, emoji });
  }

  removeReaction(messageId: string, emoji: string) {
    this.socket?.emit('remove_reaction', { messageId, emoji });
  }

  // ============================================================
  // ON — слушаем события от сервера
  // ============================================================

  onNewMessage(cb: (data: any) => void) {
    this.socket?.on('new_message', cb);
  }

  onUserTyping(cb: (data: { userId: string; username: string; chatId: string }) => void) {
    this.socket?.on('user_typing', cb);
  }

  onUserStopTyping(cb: (data: { userId: string; chatId: string }) => void) {
    this.socket?.on('user_stop_typing', cb);
  }

  onReactionAdded(cb: (data: { reaction: any; messageId: string }) => void) {
    this.socket?.on('reaction_added', cb);
  }

  onReactionRemoved(cb: (data: { messageId: string; userId: string; emoji: string }) => void) {
    this.socket?.on('reaction_removed', cb);
  }

  onUserStatusChange(cb: (data: { userId: string; username: string; status: 'online' | 'offline' }) => void) {
    this.socket?.on('user_status_change', cb);
  }

  onNotification(cb: (data: any) => void) {
    // Бэкенд шлёт 'new_notification' (notificationService.js)
    this.socket?.on('new_notification', cb);
    this.socket?.on('notification', cb);
  }

  onNewChat(cb: (data: any) => void) {
    this.socket?.on('new_chat', cb);
  }

  // Снять конкретный слушатель
  off(event: string) {
    this.socket?.off(event);
  }
}

// Синглтон — один экземпляр на всё приложение
export const socketService = new SocketService();