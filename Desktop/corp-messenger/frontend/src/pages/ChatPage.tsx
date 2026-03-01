// src/pages/ChatPage.tsx
import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import ChatList from '../components/chat/ChatList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';

const ChatPage: React.FC = () => {
  return (
    <ChatProvider>
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {/* Список чатов */}
        <ChatList />
        
        {/* Основная область чата */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <MessageList />
          <MessageInput />
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatPage;

export {};
