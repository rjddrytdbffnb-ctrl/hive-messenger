// src/components/Header.tsx - АДАПТИВНАЯ ВЕРСИЯ
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string): boolean => location.pathname === path;
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsTablet(w <= 1024);
      if (w > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Закрываем меню при смене страницы
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', icon: '📰', text: 'Главная' },
    { to: '/chat', icon: '💬', text: 'Чат', badge: totalUnread > 0 ? totalUnread : undefined },
    { to: '/employees', icon: '👥', text: 'Сотрудники' },
    { to: '/help', icon: '❓', text: 'Помощь' },
    { to: '/profile', icon: '👤', text: 'Кабинет' },
  ];

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? '12px 16px' : isTablet ? '14px 24px' : '16px 40px',
      background: 'var(--accent-gradient)',
      color: 'white',
      boxShadow: 'var(--shadow-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {/* ЛЕВЫЙ БЛОК */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '40px' }}>
        {/* Логотип */}
        <div
          style={{
            fontSize: isMobile ? '20px' : '26px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: isMobile ? '22px' : '28px' }}>🐝</span>
          <span>Hive</span>
        </div>

        {/* Навигация — только на десктопе */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '8px' }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                text={isTablet ? '' : link.text}
                isActive={isActive}
                badge={link.badge}
              />
            ))}
          </nav>
        )}
      </div>

      {/* ПРАВЫЙ БЛОК */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px' }}>

        {/* Поиск — скрываем на мобильных */}
        {!isMobile && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Поиск..."
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                outline: 'none',
                width: isTablet ? '140px' : '200px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.width = isTablet ? '180px' : '280px';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.width = isTablet ? '140px' : '200px';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
            />
          </div>
        )}

        <ThemeToggle />

        {/* Иконки уведомлений — только на десктопе */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <IconButton icon="🔔" tooltip="Уведомления" onClick={() => navigate('/notifications')} />
            <IconButton icon="📝" tooltip="Задачи" onClick={() => navigate('/tasks')} />
          </div>
        )}

        {!isMobile && (
          <div style={{ width: '1px', height: '35px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
        )}

        {/* Профиль — на десктопе дропдаун, на мобильном просто аватар */}
        {!isMobile ? (
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
                backgroundColor: isProfileMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
              onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: '#3498db', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 'bold', fontSize: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)', flexShrink: 0,
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              {!isTablet && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.2' }}>
                    {user?.department}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '12px', transition: 'transform 0.3s ease', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
            </div>

            {isProfileMenuOpen && (
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  backgroundColor: 'var(--bg-primary)', borderRadius: '10px',
                  boxShadow: 'var(--shadow-md)', minWidth: '220px',
                  overflow: 'hidden', zIndex: 1001, border: '1px solid var(--border-color)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownItem icon="👤" text="Мой профиль" onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }} />
                <DropdownItem icon="⚙️" text="Настройки" onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }} />
                <DropdownItem icon="🔔" text="Уведомления" onClick={() => { navigate('/notifications'); setIsProfileMenuOpen(false); }} />
                <DropdownItem icon="📁" text="Медиа галерея" onClick={() => { navigate('/media'); setIsProfileMenuOpen(false); }} />
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '5px 0' }} />
                <DropdownItem icon="🚪" text="Выйти" onClick={() => { logout(); setIsProfileMenuOpen(false); }} danger />
              </div>
            )}
          </div>
        ) : (
          /* Аватар на мобильном */
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: '#3498db', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 'bold', fontSize: '14px',
              border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0,
            }}
            onClick={() => navigate('/profile')}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        )}

        {/* Бургер — только на мобильном */}
        {isMobile && (
          <div ref={mobileMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: isMobileMenuOpen ? 'rgba(255,255,255,0.15)' : 'none',
                border: 'none', color: 'white', cursor: 'pointer',
                fontSize: '22px', padding: '6px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '38px', height: '38px', transition: 'all 0.2s',
              }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

            {/* Мобильное меню */}
            {isMobileMenuOpen && (
              <div style={{
                position: 'fixed',
                top: '64px',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-primary)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                zIndex: 999,
                borderTop: '1px solid var(--border-color)',
                padding: '12px 0',
              }}>
                {/* Поиск в меню */}
                <div style={{ padding: '8px 16px 16px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Поиск..."
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: '12px',
                      border: '1px solid var(--border-color)', fontSize: '14px',
                      backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Навигация */}
                {navLinks.map((link) => (
                  <MobileNavLink
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    text={link.text}
                    isActive={isActive(link.to)}
                    badge={link.badge}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}

                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />

                {/* Дополнительные пункты */}
                <MobileNavLink to="/notifications" icon="🔔" text="Уведомления" isActive={isActive('/notifications')} onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/tasks" icon="📝" text="Задачи" isActive={isActive('/tasks')} onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/settings" icon="⚙️" text="Настройки" isActive={isActive('/settings')} onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/media" icon="📁" text="Медиа галерея" isActive={isActive('/media')} onClick={() => setIsMobileMenuOpen(false)} />

                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />

                {/* Выйти */}
                <div
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 20px', cursor: 'pointer', color: '#e74c3c',
                    fontSize: '15px', fontWeight: '600',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(231,76,60,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '20px' }}>🚪</span>
                  <span>Выйти</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        input::placeholder { color: rgba(255, 255, 255, 0.6); }
      `}</style>
    </header>
  );
};

// ── Компоненты ──────────────────────────────────────────────────────────────

interface NavLinkProps {
  to: string;
  icon: string;
  text: string;
  isActive: (path: string) => boolean;
  badge?: number;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, text, isActive, badge }) => {
  const [isHovered, setIsHovered] = useState(false);
  const active = isActive(to);

  return (
    <Link
      to={to}
      style={{
        position: 'relative', color: 'white', textDecoration: 'none',
        padding: text ? '10px 18px' : '10px 14px',
        borderRadius: '8px',
        backgroundColor: active ? '#3498db' : isHovered ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
        fontWeight: active ? 'bold' : 'normal',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={text || undefined}
    >
      <span>{icon}</span>
      {text && <span>{text}</span>}
      {badge && badge > 0 && (
        <span style={{
          position: 'absolute', top: '4px', right: '4px',
          backgroundColor: '#e74c3c', color: 'white', borderRadius: '10px',
          padding: '2px 6px', fontSize: '11px', fontWeight: 'bold',
          minWidth: '18px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
};

// Пункт мобильного меню
interface MobileNavLinkProps {
  to: string;
  icon: string;
  text: string;
  isActive: boolean;
  badge?: number;
  onClick: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, icon, text, isActive, badge, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 20px', textDecoration: 'none',
        color: isActive ? '#3498db' : 'var(--text-primary)',
        fontSize: '15px', fontWeight: isActive ? '700' : '500',
        backgroundColor: isActive ? 'rgba(52,152,219,0.08)' : 'transparent',
        borderLeft: isActive ? '3px solid #3498db' : '3px solid transparent',
        position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span>{text}</span>
      {badge && badge > 0 && (
        <span style={{
          marginLeft: 'auto', backgroundColor: '#e74c3c', color: 'white',
          borderRadius: '10px', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold',
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
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (onClick) onClick(); }}
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.15)' : 'none',
          border: 'none', color: 'white', cursor: onClick ? 'pointer' : 'default',
          fontSize: '20px', padding: '8px', borderRadius: '8px',
          transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
          justifyContent: 'center', width: '40px', height: '40px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltip}
      >
        {icon}
        {badge && badge > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            backgroundColor: '#e74c3c', color: 'white', borderRadius: '10px',
            padding: '2px 5px', fontSize: '10px', fontWeight: 'bold',
            minWidth: '16px', textAlign: 'center', border: '2px solid var(--accent-primary)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
      {isHovered && tooltip && (
        <div style={{
          position: 'absolute', bottom: '-35px', left: '50%',
          transform: 'translateX(-50%)', backgroundColor: '#34495e',
          color: 'white', padding: '6px 12px', borderRadius: '6px',
          fontSize: '12px', whiteSpace: 'nowrap', zIndex: 1002,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', pointerEvents: 'none',
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
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
      style={{
        padding: '12px 20px', cursor: 'pointer',
        backgroundColor: isHovered ? (danger ? '#ffe6e6' : 'var(--bg-hover)') : 'var(--bg-primary)',
        color: danger ? '#e74c3c' : 'var(--text-primary)',
        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
        gap: '12px', fontSize: '14px',
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