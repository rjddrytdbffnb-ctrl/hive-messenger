// src/components/GlobalSearch.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'user' | 'chat' | 'message';
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  icon: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'chats' | 'messages'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Моковые данные для поиска
  const mockData: SearchResult[] = [
    // Пользователи
    { type: 'user', id: '1', title: 'Алексей Иванов', subtitle: 'IT отдел', avatar: 'АИ', icon: '👤' },
    { type: 'user', id: '2', title: 'Мария Петрова', subtitle: 'Marketing', avatar: 'МП', icon: '👤' },
    { type: 'user', id: '3', title: 'Дмитрий Сидоров', subtitle: 'Sales', avatar: 'ДС', icon: '👤' },
    // Чаты
    { type: 'chat', id: '1', title: 'IT отдел', subtitle: '12 участников', avatar: '💻', icon: '👥' },
    { type: 'chat', id: '2', title: 'Проект Альфа', subtitle: '8 участников', avatar: '📊', icon: '👥' },
    // Сообщения
    { type: 'message', id: '1', title: 'Отчет по проекту готов', subtitle: 'от Алексей Иванов', avatar: '📄', icon: '💬' },
    { type: 'message', id: '2', title: 'Встреча завтра в 10:00', subtitle: 'от Мария Петрова', avatar: '📅', icon: '💬' },
  ];

  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockData.filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
                            item.subtitle.toLowerCase().includes(query.toLowerCase());
        const matchesTab = activeTab === 'all' || item.type === activeTab.slice(0, -1);
        return matchesQuery && matchesTab;
      });
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, activeTab]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'chat') {
      navigate(`/chat?id=${result.id}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ЗАТЕМНЕНИЕ */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* ОКНО ПОИСКА */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-primary)',
        borderRadius: '20px',
        padding: '24px',
        zIndex: 1001,
        maxWidth: '700px',
        width: '90%',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* ПОИСКОВАЯ СТРОКА */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="🔍 Поиск пользователей, чатов, сообщений..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px',
              border: 'none',
              background: '#f0f0f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}
          >
            ESC
          </button>
        </div>

        {/* ВКЛАДКИ */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: '12px'
        }}>
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            text="Все"
          />
          <TabButton
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            text="Пользователи"
          />
          <TabButton
            active={activeTab === 'chats'}
            onClick={() => setActiveTab('chats')}
            text="Чаты"
          />
          <TabButton
            active={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            text="Сообщения"
          />
        </div>

        {/* РЕЗУЛЬТАТЫ */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {query.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600' }}>
                Начните поиск
              </p>
              <p style={{ fontSize: '14px' }}>
                Введите имя пользователя, название чата или текст сообщения
              </p>
            </div>
          ) : results.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
              <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600' }}>
                Ничего не найдено
              </p>
              <p style={{ fontSize: '14px' }}>
                Попробуйте изменить запрос
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map(result => (
                <SearchResultCard
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onClick={() => handleResultClick(result)}
                  query={query}
                />
              ))}
            </div>
          )}
        </div>

        {/* ПОДСКАЗКИ */}
        {query.length === 0 && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>💡 Подсказки:</div>
            <div>• Используйте @ для поиска пользователей</div>
            <div>• Используйте # для поиска чатов</div>
            <div>• Нажмите ESC для выхода</div>
          </div>
        )}
      </div>
    </>
  );
};

// КОМПОНЕНТ: Вкладка
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  text: string;
}> = ({ active, onClick, text }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        background: active
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'transparent',
        color: active ? 'white' : '#7f8c8d',
        fontSize: '14px',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
      }}
    >
      {text}
    </button>
  );
};

// КОМПОНЕНТ: Карточка результата
const SearchResultCard: React.FC<{
  result: SearchResult;
  onClick: () => void;
  query: string;
}> = ({ result, onClick, query }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Подсветка совпадений
  const highlightText = (text: string) => {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ background: '#fff59d', fontWeight: '600' }}>{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: isHovered
          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))'
          : 'white'
      }}
    >
      {/* ИКОНКА/АВАТАР */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: result.type === 'user'
          ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
          : result.type === 'chat'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: result.type === 'message' ? '24px' : '16px',
        fontWeight: 'bold',
        color: result.type === 'message' ? '#7f8c8d' : 'white',
        flexShrink: 0
      }}>
        {result.avatar}
      </div>

      {/* КОНТЕНТ */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '600',
          fontSize: '15px',
          marginBottom: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {highlightText(result.title)}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {result.subtitle}
        </div>
      </div>

      {/* ТИП */}
      <div style={{
        padding: '4px 10px',
        borderRadius: '6px',
        background: '#f0f0f0',
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        flexShrink: 0
      }}>
        {result.icon}
      </div>
    </div>
  );
};

export default GlobalSearch;
