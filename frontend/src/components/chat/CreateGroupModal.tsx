// src/components/chat/CreateGroupModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, participants: string[]) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Моковые пользователи для выбора
  const availableUsers = [
    { id: '1', name: 'Алексей Иванов', department: 'IT', avatar: 'АИ' },
    { id: '2', name: 'Мария Петрова', department: 'Marketing', avatar: 'МП' },
    { id: '3', name: 'Дмитрий Сидоров', department: 'Sales', avatar: 'ДС' },
    { id: '4', name: 'Елена Смирнова', department: 'HR', avatar: 'ЕС' },
    { id: '5', name: 'Иван Козлов', department: 'IT', avatar: 'ИК' },
  ];

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      onCreateGroup(groupName, selectedUsers);
      setGroupName('');
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ЗАТЕМНЕНИЕ ФОНА */}
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
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            👥 Создать группу
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Введите название группы и выберите участников
          </p>
        </div>

        {/* НАЗВАНИЕ ГРУППЫ */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Название группы
          </label>
          <input
            type="text"
            placeholder="Например: Команда разработки"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.3s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* ПОИСК УЧАСТНИКОВ */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Добавить участников ({selectedUsers.length})
          </label>
          <input
            type="text"
            placeholder="🔍 Поиск по имени или отделу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.3s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* ВЫБРАННЫЕ ПОЛЬЗОВАТЕЛИ */}
        {selectedUsers.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px'
          }}>
            {selectedUsers.map(userId => {
              const user = availableUsers.find(u => u.id === userId);
              return user ? (
                <div
                  key={userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <span>{user.name}</span>
                  <button
                    onClick={() => toggleUser(userId)}
                    style={{
                      background: 'rgba(255,255,255,0.3)',
                      border: 'none',
                      color: 'white',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* СПИСОК ПОЛЬЗОВАТЕЛЕЙ */}
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          marginBottom: '24px'
        }}>
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => toggleUser(user.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedUsers.includes(user.id)
                  ? 'rgba(102, 126, 234, 0.1)'
                  : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!selectedUsers.includes(user.id)) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedUsers.includes(user.id)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Аватар */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {user.avatar}
              </div>

              {/* Инфо */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {user.department}
                </div>
              </div>

              {/* Чекбокс */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: selectedUsers.includes(user.id)
                  ? 'none'
                  : '2px solid #ddd',
                background: selectedUsers.includes(user.id)
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {selectedUsers.includes(user.id) && '✓'}
              </div>
            </div>
          ))}
        </div>

        {/* КНОПКИ */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
          >
            Отмена
          </button>

          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              background: (groupName.trim() && selectedUsers.length > 0)
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#ddd',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: (groupName.trim() && selectedUsers.length > 0) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              boxShadow: (groupName.trim() && selectedUsers.length > 0)
                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (groupName.trim() && selectedUsers.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (groupName.trim() && selectedUsers.length > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            Создать группу
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateGroupModal;
