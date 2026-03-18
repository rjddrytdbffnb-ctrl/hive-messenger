// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: Date;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Преобразуем строки дат обратно в Date объекты
        const withDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(withDates);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    } else {
      // Начальные уведомления (примеры)
      setNotifications([
        {
          id: '1',
          title: 'Добро пожаловать!',
          message: 'Добро пожаловать в Hive Messenger! Начните общение с коллегами.',
          type: 'info',
          isRead: false,
          timestamp: new Date(),
          icon: '👋'
        },
        {
          id: '2',
          title: 'Новое сообщение',
          message: 'У вас новое сообщение в чате',
          type: 'info',
          isRead: false,
          timestamp: new Date(),
          icon: '💬'
        }
      ]);
    }
  }, []);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Подсчёт непрочитанных
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
