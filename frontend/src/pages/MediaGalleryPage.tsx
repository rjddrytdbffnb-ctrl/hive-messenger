// src/pages/MediaGalleryPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
  size: string;
  date: string;
  sender: string;
  chatName: string;
}

const MediaGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Моковые данные
  const mediaItems: MediaItem[] = [
    { id: '1', type: 'image', url: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Фото+1', name: 'Скриншот_2024.png', size: '2.3 MB', date: '15 фев 2024', sender: 'Алексей Иванов', chatName: 'IT отдел' },
    { id: '2', type: 'image', url: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Фото+2', name: 'Презентация.png', size: '1.8 MB', date: '14 фев 2024', sender: 'Мария Петрова', chatName: 'Проект Альфа' },
    { id: '3', type: 'image', url: 'https://via.placeholder.com/400x300/f093fb/ffffff?text=Фото+3', name: 'Диаграмма.jpg', size: '890 KB', date: '13 фев 2024', sender: 'Дмитрий Сидоров', chatName: 'Sales' },
    { id: '4', type: 'video', url: '#', name: 'Видеозвонок.mp4', size: '45 MB', date: '12 фев 2024', sender: 'Елена Смирнова', chatName: 'HR' },
    { id: '5', type: 'video', url: '#', name: 'Презентация.mp4', size: '78 MB', date: '11 фев 2024', sender: 'Иван Козлов', chatName: 'IT отдел' },
    { id: '6', type: 'file', url: '#', name: 'Отчет_Q4.pdf', size: '3.2 MB', date: '10 фев 2024', sender: 'Алексей Иванов', chatName: 'Общий чат' },
    { id: '7', type: 'file', url: '#', name: 'Договор.docx', size: '156 KB', date: '9 фев 2024', sender: 'Мария Петрова', chatName: 'Юридический' },
  ];

  const filteredItems = mediaItems.filter(item => {
    if (activeTab === 'images') return item.type === 'image';
    if (activeTab === 'videos') return item.type === 'video';
    if (activeTab === 'files') return item.type === 'file';
    return true;
  });

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'var(--bg-secondary)',
      padding: '32px 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* ЗАГОЛОВОК */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              📸 Галерея медиа
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              Все фото, видео и файлы из ваших чатов
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Назад
          </button>
        </div>

        {/* ВКЛАДКИ */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <TabButton
            icon="🖼️"
            text="Изображения"
            count={mediaItems.filter(m => m.type === 'image').length}
            active={activeTab === 'images'}
            onClick={() => setActiveTab('images')}
          />
          <TabButton
            icon="🎥"
            text="Видео"
            count={mediaItems.filter(m => m.type === 'video').length}
            active={activeTab === 'videos'}
            onClick={() => setActiveTab('videos')}
          />
          <TabButton
            icon="📄"
            text="Файлы"
            count={mediaItems.filter(m => m.type === 'file').length}
            active={activeTab === 'files'}
            onClick={() => setActiveTab('files')}
          />
        </div>

        {/* ГАЛЕРЕЯ */}
        {activeTab === 'images' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {filteredItems.map(item => (
              <ImageCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filteredItems.map(item => (
              <VideoCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map(item => (
              <FileCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* ПРОСМОТР */}
        {selectedItem && (
          <MediaViewer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </div>
  );
};

// КОМПОНЕНТ: Вкладка
const TabButton: React.FC<{
  icon: string;
  text: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ icon, text, count, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        border: 'none',
        borderRadius: '12px',
        background: active
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'white',
        color: active ? 'white' : '#7f8c8d',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: active
          ? '0 4px 12px rgba(102, 126, 234, 0.3)'
          : '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span>{text}</span>
      <span style={{
        padding: '2px 8px',
        borderRadius: '10px',
        background: active ? 'rgba(255,255,255,0.3)' : '#f0f0f0',
        fontSize: '12px'
      }}>
        {count}
      </span>
    </button>
  );
};

// КОМПОНЕНТ: Карточка изображения
const ImageCard: React.FC<{
  item: MediaItem;
  onClick: () => void;
}> = ({ item, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: '4/3',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s'
      }}
    >
      <img
        src={item.url}
        alt={item.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'all 0.3s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      />
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
            {item.sender} • {item.date}
          </div>
        </div>
      )}
    </div>
  );
};

// КОМПОНЕНТ: Карточка видео
const VideoCard: React.FC<{
  item: MediaItem;
  onClick: () => void;
}> = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '16/9',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{
        fontSize: '64px',
        opacity: 0.8
      }}>
        ▶️
      </div>
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        color: 'white'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {item.size} • {item.date}
        </div>
      </div>
    </div>
  );
};

// КОМПОНЕНТ: Карточка файла
const FileCard: React.FC<{ item: MediaItem }> = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s',
        cursor: 'pointer'
      }}
      onClick={() => window.open(item.url, '_blank')}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: 'white',
        flexShrink: 0
      }}>
        📄
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {item.size} • {item.sender} • {item.date}
        </div>
      </div>
      {isHovered && (
        <button style={{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '8px',
          background: '#f0f0f0',
          color: '#667eea',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Скачать
        </button>
      )}
    </div>
  );
};

// КОМПОНЕНТ: Просмотр медиа
const MediaViewer: React.FC<{
  item: MediaItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            fontSize: '24px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          ✕
        </button>
        <img
          src={item.url}
          alt={item.name}
          style={{
            maxWidth: '90%',
            maxHeight: '90vh',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </>
  );
};

export default MediaGalleryPage;
