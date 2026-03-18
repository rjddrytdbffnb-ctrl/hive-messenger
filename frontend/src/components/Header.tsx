// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { chats } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string): boolean => location.pathname === path;

  // Реальный счётчик непрочитанных сообщений
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 40px',
      background: 'var(--accent-gradient)',
      color: 'white',
      boxShadow: 'var(--shadow-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* ЛЕВЫЙ БЛОК - Логотип и навигация */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div 
          style={{ 
            fontSize: '26px', 
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s ease'
          }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: '28px' }}>🐝</span>
          <span>Hive</span>
        </div>

        <nav style={{ display: 'flex', gap: '8px' }}>
          <NavLink to="/" icon="📰" text="Главная" isActive={isActive} />
          <NavLink to="/chat" icon="💬" text="Чат" isActive={isActive} badge={totalUnread > 0 ? totalUnread : undefined} />
          <NavLink to="/employees" icon="👥" text="Сотрудники" isActive={isActive} />
          <NavLink to="/help" icon="❓" text="Помощь" isActive={isActive} />
          <NavLink to="/profile" icon="👤" text="Кабинет" isActive={isActive} />
        </nav>
      </div>

      {/* ПРАВЫЙ БЛОК */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* СТРОКА ПОИСКА */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type="text"
            placeholder="🔍 Поиск..."
            style={{
              padding: '8px 16px',
              paddingLeft: '36px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              outline: 'none',
              width: '200px',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            onFocus={(e) => {
              e.currentTarget.style.width = '280px';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.width = '200px';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
          />
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ */}
        <ThemeToggle />

        {/* ИКОНКИ */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <IconButton 
            icon="🔔" 
            tooltip="Уведомления" 
            onClick={() => navigate('/notifications')}
          />
          <IconButton 
            icon="📝" 
            tooltip="Задачи" 
            onClick={() => navigate('/tasks')}
          />
        </div>

        <div style={{ width: '1px', height: '35px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>

        {/* ПРОФИЛЬ */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              backgroundColor: isProfileMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: '#3498db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.2' }}>
                {user?.department}
              </div>
            </div>
            
            <div style={{ 
              fontSize: '12px',
              transition: 'transform 0.3s ease',
              transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </div>
          </div>

          {/* DROPDOWN МЕНЮ */}
          {isProfileMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-md)',
                minWidth: '220px',
                overflow: 'hidden',
                zIndex: 1001,
                border: '1px solid var(--border-color)'
              }}
              onClick={(e) => e.stopPropagation()}
              className="fade-in"
            >
              <DropdownItem 
                icon="👤" 
                text="Мой профиль" 
                onClick={() => {
                  navigate('/profile');
                  setIsProfileMenuOpen(false);
                }}
              />
              <DropdownItem 
                icon="⚙️" 
                text="Настройки" 
                onClick={() => {
                  navigate('/settings');
                  setIsProfileMenuOpen(false);
                }}
              />
              <DropdownItem 
                icon="🔔" 
                text="Уведомления" 
                onClick={() => {
                  navigate('/notifications');
                  setIsProfileMenuOpen(false);
                }}
              />
              <DropdownItem 
                icon="📁" 
                text="Медиа галерея" 
                onClick={() => {
                  navigate('/media');
                  setIsProfileMenuOpen(false);
                }}
              />
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '5px 0' }}></div>
              <DropdownItem 
                icon="🚪" 
                text="Выйти" 
                onClick={() => {
                  logout();
                  setIsProfileMenuOpen(false);
                }}
                danger
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </header>
  );
};

// Компоненты
interface NavLinkProps {
  to: string;
  icon: string;
  text: string;
  isActive: (path: string) => boolean;
  badge?: number;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, text, isActive, badge }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={to}
      style={{
        position: 'relative',
        color: 'white',
        textDecoration: 'none',
        padding: '10px 18px',
        borderRadius: '8px',
        backgroundColor: isActive(to) ? '#3498db' : isHovered ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
        fontWeight: isActive(to) ? 'bold' : 'normal',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '15px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{icon}</span>
      <span>{text}</span>
      
      {badge && badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: '#e74c3c',
          color: 'white',
          borderRadius: '10px',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: 'bold',
          minWidth: '18px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
};

interface IconButtonProps {
  icon: string;
  badge?: number;
  tooltip?: string;
  onClick?: () => void;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, badge, tooltip, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (onClick) onClick();
        }}
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.15)' : 'none',
          border: 'none',
          color: 'white',
          cursor: onClick ? 'pointer' : 'default',
          fontSize: '20px',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltip}
      >
        {icon}
        
        {badge && badge > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: '#e74c3c',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 5px',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '16px',
            textAlign: 'center',
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
      
      {isHovered && tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '-35px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#34495e',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1002,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          pointerEvents: 'none'
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  icon: string;
  text: string;
  onClick: () => void;
  danger?: boolean;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ icon, text, onClick, danger }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      style={{
        padding: '12px 20px',
        cursor: 'pointer',
        backgroundColor: isHovered ? (danger ? '#ffe6e6' : 'var(--bg-hover)') : 'var(--bg-primary)',
        color: danger ? '#e74c3c' : 'var(--text-primary)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontWeight: danger ? 'bold' : 'normal' }}>{text}</span>
    </div>
  );
};

export default Header;
