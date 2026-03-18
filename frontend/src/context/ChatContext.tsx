// src/context/ChatContext.tsx
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

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'image' | 'video' | 'file';
  chatName: string;
  sender: string;
  date: string;
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
  mediaFiles?: MediaFile[];
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
  isMuted?: boolean;
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
  messages: Message[];
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  forwardMessage: (messageId: string, chatIds: string[]) => void;
  createOrOpenChat: (employee: any) => string;
  createGroupChat: (name: string, participants: User[]) => string;
  muteChat: (chatId: string) => void;
  unmuteChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_CHATS: Chat[] = [
  {
    id: 'bot_chat_alex',
    name: 'Алексей Иванов (БОТ)',
    type: 'direct',
    avatar: 'АИ',
    lastMessage: 'Привет! Это тестовый бот',
    lastMessageTime: '10:30',
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    isOnline: true,
    participants: [{ id: 'bot_alex', firstName: 'Алексей', lastName: 'Иванов', isOnline: true }],
    messages: []
  },
  {
    id: 'bot_chat_maria',
    name: 'Мария Петрова (БОТ)',
    type: 'direct',
    avatar: 'МП',
    lastMessage: 'Готова помочь!',
    lastMessageTime: '09:15',
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    isOnline: true,
    participants: [{ id: 'bot_maria', firstName: 'Мария', lastName: 'Петрова', isOnline: true }],
    messages: []
  }
];

// Загружаем чаты из localStorage, мерджим с дефолтными
function loadChats(): Chat[] {
  try {
    const saved = localStorage.getItem('corp_chats');
    if (!saved) return DEFAULT_CHATS;
    const parsed: Chat[] = JSON.parse(saved);
    // Добавляем дефолтные чаты если их нет в сохранённых
    const ids = new Set(parsed.map(c => c.id));
    const merged = [...parsed];
    for (const def of DEFAULT_CHATS) {
      if (!ids.has(def.id)) merged.push(def);
    }
    return merged;
  } catch {
    return DEFAULT_CHATS;
  }
}

function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem('corp_messages');
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

// Хелпер: добавляет уведомление в localStorage
function pushNotification(title: string, message: string, type: string) {
  try {
    const notifs = JSON.parse(localStorage.getItem('corp_notifications') || '[]');
    const newNotif = {
      id: Date.now(),
      type,
      title,
      message,
      related_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('corp_notifications', JSON.stringify([newNotif, ...notifs].slice(0, 50)));
  } catch {}
}

export { pushNotification };
function saveChats(chats: Chat[]) {
  try {
    const serializable = chats.map(c => ({
      ...c,
      messages: (c.messages || []).map(m => ({ ...m, attachments: undefined }))
    }));
    localStorage.setItem('corp_chats', JSON.stringify(serializable));
  } catch {}
}

function saveMessages(messages: Message[]) {
  try {
    const serializable = messages.map(m => ({ ...m, attachments: undefined }));
    localStorage.setItem('corp_messages', JSON.stringify(serializable));
  } catch {}
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());

  // Сохраняем chats в localStorage при каждом изменении
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Сохраняем messages в localStorage при каждом изменении
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.startChatWith) {
      const emp = state.startChatWith;
      const existing = chats.find(c => c.type === 'direct' && c.participants?.some(p => p.id === emp.id));
      if (existing) {
        setActiveChat(existing);
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
          isMuted: false,
          participants: [emp],
          messages: []
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (activeChat) {
      // Берём сообщения из общего стейта (там актуальные)
      setMessages(prev => prev); // просто триггер для отображения
    }
  }, [activeChat]);

  const sendMessage = (text: string, files?: File[]) => {
    if (!activeChat) return;

    const mediaFiles: MediaFile[] = (files || []).map((f, i) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext);
      const isVideo = ['mp4','mov','avi','mkv','webm'].includes(ext);
      return {
        id: `${Date.now()}_${i}`,
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : (f.size / 1024).toFixed(0) + ' KB',
        type: isImage ? 'image' : isVideo ? 'video' : 'file',
        chatName: activeChat.name,
        sender: user ? `${user.firstName} ${user.lastName}` : 'Вы',
        date: new Date().toLocaleDateString('ru-RU'),
      };
    });

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: activeChat.id,
      sender: { id: user?.id || '1', firstName: user?.firstName || 'Вы', lastName: user?.lastName || '', isOnline: true },
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      attachments: files,
      mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
      reactions: []
    };
    setMessages(prev => [...prev, newMessage]);
    const lastMsg = text.trim() || (files && files.length > 0 ? `📎 ${files[0].name}` : '');
    setChats(prev => prev.map(c => c.id === activeChat.id
      ? { ...c, messages: [...(c.messages || []), newMessage], lastMessage: lastMsg, lastMessageTime: 'Сейчас' }
      : c
    ));
    // Уведомление о новом сообщении
    const senderName = user ? `${user.firstName} ${user.lastName}` : 'Вы';
    pushNotification(
      `Новое сообщение в «${activeChat.name}»`,
      text.trim() || (files ? `📎 ${files[0]?.name}` : ''),
      'message'
    );
  };

  const markAsRead = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, unreadCount: 0} : c));
  const pinChat = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, isPinned: true} : c));
  const unpinChat = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, isPinned: false} : c));
  const archiveChat = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, isArchived: true} : c));
  const unarchiveChat = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, isArchived: false} : c));
  const muteChat = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, isMuted: true} : c));
  const unmuteChat = (id: string) => setChats(p => p.map(c => c.id === id ? {...c, isMuted: false} : c));

  const deleteChat = (id: string) => {
    setChats(p => p.filter(c => c.id !== id));
    setMessages(p => p.filter(m => m.chatId !== id));
    if (activeChat?.id === id) setActiveChat(null);
  };

  const addReaction = (id: string, emoji: string) => {};
  const removeReaction = (id: string, emoji: string) => {};
  const deleteMessage = (id: string) => {};
  const editMessage = (id: string, text: string) => {};
  const forwardMessage = (id: string, ids: string[]) => {};

  const createOrOpenChat = (employee: any): string => {
    const existing = chats.find(c => c.type === 'direct' && c.participants?.some(p => p.id === employee.id));
    if (existing) {
      setActiveChat(existing);
      return existing.id;
    }
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      name: `${employee.firstName} ${employee.lastName}`,
      type: 'direct',
      avatar: employee.avatar || `${employee.firstName[0]}${employee.lastName[0]}`,
      lastMessage: 'Начните общение...',
      lastMessageTime: 'Сейчас',
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      isOnline: employee.isOnline || false,
      participants: [employee],
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    return newChat.id;
  };

  const createGroupChat = (name: string, participants: User[]): string => {
    const newChat: Chat = {
      id: `group_${Date.now()}`,
      name,
      type: 'group',
      avatar: '👥',
      lastMessage: `Группа "${name}" создана`,
      lastMessageTime: 'Сейчас',
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      participants,
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    return newChat.id;
  };

  // Фильтруем сообщения по активному чату
  const activeChatMessages = activeChat
    ? messages.filter(m => m.chatId === activeChat.id)
    : messages;

  return (
    <ChatContext.Provider value={{
      chats, activeChat, setActiveChat, sendMessage, replyingTo, setReplyingTo,
      isTyping, setIsTyping, markAsRead, searchQuery, setSearchQuery, filterType,
      setFilterType, pinChat, unpinChat, archiveChat, unarchiveChat, loading,
      messages: activeChatMessages, addReaction, removeReaction, deleteMessage, editMessage,
      forwardMessage, createOrOpenChat, createGroupChat, muteChat, unmuteChat, deleteChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
