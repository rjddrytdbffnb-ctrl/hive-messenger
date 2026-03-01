// src/components/chat/ManageParticipants.tsx
import React, { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  department: string;
  isAdmin: boolean;
  isOnline: boolean;
}

interface ManageParticipantsProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ManageParticipants: React.FC<ManageParticipantsProps> = ({ chatId, isOpen, onClose }) => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Алексей Иванов', avatar: 'АИ', department: 'IT', isAdmin: true, isOnline: true },
    { id: '2', name: 'Мария Петрова', avatar: 'МП', department: 'Marketing', isAdmin: false, isOnline: true },
    { id: '3', name: 'Дмитрий Сидоров', avatar: 'ДС', department: 'Sales', isAdmin: false, isOnline: false },
    { id: '4', name: 'Елена Смирнова', avatar: 'ЕС', department: 'HR', isAdmin: false, isOnline: true },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAdmin = (userId: string) => {
    setParticipants(prev =>
      prev.map(p => p.id === userId ? { ...p, isAdmin: !p.isAdmin } : p)
    );
  };

  const removeParticipant = (userId: string) => {
    if (window.confirm('Удалить участника из группы?')) {
      setParticipants(prev => prev.filter(p => p.id !== userId));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ЗАТЕМНЕНИЕ */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* МОДАЛЬНОЕ ОКНО */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-primary)',
        borderRadius: '20px',
        padding: '32px',
        zIndex: 1001,
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* ЗАГОЛОВОК */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              👥 Участники группы
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Всего участников: {participants.length}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* КНОПКА ДОБАВИТЬ */}
        <button
          onClick={() => setShowAddUser(true)}
          style={{
            width: '100%',
            padding: '14px',
            border: '2px dashed #667eea',
            borderRadius: '12px',
            background: 'rgba(102, 126, 234, 0.05)',
            color: '#667eea',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
            e.currentTarget.style.borderColor = '#764ba2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
            e.currentTarget.style.borderColor = '#667eea';
          }}
        >
          ➕ Добавить участника
        </button>

        {/* ПОИСК */}
        <input
          type="text"
          placeholder="🔍 Поиск участников..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid var(--border-color)',
            borderRadius: '12px',
            fontSize: '15px',
            outline: 'none',
            marginBottom: '20px',
            boxSizing: 'border-box',
            transition: 'all 0.3s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
        />

        {/* СПИСОК УЧАСТНИКОВ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredParticipants.map(participant => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              onToggleAdmin={() => toggleAdmin(participant.id)}
              onRemove={() => removeParticipant(participant.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

// КОМПОНЕНТ: Карточка участника
const ParticipantCard: React.FC<{
  participant: Participant;
  onToggleAdmin: () => void;
  onRemove: () => void;
}> = ({ participant, onToggleAdmin, onRemove }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        transition: 'all 0.3s'
      }}
      onMouseMove={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--bg-primary)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      {/* АВАТАР */}
      <div style={{
        position: 'relative',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        flexShrink: 0
      }}>
        {participant.avatar}
        {participant.isOnline && (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid white',
            boxShadow: '0 0 8px #4ade80'
          }} />
        )}
      </div>

      {/* ИНФОРМАЦИЯ */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '2px'
        }}>
          <span style={{ fontWeight: '600', fontSize: '15px' }}>
            {participant.name}
          </span>
          {participant.isAdmin && (
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              ⭐ Админ
            </span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {participant.department}
        </div>
      </div>

      {/* ДЕЙСТВИЯ */}
      {showActions && (
        <div style={{
          display: 'flex',
          gap: '8px',
          animation: 'fadeIn 0.2s'
        }}>
          <button
            onClick={onToggleAdmin}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              background: participant.isAdmin ? '#ffe6e6' : '#e3f2fd',
              color: participant.isAdmin ? '#e74c3c' : '#667eea',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={participant.isAdmin ? 'Снять права админа' : 'Сделать админом'}
          >
            {participant.isAdmin ? '⭐→' : '⭐'}
          </button>
          <button
            onClick={onRemove}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              background: '#ffe6e6',
              color: '#e74c3c',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Удалить из группы"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageParticipants;
