// src/pages/NotificationsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: 'message' | 'mention' | 'chat_invite' | 'system' | 'message_reaction' | string;
  title: string;
  message: string | null;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'message',   title: 'Новое сообщение от Алексея',   message: 'Привет! Можешь посмотреть задачу?',         related_id: 1, is_read: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 2, type: 'mention',   title: 'Вас упомянули в чате',          message: '@вы Посмотри на этот документ',              related_id: 2, is_read: false, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 3, type: 'system',    title: 'Система',                       message: 'Добро пожаловать в Hive!',                  related_id: null, is_read: true,  created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 4, type: 'chat_invite', title: 'Вас добавили в группу',       message: 'Мария Петрова добавила вас в «Проект X»',   related_id: 3, is_read: true,  created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 5, type: 'message_reaction', title: 'Реакция на сообщение',   message: 'Алексей поставил 👍 вашему сообщению',      related_id: 1, is_read: true,  created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
];

function loadNotifications(): Notification[] {
  try {
    const s = localStorage.getItem('corp_notifications');
    return s ? JSON.parse(s) : MOCK_NOTIFICATIONS;
  } catch { return MOCK_NOTIFICATIONS; }
}
function saveNotifications(list: Notification[]) {
  try { localStorage.setItem('corp_notifications', JSON.stringify(list)); } catch {}
}

function typeIcon(type: string): string {
  switch (type) {
    case 'mention':          return '@';
    case 'message_reaction': return '👍';
    case 'chat_invite':      return '👥';
    case 'system':           return '🔔';
    case 'task':             return '📋';
    case 'calendar':         return '📅';
    case 'message':
    default:                 return '💬';
  }
}

function timeAgo(dateStr: string): string {
  const diff    = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7)     return `${days} дн назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifications());
  const [loading, setLoading]             = useState(false);
  const [filter, setFilter]               = useState<'all' | 'unread'>('all');

  const unreadCount           = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  useEffect(() => { saveNotifications(notifications); }, [notifications]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const dismiss = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.type === 'message' || n.type === 'mention') navigate('/chat');
    else if (n.type === 'task') navigate('/tasks');
    else if (n.type === 'calendar') navigate('/calendar');
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--bg-secondary)', padding: '32px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>

        {/* ЗАГОЛОВОК */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              🔔 Уведомления
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {loading ? 'Загрузка...' : unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={btnStyle('#667eea')}>✓ Прочитать все</button>
            )}
          </div>
        </div>

        {/* ФИЛЬТРЫ */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <FilterBtn active={filter === 'all'}    onClick={() => setFilter('all')}    text="Все" />
          <FilterBtn active={filter === 'unread'} onClick={() => setFilter('unread')} text={`Непрочитанные (${unreadCount})`} />
        </div>

        {/* КОНТЕНТ */}
        {filteredNotifications.length === 0 && (
          <div style={emptyBox}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p>{filter === 'unread' ? 'Нет непрочитанных' : 'Уведомлений пока нет'}</p>
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkAsRead={() => markAsRead(n.id)}
                onDismiss={() => dismiss(n.id)}
                onClick={() => handleClick(n)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

// ============================================================
// КАРТОЧКА
// ============================================================
const NotificationCard: React.FC<{
  notification: Notification;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  onClick: () => void;
}> = ({ notification, onMarkAsRead, onDismiss, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isUnread = !notification.is_read;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'all 0.2s',
        borderLeft: `4px solid ${isUnread ? '#667eea' : 'transparent'}`,
        opacity: isUnread ? 1 : 0.65,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>

        {/* ИКОНКА */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
          background: isUnread
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          boxShadow: isUnread ? '0 4px 12px rgba(102,126,234,0.3)' : 'none',
        }}>
          {typeIcon(notification.type)}
        </div>

        {/* ТЕКСТ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {notification.title}
            {isUnread && (
              <span style={{
                display: 'inline-block', width: '8px', height: '8px',
                borderRadius: '50%', background: '#667eea',
                marginLeft: '8px', verticalAlign: 'middle',
              }} />
            )}
          </div>
          {notification.message && (
            <div style={{
              fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {notification.message}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {timeAgo(notification.created_at)}
          </div>
        </div>

        {/* ДЕЙСТВИЯ */}
        {hovered && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', flexShrink: 0 }}>
            {isUnread && (
              <button
                onClick={e => { e.stopPropagation(); onMarkAsRead(); }}
                style={actionBtn('#667eea', '#eef0ff')}
                title="Прочитано"
              >✓</button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDismiss(); }}
              style={actionBtn('#e74c3c', '#ffe6e6')}
              title="Скрыть"
            >✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
// ============================================================
const FilterBtn: React.FC<{ active: boolean; onClick: () => void; text: string }> = ({ active, onClick, text }) => (
  <button onClick={onClick} style={{
    padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-primary)',
    color: active ? 'white' : 'var(--text-secondary)',
    fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
    boxShadow: active ? '0 4px 12px rgba(102,126,234,0.3)' : 'var(--shadow-sm)',
  }}>{text}</button>
);

const Skeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {[1, 2, 3].map(i => (
      <div key={i} style={{
        background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px',
        display: 'flex', gap: '16px', animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', width: '55%' }} />
          <div style={{ height: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', width: '75%' }} />
        </div>
      </div>
    ))}
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
  </div>
);

const emptyBox: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: '16px',
  padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)',
};

function btnStyle(color: string): React.CSSProperties {
  return { padding: '10px 20px', border: 'none', borderRadius: '10px', background: color,
    color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    boxShadow: `0 4px 12px ${color}55` };
}

function actionBtn(color: string, bg: string): React.CSSProperties {
  return { padding: '6px 10px', border: 'none', borderRadius: '8px',
    background: bg, color, fontSize: '13px', fontWeight: '700', cursor: 'pointer' };
}

export default NotificationsPage;
