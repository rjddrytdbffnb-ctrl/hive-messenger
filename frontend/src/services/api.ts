// src/services/api.ts
import axios from 'axios';
import { User, LoginData, RegisterData, AuthResponse } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Автоматически подставляем JWT токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Если токен протух — выкидываем на логин
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
  login: (data: LoginData) =>
    api.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterData) =>
    api.post<AuthResponse>('/api/auth/register', data),

  getProfile: () =>
    api.get<{ user: User }>('/api/users/me'),
};

// ============================================================
// USERS API
// ============================================================
export const usersAPI = {
  getAll: () =>
    api.get<{ users: User[] }>('/api/users'),
};

// ============================================================
// CHATS API
// ============================================================
export const chatsAPI = {
  getAll: () =>
    api.get<{ chats: any[] }>('/api/chats'),

  create: (name: string, type: 'group' | 'channel', memberIds: string[]) =>
    api.post<{ chat: any }>('/api/chats', { name, type, memberIds }),

  createDirect: (targetUserId: string) =>
    api.post<{ chat: any }>('/api/chats/direct', { targetUserId }),

  getMembers: (chatId: string) =>
    api.get<{ members: any[] }>(`/api/chats/${chatId}/members`),

  addMember: (chatId: string, userId: string) =>
    api.post(`/api/chats/${chatId}/members`, { userId }),

  removeMember: (chatId: string, userId: string) =>
    api.delete(`/api/chats/${chatId}/members/${userId}`),

  getStats: (chatId: string) =>
    api.get(`/api/chats/${chatId}/stats`),

  search: (chatId: string, query: string) =>
    api.get(`/api/chats/${chatId}/search`, { params: { query } }),
};

// ============================================================
// MESSAGES API
// ============================================================
export const messagesAPI = {
  getByChat: (chatId: string, page = 1, limit = 50) =>
    api.get<{ messages: any[] }>(`/api/chats/${chatId}/messages`, {
      params: { page, limit }
    }),

  send: (chatId: string, text: string, replyTo?: string) =>
    api.post<{ message: any }>(`/api/chats/${chatId}/messages`, {
      text,
      reply_to: replyTo
    }),

  // Загрузка файла вместе с сообщением
  sendWithFile: (chatId: string, formData: FormData) =>
    api.post<{ message: any }>(`/api/chats/${chatId}/messages/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getReactions: (messageId: string) =>
    api.get(`/api/messages/${messageId}/reactions`),
};

// ============================================================
// NOTIFICATIONS API
// ============================================================
export const notificationsAPI = {
  getAll: () =>
    api.get<{ notifications: any[] }>('/api/notifications'),

  markAsRead: (id: string) =>
    api.put(`/api/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/api/notifications/read-all'),
};

export default api;