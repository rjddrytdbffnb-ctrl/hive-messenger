// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      style={{
        width: '60px',
        height: '30px',
        borderRadius: '15px',
        background: isDark ? '#667eea' : '#e0e0e0',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}
      title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: isDark ? 'calc(100% - 27px)' : '3px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--bg-primary)',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px'
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </div>
    </div>
  );
};

export default ThemeToggle;
