// src/components/MentionInput.tsx
import React, { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  style?: React.CSSProperties;
  onSubmit?: () => void;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value, onChange, users,
  placeholder = 'Введите сообщение...',
  style, onSubmit
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    const cursorPos = e.target.selectionStart;
    const textBefore = newValue.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');
    if (lastAt !== -1) {
      const query = textBefore.slice(lastAt + 1);
      const spaceAfterAt = query.includes(' ');
      if (!spaceAfterAt) {
        setMentionQuery(query);
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (user: User) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const lastAt = textBefore.lastIndexOf('@');
    const newValue = textBefore.slice(0, lastAt) + `@${user.name} ` + textAfter;
    onChange(newValue);
    setShowMentions(false);
    setMentionQuery('');
    setTimeout(() => {
      inputRef.current?.focus();
      const pos = lastAt + user.name.length + 2;
      inputRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => (p + 1) % filteredUsers.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => (p - 1 + filteredUsers.length) % filteredUsers.length); return; }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); insertMention(filteredUsers[selectedIndex]); return; }
      if (e.key === 'Escape') { setShowMentions(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '2px solid transparent',
          borderRadius: '14px',
          fontSize: '15px',
          outline: 'none',
          resize: 'none',
          height: '48px',
          maxHeight: '150px',
          overflowY: 'auto',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          display: 'block',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(102,126,234,0.15)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* СПИСОК УПОМИНАНИЙ */}
      {showMentions && filteredUsers.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
          borderRadius: '12px', maxHeight: '200px', overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)', zIndex: 20,
          animation: 'slideUp 0.15s ease'
        }}>
          <div style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.5px' }}>
            УПОМИНАНИЯ
          </div>
          {filteredUsers.map((user, index) => (
            <div key={user.id} onClick={() => insertMention(user)} style={{
              padding: '8px 12px', cursor: 'pointer',
              background: index === selectedIndex ? 'var(--bg-hover)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; setSelectedIndex(index); }}
              onMouseLeave={e => { e.currentTarget.style.background = index === selectedIndex ? 'var(--bg-hover)' : 'transparent'; }}
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '11px', fontWeight: 'bold', flexShrink: 0
              }}>{user.avatar}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user.name}
                <span style={{ fontSize: '12px', color: '#667eea', marginLeft: '6px' }}>@{user.name.toLowerCase().replace(' ', '')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
