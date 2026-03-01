import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

function ChatList({ onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const result = await apiService.getChats();
      setChats(result.chats || []);
    } catch (error) {
      setError(error.message || 'Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Загрузка чатов...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        ❌ {error}
        <button onClick={loadChats} style={{ marginLeft: '10px' }}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3>Чаты ({chats.length})</h3>
      
      {chats.length === 0 ? (
        <div>Чатов пока нет</div>
      ) : (
        <div>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                marginBottom: '5px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <strong>{chat.name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Тип: {chat.type} | Сообщений: {chat.message_count || 0}
              </div>
              {chat.last_message && (
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Последнее: {chat.last_message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={loadChats}
        style={{ marginTop: '10px', padding: '5px 10px' }}
      >
        Обновить
      </button>
    </div>
  );
}

export default ChatList;