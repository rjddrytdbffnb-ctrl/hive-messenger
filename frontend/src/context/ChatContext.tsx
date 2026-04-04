// src/context/ChatContext.tsx - ПОЛНОСТЬЮ ПЕРЕПИСАН: надёжная загрузка сообщений
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
  attachments?: any[];
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
  sendMessage: (text: string, files?: any[], replyTo?: string) => void;
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
  messagesError: string | null;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  forwardMessage: (messageId: string, chatIds: string[]) => void;
  createOrOpenChat: (employee: any) => string;
  createGroupChat: (name: string, participants: User[] | string[]) => string;
  muteChat: (chatId: string) => void;
  unmuteChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void> | void;
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
    replyTo: raw.reply_to_message ? {
      id: String(raw.reply_to_message.id),
      chatId: String(chatId),
      text: raw.reply_to_message.text || '',
      sender: {
        id: String(raw.reply_to_message.sender?.id || ''),
        firstName: raw.reply_to_message.sender?.first_name || '',
        lastName: raw.reply_to_message.sender?.last_name || '',
        isOnline: false,
      },
      timestamp: '',
      isRead: true,
      reactions: [],
    } : undefined,
    attachments: (raw.attachments && raw.attachments.length > 0)
      ? raw.attachments.map((f: any) => ({
          url: f.url,
          original_name: f.name || f.original_name || f.filename || 'Файл',
          name: f.name || f.original_name || f.filename || 'Файл',
          mime_type: f.mime_type || '',
          type: f.type || '',
          size: f.size || 0,
          id: f.id,
        }))
      : undefined,
  };
}

// Маппинг чата из API
function mapRawChat(raw: any, currentUserId?: string): Chat {
  const lm = raw.last_message;
  let chatName = raw.name || 'Чат';
  if (raw.type === 'direct' && raw.participants && currentUserId) {
    const other = raw.participants.find((p: any) => String(p.id) !== String(currentUserId));
    if (other) {
      chatName = other.first_name
        ? `${other.first_name} ${other.last_name || ''}`.trim()
        : other.username || raw.name || 'Чат';
    }
  }
  return {
    id: String(raw.id),
    name: chatName,
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
    isOnline: raw.participants
      ? (raw.participants as any[]).some((p: any) => p.is_online)
      : false,
    participants: (raw.participants || []).map((p: any) => ({
      id: String(p.id),
      firstName: p.first_name || p.username || '',
      lastName: p.last_name || '',
      isOnline: p.is_online || false,
      avatar: p.avatar,
      department: p.department,
    })),
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
  const activeChatRef = useRef<Chat | null>(null);

  const [chats, setChats] = useState<Chat[]>(BOT_CHATS);
  const [activeChat, setActiveChatState] = useState<Chat | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Счётчик загрузок — для отмены устаревших запросов сообщений
  const msgLoadCounter = useRef(0);

  // ── setActiveChat: обёртка, сразу обновляет и state и ref ─────────────
  const setActiveChat = useCallback((chat: Chat | null) => {
    activeChatRef.current = chat;          // ref — мгновенно
    setActiveChatState(chat);              // state — через рендер
    if (chat) {
      localStorage.setItem('activeChatId', chat.id);
    } else {
      localStorage.removeItem('activeChatId');
    }
  }, []);

  // Бэкап: синхронизируем ref если state поменялся через setActiveChatState напрямую
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // ══════════════════════════════════════════════════════════════════════
  //  ЗАГРУЗКА ЧАТОВ — ЕДИНСТВЕННЫЙ useEffect, только когда user готов
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user?.id) return;                       // user ещё не загружен — ждём
    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    const loadChats = async () => {
      try {
        setLoading(true);
        console.log('[ChatContext] Загрузка чатов, user.id:', user.id);

        const response = await chatsAPI.getAll();
        if (cancelled) return;

        const serverChats = (response.data.chats || []).map((c: any) => mapRawChat(c, user.id));
        const allChats = [...BOT_CHATS, ...serverChats];
        setChats(allChats);

        console.log('[ChatContext] Чаты загружены:', serverChats.length);

        // Восстанавливаем последний активный чат
        const savedChatId = localStorage.getItem('activeChatId');
        if (savedChatId && !cancelled) {
          const found = allChats.find((c: Chat) => c.id === savedChatId);
          console.log('[ChatContext] Восстановление чата:', savedChatId, found ? `→ ${found.name}` : '→ не найден');
          if (found) {
            activeChatRef.current = found;     // ref — мгновенно
            setActiveChatState(prev => {
              if (prev) return prev;           // уже был выбран — не трогаем
              return found;
            });
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[ChatContext] Ошибка загрузки чатов:', err?.response?.status, err?.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChats();
    return () => { cancelled = true; };
  }, [user?.id]);  // <── ЕДИНСТВЕННЫЙ триггер: user готов

  // ══════════════════════════════════════════════════════════════════════
  //  ЗАГРУЗКА СООБЩЕНИЙ — при смене activeChat.id
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.id.startsWith('bot_')) return;

    const chatId = activeChat.id;
    // Каждый новый вызов инкрементирует счётчик — предыдущие запросы "устаревают"
    const loadId = ++msgLoadCounter.current;

    setMessagesError(null);
    console.log('[ChatContext] ▶ Загрузка сообщений чата:', chatId, '| loadId:', loadId);

    const load = async () => {
      try {
        const response = await messagesAPI.getByChat(chatId);
        const msgs = response.data.messages || [];

        // Если за время запроса пользователь переключил чат — пропускаем
        if (msgLoadCounter.current !== loadId) {
          console.log('[ChatContext] ✕ loadId', loadId, 'устарел → пропуск');
          return;
        }

        console.log('[ChatContext] ✓ Получено', msgs.length, 'сообщений для чата', chatId);

        const mapped = msgs.map((m: any) => mapRawMessage(m, chatId));

        setMessages(prev => {
          // Оставляем сообщения ДРУГИХ чатов нетронутыми
          const otherMsgs = prev.filter(m => String(m.chatId) !== String(chatId));
          // Сохраняем оптимистичные (temp_) которых нет на сервере
          const serverIds = new Set(mapped.map((m: Message) => m.id));
          const tempMsgs = prev.filter(
            m => String(m.chatId) === String(chatId) && m.id.startsWith('temp_') && !serverIds.has(m.id)
          );
          return [...otherMsgs, ...mapped, ...tempMsgs];
        });
      } catch (err: any) {
        if (msgLoadCounter.current !== loadId) return;

        const status = err?.response?.status;
        const detail = err?.message || 'неизвестная ошибка';
        console.error('[ChatContext] ✕ Ошибка сообщений:', status, detail);
        setMessagesError(`Ошибка ${status || ''}: ${detail}`);
      }
    };

    load();
  }, [activeChat?.id]);

  // ══════════════════════════════════════════════════════════════════════
  //  SOCKET.IO
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user?.id) return;
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
      const newMsg: Message = mapRawMessage(message, chatId);

      setMessages(prev => {
        // Не дублируем
        if (prev.some(m => m.id === newMsg.id)) return prev;

        // Заменяем temp_ сообщение
        const tempIdx = prev.findIndex(
          m => m.id.startsWith('temp_') && m.chatId === chatId && m.sender.id === newMsg.sender.id
        );
        if (tempIdx !== -1) {
          const tempMsg = prev[tempIdx];
          const updated = [...prev];
          updated[tempIdx] = {
            ...newMsg,
            attachments: (newMsg.attachments && newMsg.attachments.length > 0)
              ? newMsg.attachments : tempMsg.attachments,
            replyTo: newMsg.replyTo || tempMsg.replyTo,
          };
          return updated;
        }

        return [...prev, newMsg];
      });

      // Обновляем sidebar
      setChats(prev => prev.map(c =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: message.text || '',
              lastMessageTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: chatId !== activeChatRef.current?.id ? (c.unreadCount || 0) + 1 : c.unreadCount,
            }
          : c
      ));
    });

    socket.on('new_chat', ({ chat }: any) => {
      const newChat = mapRawChat(chat, user?.id);
      setChats(prev => {
        if (prev.some(c => c.id === newChat.id)) return prev;
        return [newChat, ...prev];
      });
    });

    socket.on('user_status_change', ({ userId, status }: { userId: string; status: string }) => {
      const isOnline = status === 'online';
      const uid = String(userId);

      setChats(prev => prev.map(c => {
        if (!c.participants?.some(p => String(p.id) === uid)) return c;
        return {
          ...c,
          isOnline: c.type === 'direct' ? isOnline : c.isOnline,
          participants: (c.participants || []).map(p =>
            String(p.id) === uid ? { ...p, isOnline } : p
          ),
        };
      }));

      setActiveChatState(prev => {
        if (!prev) return prev;
        if (!prev.participants?.some(p => String(p.id) === uid)) return prev;
        return {
          ...prev,
          isOnline: prev.type === 'direct' ? isOnline : prev.isOnline,
          participants: (prev.participants || []).map(p =>
            String(p.id) === uid ? { ...p, isOnline } : p
          ),
        };
      });

      window.dispatchEvent(new CustomEvent('user_status_change', {
        detail: { userId: uid, isOnline }
      }));
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket отключён:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket ошибка:', err.message);
    });

    socket.on('message_deleted', ({ messageId }: any) => {
      setMessages(prev => prev.filter(m => m.id !== String(messageId)));
    });

    socket.on('message_edited', ({ messageId, text }: any) => {
      setMessages(prev => prev.map(m =>
        m.id === String(messageId) ? { ...m, text, isEdited: true } : m
      ));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

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
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════
  //  ОТПРАВКА СООБЩЕНИЯ
  // ══════════════════════════════════════════════════════════════════════
  const sendMessage = (text: string, files?: any[], replyTo?: string) => {
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
        const reply = replyObj?.text || '...';
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

    // Реальный чат — оптимистичная отправка
    const tempId = 'temp_' + Date.now();
    const currentChatId = activeChat.id;

    const optimisticMsg: Message = {
      id: tempId,
      chatId: currentChatId,
      sender: {
        id: user!.id,
        firstName: user!.firstName,
        lastName: user!.lastName,
        isOnline: true,
        avatar: user!.avatar,
      },
      text: text.trim() || (files?.length ? files.map(f => f.name).join(', ') : ''),
      timestamp: new Date().toISOString(),
      isRead: false,
      reactions: [],
      replyTo: replyTo ? replyingTo || undefined : undefined,
      attachments: files && files.length > 0 ? files.map((f: any) => {
        if (f instanceof File) return f;
        return {
          url: f.url, original_name: f.name, name: f.name,
          mime_type: f.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
          type: f.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
          size: f.size || 0,
        };
      }) : undefined,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setChats(prev => prev.map(c =>
      c.id === currentChatId
        ? { ...c, lastMessage: text.trim() || 'Файл', lastMessageTime: 'Сейчас' }
        : c
    ));

    const sendPromise = (files && files.length > 0)
      ? (() => {
          const formData = new FormData();
          if (text.trim()) formData.append('text', text.trim());
          else formData.append('text', ' ');
          if (replyTo) formData.append('reply_to', replyTo);
          files.forEach(f => { if (f instanceof File) formData.append('files', f); });
          const galleryFiles = files.filter(f => !(f instanceof File) && f.url);
          if (galleryFiles.length > 0) formData.append('gallery_files', JSON.stringify(galleryFiles));
          return messagesAPI.sendWithFile(currentChatId, formData);
        })()
      : messagesAPI.send(currentChatId, text.trim(), replyTo);

    sendPromise.then(response => {
      const serverMsg = response.data.message;
      const realId = String(serverMsg.id);
      const serverAttachments = (serverMsg.attachments && serverMsg.attachments.length > 0)
        ? serverMsg.attachments.map((f: any) => ({
            url: f.url,
            original_name: f.name || f.original_name || f.filename || 'Файл',
            name: f.name || f.original_name || f.filename || 'Файл',
            mime_type: f.mime_type || '',
            type: f.type || '',
            size: f.size || 0,
            id: f.id,
          }))
        : undefined;
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: realId, attachments: serverAttachments || m.attachments }
          : m
      ));
    }).catch(err => {
      console.error('Ошибка отправки:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    });
  };

  // ── Создать или открыть чат ───────────────────────────────────────────
  const createOrOpenChat = (employee: any): string => {
    const empId = String(employee.id);

    const existing = chats.find(c =>
      c.type === 'direct' && c.participants?.some(p => String(p.id) === empId)
    );
    if (existing) {
      setActiveChat(existing);
      return existing.id;
    }

    chatsAPI.createDirect(empId).then(response => {
      const newChat = mapRawChat(response.data.chat, user?.id);
      newChat.participants = [employee];
      setChats(prev => [newChat, ...prev.filter(c => !c.id.startsWith('bot_')), ...BOT_CHATS]);
      setActiveChat(newChat);
      socketRef.current?.emit('join_chat', newChat.id);
    }).catch(() => {
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

  const createGroupChat = (name: string, participants: User[] | string[]): string => {
    const ids = participants.map((p: any) => typeof p === 'string' ? p : p.id);
    chatsAPI.create(name, 'group', ids).then(response => {
      const newChat = mapRawChat(response.data.chat, user?.id);
      if (participants.length > 0 && typeof participants[0] !== 'string') {
        newChat.participants = participants as User[];
      }
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
    }).catch(console.error);
    return '';
  };

  // ── Простые операции ──────────────────────────────────────────────────
  const markAsRead = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  const pinChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isPinned: true } : c));
  const unpinChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isPinned: false } : c));
  const archiveChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isArchived: true } : c));
  const unarchiveChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isArchived: false } : c));
  const muteChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isMuted: true } : c));
  const unmuteChat = (id: string) => setChats(p => p.map(c => c.id === id ? { ...c, isMuted: false } : c));

  const deleteChat = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_API_URL || '';
      await fetch(`${API_BASE}/api/chats/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
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

  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await messagesAPI.delete(messageId);
    } catch (err) {
      console.error('Ошибка удаления сообщения:', err);
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m));
    try {
      await messagesAPI.edit(messageId, newText);
    } catch (err) {
      console.error('Ошибка редактирования сообщения:', err);
    }
  };

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
      loading, messages, messagesError,
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
