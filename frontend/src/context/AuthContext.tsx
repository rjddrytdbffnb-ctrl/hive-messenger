// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  avatar?: string;
  isOnline: boolean;
  role?: 'customer' | 'executor'; // заказчик или исполнитель
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Маппинг: бэкенд возвращает snake_case → фронтенд ожидает camelCase
function mapUser(raw: any): User {
  return {
    id:         raw.id,
    username:   raw.username,
    email:      raw.email,
    firstName:  raw.first_name  ?? raw.firstName  ?? '',
    lastName:   raw.last_name   ?? raw.lastName   ?? '',
    department: raw.department  ?? 'Other',
    avatar:     raw.avatar,
    isOnline:   raw.is_online   ?? raw.isOnline   ?? false,
  };
}

const DEMO_TOKEN = 'demo-token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Демо-режим — не идём на сервер
      if (token === DEMO_TOKEN) {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));
        return;
      }

      // Сначала восстанавливаем из кэша чтобы не было моргания
      const saved = localStorage.getItem('user');
      if (saved) setUser(JSON.parse(saved));

      // Пробуем обновить с сервера
      try {
        const response = await authAPI.getProfile();
        const rawUser = response.data.user ?? response.data;
        const freshUser = mapUser(rawUser);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch {
        // Сервер недоступен — остаёмся с кэшированными данными, не сбрасываем сессию
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Демо-режим: любой email + пароль 'password'
    if (password === 'password') {
      const demoUser: User = {
        id: '1',
        username: 'demo',
        email: email,
        firstName: 'Демо',
        lastName: 'Пользователь',
        department: 'IT',
        isOnline: true,
      };
      localStorage.setItem('token', DEMO_TOKEN);
      localStorage.setItem('user', JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true };
    }

    try {
      const response = await authAPI.login({ email, password });
      const { token, user: rawUser } = response.data;

      localStorage.setItem('token', token);
      const mappedUser = mapUser(rawUser);
      setUser(mappedUser);

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Ошибка входа. Проверьте email и пароль.';
      return { success: false, error: message };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authAPI.register({
        ...userData,
        // @ts-ignore — передаём дополнительные поля для бэкенда
        first_name: userData.firstName,
        last_name:  userData.lastName,
      });
      const { token, user: rawUser } = response.data;

      localStorage.setItem('token', token);
      const mappedUser = mapUser(rawUser);
      setUser(mappedUser);

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Ошибка регистрации.';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loading,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export {};
