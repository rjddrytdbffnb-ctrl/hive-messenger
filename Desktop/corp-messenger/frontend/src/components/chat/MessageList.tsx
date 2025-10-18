// src/components/chat/MessageList.tsx
import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const MessageList: React.FC = () => {
  const { activeChat, messages, markAsRead } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      markAsRead(activeChat.id);
    }
  }, [activeChat, markAsRead]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === user?.id;
  };

  if (!activeChat) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        color: '#6c757d'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
        <h3>Выберите чат для начала общения</h3>
        <p>Выберите чат из списка слева чтобы начать переписку</p>
      </div>
    );
  }

  const chatMessages = messages.filter(msg => msg.chatId === activeChat.id);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Заголовок чата */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h4 style={{ margin: 0, color: '#2c3e50' }}>{activeChat.name}</h4>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
            {activeChat.type === 'private' 
              ? (activeChat.isOnline ? '🟢 В сети' : '⚫ Не в сети')
              : `Участников: ${activeChat.participants.length}`
            }
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          color: '#6c757d'
        }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔍</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>⋮</button>
        </div>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        {chatMessages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            marginTop: '50px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>👋</div>
            <h3>Нет сообщений</h3>
            <p>Начните общение - отправьте первое сообщение!</p>
          </div>
        ) : (
          chatMessages.map(message => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: isCurrentUser(message.sender.id) ? 'flex-end' : 'flex-start',
                marginBottom: '15px'
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '70%'
              }}>
                {!isCurrentUser(message.sender.id) && (
                  <div style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    marginBottom: '4px',
                    marginLeft: '10px'
                  }}>
                    {message.sender.firstName} {message.sender.lastName}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}>
                  {!isCurrentUser(message.sender.id) && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#3498db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {message.sender.firstName[0]}{message.sender.lastName[0]}
                    </div>
                  )}
                  <div style={{
                    backgroundColor: isCurrentUser(message.sender.id) ? '#007bff' : 'white',
                    color: isCurrentUser(message.sender.id) ? 'white' : '#2c3e50',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    borderBottomLeftRadius: isCurrentUser(message.sender.id) ? '18px' : '4px',
                    borderBottomRightRadius: isCurrentUser(message.sender.id) ? '4px' : '18px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word'
                  }}>
                    {message.text}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#95a5a6',
                  textAlign: isCurrentUser(message.sender.id) ? 'right' : 'left',
                  marginTop: '4px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  justifyContent: isCurrentUser(message.sender.id) ? 'flex-end' : 'flex-start'
                }}>
                  <span>{formatTime(message.timestamp)}</span>
                  {isCurrentUser(message.sender.id) && (
                    <span>{message.isRead ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;

export {};