// src/pages/MediaGalleryPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { MediaFile } from '../context/ChatContext';

const API_BASE = process.env.REACT_APP_API_URL || '';

const MediaGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const { chats } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [selectedItem, setSelectedItem] = useState<MediaFile | null>(null);
  const [manualFiles, setManualFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Загружаем файлы с сервера при монтировании
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (data.files) {
        const mapped: MediaFile[] = data.files.map((f: any) => {
          const ext = (f.name || '').split('.').pop()?.toLowerCase() || '';
          const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext) || (f.mime_type || '').startsWith('image/');
          const isVideo = ['mp4','mov','avi','mkv','webm'].includes(ext) || (f.mime_type || '').startsWith('video/');
          const sizeFmt = f.size > 1024*1024 ? (f.size/1024/1024).toFixed(1)+' MB' : Math.round(f.size/1024)+' KB';
          return {
            id: String(f.id),
            name: f.name || f.original_name,
            url: f.url,
            size: sizeFmt,
            type: isImage ? 'image' : isVideo ? 'video' : 'file',
            chatName: 'Загружено вручную',
            sender: f.first_name ? `${f.first_name} ${f.last_name}` : 'Вы',
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('ru-RU') : '',
          };
        });
        setManualFiles(mapped);
      }
    }).catch(() => {});
  }, []);

  // Собираем все mediaFiles из всех сообщений всех чатов
  const chatMedia: MediaFile[] = [];
  chats.forEach(chat => {
    (chat.messages || []).forEach(msg => {
      if (msg.mediaFiles) chatMedia.push(...msg.mediaFiles);
    });
  });

  // Объединяем: из чатов + с сервера, убираем дубли по id
  const allMedia = [...chatMedia, ...manualFiles];
  const seen = new Set<string>();
  const uniqueMedia = allMedia.filter(f => { if (seen.has(f.id)) return false; seen.add(f.id); return true; });

  const images = uniqueMedia.filter(f => f.type === 'image');
  const videos = uniqueMedia.filter(f => f.type === 'video');
  const files  = uniqueMedia.filter(f => f.type === 'file');

  const filtered = activeTab === 'images' ? images : activeTab === 'videos' ? videos : files;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (!uploaded.length) return;
    setUploading(true);
    const token = localStorage.getItem('token');
    for (const file of uploaded) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API_BASE}/api/media`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.file) {
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext);
          const isVideo = ['mp4','mov','avi','mkv','webm'].includes(ext);
          const sizeFmt = file.size > 1024*1024 ? (file.size/1024/1024).toFixed(1)+' MB' : Math.round(file.size/1024)+' KB';
          const newFile: MediaFile = {
            id: String(data.file.id),
            name: file.name,
            url: data.file.url,
            size: sizeFmt,
            type: isImage ? 'image' : isVideo ? 'video' : 'file',
            chatName: 'Загружено вручную',
            sender: 'Вы',
            date: new Date().toLocaleDateString('ru-RU'),
          };
          setManualFiles(prev => [newFile, ...prev]);
        }
      } catch {}
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--bg-secondary)', padding: '32px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* ЗАГОЛОВОК */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              📸 Медиа галерея
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Все фото, видео и файлы из ваших чатов
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Кнопка загрузки */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px 20px', border: 'none', borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(102,126,234,0.35)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              ⬆ Загрузить файл
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={handleUpload} style={{ display: 'none' }} />
            <button
              onClick={() => navigate(-1)}
              style={{ padding: '10px 20px', border: '1.5px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >← Назад</button>
          </div>
        </div>

        {/* ВКЛАДКИ */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {([
            { key: 'images', icon: '🖼️', label: 'Изображения', count: images.length },
            { key: 'videos', icon: '🎥', label: 'Видео',        count: videos.length },
            { key: 'files',  icon: '📄', label: 'Файлы',        count: files.length  },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '10px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              background: activeTab === tab.key ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--bg-primary)',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              boxShadow: activeTab === tab.key ? '0 4px 12px rgba(102,126,234,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--bg-secondary)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* КОНТЕНТ */}
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>
              {activeTab === 'images' ? '🖼️' : activeTab === 'videos' ? '🎥' : '📄'}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {activeTab === 'images' ? 'Нет изображений' : activeTab === 'videos' ? 'Нет видео' : 'Нет файлов'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Отправьте файлы в чате или загрузите напрямую
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '10px 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
            >⬆ Загрузить файл</button>
          </div>
        ) : activeTab === 'images' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {filtered.map(item => <ImageCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
          </div>
        ) : activeTab === 'videos' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {filtered.map(item => <VideoCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(item => <FileCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
          </div>
        )}
      </div>

      {selectedItem && <MediaViewer item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
};

// ─── ImageCard ────────────────────────────────────────────────
const ImageCard: React.FC<{ item: MediaFile; onClick: () => void }> = ({ item, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ aspectRatio: '4/3', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', position: 'relative', boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s', transform: hovered ? 'scale(1.02)' : 'scale(1)' }}>
      {item.url !== '#' ? (
        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🖼️</div>
      )}
      {hovered && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', color: 'white' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>{item.sender} · {item.date}</div>
        </div>
      )}
    </div>
  );
};

// ─── VideoCard ────────────────────────────────────────────────
const VideoCard: React.FC<{ item: MediaFile; onClick: () => void }> = ({ item, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ aspectRatio: '16/9', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', position: 'relative', background: 'linear-gradient(135deg, #667eea, #764ba2)', boxShadow: hovered ? '0 8px 24px rgba(102,126,234,0.4)' : '0 4px 12px rgba(102,126,234,0.2)', transition: 'all 0.2s', transform: hovered ? 'scale(1.02)' : 'scale(1)' }}>
      {item.url !== '#' && (
        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} muted />
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>▶️</div>
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: 'white' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>{item.name}</div>
        <div style={{ fontSize: '11px', opacity: 0.85 }}>{item.size} · {item.date}</div>
      </div>
    </div>
  );
};

// ─── FileCard ─────────────────────────────────────────────────
const FileCard: React.FC<{ item: MediaFile; onClick: () => void }> = ({ item, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const icon = item.name.endsWith('.pdf') ? '📄' : item.name.match(/\.docx?$/) ? '📝' : item.name.match(/\.xlsx?$/) ? '📊' : item.name.match(/\.(zip|rar)$/) ? '🗜️' : '📎';
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border-color)', boxShadow: hovered ? '0 4px 14px rgba(0,0,0,0.09)' : '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s', cursor: 'pointer', transform: hovered ? 'translateY(-1px)' : 'translateY(0)' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{item.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.size} · {item.sender} · {item.date}</div>
      </div>
      <div style={{ padding: '6px 14px', borderRadius: '8px', background: hovered ? 'rgba(102,126,234,0.1)' : 'var(--bg-secondary)', color: '#667eea', fontSize: '13px', fontWeight: '600', flexShrink: 0, transition: 'all 0.2s' }}>
        Открыть
      </div>
    </div>
  );
};

// ─── MediaViewer ──────────────────────────────────────────────
const MediaViewer: React.FC<{ item: MediaFile; onClose: () => void }> = ({ item, onClose }) => {
  const icon = item.name.endsWith('.pdf') ? '📄' : item.name.match(/\.docx?$/) ? '📝' : item.name.match(/\.xlsx?$/) ? '📊' : item.name.match(/\.(zip|rar)$/) ? '🗜️' : '📎';
  return (
    <div onClick={e => { e.stopPropagation(); onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer' }}>✕</button>

      {item.type === 'image' && item.url !== '#' ? (
        <img src={item.url} alt={item.name} onClick={e => e.stopPropagation()}
          style={{ maxWidth: '92%', maxHeight: '92vh', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
      ) : item.type === 'video' && item.url !== '#' ? (
        <video src={item.url} controls onClick={e => e.stopPropagation()}
          style={{ maxWidth: '92%', maxHeight: '92vh', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
      ) : (
        <div onClick={e => e.stopPropagation()}
          style={{ background: 'var(--bg-primary)', borderRadius: '20px', padding: '44px', minWidth: '340px', maxWidth: '460px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '68px', marginBottom: '18px' }}>{item.type === 'video' ? '🎬' : icon}</div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', wordBreak: 'break-all' }}>{item.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.size} · {item.date}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>От: {item.sender} · {item.chatName}</div>
          {item.url !== '#' ? (
            <a href={item.url} download={item.name} onClick={e => e.stopPropagation()}
              style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
              ⬇ Скачать
            </a>
          ) : (
            <div style={{ padding: '10px 18px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
              ⚠ Файл недоступен после перезагрузки
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaGalleryPage;