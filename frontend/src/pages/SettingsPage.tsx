// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [settings, setSettings] = useState({
    notifications: {
      messages: true,
      mentions: true,
      groups: true,
      email: false
    },
    privacy: {
      showOnlineStatus: true,
      readReceipts: true,
      lastSeen: true
    },
    sound: {
      messageSound: true,
      callSound: true,
      volume: 70
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'sound'>('general');

  const handleToggle = (category: string, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [setting]: !(prev as any)[category][setting]
      }
    }));
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'var(--bg-secondary)',
      padding: '32px 0'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        {/* ЗАГОЛОВОК */}
        <div style={{ marginBottom: '32px' }} className="fade-in">
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            ⚙️ Настройки
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
            Управляйте параметрами вашего аккаунта
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* БОКОВОЕ МЕНЮ */}
          <div style={{
            width: '250px',
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)',
            height: 'fit-content'
          }}
          className="fade-in">
            <TabButton
              icon="🎨"
              text="Общие"
              active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
            />
            <TabButton
              icon="🔔"
              text="Уведомления"
              active={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
            />
            <TabButton
              icon="🔒"
              text="Приватность"
              active={activeTab === 'privacy'}
              onClick={() => setActiveTab('privacy')}
            />
            <TabButton
              icon="🔊"
              text="Звук"
              active={activeTab === 'sound'}
              onClick={() => setActiveTab('sound')}
            />
          </div>

          {/* КОНТЕНТ */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            
            {/* ОБЩИЕ НАСТРОЙКИ */}
            {activeTab === 'general' && (
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="fade-in">
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '24px',
                  color: 'var(--text-primary)'
                }}>
                  🎨 Оформление
                </h2>

                <SettingRow
                  label="Тема интерфейса"
                  description="Выберите светлую или темную тему"
                >
                  <ThemeToggle />
                </SettingRow>

                <div style={{ 
                  height: '1px', 
                  background: 'var(--border-color)', 
                  margin: '20px 0' 
                }} />

                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginTop: '32px', 
                  marginBottom: '24px',
                  color: 'var(--text-primary)'
                }}>
                  👤 Профиль
                </h2>

                <SettingRow
                  label="Имя"
                  description="Ваше отображаемое имя"
                >
                  <input
                    type="text"
                    defaultValue={`${user?.firstName} ${user?.lastName}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid var(--border-color)',
                      fontSize: '14px',
                      width: '250px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  />
                </SettingRow>

                <SettingRow
                  label="Email"
                  description="Ваш email адрес"
                >
                  <input
                    type="email"
                    defaultValue={user?.email}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid var(--border-color)',
                      fontSize: '14px',
                      width: '250px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  />
                </SettingRow>
              </div>
            )}

            {/* УВЕДОМЛЕНИЯ */}
            {activeTab === 'notifications' && (
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="fade-in">
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '24px',
                  color: 'var(--text-primary)'
                }}>
                  🔔 Уведомления
                </h2>

                <SettingRow
                  label="Личные сообщения"
                  description="Получать уведомления о новых сообщениях"
                >
                  <Toggle
                    checked={settings.notifications.messages}
                    onChange={() => handleToggle('notifications', 'messages')}
                  />
                </SettingRow>

                <SettingRow
                  label="Упоминания"
                  description="Когда вас упоминают в чате"
                >
                  <Toggle
                    checked={settings.notifications.mentions}
                    onChange={() => handleToggle('notifications', 'mentions')}
                  />
                </SettingRow>

                <SettingRow
                  label="Группы"
                  description="Сообщения в групповых чатах"
                >
                  <Toggle
                    checked={settings.notifications.groups}
                    onChange={() => handleToggle('notifications', 'groups')}
                  />
                </SettingRow>

                <SettingRow
                  label="Email уведомления"
                  description="Отправлять дубликаты на email"
                >
                  <Toggle
                    checked={settings.notifications.email}
                    onChange={() => handleToggle('notifications', 'email')}
                  />
                </SettingRow>
              </div>
            )}

            {/* ПРИВАТНОСТЬ */}
            {activeTab === 'privacy' && (
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="fade-in">
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '24px',
                  color: 'var(--text-primary)'
                }}>
                  🔒 Приватность
                </h2>

                <SettingRow
                  label="Статус онлайн"
                  description="Показывать когда вы онлайн"
                >
                  <Toggle
                    checked={settings.privacy.showOnlineStatus}
                    onChange={() => handleToggle('privacy', 'showOnlineStatus')}
                  />
                </SettingRow>

                <SettingRow
                  label="Отметки прочтения"
                  description="Показывать что вы прочитали сообщение"
                >
                  <Toggle
                    checked={settings.privacy.readReceipts}
                    onChange={() => handleToggle('privacy', 'readReceipts')}
                  />
                </SettingRow>

                <SettingRow
                  label="Был(а) в сети"
                  description="Показывать время последнего визита"
                >
                  <Toggle
                    checked={settings.privacy.lastSeen}
                    onChange={() => handleToggle('privacy', 'lastSeen')}
                  />
                </SettingRow>
              </div>
            )}

            {/* ЗВУК */}
            {activeTab === 'sound' && (
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="fade-in">
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '24px',
                  color: 'var(--text-primary)'
                }}>
                  🔊 Звук
                </h2>

                <SettingRow
                  label="Звук сообщений"
                  description="Воспроизводить при получении сообщения"
                >
                  <Toggle
                    checked={settings.sound.messageSound}
                    onChange={() => handleToggle('sound', 'messageSound')}
                  />
                </SettingRow>

                <SettingRow
                  label="Звук звонков"
                  description="Рингтон для входящих звонков"
                >
                  <Toggle
                    checked={settings.sound.callSound}
                    onChange={() => handleToggle('sound', 'callSound')}
                  />
                </SettingRow>

                <SettingRow
                  label="Громкость"
                  description="Уровень громкости уведомлений"
                >
                  <div style={{ width: '200px' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sound.volume}
                      onChange={(e) => setSettings({
                        ...settings,
                        sound: {...settings.sound, volume: Number(e.target.value)}
                      })}
                      style={{ 
                        width: '100%',
                        accentColor: 'var(--accent-primary)'
                      }}
                    />
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '8px', 
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {settings.sound.volume}%
                    </div>
                  </div>
                </SettingRow>
              </div>
            )}

            {/* КНОПКА СОХРАНИТЬ */}
            <button
              style={{
                marginTop: '24px',
                padding: '14px 32px',
                background: 'var(--accent-gradient)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s'
              }}
              className="hover-lift"
              onClick={() => alert('Настройки сохранены!')}
            >
              💾 Сохранить изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// КОМПОНЕНТ: Кнопка вкладки
const TabButton: React.FC<{
  icon: string;
  text: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, text, active, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        borderRadius: '12px',
        background: active 
          ? 'var(--accent-gradient)' 
          : isHovered 
            ? 'var(--bg-hover)' 
            : 'transparent',
        color: active ? 'white' : 'var(--text-primary)',
        fontSize: '15px',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '4px',
        textAlign: 'left',
        boxShadow: active ? 'var(--shadow-lg)' : 'none'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{text}</span>
    </button>
  );
};

// КОМПОНЕНТ: Строка настройки
const SettingRow: React.FC<{
  label: string;
  description: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ flex: 1, marginRight: '16px' }}>
        <div style={{ 
          fontWeight: '600', 
          fontSize: '15px', 
          marginBottom: '4px',
          color: 'var(--text-primary)'
        }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {description}
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

// КОМПОНЕНТ: Toggle переключатель
const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => {
  return (
    <div
      onClick={onChange}
      style={{
        width: '50px',
        height: '28px',
        borderRadius: '14px',
        background: checked 
          ? 'var(--accent-gradient)' 
          : 'var(--border-color)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s',
        boxShadow: checked ? 'var(--shadow-lg)' : 'none'
      }}
    >
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: 'var(--bg-primary)',
        position: 'absolute',
        top: '3px',
        left: checked ? '25px' : '3px',
        transition: 'all 0.3s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
};

export default SettingsPage;
