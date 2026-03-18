// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    department: user?.department || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.updateProfile({
        firstName:  formData.firstName,
        lastName:   formData.lastName,
        department: formData.department,
      });
      setIsEditing(false);
    } catch (err: any) {
      alert('Ошибка при сохранении: ' + (err?.response?.data?.error ?? 'Попробуйте снова'));
    } finally {
      setSaving(false);
    }
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

  return (
    <div style={{ 
      padding: '40px', 
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: 0
          }}>
            👤 Личный кабинет
          </h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '10px 20px',
              backgroundColor: isEditing ? '#6c757d' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isEditing ? 'Отмена' : 'Редактировать'}
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '30px',
          alignItems: 'flex-start'
        }}>
          {/* Аватар и статус */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#3498db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '36px',
              color: 'white',
              marginBottom: '15px'
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 15px',
              backgroundColor: user?.isOnline ? '#2ecc71' : '#95a5a6',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)'
              }}></div>
              {user?.isOnline ? 'В сети' : 'Не в сети'}
            </div>
          </div>

          {/* Информация о пользователе */}
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <form onSubmit={handleSave}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                      Имя *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                      Имя пользователя *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                      Отдел *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        fontSize: '16px',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                      required
                    >
                      <option value="">Выберите отдел</option>
                      <option value="IT">IT отдел</option>
                      <option value="Marketing">Маркетинг</option>
                      <option value="Sales">Продажи</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Финансы</option>
                      <option value="Management">Руководство</option>
                      <option value="Other">Другой</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {saving ? "⏳ Сохранение..." : "💾 Сохранить"}
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancel}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ❌ Отмена
                  </button>
                </div>
              </form>
            ) : (
              // Режим просмотра
              <div>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '5px' }}>
                      Имя
                    </label>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {user?.firstName}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '5px' }}>
                      Фамилия
                    </label>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {user?.lastName}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '5px' }}>
                      Email
                    </label>
                    <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '5px' }}>
                      Имя пользователя
                    </label>
                    <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                      @{user?.username}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '5px' }}>
                      Отдел
                    </label>
                    <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                      {user?.department}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '5px' }}>
                      ID пользователя
                    </label>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {user?.id}
                    </div>
                  </div>
                </div>

                {/* Статистика */}
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: '8px',
                  marginTop: '20px'
                }}>
                  <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>📊 Статистика</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>42</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Сообщений</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>7</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Чатов</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>15</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Дней в сети</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>98%</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Активность</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

export {};