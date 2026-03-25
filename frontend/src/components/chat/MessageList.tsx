// src/components/chat/MessageList.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import FileViewer from '../FileViewer';
import { usersAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || '';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

// Компонент для одного файла — создаёт blob URL один раз через useEffect
const FileAttachment: React.FC<{ file: any; isMyMessage: boolean }> = ({ file, isMyMessage }) => {
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const isFileObj = file instanceof File;
  const fileName = isFileObj ? file.name : (file.name || file.original_name || file.filename || 'Файл');
  const mimeType = isFileObj ? file.type : (file.mime_type || '');
  const fileType = isFileObj ? '' : (file.type || '');
  const fileSize = file.size || 0;
  const serverUrl = isFileObj ? '' : (file.url || '');
  // Определяем тип: по mime, по type полю, или по содержимому url
  const isImage = mimeType.startsWith('image/')
    || fileType === 'image'
    || serverUrl.startsWith('data:image/')
    || (isFileObj && (file as File).type.startsWith('image/'));

  // Для серверных файлов используем url напрямую, для File объектов — создаём blob один раз
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isFileObj) {
      const url = URL.createObjectURL(file);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url); // очищаем при unmount
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedUrl = isFileObj ? (blobUrl || '#') : (serverUrl || '#');

  const icon = mimeType.includes('pdf') ? '📄'
    : mimeType.includes('word') || mimeType.includes('document') ? '📝'
    : mimeType.includes('sheet') || mimeType.includes('excel') ? '📊'
    : isImage ? '🖼️' : '📎';

  if (isImage && resolvedUrl !== '#') {
    return (
      <>
        {viewerOpen && (
          <FileViewer
            url={resolvedUrl}
            name={fileName}
            mimeType={mimeType}
            type={fileType}
            size={fileSize}
            onClose={() => setViewerOpen(false)}
          />
        )}
        <img
          src={resolvedUrl}
          alt={fileName}
          style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: '8px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
          onClick={() => setViewerOpen(true)}
        />
      </>
    );
  }

  return (
    <>
      {viewerOpen && (
        <FileViewer
          url={resolvedUrl}
          name={fileName}
          mimeType={mimeType}
          type={fileType}
          size={fileSize}
          onClose={() => setViewerOpen(false)}
        />
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
          background: isMyMessage ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
          borderRadius: '10px', cursor: 'pointer', maxWidth: '220px'
        }}
        onClick={() => setViewerOpen(true)}
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
    </>
  );
};

const MessageList: React.FC = () => {
  const { activeChat, messages, setReplyingTo, replyingTo } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [adding, setAdding] = useState(false);

  // Загружаем пользователей для добавления в группу
  useEffect(() => {
    if (!showAddMember) return;
    usersAPI.getAll().then(res => {
      const users = res.data?.users || res.data || [];
      const existing = activeChat?.participants?.map(p => String(p.id)) || [];
      setAllUsers(users
        .filter((u: any) => !existing.includes(String(u.id)))
        .map((u: any) => ({
          id: String(u.id),
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
          department: u.department || '',
          initials: [u.first_name?.[0], u.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?',
        }))
      );
    }).catch(() => {});
  }, [showAddMember, activeChat?.id]);

  const handleAddMember = async (userId: string) => {
    if (!activeChat || adding) return;
    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/chats/${activeChat.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      setShowAddMember(false);
    } catch {}
    setAdding(false);
  };

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
            {activeChat.type === 'group' && (
              <span
                onClick={() => setShowMembers(v => !v)}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                {activeChat.participants?.length || 0} участников
              </span>
            )}
          </div>
        </div>
        {activeChat.type === 'group' && (
          <button
            onClick={() => setShowAddMember(true)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}
          >
            ➕ Добавить
          </button>
        )}
      </div>

      {/* ПАНЕЛЬ УЧАСТНИКОВ */}
      {showMembers && activeChat.type === 'group' && (
        <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '12px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Участники группы
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(activeChat.participants || []).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '20px', fontSize: '13px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                  {p.firstName?.[0]}{p.lastName?.[0]}
                </div>
                <span style={{ color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* МОДАЛКА ДОБАВИТЬ УЧАСТНИКА */}
      {showAddMember && (
        <div onClick={() => setShowAddMember(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>➕ Добавить участника</div>
            <input
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder="Поиск..."
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', marginBottom: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {allUsers.filter(u => u.name.toLowerCase().includes(addSearch.toLowerCase())).map(u => (
                <div key={u.id} onClick={() => handleAddMember(u.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px' }}>{u.initials}</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.department}</div>
                  </div>
                </div>
              ))}
              {allUsers.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Все уже в группе</div>}
            </div>
            <button onClick={() => setShowAddMember(false)} style={{ marginTop: '12px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Отмена</button>
          </div>
        </div>
      )}

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
            const isMyMessage = String(message.sender.id) === String(user?.id);

            return (
              <div
                key={message.id}
                onClick={() => setActiveMessageId(prev => prev === message.id ? null : message.id)}
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
                {activeMessageId === message.id && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '4px',
                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                  }}>
                    <button
                      onClick={() => setReplyingTo(message)}
                      style={{
                        fontSize: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                        padding: '3px 10px',
                        borderRadius: '10px',
                        color: 'var(--text-secondary)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                      title="Ответить"
                    >
                      ↩ Ответить
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
