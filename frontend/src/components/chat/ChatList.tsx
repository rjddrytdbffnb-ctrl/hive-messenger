// src/components/chat/ChatList.tsx - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatListSkeleton } from '../SkeletonLoaders';
import CreateGroupModal from './CreateGroupModal';

const ChatList: React.FC = () => {
 const {
  chats, activeChat, setActiveChat, markAsRead,
  searchQuery, setSearchQuery, filterType, setFilterType,
  pinChat, unpinChat, archiveChat, unarchiveChat, loading,  
  muteChat, unmuteChat, deleteChat, createGroupChat
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

  return (
    <div style={{
      width: '100%',
      background: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}
      onClick={() => setContextMenu(null)}
    >
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
          <button
            onClick={() => setShowCreateGroup(true)}
            title="Создать группу"
            style={{
              width: '32px', height: '32px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '20px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', lineHeight: 1
            }}
          >+</button>
        </div>
        <input
          type="text"
          placeholder="🔍 Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
                width: '100%',
               padding: '8px 12px',
               border: 'none',
               borderRadius: '8px',
               fontSize: '14px',
               background: 'rgba(255,255,255,0.2)',
               color: 'white',
               outline: 'none',
               boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        padding: '12px 8px', display: 'flex', gap: '6px',
        borderBottom: '1px solid var(--border-color)', overflowX: 'auto'
      }}>
        {[
          { key: 'all', label: 'Все', icon: '💬' },
          { key: 'unread', label: 'Непрочит.', icon: '🔴' },
          { key: 'groups', label: 'Группы', icon: '👥' },
          { key: 'archived', label: 'Архив', icon: '📥' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            style={{
              padding: '6px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer',
              background: filterType === f.key ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: filterType === f.key ? 'white' : 'var(--text-primary)',
              fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >{f.icon} {f.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? <ChatListSkeleton /> : (
          filteredChats.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>😔</div>
              <p>Чаты не найдены</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                onContextMenu={(e) => handleContextMenu(e, chat.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: activeChat?.id === chat.id ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: activeChat?.id === chat.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  transition: 'all 0.15s', position: 'relative',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--accent-gradient)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: '700', flexShrink: 0,
                    position: 'relative'
                  }}>
                    {chat.avatar || chat.name[0]}
                    {chat.isOnline && (
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: '#10b981', border: '2px solid var(--bg-primary)'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{
                        margin: 0, fontSize: '15px', fontWeight: '600',
                        color: 'var(--text-primary)', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                      }}>
                        {chat.isPinned && <span style={{ marginRight: '4px' }}>📌</span>}
                        {chat.isMuted && <span style={{ marginRight: '4px' }}>🔕</span>}
                        {chat.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        {chat.lastMessageTime}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{
                        margin: 0, fontSize: '13px', color: 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                      }}>
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span style={{
                          background: '#e74c3c', color: 'white', borderRadius: '10px',
                          padding: '2px 6px', fontSize: '11px', fontWeight: '700', marginLeft: '8px'
                        }}>{chat.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {contextMenu && (
        <ContextMenuPopup
          chatId={contextMenu.chatId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      <CreateGroupModal 
  isOpen={showCreateGroup} 
  onClose={() => setShowCreateGroup(false)} 
  onCreateGroup={(name: string, participants: any[]) => { 
    createGroupChat(name, participants); 
    setShowCreateGroup(false); 
  }} 
/>
    </div>
  );
};

const ContextMenuPopup: React.FC<{
  chatId: string;
  x: number;
  y: number;
  onClose: () => void;
}> = ({ chatId, x, y, onClose }) => {
  const { chats, muteChat, unmuteChat, deleteChat, pinChat, unpinChat, archiveChat, unarchiveChat } = useChat();
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: y, left: x,
        background: 'var(--bg-primary)', borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)', zIndex: 1000, minWidth: '200px',
        border: '1px solid var(--border-color)', padding: '4px 0'
      }}>
        <CtxMenuItem
          icon={chat.isPinned ? "📌" : "📍"}
          text={chat.isPinned ? "Открепить" : "Закрепить"}
          onClick={() => {
            if (chat.isPinned) {
              unpinChat(chat.id);
            } else {
              pinChat(chat.id);
            }
            onClose();
          }}
        />
        <CtxMenuItem
          icon={chat.isArchived ? "📤" : "📥"}
          text={chat.isArchived ? "Разархивировать" : "Архивировать"}
          onClick={() => {
            if (chat.isArchived) {
              unarchiveChat(chat.id);
            } else {
              archiveChat(chat.id);
            }
            onClose();
          }}
        />
        <CtxMenuItem
          icon={chat.isMuted ? "🔔" : "🔕"}
          text={chat.isMuted ? "Включить уведомления" : "Откл. уведомления"}
          onClick={() => {
            if (chat.isMuted) {
              unmuteChat(chat.id);
            } else {
              muteChat(chat.id);
            }
            onClose();
          }}
        />
        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
        <CtxMenuItem
          icon="🗑️"
          text="Удалить чат"
          onClick={() => {
            if (window.confirm('Удалить этот чат?')) {
              deleteChat(chat.id);
            }
            onClose();
          }}
          danger
        />
      </div>
    </>
  );
};

const CtxMenuItem: React.FC<{ icon: string; text: string; onClick: () => void; danger?: boolean }> = ({ icon, text, onClick, danger }) => {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      padding: '10px 14px', cursor: 'pointer',
      background: h ? (danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)') : 'transparent',
      color: danger ? '#ef5350' : 'var(--text-primary)',
      fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
      transition: 'background 0.15s'
    }}>
      <span>{icon}</span><span>{text}</span>
    </div>
  );
};

export default ChatList;
