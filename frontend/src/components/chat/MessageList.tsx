// src/components/chat/MessageList.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

// Компонент для одного файла — создаёт blob URL один раз через useEffect
const FileAttachment: React.FC<{ file: any; isMyMessage: boolean }> = ({ file, isMyMessage }) => {
  const isFileObj = file instanceof File;
  const fileName = isFileObj ? file.name : (file.original_name || file.name || 'Файл');
  const mimeType = isFileObj ? file.type : (file.mime_type || file.type || '');
  const fileSize = file.size || 0;
  const isImage = mimeType.startsWith('image/');

  // Для серверных файлов используем url напрямую, для File объектов — создаём blob один раз
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isFileObj) {
      const url = URL.createObjectURL(file);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url); // очищаем при unmount
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fileUrl = isFileObj ? (blobUrl || '#') : (file.url || '#');

  const icon = mimeType.includes('pdf') ? '📄'
    : mimeType.includes('word') || mimeType.includes('document') ? '📝'
    : mimeType.includes('sheet') || mimeType.includes('excel') ? '📊'
    : isImage ? '🖼️' : '📎';

  if (isImage && fileUrl !== '#') {
    return (
      <img
        src={fileUrl}
        alt={fileName}
        style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: '8px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
        onClick={() => window.open(fileUrl, '_blank')}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
        background: isMyMessage ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
        borderRadius: '10px', cursor: 'pointer', maxWidth: '220px'
      }}
      onClick={() => {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        a.click();
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isMyMessage ? 'white' : 'var(--text-primary)' }}>
          {fileName}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.7 }}>
          {fileSize > 0 ? (fileSize > 1024*1024 ? (fileSize/1024/1024).toFixed(1)+' MB' : Math.round(fileSize/1024)+' KB') : ''}
        </div>
      </div>
    </div>
  );
};

const MessageList: React.FC = () => {
  const { activeChat, messages, setReplyingTo, replyingTo } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Автопрокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
          <div>Выберите чат для начала общения</div>
        </div>
      </div>
    );
  }

  const chatMessages = messages.filter(m => m.chatId === activeChat.id && !m.isDeleted);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      overflow: 'hidden'
    }}>
      {/* ШАПКА ЧАТА */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--accent-gradient)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          border: '2px solid rgba(255,255,255,0.3)',
          flexShrink: 0
        }}>
          {activeChat.type === 'direct' ? activeChat.name[0] : '👥'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: 'white' }}>
            {activeChat.name}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeChat.type === 'direct' && activeChat.isOnline && (
              <>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
                В сети
              </>
            )}
            {activeChat.type === 'direct' && !activeChat.isOnline && 'Не в сети'}
            {activeChat.type === 'group' && `${activeChat.participants?.length || 0} участников`}
          </div>
        </div>
      </div>

      {/* СПИСОК СООБЩЕНИЙ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {chatMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            gap: '12px'
          }}>
            <div style={{ fontSize: '48px' }}>👋</div>
            <div style={{ fontSize: '16px' }}>Начните общение!</div>
          </div>
        ) : (
          chatMessages.map((message) => {
            const isMyMessage = message.sender.id === user?.id;

            return (
              <div
                key={message.id}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMyMessage ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}
              >
                {/* Имя отправителя (для групповых чатов) */}
                {!isMyMessage && activeChat.type === 'group' && (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginLeft: '12px'
                  }}>
                    {message.sender.firstName} {message.sender.lastName}
                    {message.sender.department && (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '400', marginLeft: '8px' }}>
                        {message.sender.department}
                      </span>
                    )}
                  </div>
                )}

                {/* Ответ на сообщение */}
                {message.replyTo && (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    maxWidth: '70%',
                    borderLeft: '3px solid var(--accent-primary)',
                    marginBottom: '4px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                      {message.replyTo.sender.firstName}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      {message.replyTo.text.substring(0, 50)}
                      {message.replyTo.text.length > 50 ? '...' : ''}
                    </div>
                  </div>
                )}

                {/* Само сообщение */}
                <div style={{
                  position: 'relative',
                  maxWidth: '70%',
                  padding: '12px 16px',
                  background: isMyMessage 
                    ? 'var(--accent-gradient)' 
                    : 'var(--bg-primary)',
                  color: isMyMessage ? 'white' : 'var(--text-primary)',
                  borderRadius: isMyMessage ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: 'var(--shadow-sm)',
                  wordBreak: 'break-word'
                }}>
                  <div>{message.text}</div>

                  {/* Вложения */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div style={{ marginTop: message.text ? '8px' : '0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {message.attachments.map((file: any, idx: number) => (
                        <FileAttachment key={idx} file={file} isMyMessage={isMyMessage} />
                      ))}
                    </div>
                  )}

                  {/* Время + статус */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'flex-end',
                    marginTop: '4px'
                  }}>
                    {message.isEdited && (
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>изм.</span>
                    )}
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                      {formatTime(message.timestamp)}
                    </span>
                    {isMyMessage && (
                      <span style={{ fontSize: '12px', opacity: 0.85 }}>
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Реакции */}
                {message.reactions && message.reactions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                    marginTop: '4px'
                  }}>
                    {message.reactions.map((reaction, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          background: 'var(--bg-primary)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span>{reaction.emoji}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          1
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Быстрые действия при наведении */}
                {hoveredMessageId === message.id && (
                  <div style={{
                    position: 'absolute',
                    top: '-36px',
                    [isMyMessage ? 'left' : 'right']: 0,
                    display: 'flex',
                    gap: '4px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '4px 6px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-color)',
                    zIndex: 10
                  }}>
                    <button
                      onClick={() => setReplyingTo(message)}
                      style={{
                        fontSize: '14px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)'
                      }}
                      title="Ответить"
                    >
                      ↩
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
