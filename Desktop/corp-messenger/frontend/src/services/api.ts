// src/services/api.ts
import axios from 'axios';
import { mockAuthAPI, mockUsersAPI } from './mockApi';
import { User, LoginData, RegisterData, AuthResponse } from '../context/AuthContext';

// Флаг для переключения между моками и реальным API
const USE_MOCK_API = true;

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для автоматической подстановки токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token.startsWith('mock-jwt-token')) {
      // Для моковых токенов не добавляем заголовок
      return config;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API для аутентификации
export const authAPI = USE_MOCK_API ? {
  login: mockAuthAPI.login,
  register: mockAuthAPI.register,
  getProfile: mockAuthAPI.getProfile,
} : {
  login: (data: LoginData) => 
    api.post<AuthResponse>('/api/auth/login', data),
  
  register: (data: RegisterData) => 
    api.post<AuthResponse>('/api/auth/register', data),
  
  getProfile: () => 
    api.get<User>('/api/auth/profile'),
};

// API для пользователей
export const usersAPI = USE_MOCK_API ? {
  getAll: mockUsersAPI.getAll,
} : {
  getAll: () => 
    api.get<User[]>('/api/users'),
};

export default api;