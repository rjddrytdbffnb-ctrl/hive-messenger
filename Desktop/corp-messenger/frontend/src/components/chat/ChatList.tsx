// src/components/chat/ChatList.tsx
import React from 'react';
import { useChat } from '../../context/ChatContext';

const ChatList: React.FC = () => {
  const { chats, activeChat, setActiveChat, markAsRead } = useChat();

  const handleChatClick = (chat: any) => {
    setActiveChat(chat);
    markAsRead(chat.id);
  };

  const getChatIcon = (type: string, isOnline?: boolean) => {
    switch (type) {
      case 'private':
        return isOnline ? '🟢' : '⚫';
      case 'group':
        return '👥';
      case 'channel':
        return '📢';
      default:
        return '💬';
    }
  };

  const formatLastMessage = (message?: { text: string }) => {
    if (!message) return 'Нет сообщений';
    return message.text.length > 30 
      ? message.text.substring(0, 30) + '...' 
      : message.text;
  };

  return (
    <div style={{
      width: '300px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #dee2e6',
        backgroundColor: 'white'
      }}>
        <h3 style={{ margin: 0, color: '#2c3e50' }}>Чаты</h3>
      </div>

      <div style={{ padding: '10px' }}>
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '5px',
              backgroundColor: activeChat?.id === chat.id ? '#e3f2fd' : 'white',
              border: activeChat?.id === chat.id ? '1px solid #2196f3' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              fontSize: '20px', 
              marginRight: '12px',
              marginTop: '2px'
            }}>
              {getChatIcon(chat.type, chat.isOnline)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {chat.name}
                </div>
                {chat.unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              <div style={{
                color: '#7f8c8d',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {formatLastMessage(chat.lastMessage)}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#95a5a6',
                marginTop: '2px'
              }}>
                <span>
                  {chat.type === 'private' 
                    ? 'Личный чат' 
                    : chat.type === 'group' 
                    ? `Участников: ${chat.participants.length}`
                    : 'Канал'
                  }
                </span>
                {chat.lastMessage && (
                  <span>
                    {chat.lastMessage.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;

export {};