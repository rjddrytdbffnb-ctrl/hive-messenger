// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    department: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      department: formData.department,
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Ошибка регистрации. Попробуйте снова.');
    }

    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-primary)' }}>
          🐝 Регистрация в Hive
        </h2>

        {error && (
          <div style={{
            color: 'red', backgroundColor: '#ffe6e6', padding: '10px',
            borderRadius: '5px', marginBottom: '20px', border: '1px solid red',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Имя и Фамилия */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Имя *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Фамилия *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          {/* Юзернейм */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Имя пользователя *</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} style={inputStyle} required />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} required />
          </div>

          {/* Отдел */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Отдел *</label>
            <select name="department" value={formData.department} onChange={handleChange}
              style={{ ...inputStyle, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} required>
              <option value="">Выберите отдел</option>
              <option value="IT">IT отдел</option>
              <option value="Marketing">Маркетинг</option>
              <option value="Sales">Продажи</option>
              <option value="HR">HR</option>
              <option value="Finance">Финансы</option>
              <option value="Other">Другой</option>
            </select>
          </div>

          {/* Пароль */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Пароль *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} required />
          </div>

          {/* Подтверждение пароля */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Подтвердите пароль *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} required />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: loading ? '#90caf9' : '#1976d2',
              color: 'white', border: 'none', borderRadius: '5px',
              fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', transition: 'background 0.2s',
            }}
          >
            {loading ? '⏳ Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-primary)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>
              Войдите
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;