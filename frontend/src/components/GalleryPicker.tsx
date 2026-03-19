// src/components/GalleryPicker.tsx
import React, { useState, useEffect } from 'react';

export interface GalleryFile {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'image' | 'video' | 'file';
  date: string;
}

interface Props {
  onSelect: (files: GalleryFile[]) => void;
  onClose: () => void;
  multiple?: boolean;
}

const API_BASE = process.env.REACT_APP_API_URL || '';

const GalleryPicker: React.FC<Props> = ({ onSelect, onClose, multiple = true }) => {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'file'>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (data.files) {
        const mapped: GalleryFile[] = data.files.map((f: any) => {
          const ext = (f.name || f.original_name || '').split('.').pop()?.toLowerCase() || '';
          const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext) || (f.mime_type||'').startsWith('image/');
          const isVideo = ['mp4','mov','avi','mkv','webm'].includes(ext) || (f.mime_type||'').startsWith('video/');
          const bytes = f.size || 0;
          const sizeFmt = bytes > 1024*1024 ? (bytes/1024/1024).toFixed(1)+' MB' : Math.round(bytes/1024)+' KB';
          return {
            id: String(f.id),
            name: f.name || f.original_name || 'Файл',
            url: f.url,
            size: sizeFmt,
            type: isImage ? 'image' : isVideo ? 'video' : 'file',
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('ru-RU') : '',
          };
        });
        setFiles(mapped);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'all' ? files : files.filter(f => f.type === activeTab);

  const toggle = (id: string) => {
    if (!multiple) {
      setSelected(new Set([id]));
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = files.filter(f => selected.has(f.id));
    onSelect(chosen);
  };

  const getIcon = (type: string) => type === 'image' ? '🖼️' : type === 'video' ? '🎬' : '📎';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: '16px',
        width: '100%', maxWidth: '600px', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>

        {/* Заголовок */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
            📸 Медиа галерея
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '20px',
            cursor: 'pointer', color: 'var(--text-secondary)'
          }}>✕</button>
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
          {(['all','image','video','file'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none',
              background: activeTab === tab ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'var(--bg-secondary)',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>
              {tab === 'all' ? 'Все' : tab === 'image' ? '🖼️ Фото' : tab === 'video' ? '🎬 Видео' : '📎 Файлы'}
            </button>
          ))}
        </div>

        {/* Список файлов */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Нет файлов
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {filtered.map(f => {
                const isSelected = selected.has(f.id);
                return (
                  <div key={f.id} onClick={() => toggle(f.id)} style={{
                    position: 'relative', borderRadius: '10px', overflow: 'hidden',
                    border: isSelected ? '2px solid #667eea' : '2px solid var(--border-color)',
                    cursor: 'pointer', background: 'var(--bg-secondary)',
                    transition: 'all 0.15s'
                  }}>
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px', zIndex: 2,
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: '#667eea', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700'
                      }}>✓</div>
                    )}
                    {f.type === 'image' && f.url && !f.url.startsWith('#') ? (
                      <img src={f.url} alt={f.name} style={{
                        width: '100%', height: '100px', objectFit: 'cover', display: 'block'
                      }} />
                    ) : (
                      <div style={{
                        height: '100px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '36px'
                      }}>
                        {getIcon(f.type)}
                      </div>
                    )}
                    <div style={{ padding: '8px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>{f.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {f.size} · {f.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border-color)',
          display: 'flex', gap: '10px', alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>
            {selected.size > 0 ? `Выбрано: ${selected.size}` : 'Выберите файл'}
          </span>
          <button onClick={onClose} style={{
            padding: '9px 18px', border: '1.5px solid var(--border-color)', borderRadius: '9px',
            background: 'transparent', color: 'var(--text-secondary)', fontWeight: '600',
            fontSize: '13px', cursor: 'pointer'
          }}>Отмена</button>
          <button onClick={handleConfirm} disabled={selected.size === 0} style={{
            padding: '9px 18px', border: 'none', borderRadius: '9px',
            background: selected.size > 0 ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'var(--bg-secondary)',
            color: selected.size > 0 ? 'white' : 'var(--text-tertiary)',
            fontWeight: '700', fontSize: '13px', cursor: selected.size > 0 ? 'pointer' : 'not-allowed'
          }}>
            Прикрепить {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryPicker;
