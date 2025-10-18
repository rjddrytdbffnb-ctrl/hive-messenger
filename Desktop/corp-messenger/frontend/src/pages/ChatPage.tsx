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
        backgroundColor: 'white'
      }}>
        {/* Список чатов */}
        <ChatList />
        
        {/* Основная область чата */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
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