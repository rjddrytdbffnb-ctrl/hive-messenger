// src/components/chat/MessageInput.tsx
import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';

const MessageInput: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const { activeChat, sendMessage } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!activeChat) {
    return null;
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderTop: '1px solid #dee2e6'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '8px'
            }}
            title="Прикрепить файл"
          >
            📎
          </button>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '8px'
            }}
            title="Смайлики"
          >
            😊
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '25px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#007bff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dee2e6';
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!messageText.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: messageText.trim() ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: messageText.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease'
          }}
        >
          Отправить
        </button>
      </form>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#95a5a6',
        marginTop: '8px',
        padding: '0 10px'
      }}>
        <span>Enter - отправить</span>
        <span>Shift + Enter - новая строка</span>
      </div>
    </div>
  );
};

export default MessageInput;

export {};