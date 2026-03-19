// src/context/ChatContext.tsx - РЕАЛЬНЫЙ API + SOCKET.IO
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';
import { chatsAPI, messagesAPI } from '../services/api';
import { getSmartBotResponse, isBot } from '../services/chatBots';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

// Уведомления в localStorage
export function pushNotification(title: string, message: string, type: string) {
  try {
    const notifs = JSON.parse(localStorage.getItem('corp_notifications') || '[]');
    const newNotif = {
      id: Date.now(), type, title, message,
      related_id: null, is_read: false,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('corp_notifications', JSON.stringify([newNotif, ...notifs].slice(0, 50)));
  } catch {}
}

// Маппинг сырого сообщения из API/сокета в Message
function mapRawMessage(raw: any, chatId: string): Message {
  // Бэкенд всегда возвращает объект sender: { id, username, first_name, last_name }
  // raw.sender_id есть у POST-ответа, но id надо брать из sender объекта
  const sender = raw.sender || {};
  return {
    id: String(raw.id),
    chatId: String(chatId),
    sender: {
      id: String(sender.id || raw.sender_id || raw.user_id || ''),
      firstName: sender.first_name || sender.username || raw.first_name || '',
      lastName: sender.last_name || raw.last_name || '',
      isOnline: sender.is_online || false,
      avatar: sender.avatar,
      department: sender.department,
    },
    text: raw.text || '',
    timestamp: raw.created_at || new Date().toISOString(),
    isRead: raw.is_read || false,
    reactions: [],
  };
}

// Маппинг чата из API
function mapRawChat(raw: any): Chat {
  const lm = raw.last_message;
  return {
    id: String(raw.id),
    name: raw.name || 'Чат',
    type: raw.type || 'direct',
    avatar: raw.avatar || raw.name?.[0] || '?',
    lastMessage: lm?.text || '',
    lastMessageTime: lm?.created_at
      ? new Date(lm.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : '',
    unreadCount: raw.unread_count || 0,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    isOnline: false,
    participants: [],
    messages: [],
  };
}

const BOT_CHATS: Chat[] = [
  {
    id: 'bot_chat_alex', name: 'Алексей Иванов (БОТ)', type: 'direct', avatar: 'АИ',
    lastMessage: 'Привет! Это тестовый бот', lastMessageTime: '10:30',
    unreadCount: 0, isPinned: false, isArchived: false, isMuted: false, isOnline: true,
    participants: [{ id: 'bot_alex', firstName: 'Алексей', lastName: 'Иванов', isOnline: true }],
    messages: []
  },
  {
    id: 'bot_chat_maria', name: 'Мария Петрова (БОТ)', type: 'direct', avatar: 'МП',
    lastMessage: 'Готова помочь!', lastMessageTime: '09:15',
    unreadCount: 0, isPinned: false, isArchived: false, isMuted: false, isOnline: true,
    participants: [{ id: 'bot_maria', firstName: 'Мария', lastName: 'Петрова', isOnline: true }],
    messages: []
  }
];

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const socketRef = useRef<Socket | null>(null);

  const [chats, setChats] = useState<Chat[]>(BOT_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // ── Загрузка чатов с сервера ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadChatsFromAPI();
  }, [user]);

  const loadChatsFromAPI = async () => {
    try {
      setLoading(true);
      const response = await chatsAPI.getAll();
      const serverChats = response.data.chats.map(mapRawChat);
      setChats([...BOT_CHATS, ...serverChats]);
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Загрузка сообщений при смене активного чата ───────────────────────
  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.id.startsWith('bot_')) return; // боты — локально

    const loadMessages = async () => {
      try {
        const response = await messagesAPI.getByChat(activeChat.id);
        const mapped = response.data.messages.map((m: any) => mapRawMessage(m, activeChat.id));
        setMessages(prev => {
          // Удаляем старые сообщения этого чата, добавляем новые
          const other = prev.filter(m => m.chatId !== activeChat.id);
          return [...other, ...mapped];
        });
      } catch (err) {
        console.error('Ошибка загрузки сообщений:', err);
      }
    };
    loadMessages();
  }, [activeChat?.id]);

  // ── Socket.io ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket подключён');
      socket.emit('join_chats');
      socket.emit('join_user_room');
      socket.emit('user_online');
    });

    socket.on('new_message', ({ message }: any) => {
      const chatId = String(message.chat_id);
      // Бэкенд передаёт { message } где message содержит sender объект
      const newMsg: Message = mapRawMessage(message, chatId);

      setMessages(prev => {
        // Не дублируем если уже есть
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      setChats(prev => prev.map(c =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: message.text || '',
              lastMessageTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: c.id !== activeChat?.id ? (c.unreadCount || 0) + 1 : c.unreadCount,
            }
          : c
      ));
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket отключён:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket ошибка:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Подключаемся к комнате нового активного чата
  useEffect(() => {
    if (!activeChat || activeChat.id.startsWith('bot_')) return;
    socketRef.current?.emit('join_chat', activeChat.id);
  }, [activeChat?.id]);

  // ── Навигация из EmployeesPage ────────────────────────────────────────
  useEffect(() => {
    const state = location.state as any;
    if (!state?.startChatWith) return;
    const emp = state.startChatWith;
    createOrOpenChat(emp);
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // ── Отправка сообщения ─────────────────────────────────────────────────
  const sendMessage = (text: string, files?: File[]) => {
    if (!activeChat) return;

    // Боты — локально
    if (activeChat.id.startsWith('bot_')) {
      const botMsg: Message = {
        id: Date.now().toString(),
        chatId: activeChat.id,
        sender: { id: user?.id || '1', firstName: user?.firstName || 'Вы', lastName: user?.lastName || '', isOnline: true },
        text: text.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        reactions: [],
      };
      setMessages(prev => [...prev, botMsg]);
      setTimeout(() => {
        const botId = activeChat.participants?.[0]?.id || 'bot';
        const replyObj = getSmartBotResponse(botId, text);
        const reply = replyObj?.text || "...";
        const replyMsg: Message = {
          id: (Date.now() + 1).toString(),
          chatId: activeChat.id,
          sender: activeChat.participants?.[0] || { id: 'bot', firstName: 'Бот', lastName: '', isOnline: true },
          text: reply,
          timestamp: new Date().toISOString(),
          isRead: false,
          reactions: [],
        };
        setMessages(prev => [...prev, replyMsg]);
      }, 800);
      return;
    }

    // Реальный чат — отправляем через HTTP, получаем через сокет
    messagesAPI.send(activeChat.id, text.trim()).then(response => {
      const raw = response.data.message;
      console.log('[DEBUG] server response:', JSON.stringify(raw));
      console.log('[DEBUG] user.id:', user?.id, 'type:', typeof user?.id);
      console.log('[DEBUG] raw.sender:', JSON.stringify(raw?.sender));
      const saved = mapRawMessage(raw, activeChat.id);
      console.log('[DEBUG] mapped sender.id:', saved.sender.id, 'isMyMessage:', saved.sender.id === user?.id);
      setMessages(prev => {
        if (prev.some(m => m.id === saved.id)) return prev;
        return [...prev, saved];
      });
      setChats(prev => prev.map(c =>
        c.id === activeChat.id
          ? { ...c, lastMessage: text.trim(), lastMessageTime: 'Сейчас' }
          : c
      ));
    }).catch(err => console.error('Ошибка отправки:', err));
  };

  // ── Создать или открыть чат ───────────────────────────────────────────
  const createOrOpenChat = (employee: any): string => {
    const empId = String(employee.id);

    // Ищем существующий чат
    const existing = chats.find(c =>
      c.type === 'direct' && c.participants?.some(p => String(p.id) === empId)
    );
    if (existing) {
      setActiveChat(existing);
      return existing.id;
    }

    // Создаём через API
    chatsAPI.createDirect(empId).then(response => {
      const newChat = mapRawChat(response.data.chat);
      newChat.participants = [employee];
      setChats(prev => [newChat, ...prev.filter(c => !c.id.startsWith('bot_')), ...BOT_CHATS]);
      setActiveChat(newChat);
      socketRef.current?.emit('join_chat', newChat.id);
    }).catch(() => {
      // Fallback: локальный чат
      const localChat: Chat = {
        id: `local_${Date.now()}`,
        name: `${employee.firstName} ${employee.lastName}`,
        type: 'direct',
        avatar: employee.avatar || `${employee.firstName[0]}${employee.lastName[0]}`,
        lastMessage: 'Начните общение...',
        lastMessageTime: '',
        unreadCount: 0,
        isPinned: false, isArchived: false, isMuted: false,
        participants: [employee],
        messages: [],
      };
      setChats(prev => [localChat, ...prev]);
      setActiveChat(localChat);
    });

    return '';
  };

  const createGroupChat = (name: string, participants: User[]): string => {
    const ids = participants.map(p => p.id);
    chatsAPI.create(name, 'group', ids).then(response => {
      const newChat = mapRawChat(response.data.chat);
      newChat.participants = participants;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
    }).catch(console.error);
    return '';
  };

  const markAsRead = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  const pinChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isPinned: true } : c));
  const unpinChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isPinned: false } : c));
  const archiveChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isArchived: true } : c));
  const unarchiveChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isArchived: false } : c));
  const muteChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isMuted: true } : c));
  const unmuteChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isMuted: false } : c));
  const deleteChat = (id: string) => {
    setChats(p => p.filter(c => c.id !== id));
    setMessages(p => p.filter(m => m.chatId !== id));
    if (activeChat?.id === id) setActiveChat(null);
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, reactions: [...(m.reactions || []), { emoji, userId: user?.id || '', userName: user?.firstName || '' }] }
        : m
    ));
    socketRef.current?.emit('add_reaction', { messageId, emoji });
  };

  const removeReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, reactions: (m.reactions || []).filter(r => !(r.emoji === emoji && r.userId === user?.id)) }
        : m
    ));
    socketRef.current?.emit('remove_reaction', { messageId, emoji });
  };

  const deleteMessage = (messageId: string) =>
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, text: 'Сообщение удалено' } : m));

  const editMessage = (messageId: string, newText: string) =>
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m));

  const forwardMessage = (messageId: string, chatIds: string[]) => {
    const original = messages.find(m => m.id === messageId);
    if (!original) return;
    chatIds.forEach(chatId => {
      const fwd: Message = { ...original, id: `fwd_${Date.now()}`, chatId, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, fwd]);
    });
  };

  return (
    <ChatContext.Provider value={{
      chats, activeChat, setActiveChat, sendMessage,
      replyingTo, setReplyingTo, isTyping, setIsTyping,
      markAsRead, searchQuery, setSearchQuery, filterType, setFilterType,
      pinChat, unpinChat, archiveChat, unarchiveChat,
      loading, messages,
      addReaction, removeReaction, deleteMessage, editMessage, forwardMessage,
      createOrOpenChat, createGroupChat, muteChat, unmuteChat, deleteChat,
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