// src/pages/ProfilePage.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { messages, chats } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    department: user?.department || ''
  });

  // Реальная статистика
  const stats = useMemo(() => {
    const myMessages = messages.filter(m => m.sender.id === user?.id);
    const myChats = chats.filter(c => !c.isArchived);
    const archivedChats = chats.filter(c => c.isArchived);

    // Дней в сети: считаем по уникальным дням когда отправлялись сообщения
    const days = new Set(
      myMessages.map(m => new Date(m.timestamp).toDateString())
    ).size;

    // Активность: процент чатов где есть хоть одно моё сообщение
    const activeChatsCount = myChats.filter(c =>
      messages.some(m => m.chatId === c.id && m.sender.id === user?.id)
    ).length;
    const activity = myChats.length > 0
      ? Math.round((activeChatsCount / myChats.length) * 100)
      : 0;

    return {
      messages: myMessages.length,
      chats: myChats.length,
      archived: archivedChats.length,
      days: days || 1,
      activity: activity || (myMessages.length > 0 ? 100 : 0),
    };
  }, [messages, chats, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
      department: user?.department || ''
    });
    setIsEditing(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid var(--border-color)',
    borderRadius: '10px',
    fontSize: '15px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '860px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>

        {/* Уведомление об успешном сохранении */}
        {saved && (
          <div style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            ✅ Данные успешно сохранены
          </div>
        )}

        {/* Основная карточка */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {/* Шапка с градиентом */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Аватар */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                border: '3px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: '800', color: 'white',
                flexShrink: 0
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: 'white' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                  @{user?.username} · {user?.department}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  marginTop: '8px', padding: '4px 12px',
                  background: user?.isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)',
                  borderRadius: '20px', fontSize: '12px', color: 'white'
                }}>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: user?.isOnline ? '#10b981' : '#9ca3af'
                  }} />
                  {user?.isOnline ? 'В сети' : 'Не в сети'}
                </div>
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              style={{
                padding: '10px 22px',
                background: isEditing ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                color: isEditing ? 'white' : '#667eea',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {isEditing ? '✕ Отмена' : '✏️ Редактировать'}
            </button>
          </div>

          {/* Тело карточки */}
          <div style={{ padding: '28px 32px' }}>
            {isEditing ? (
              <form onSubmit={handleSave}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '18px', marginBottom: '24px'
                }}>
                  {[
                    { name: 'firstName', label: 'Имя', type: 'text' },
                    { name: 'lastName', label: 'Фамилия', type: 'text' },
                    { name: 'email', label: 'Email', type: 'email' },
                    { name: 'username', label: 'Имя пользователя', type: 'text' },
                  ].map(field => (
                    <div key={field.name}>
                      <label style={{
                        display: 'block', fontSize: '13px', fontWeight: '600',
                        color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block', fontSize: '13px', fontWeight: '600',
                      color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>Отдел</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      style={{ ...inputStyle }}
                    >
                      <option value="">Выберите отдел</option>
                      {['IT', 'Marketing', 'Sales', 'HR', 'Finance', 'Management', 'Other'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '15px', fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
                  }}>
                    💾 Сохранить
                  </button>
                  <button type="button" onClick={handleCancel} style={{
                    padding: '12px 28px',
                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                    border: '2px solid var(--border-color)', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '15px'
                  }}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[
                  { label: 'Имя', value: user?.firstName },
                  { label: 'Фамилия', value: user?.lastName },
                  { label: 'Email', value: user?.email },
                  { label: 'Имя пользователя', value: `@${user?.username}` },
                  { label: 'Отдел', value: user?.department },
                  { label: 'ID пользователя', value: user?.id },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {f.value || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Статистика */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>
            📊 Статистика
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { value: stats.messages, label: 'Сообщений', color: '#667eea', icon: '💬' },
              { value: stats.chats, label: 'Активных чатов', color: '#10b981', icon: '🗂️' },
              { value: stats.days, label: 'Дней активности', color: '#f59e0b', icon: '📅' },
              { value: `${stats.activity}%`, label: 'Вовлечённость', color: '#ef4444', icon: '🔥' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
                border: `2px solid transparent`,
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '500' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          {stats.archived > 0 && (
            <div style={{
              marginTop: '12px', padding: '12px 16px',
              background: 'var(--bg-secondary)', borderRadius: '10px',
              fontSize: '13px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              📥 Архивировано чатов: <strong>{stats.archived}</strong>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
export {};
