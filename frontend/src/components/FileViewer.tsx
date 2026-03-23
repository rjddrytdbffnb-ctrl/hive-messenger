// src/components/FileViewer.tsx
import React, { useState, useEffect } from 'react';

interface FileViewerProps {
  url: string;
  name: string;
  mimeType?: string;
  type?: string;
  size?: number;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ url, name, mimeType, type, size, onClose }) => {
  const [loading, setLoading] = useState(true);

  const mime = mimeType || '';
  const isImage = mime.startsWith('image/') || type === 'image' || url.startsWith('data:image/');
  const isVideo = mime.startsWith('video/') || type === 'video';
  const isPdf = mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf');

  const sizeFmt = size
    ? size > 1024 * 1024
      ? (size / 1024 / 1024).toFixed(1) + ' MB'
      : Math.round(size / 1024) + ' KB'
    : '';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.click();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Шапка */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          zIndex: 3001,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '20px' }}>
            {isImage ? '🖼️' : isVideo ? '🎬' : isPdf ? '📄' : '📎'}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '14px', fontWeight: '600', color: 'white',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '250px'
            }}>
              {name}
            </div>
            {sizeFmt && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{sizeFmt}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '7px 14px', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', background: 'rgba(255,255,255,0.1)',
              color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            ⬇️ Скачать
          </button>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px', border: 'none',
              borderRadius: '8px', background: 'rgba(255,255,255,0.1)',
              color: 'white', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Контент */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          marginTop: '60px',
          maxWidth: '95vw', maxHeight: 'calc(95vh - 60px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {isImage && (
          <>
            {loading && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Загрузка...</div>
            )}
            <img
              src={url}
              alt={name}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              style={{
                maxWidth: '95vw', maxHeight: 'calc(95vh - 80px)',
                objectFit: 'contain', borderRadius: '8px',
                display: loading ? 'none' : 'block',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            />
          </>
        )}

        {isVideo && (
          <video
            src={url}
            controls
            autoPlay
            style={{
              maxWidth: '95vw', maxHeight: 'calc(95vh - 80px)',
              borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          />
        )}

        {isPdf && (
          <iframe
            src={url}
            title={name}
            style={{
              width: '90vw', height: 'calc(95vh - 80px)',
              border: 'none', borderRadius: '8px',
              background: 'white'
            }}
            onLoad={() => setLoading(false)}
          />
        )}

        {!isImage && !isVideo && !isPdf && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '48px',
            textAlign: 'center', maxWidth: '400px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📎</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
              {name}
            </div>
            {sizeFmt && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
                {sizeFmt}
              </div>
            )}
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>
              Предпросмотр недоступен для этого типа файла
            </div>
            <button
              onClick={handleDownload}
              style={{
                padding: '12px 24px', border: 'none', borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
              }}
            >
              ⬇️ Скачать файл
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
