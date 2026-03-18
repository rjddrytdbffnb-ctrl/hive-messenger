// src/pages/HelpPage.tsx
import React from 'react';

const HelpPage: React.FC = () => {
  return (
    <div 
      className="fade-in"
      style={{ 
        padding: '40px', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}
    >
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1 style={{ 
          marginBottom: '30px', 
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          ❓ Помощь и поддержка
        </h1>
        <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
          <p>Здесь вы найдете ответы на часто задаваемые вопросы и инструкции по использованию мессенджера.</p>
          
          <h3>📞 Контакты поддержки:</h3>
          <ul>
            <li>Техническая поддержка: support@company.com</li>
            <li>IT отдел: it@company.com</li>
            <li>Телефон: +7 (XXX) XXX-XX-XX</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;