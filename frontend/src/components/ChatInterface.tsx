import React, { useState, useEffect, useRef } from 'react';
import SocketService from '../services/socketservice';

interface ChatInterfaceProps {
  user: any;
  onLogout: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
  chatId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeChat, setActiveChat] = useState('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = SocketService.connect();

    SocketService.onReceiveMessage((message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    SocketService.joinChat(activeChat);

    // Заглушка - имитация истории сообщений
    const mockMessages: Message[] = [
      {
        id: 1,
        text: 'Добро пожаловать в корпоративный мессенджер!',
        sender: 'System',
        timestamp: new Date(),
        chatId: 'general'
      },
      {
        id: 2,
        text: 'Здесь вы можете общаться с коллегами в реальном времени',
        sender: 'System', 
        timestamp: new Date(),
        chatId: 'general'
      }
    ];
    setMessages(mockMessages);

    return () => {
      SocketService.removeAllListeners();
    };
  }, [activeChat]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && user) {
      SocketService.sendMessage({
        text: inputMessage,
        sender: user.name,
        chatId: activeChat
      });
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-layout">
      {/* Боковая панель с чатами */}
      <div className="sidebar">
        <div className="user-profile">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-status">Online</div>
          </div>
        </div>
        
        <div className="chat-list">
          <h3>Чаты</h3>
          <div 
            className={`chat-item ${activeChat === 'general' ? 'active' : ''}`}
            onClick={() => setActiveChat('general')}
          >
            💬 Общий чат
          </div>
          <div 
            className={`chat-item ${activeChat === 'random' ? 'active' : ''}`}
            onClick={() => setActiveChat('random')}
          >
            🎉 Неформальный чат
          </div>
          <div 
            className={`chat-item ${activeChat === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveChat('projects')}
          >
            📁 Проекты
          </div>
        </div>
        
        <div className="online-users">
          <h3>Онлайн</h3>
          <div className="user-item">
            👤 {user.name} (Вы)
          </div>
          <div className="user-item">
            👤 Коллега 1
          </div>
          <div className="user-item">
            👤 Коллега 2
          </div>
          <div className="user-item offline">
            👤 Коллега 3 (offline)
          </div>
        </div>
      </div>

      {/* Основная область сообщений */}
      <div className="messages-area">
        <div className="chat-header">
          <div className="chat-title">
            {activeChat === 'general' && '💬 Общий чат'}
            {activeChat === 'random' && '🎉 Неформальный чат'}
            {activeChat === 'projects' && '📁 Проекты'}
          </div>
          <div className="chat-members">3 участника</div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender === user.name ? 'own-message' : ''}`}
            >
              <div className="message-sender">
                {message.sender === user.name ? 'Вы' : message.sender}
              </div>
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода сообщения */}
        <div className="input-area">
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              className="message-input"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="send-button"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;