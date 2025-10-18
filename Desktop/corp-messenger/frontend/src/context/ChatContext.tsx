// src/context/ChatContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from './AuthContext';

export interface Message {
  id: string;
  text: string;
  sender: User;
  timestamp: Date;
  chatId: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group' | 'channel';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (text: string) => void;
  markAsRead: (chatId: string) => void;
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

// Моковые данные для демонстрации
const mockUsers: User[] = [
  {
    id: '1',
    username: 'alexey',
    email: 'alexey@company.com',
    firstName: 'Алексей',
    lastName: 'Иванов',
    department: 'IT',
    isOnline: true
  },
  {
    id: '2',
    username: 'maria',
    email: 'maria@company.com',
    firstName: 'Мария',
    lastName: 'Петрова',
    department: 'Marketing',
    isOnline: false
  },
  {
    id: '3',
    username: 'dmitry',
    email: 'dmitry@company.com',
    firstName: 'Дмитрий',
    lastName: 'Сидоров',
    department: 'Sales',
    isOnline: true
  }
];

const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Общий чат компании',
    type: 'group',
    participants: mockUsers,
    unreadCount: 0
  },
  {
    id: '2',
    name: 'IT отдел',
    type: 'group',
    participants: mockUsers.filter(u => u.department === 'IT'),
    unreadCount: 3
  },
  {
    id: '3',
    name: 'Проект "Альфа"',
    type: 'channel',
    participants: mockUsers,
    unreadCount: 0
  },
  {
    id: '4',
    name: 'Алексей Иванов',
    type: 'private',
    participants: [mockUsers[0]],
    unreadCount: 1,
    isOnline: true
  },
  {
    id: '5',
    name: 'Мария Петрова',
    type: 'private',
    participants: [mockUsers[1]],
    unreadCount: 0,
    isOnline: false
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Добро пожаловать в корпоративный мессенджер! 🎉',
    sender: mockUsers[0],
    timestamp: new Date(Date.now() - 3600000),
    chatId: '1',
    isRead: true
  },
  {
    id: '2',
    text: 'Здесь вы можете общаться с коллегами в реальном времени',
    sender: mockUsers[0],
    timestamp: new Date(Date.now() - 3500000),
    chatId: '1',
    isRead: true
  },
  {
    id: '3',
    text: 'Привет всем! Как дела?',
    sender: mockUsers[1],
    timestamp: new Date(Date.now() - 3000000),
    chatId: '1',
    isRead: true
  },
  {
    id: '4',
    text: 'Всем привет! Отлично, работаем 👍',
    sender: mockUsers[2],
    timestamp: new Date(Date.now() - 2900000),
    chatId: '1',
    isRead: true
  }
];

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [loading, setLoading] = useState(false);

  const sendMessage = (text: string) => {
    if (!activeChat || !text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: mockUsers[0], // В реальном приложении здесь будет текущий пользователь
      timestamp: new Date(),
      chatId: activeChat.id,
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);

    // Обновляем последнее сообщение в чате
    setChats(prev => prev.map(chat => 
      chat.id === activeChat.id 
        ? { ...chat, lastMessage: newMessage, unreadCount: chat.unreadCount + 1 }
        : chat
    ));
  };

  const markAsRead = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
    
    setMessages(prev => prev.map(message => 
      message.chatId === chatId ? { ...message, isRead: true } : message
    ));
  };

  const value: ChatContextType = {
    chats,
    activeChat,
    messages,
    setActiveChat,
    sendMessage,
    markAsRead,
    loading
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export {};