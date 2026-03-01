// src/components/chat/ChatList.tsx
import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatListSkeleton } from '../SkeletonLoaders';
import CreateGroupModal from './CreateGroupModal';

const ChatList: React.FC = () => {
  const {
    chats, activeChat, setActiveChat, markAsRead,
    searchQuery, setSearchQuery, filterType, setFilterType,
    pinChat, unpinChat, archiveChat, unarchiveChat, loading
  } = useChat();

  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const filteredChats = useMemo(() => {
    let filtered = chats;
    switch (filterType) {
      case 'unread': filtered = filtered.filter(c => c.unreadCount > 0); break;
      case 'groups': filtered = filtered.filter(c => c.type === 'group'); break;
      case 'archived': filtered = filtered.filter(c => c.isArchived); break;
      default: filtered = filtered.filter(c => !c.isArchived);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [chats, searchQuery, filterType]);

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleChatClick = (chat: any) => {
    setActiveChat(chat);
    markAsRead(chat.id);
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  const getChatAvatar = (chat: any) => {
    if (chat.type === 'group') return '👥';
    if (chat.type === 'channel') return '📢';
    return chat.name[0].toUpperCase();
  };

  const formatLastMessage = (message?: { text: string }) => {
    if (!message) return 'Нет сообщений';
    return message.text.length > 32 ? message.text.substring(0, 32) + '…' : message.text;
  };

  const formatTime = (message?: { timestamp: Date }) => {
    if (!message) return '';
    const d = new Date(message.timestamp);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{
      width: '300px', minWidth: '300px',
      background: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}
      onClick={() => setContextMenu(null)}
    >
      {/* ЗАГОЛОВОК */}
      <div style={{
        padding: '16px 16px 12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 15px rgba(102,126,234,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '700' }}>
            💬 Чаты
            {totalUnread > 0 && (
              <span style={{
                marginLeft: '8px', background: '#e74c3c', color: 'white',
                borderRadius: '10px', padding: '2px 7px', fontSize: '13px', fontWeight: '700'
              }}>{totalUnread}</span>
            )}
          </h3>
          {/* КНОПКА СОЗДАТЬ ГРУППУ */}
          <button
            onClick={() => setShowCreateGroup(true)}
            title="Создать группу"
            style={{
              width: '32px', height: '32px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '20px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', lineHeight: 1
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >+</button>
        </div>

        <input
          type="text"
          placeholder="🔍 Поиск чатов..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px',
            border: 'none', borderRadius: '10px',
            fontSize: '14px', outline: 'none',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: '#333'
          }}
        />
      </div>

      {/* ФИЛЬТРЫ */}
      <div style={{
        display: 'flex', gap: '6px', padding: '10px 12px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        {[
          { type: 'all', label: 'Все' },
          { type: 'unread', label: '🔴 Непрочит.' },
          { type: 'groups', label: '👥 Группы' },
          { type: 'archived', label: '📦 Архив' },
        ].map(f => (
          <button
            key={f.type}
            onClick={() => setFilterType(f.type as any)}
            style={{
              padding: '5px 10px', border: 'none', borderRadius: '8px',
              background: filterType === f.type ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-primary)',
              color: filterType === f.type ? 'white' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: filterType === f.type ? '700' : '500',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: filterType === f.type ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* СПИСОК ЧАТОВ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {loading ? (
          <ChatListSkeleton />
        ) : filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>
              {searchQuery ? '🔍' : '📭'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {searchQuery ? 'Чаты не найдены' : 'Нет чатов'}
            </div>
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = activeChat?.id === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                onContextMenu={e => handleContextMenu(e, chat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '12px',
                  cursor: 'pointer', marginBottom: '4px',
                  background: isActive
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                  boxShadow: isActive ? '0 4px 16px rgba(102,126,234,0.4)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* АВАТАР */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: chat.type === 'direct' ? '16px' : '20px',
                  fontWeight: 'bold', color: 'white',
                  border: isActive ? '2px solid rgba(255,255,255,0.3)' : 'none',
                  position: 'relative'
                }}>
                  {getChatAvatar(chat)}
                  {/* Онлайн индикатор */}
                  {chat.type === 'direct' && chat.isOnline && (
                    <div style={{
                      position: 'absolute', bottom: '1px', right: '1px',
                      width: '11px', height: '11px', borderRadius: '50%',
                      background: '#4ade80', border: '2px solid var(--bg-primary)',
                      boxShadow: '0 0 6px #4ade80'
                    }} />
                  )}
                </div>

                {/* ИНФОРМАЦИЯ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <div style={{
                      fontWeight: '600', fontSize: '14px',
                      color: isActive ? 'white' : 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: '160px'
                    }}>
                      {chat.isPinned && <span style={{ marginRight: '4px', fontSize: '12px' }}>📌</span>}
                      {chat.name}
                    </div>
                    <div style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', flexShrink: 0 }}>
                      {chat.lastMessageTime}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      fontSize: '12px',
                      color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: '180px',
                      fontWeight: chat.unreadCount > 0 ? '500' : 'normal'
                    }}>
                      {chat.lastMessageTime}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span style={{
                        background: isActive ? 'rgba(255,255,255,0.9)' : '#e74c3c',
                        color: isActive ? '#667eea' : 'white',
                        borderRadius: '10px', padding: '2px 6px',
                        fontSize: '11px', fontWeight: '700', flexShrink: 0
                      }}>
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* КОНТЕКСТНОЕ МЕНЮ */}
      {contextMenu && (
        <ChatContextMenu
          chatId={contextMenu.chatId}
          x={contextMenu.x}
          y={contextMenu.y}
          chat={chats.find(c => c.id === contextMenu.chatId)!}
          onClose={() => setContextMenu(null)}
          onPin={() => { pinChat(contextMenu.chatId); setContextMenu(null); }}
          onUnpin={() => { unpinChat(contextMenu.chatId); setContextMenu(null); }}
          onArchive={() => { archiveChat(contextMenu.chatId); setContextMenu(null); }}
          onUnarchive={() => { unarchiveChat(contextMenu.chatId); setContextMenu(null); }}
        />
      )}

      {/* МОДАЛ СОЗДАТЬ ГРУППУ */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={(name, participants) => {
          console.log('Creating group:', name, participants);
          setShowCreateGroup(false);
        }}
      />
    </div>
  );
};

const ChatContextMenu: React.FC<{
  chatId: string; x: number; y: number; chat: any; onClose: () => void;
  onPin: () => void; onUnpin: () => void; onArchive: () => void; onUnarchive: () => void;
}> = ({ x, y, chat, onClose, onPin, onUnpin, onArchive, onUnarchive }) => (
  <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
    <div style={{
      position: 'fixed', top: y, left: x,
      background: 'var(--bg-primary)', borderRadius: '12px',
      boxShadow: 'var(--shadow-lg)', zIndex: 1000, minWidth: '185px',
      overflow: 'hidden', border: '1px solid var(--border-color)',
      animation: 'fadeIn 0.15s ease'
    }}>
      <CtxMenuItem icon={chat.isPinned ? '📌' : '📌'} text={chat.isPinned ? 'Открепить' : 'Закрепить'}
        onClick={chat.isPinned ? onUnpin : onPin} />
      <CtxMenuItem icon="📦" text={chat.isArchived ? 'Разархивировать' : 'Архивировать'}
        onClick={chat.isArchived ? onUnarchive : onArchive} />
      <CtxMenuItem icon="🔕" text="Откл. уведомления" onClick={onClose} />
      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
      <CtxMenuItem icon="🗑️" text="Удалить чат" onClick={onClose} danger />
    </div>
  </>
);

const CtxMenuItem: React.FC<{ icon: string; text: string; onClick: () => void; danger?: boolean }> = ({ icon, text, onClick, danger }) => {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      padding: '10px 14px', cursor: 'pointer',
      background: h ? (danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)') : 'transparent',
      color: danger ? 'var(--error)' : 'var(--text-primary)',
      fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
      transition: 'background 0.15s'
    }}>
      <span>{icon}</span><span>{text}</span>
    </div>
  );
};

export default ChatList;
export {};
