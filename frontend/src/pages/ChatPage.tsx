// src/pages/ChatPage.tsx - АДАПТИВНАЯ ВЕРСИЯ
import React, { useState, useEffect } from 'react';
import ChatList from '../components/chat/ChatList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import { useChat } from '../context/ChatContext';

const ChatPage: React.FC = () => {
  const { activeChat } = useChat();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatList, setShowChatList] = useState(!isMobile);

  // Отслеживаем изменение размера окна
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setShowChatList(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // На мобильных: при выборе чата скрываем список
  useEffect(() => {
    if (isMobile && activeChat) {
      setShowChatList(false);
    }
  }, [activeChat, isMobile]);

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 70px)',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-secondary)',
      position: 'relative'
    }}>
      {/* Список чатов - скрывается на мобильных когда открыт чат */}
      <div style={{
        width: isMobile ? '100%' : 'clamp(280px, 25vw, 360px)',
        display: (isMobile && !showChatList) ? 'none' : 'block',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden'
      }}>
        <ChatList />
      </div>
      
      {/* Основная область чата - скрывается на мобильных когда показан список */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: (isMobile && showChatList) ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        position: 'relative'
      }}>
        {activeChat ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Кнопка "Назад" на мобильных */}
            {isMobile && (
              <div style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowChatList(true)}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'clamp(18px, 3vw, 24px)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  ← 
                </button>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    width: 'clamp(36px, 6vw, 40px)',
                    height: 'clamp(36px, 6vw, 40px)',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(14px, 2.2vw, 16px)',
                    fontWeight: '700',
                    color: 'white',
                    aspectRatio: '1 / 1',
                    flexShrink: 0
                  }}>
                    {activeChat.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(14px, 2.2vw, 16px)',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeChat.name}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <MessageList />
            <MessageInput />
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 'clamp(12px, 2vw, 16px)',
            color: 'var(--text-secondary)',
            padding: 'clamp(16px, 4vw, 24px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'clamp(48px, 10vw, 64px)' }}>💬</div>
            <h2 style={{ 
              color: 'var(--text-primary)', 
              fontSize: 'clamp(20px, 3.5vw, 24px)',
              margin: 0,
              fontWeight: '600'
            }}>
              Выберите чат
            </h2>
            <p style={{
              fontSize: 'clamp(14px, 2vw, 16px)',
              margin: 0
            }}>
              {isMobile ? 'Откройте список чатов' : 'Выберите собеседника из списка слева'}
            </p>
            {isMobile && (
              <button
                onClick={() => setShowChatList(true)}
                style={{
                  marginTop: '16px',
                  padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 32px)',
                  background: 'var(--accent-gradient)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: 'clamp(14px, 2vw, 16px)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📱 Открыть чаты
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
