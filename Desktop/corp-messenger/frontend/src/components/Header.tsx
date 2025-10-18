// src/components/Header.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 30px',
      backgroundColor: '#2c3e50',
      color: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <div 
          style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          🐝 Hive
        </div>

        <nav style={{ display: 'flex', gap: '20px' }}>
          <Link 
            to="/" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              backgroundColor: isActive('/') ? '#3498db' : 'transparent',
              fontWeight: isActive('/') ? 'bold' : 'normal'
            }}
          >
            📰 Новости
          </Link>
          <Link 
            to="/chat" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              backgroundColor: isActive('/chat') ? '#3498db' : 'transparent',
              fontWeight: isActive('/chat') ? 'bold' : 'normal'
            }}
          >
            💬 Чат
          </Link>
          <Link 
            to="/help" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              backgroundColor: isActive('/help') ? '#3498db' : 'transparent',
              fontWeight: isActive('/help') ? 'bold' : 'normal'
            }}
          >
            ❓ Помощь
          </Link>
          <Link 
            to="/profile" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              backgroundColor: isActive('/profile') ? '#3498db' : 'transparent',
              fontWeight: isActive('/profile') ? 'bold' : 'normal'
            }}
          >
            👤 Кабинет
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}>
            🔔
          </button>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}>
            ⭐
          </button>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}>
            📝
          </button>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}>
            📅
          </button>
        </div>

        <div style={{ width: '1px', height: '30px', backgroundColor: '#555' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '35px', 
            height: '35px', 
            borderRadius: '50%', 
            backgroundColor: '#3498db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
              {user?.department}
            </div>
          </div>
          <button 
            onClick={logout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '10px'
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

export {};