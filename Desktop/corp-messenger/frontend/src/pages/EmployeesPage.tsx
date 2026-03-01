// src/pages/EmployeesPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  department: string;
  avatar: string;
  isOnline: boolean;
  position?: string;
}

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  // Моковые данные сотрудников
  const [employees] = useState<Employee[]>([
    { id: '1', firstName: 'Алексей', lastName: 'Иванов', username: 'aivanov', email: 'aivanov@company.com', department: 'IT', avatar: 'АИ', isOnline: true, position: 'Senior Developer' },
    { id: '2', firstName: 'Мария', lastName: 'Петрова', username: 'mpetro', email: 'mpetro@company.com', department: 'Marketing', avatar: 'МП', isOnline: true, position: 'Marketing Manager' },
    { id: '3', firstName: 'Дмитрий', lastName: 'Сидоров', username: 'dsidorov', email: 'dsidorov@company.com', department: 'Sales', avatar: 'ДС', isOnline: false, position: 'Sales Manager' },
    { id: '4', firstName: 'Елена', lastName: 'Смирнова', username: 'esmirno', email: 'esmirno@company.com', department: 'HR', avatar: 'ЕС', isOnline: true, position: 'HR Specialist' },
    { id: '5', firstName: 'Иван', lastName: 'Козлов', username: 'ikozlov', email: 'ikozlov@company.com', department: 'IT', avatar: 'ИК', isOnline: false, position: 'Backend Developer' },
    { id: '6', firstName: 'Ольга', lastName: 'Новикова', username: 'onovikova', email: 'onovikova@company.com', department: 'Finance', avatar: 'ОН', isOnline: true, position: 'Accountant' },
    { id: '7', firstName: 'Андрей', lastName: 'Волков', username: 'avolkov', email: 'avolkov@company.com', department: 'IT', avatar: 'АВ', isOnline: true, position: 'DevOps Engineer' },
    { id: '8', firstName: 'Светлана', lastName: 'Морозова', username: 'smorozova', email: 'smorozova@company.com', department: 'Marketing', avatar: 'СМ', isOnline: false, position: 'Content Manager' },
  ]);

  const departments = ['all', 'IT', 'Marketing', 'Sales', 'HR', 'Finance'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const handleStartChat = (employee: Employee) => {
  // Переход на чат с параметром ID сотрудника
  navigate('/chat', { 
    state: { 
      startChatWith: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        avatar: employee.avatar,
        isOnline: employee.isOnline
      }
    } 
  });
};

  return (
    <div 
      className="fade-in"
      style={{
        minHeight: 'calc(100vh - 70px)',
        background: 'var(--bg-secondary)',
        padding: '32px 0'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* ЗАГОЛОВОК */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            👥 Сотрудники
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
            Найдите коллег и начните общение
          </p>
        </div>

        {/* ПОИСК И ФИЛЬТРЫ */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Поиск */}
          <input
            type="text"
            placeholder="🔍 Поиск по имени, email, отделу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
              padding: '14px 20px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />

          {/* Фильтр по отделу */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{
              padding: '14px 20px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            <option value="all">Все отделы</option>
            {departments.filter(d => d !== 'all').map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* СТАТИСТИКА */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <StatCard
            icon="👥"
            label="Всего сотрудников"
            value={employees.length}
            color="var(--accent-primary)"
          />
          <StatCard
            icon="🟢"
            label="Онлайн"
            value={employees.filter(e => e.isOnline).length}
            color="var(--success)"
          />
          <StatCard
            icon="📊"
            label="Отделов"
            value={departments.length - 1}
            color="var(--info)"
          />
          <StatCard
            icon="🔍"
            label="Найдено"
            value={filteredEmployees.length}
            color="var(--warning)"
          />
        </div>

        {/* СПИСОК СОТРУДНИКОВ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredEmployees.map(employee => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onStartChat={() => handleStartChat(employee)}
            />
          ))}
        </div>

        {/* Если никого не найдено */}
        {filteredEmployees.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Никого не найдено</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

// КОМПОНЕНТ: Карточка статистики
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => {
  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.3s'
    }}
    className="hover-lift">
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          lineHeight: '1'
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginTop: '4px'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
};

// КОМПОНЕНТ: Карточка сотрудника
const EmployeeCard: React.FC<{
  employee: Employee;
  onStartChat: () => void;
}> = ({ employee, onStartChat }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s',
        border: '2px solid var(--border-color)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-color)'
      }}
    >
      {/* Аватар и статус */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {employee.avatar}
          </div>
          {employee.isOnline && (
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'var(--success)',
              border: '3px solid var(--bg-primary)',
              boxShadow: '0 0 8px var(--success)'
            }} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '4px'
          }}>
            {employee.firstName} {employee.lastName}
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            @{employee.username}
          </div>
        </div>
      </div>

      {/* Информация */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <InfoRow icon="💼" text={employee.position || 'Сотрудник'} />
        <InfoRow icon="🏢" text={employee.department} />
        <InfoRow icon="📧" text={employee.email} />
      </div>

      {/* Кнопка написать */}
      <button
        onClick={onStartChat}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '10px',
          background: isHovered ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
          color: isHovered ? 'white' : 'var(--text-primary)',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        💬 Написать сообщение
      </button>
    </div>
  );
};

// КОМПОНЕНТ: Строка информации
const InfoRow: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: 'var(--text-secondary)'
    }}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
};

export default EmployeesPage;
