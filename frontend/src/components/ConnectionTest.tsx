import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Проверка...');
  const [backendMessage, setBackendMessage] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setConnectionStatus('Проверяем соединение с бэкендом...');
      const response = await api.get('/api/debug/db');
      setConnectionStatus('✅ Соединение установлено!');
      setBackendMessage('БД: ' + (response.data.connection || 'OK'));
    } catch (error: any) {
      setConnectionStatus('❌ Ошибка соединения с бэкендом');
      if (error.message?.includes('Network Error')) {
        setBackendMessage('Бэкенд не запущен или недоступен на localhost:3000');
      } else {
        setBackendMessage(error.message || 'Неизвестная ошибка');
      }
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => { testConnection(); }, []);

  return (
    <div style={{ padding: '16px', margin: '16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', fontSize: '14px' }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Тест соединения с бэкендом</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span><strong>Статус:</strong> {connectionStatus}</span>
        {backendMessage && (
          <span style={{ padding: '4px 8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '12px' }}>
            {backendMessage}
          </span>
        )}
        <button onClick={testConnection} disabled={isTesting} style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: isTesting ? '#ccc' : '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: isTesting ? 'not-allowed' : 'pointer' }}>
          {isTesting ? 'Проверка...' : 'Проверить'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionTest;
