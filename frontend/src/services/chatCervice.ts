import { chatsAPI, messagesAPI } from './api';

export interface Chat {
  id: string;
  name: string;
  type: 'public' | 'private';
  lastMessage?: string;
  unreadCount?: number;
}

export interface Message {
  id: number;
  text: string;
  sender: string;
  senderId: number;
  timestamp: Date;
  chatId: string;
}

class ChatService {
  async getChats(): Promise<Chat[]> {
    try {
      const response = await chatsAPI.getAll();
      return response.data.chats ?? [];
    } catch (error) {
      console.error('Ошибка получения списка чатов:', error);
      return [];
    }
  }

  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const response = await messagesAPI.getByChat(chatId);
      return (response.data.messages ?? []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.created_at ?? msg.timestamp)
      }));
    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      return [];
    }
  }

  async createChat(name: string, participants: string[]): Promise<Chat | null> {
    try {
      const response = await chatsAPI.create(name, 'group', participants);
      return response.data.chat;
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      return null;
    }
  }
}

export default new ChatService();
