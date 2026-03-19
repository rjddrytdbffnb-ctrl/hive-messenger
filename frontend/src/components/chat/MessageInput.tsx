// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect, DragEvent } from 'react';
import GalleryPicker, { GalleryFile } from '../GalleryPicker';
import { useChat } from '../../context/ChatContext';
import MentionInput from '../MentionInput';

const style = document.createElement('style');
style.textContent = `
  @keyframes dropZonePulse {
    0%, 100% { border-color: #667eea; }
    50% { border-color: #764ba2; }
  }
  .drop-active {
    animation: dropZonePulse 1s infinite;
    background: rgba(102, 126, 234, 0.08) !important;
    transform: scale(1.01);
  }
`;
if (!document.head.querySelector('style[data-message-input]')) {
  style.setAttribute('data-message-input', 'true');
  document.head.appendChild(style);
}

const mockUsers = [
  { id: '1', name: 'Алексей Иванов', avatar: 'АИ' },
  { id: '2', name: 'Мария Петрова', avatar: 'МП' },
  { id: '3', name: 'Дмитрий Сидоров', avatar: 'ДС' },
  { id: '4', name: 'Елена Смирнова', avatar: 'ЕС' },
];

const MessageInput: React.FC = () => {
  const { sendMessage, replyingTo, setReplyingTo, activeChat, isTyping, setIsTyping } = useChat();
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const emojis = [
    '😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨',
    '😍', '🤔', '😎', '👏', '🙏', '💪', '🎊', '⭐',
    '😢', '😡', '🤗', '😱', '🤩', '🥳', '😇', '🤯',
    '👋', '✌️', '👌', '💼', '📱', '💻', '📧', '📅'
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() || attachedFiles.length > 0) {
      sendMessage(text, attachedFiles);
      setText('');
      setAttachedFiles([]);
      setIsTyping(false);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (value.length > 0 && !isTyping) setIsTyping(true);
    else if (value.length === 0 && isTyping) setIsTyping(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const processFiles = (files: File[]) => {
    const valid = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`Файл ${f.name} слишком большой (макс 10MB)`);
        return false;
      }
      return true;
    });
    setAttachedFiles(prev => [...prev, ...valid]);
  };

  // Ключевое решение: onMouseDown на кнопке эмодзи вызываем e.preventDefault()
  // Это не даёт textarea потерять фокус, курсор остаётся на месте
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText(prev => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    if (newText.length > 0 && !isTyping) setIsTyping(true);
    // Восстанавливаем курсор после эмодзи
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
  };

  const handleGallerySelect = (galleryFiles: GalleryFile[]) => {
    // Конвертируем GalleryFile в объекты совместимые с File для отображения
    // Создаём псевдо-File объекты из URL
    const pseudoFiles = galleryFiles.map(gf => {
      const pseudo = new File([''], gf.name, { type: gf.type === 'image' ? 'image/jpeg' : 'application/octet-stream' });
      Object.defineProperty(pseudo, 'galleryUrl', { value: gf.url });
      Object.defineProperty(pseudo, 'galleryId', { value: gf.id });
      return pseudo;
    });
    setAttachedFiles(prev => [...prev, ...pseudoFiles]);
    setShowGallery(false);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word') || file.type.includes('document')) return '📝';
    if (file.type.includes('sheet') || file.type.includes('excel')) return '📊';
    return '📎';
  };

  if (!activeChat) return null;

  return (
    <>
      {showGallery && (
        <GalleryPicker
          onSelect={handleGallerySelect}
          onClose={() => setShowGallery(false)}
          multiple={true}
        />
      )}
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: 'var(--bg-primary)',
        borderTop: `2px solid ${isDragging ? '#667eea' : 'var(--border-color)'}`,
        padding: '12px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
        transition: 'border-color 0.2s',
        position: 'relative'
      }}
    >
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(102, 126, 234, 0.1)',
          border: '2px dashed #667eea',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, pointerEvents: 'none'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📥</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#667eea' }}>
              Отпустите файлы для прикрепления
            </div>
          </div>
        </div>
      )}

      {replyingTo && (
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          borderLeft: '3px solid #667eea'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600', marginBottom: '2px' }}>
              Ответ на сообщение
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
              {replyingTo.text}
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '18px', color: 'var(--text-tertiary)', padding: '4px', flexShrink: 0
          }}>✕</button>
        </div>
      )}

      {attachedFiles.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {attachedFiles.map((file, index) => (
            <div key={index} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px', fontSize: '13px',
              border: '1px solid var(--border-color)'
            }}>
              <span>{getFileIcon(file)}</span>
              <span style={{ color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', flexShrink: 0 }}>
                {(file.size / 1024).toFixed(0)}KB
              </span>
              <button onClick={() => removeFile(index)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--error)', fontSize: '14px', padding: '0 2px', flexShrink: 0
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignSelf: 'flex-end', paddingBottom: '4px' }}>
          <ActionButton icon="📎" tooltip="Прикрепить файл" onClick={() => fileInputRef.current?.click()} />
          <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
          <ActionButton icon="🗂️" tooltip="Из галереи" onClick={() => setShowGallery(true)} />

          {/* ЭМОДЗИ */}
          <div style={{ position: 'relative' }}>
            <ActionButton
              icon="😊"
              tooltip="Эмодзи"
              onClick={() => setShowEmojiPicker(p => !p)}
              active={showEmojiPicker}
            />
            {showEmojiPicker && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', bottom: '44px', left: 0,
                  background: 'var(--bg-primary)',
                  backdropFilter: 'blur(20px)',
                  padding: '12px', borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '4px', zIndex: 20,
                  border: '1px solid var(--border-color)',
                  animation: 'slideUp 0.2s ease'
                }}
              >
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    // preventDefault на mousedown — textarea НЕ теряет фокус
                    onMouseDown={e => {
                      e.preventDefault();
                      insertEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={{
                      fontSize: '22px', border: 'none', background: 'transparent',
                      cursor: 'pointer', padding: '6px', borderRadius: '8px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
                  >{emoji}</button>
                ))}
              </div>
            )}
          </div>


        </div>

        {/* MENTION INPUT — передаём ref напрямую */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MentionInput
            inputRef={textareaRef}
            value={text}
            onChange={handleTextChange}
            users={mockUsers}
            placeholder="Введите сообщение... (@ для упоминания)"
            style={{
              width: '100%',
              minHeight: '48px',
              maxHeight: '150px',
            }}
          />
          {text.length > 200 && (
            <div style={{
              position: 'absolute', bottom: '-18px', right: '4px',
              fontSize: '11px',
              color: text.length > 4000 ? 'var(--error)' : 'var(--text-tertiary)'
            }}>
              {text.length}/4000
            </div>
          )}
        </div>

        <button type="submit" disabled={!text.trim() && attachedFiles.length === 0} style={{
          width: '48px', height: '48px', borderRadius: '50%', border: 'none',
          background: (text.trim() || attachedFiles.length > 0)
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'var(--bg-secondary)',
          color: 'white', fontSize: '20px',
          cursor: (text.trim() || attachedFiles.length > 0) ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s', flexShrink: 0,
          boxShadow: (text.trim() || attachedFiles.length > 0)
            ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
        }}
          onMouseEnter={e => { if (text.trim() || attachedFiles.length > 0) { e.currentTarget.style.transform = 'scale(1.1) rotate(-10deg)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
        >➤</button>
      </form>

      {isTyping && (
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', paddingLeft: '4px' }}>
          Вы печатаете...
        </div>
      )}
    </div>
    </>
  );
};

const ActionButton: React.FC<{
  icon: string; tooltip?: string; onClick: () => void; active?: boolean; isText?: boolean;
}> = ({ icon, tooltip, onClick, active, isText }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '36px', height: '36px', border: 'none',
          backgroundColor: active ? 'rgba(102,126,234,0.15)' : isHovered ? 'var(--bg-hover)' : 'transparent',
          borderRadius: '8px', cursor: 'pointer',
          fontSize: isText ? '12px' : '18px',
          fontWeight: isText ? '700' : 'normal',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          color: active ? '#667eea' : 'var(--text-secondary)'
        }}
      >{icon}</button>
      {isHovered && tooltip && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)', marginBottom: '6px',
          backgroundColor: '#1a1a2e', color: 'white',
          padding: '5px 8px', borderRadius: '6px',
          fontSize: '12px', whiteSpace: 'nowrap', zIndex: 30, pointerEvents: 'none'
        }}>
          {tooltip}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
            borderTop: '4px solid #1a1a2e'
          }} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
export {};
