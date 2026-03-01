// src/context/ChatContext.tsx - ПОЛНАЯ ВЕРСИЯ
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';
import { getSmartBotResponse, isBot, BOTS } from '../services/chatBots';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  isOnline?: boolean;
  avatar?: string;
  department?: string;
}

interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Message {
  id: string;
  chatId: string;
  sender: User;
  text: string;
  timestamp: string;
  isRead: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  replyTo?: Message;
  attachments?: File[];
  reactions?: Reaction[];
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isOnline?: boolean;
  participants?: User[];
  messages?: Message[];
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (text: string, files?: File[]) => void;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  
  // Дополнительные функции для ChatList
  markAsRead: (chatId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  unarchiveChat: (chatId: string) => void;
  loading: boolean;
  
  // Дополнительные функции для MessageList
  messages: Message[];
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  forwardMessage: (messageId: string, chatIds: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'bot_chat_alex',
      name: 'Алексей Иванов (БОТ)',
      type: 'direct',
      avatar: 'АИ',
      lastMessage: 'Привет! Это тестовый бот 🤖',
      lastMessageTime: '10:30',
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isOnline: true,
      participants: [
        { id: 'bot_alex', firstName: 'Алексей', lastName: 'Иванов', isOnline: true }
      ],
      messages: []
    },
    {
      id: 'bot_chat_maria',
      name: 'Мария Петрова (БОТ)',
      type: 'direct',
      avatar: 'МП',
      lastMessage: 'Готова помочь! 🎉',
      lastMessageTime: '09:15',
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isOnline: true,
      participants: [
        { id: 'bot_maria', firstName: 'Мария', lastName: 'Петрова', isOnline: true }
      ],
      messages: []
    },
    {
      id: '1',
      name: 'IT отдел',
      type: 'group',
      avatar: 'IT',
      lastMessage: 'Обновление системы завершено',
      lastMessageTime: '14:30',
      unreadCount: 3,
      isPinned: false,
      isArchived: false,
      participants: [
        { id: '1', firstName: 'Алексей', lastName: 'Иванов', isOnline: true },
        { id: '2', firstName: 'Иван', lastName: 'Козлов', isOnline: false },
      ],
      messages: []
    },
    {
      id: '2',
      name: 'Мария Петрова',
      type: 'direct',
      avatar: 'МП',
      lastMessage: 'Отправила презентацию',
      lastMessageTime: '12:15',
      unreadCount: 1,
      isPinned: true,
      isArchived: false,
      isOnline: true,
      participants: [
        { id: '3', firstName: 'Мария', lastName: 'Петрова', isOnline: true }
      ],
      messages: []
    }
  ]);

  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Автооткрытие чата при переходе со страницы сотрудников
  useEffect(() => {
    const state = location.state as any;
    
    if (state?.startChatWith) {
      const emp = state.startChatWith;
      
      const existingChat = chats.find(chat => 
        chat.type === 'direct' && 
        chat.participants?.some(p => p.id === emp.id)
      );
      
      if (existingChat) {
        setActiveChat(existingChat);
      } else {
        const newChat: Chat = {
          id: `chat_${Date.now()}`,
          name: `${emp.firstName} ${emp.lastName}`,
          type: 'direct',
          avatar: emp.avatar || `${emp.firstName[0]}${emp.lastName[0]}`,
          lastMessage: 'Начните общение...',
          lastMessageTime: 'Сейчас',
          unreadCount: 0,
          isPinned: false,
          isArchived: false,
          participants: [emp],
          messages: []
        };
        
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat);
      }
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Загружаем сообщения активного чата
  useEffect(() => {
    if (activeChat) {
      setMessages(activeChat.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  // Отправка сообщения
  const sendMessage = (text: string, files?: File[]) => {
    if (!activeChat || (!text.trim() && !files?.length)) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId: activeChat.id,
      sender: {
        id: user?.id || 'current',
        firstName: user?.firstName || 'Вы',
        lastName: user?.lastName || '',
        isOnline: true
      },
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      replyTo: replyingTo || undefined,
      attachments: files,
      reactions: []
    };

    setMessages(prev => [...prev, newMessage]);

    setActiveChat(prev => ({
      ...prev!,
      messages: [...(prev!.messages || []), newMessage],
      lastMessage: text.trim() || '📎 Файл',
      lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: [...(chat.messages || []), newMessage],
              lastMessage: text.trim() || '📎 Файл',
              lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          : chat
      )
    );

    setReplyingTo(null);

    // ============================================
    // ОТВЕТЫ БОТОВ
    // ============================================
    const otherMembers = activeChat.participants?.filter(p => p.id !== user?.id) || [];
    
    otherMembers.forEach((member) => {
      if (isBot(member.id)) {
        const botResponse = getSmartBotResponse(member.id, text.trim());
        
        if (botResponse) {
          // Показываем "печатает..."
          setIsTyping(true);
          
          // Отправляем ответ с задержкой
          setTimeout(() => {
            const botMessage: Message = {
              id: `msg_${Date.now()}_${Math.random()}`,
              chatId: activeChat.id,
              sender: member,
              text: botResponse.text,
              timestamp: new Date().toISOString(),
              isRead: false,
              reactions: []
            };
            
            setMessages(prev => [...prev, botMessage]);
            
            setActiveChat(prev => prev ? ({
              ...prev,
              messages: [...(prev.messages || []), botMessage],
              lastMessage: botResponse.text,
              lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }) : null);
            
            setChats(prevChats =>
              prevChats.map(chat =>
                chat.id === activeChat.id
                  ? {
                      ...chat,
                      messages: [...(chat.messages || []), botMessage],
                      lastMessage: botResponse.text,
                      lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                    }
                  : chat
              )
            );
            
            setIsTyping(false);
          }, botResponse.delay);
        }
      }
    });
  };

  // Пометить как прочитанное
  const markAsRead = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  // Закрепить чат
  const pinChat = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, isPinned: true } : chat
      )
    );
  };

  // Открепить чат
  const unpinChat = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, isPinned: false } : chat
      )
    );
  };

  // Архивировать чат
  const archiveChat = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, isArchived: true } : chat
      )
    );
  };

  // Разархивировать чат
  const unarchiveChat = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, isArchived: false } : chat
      )
    );
  };

  // Добавить реакцию
  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                {
                  emoji,
                  userId: user?.id || 'current',
                  userName: `${user?.firstName} ${user?.lastName}`
                }
              ]
            }
          : msg
      )
    );
  };

  // Удалить реакцию
  const removeReaction = (messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions?.filter(
                r => !(r.emoji === emoji && r.userId === user?.id)
              )
            }
          : msg
      )
    );
  };

  // Удалить сообщение
  const deleteMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isDeleted: true } : msg
      )
    );
  };

  // Редактировать сообщение
  const editMessage = (messageId: string, newText: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, text: newText, isEdited: true }
          : msg
      )
    );
  };

  // Переслать сообщение
  const forwardMessage = (messageId: string, chatIds: string[]) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    chatIds.forEach(chatId => {
      const newMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        chatId,
        timestamp: new Date().toISOString()
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...(chat.messages || []), newMessage],
                lastMessage: message.text || '📎 Файл',
                lastMessageTime: 'Сейчас'
              }
            : chat
        )
      );
    });
  };

  const value: ChatContextType = {
    chats,
    activeChat,
    setActiveChat,
    sendMessage,
    replyingTo,
    setReplyingTo,
    isTyping,
    setIsTyping,
    markAsRead,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    pinChat,
    unpinChat,
    archiveChat,
    unarchiveChat,
    loading,
    messages,
    addReaction,
    removeReaction,
    deleteMessage,
    editMessage,
    forwardMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
