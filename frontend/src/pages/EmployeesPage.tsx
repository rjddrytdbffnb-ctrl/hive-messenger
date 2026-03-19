// src/pages/EmployeesPage.tsx - ПОЛНОСТЬЮ АДАПТИВНЫЙ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

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
  managerId?: string;
  role?: 'ceo' | 'manager' | 'employee';
}

type ViewMode = 'cards' | 'list' | 'tree';

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrOpenChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const saveEmployeeEdits = async (updated: Employee) => {
    try {
      const edits = JSON.parse(localStorage.getItem('corp_employee_edits') || '{}');
      edits[updated.id] = { department: updated.department, position: updated.position, role: updated.role, firstName: updated.firstName, lastName: updated.lastName, email: updated.email };
      localStorage.setItem('corp_employee_edits', JSON.stringify(edits));
    } catch {}

    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API_BASE}/api/users/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: updated.firstName,
          last_name: updated.lastName,
          email: updated.email,
          department: updated.department,
          position: updated.position,
          role: updated.role,
        })
      });
      const data = await res.json();
      console.log('Сохранение:', res.status, JSON.stringify(data));
      alert('Сохранено: ' + res.status + ' ' + JSON.stringify(data));
    } catch (err) {
      console.error('Ошибка сохранения на сервер:', err);
      alert('Ошибка: ' + err);
    }

    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    setEditingEmployee(null);
  };

  const applyEdits = (list: Employee[]): Employee[] => {
    try {
      const edits = JSON.parse(localStorage.getItem('corp_employee_edits') || '{}');
      return list.map(e => edits[e.id] ? { ...e, ...edits[e.id] } : e);
    } catch { return list; }
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('employeesViewMode');
    return (saved as ViewMode) || 'cards';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('employeesViewMode', mode);
  };

  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    try {
      const { usersAPI } = await import('../services/api');
      const response = await usersAPI.getAll();
      const rawUsers = response.data.users;

      const mapped: Employee[] = rawUsers.map((u: any) => ({
        id: String(u.id),
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        username: u.username,
        email: u.email,
        department: u.department || 'Other',
        avatar: u.avatar || `${(u.first_name||'?')[0]}${(u.last_name||'')[0]}`,
        isOnline: u.is_online || false,
        position: u.position || 'Employee',
        role: u.role || 'employee',
      }));

      setEmployees(applyEdits(mapped));
    } catch (err) {
      console.error('Ошибка загрузки сотрудников:', err);
    }
  };

  const departments = ['all', 'IT', 'Marketing', 'Sales', 'HR', 'Finance', 'Management'];

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
    createOrOpenChat({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      avatar: employee.avatar,
      isOnline: employee.isOnline
    });
    navigate('/chat');
  };

  // ОБЩИЙ СТИЛЬ АВАТАРА
  const avatarStyle = (size: string) => ({
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    aspectRatio: '1 / 1',
    flexShrink: 0,
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontWeight: '700' as const,
    color: 'white'
  });

  // РЕЖИМ: КАРТОЧКИ
  const renderCardsView = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
      gap: 'clamp(12px, 2vw, 16px)',
      width: '100%'
    }}>
      {filteredEmployees.map(employee => (
        <div
          key={employee.id}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'clamp(8px, 1.5vw, 12px)',
            padding: 'clamp(16px, 2.5vw, 20px)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            position: 'relative'
          }}
          onClick={() => handleStartChat(employee)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {employee.isOnline && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: 'clamp(10px, 1.5vw, 12px)',
              height: 'clamp(10px, 1.5vw, 12px)',
              background: '#4ade80',
              borderRadius: '50%',
              border: '2px solid var(--bg-primary)',
              boxShadow: '0 0 0 2px #4ade80',
              aspectRatio: '1 / 1',
              flexShrink: 0
            }} />
          )}

          <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 16px)', alignItems: 'start', flexWrap: 'wrap' }}>
            <div style={{
              ...avatarStyle('clamp(48px, 7vw, 56px)'),
              fontSize: 'clamp(16px, 2.5vw, 20px)'
            }}>
              {employee.avatar}
            </div>

            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(16px, 2.2vw, 18px)',
                fontWeight: '600',
                marginBottom: '4px',
                wordBreak: 'break-word'
              }}>
                {employee.firstName} {employee.lastName}
              </h3>
              
              {employee.position && (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'clamp(12px, 1.8vw, 13px)',
                  marginBottom: '8px',
                  wordBreak: 'break-word'
                }}>
                  {employee.position}
                </p>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: 'clamp(12px, 1.8vw, 13px)',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏢</span>
                  <span>{employee.department}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: 'clamp(12px, 2vw, 16px)' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartChat(employee);
              }}
              style={{
                flex: 1,
                padding: 'clamp(8px, 1.5vw, 10px)',
                background: 'var(--accent-gradient)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: 'clamp(13px, 1.8vw, 14px)',
                fontWeight: '600'
              }}
            >
              💬 Написать
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingEmployee(employee); }}
              title="Редактировать"
              style={{ width: '40px', padding: '8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >✏️</button>
          </div>
        </div>
      ))}
    </div>
  );

  // РЕЖИМ: ЛЕНТА
  const renderListView = () => (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'clamp(8px, 1.5vw, 12px)',
      overflow: 'hidden',
      width: '100%'
    }}>
      {filteredEmployees.map((employee, index) => (
        <div
          key={employee.id}
          onClick={() => handleStartChat(employee)}
          style={{
            padding: 'clamp(12px, 2vw, 16px) clamp(16px, 2.5vw, 20px)',
            cursor: 'pointer',
            borderBottom: index < filteredEmployees.length - 1 ? '1px solid var(--border-color)' : 'none',
            transition: 'background 0.2s',
            display: 'flex',
            gap: 'clamp(10px, 1.5vw, 12px)',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              ...avatarStyle('clamp(40px, 6vw, 48px)'),
              fontSize: 'clamp(14px, 2.2vw, 18px)'
            }}>
              {employee.avatar}
            </div>
            {employee.isOnline && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 'clamp(12px, 1.8vw, 14px)',
                height: 'clamp(12px, 1.8vw, 14px)',
                background: '#4ade80',
                borderRadius: '50%',
                border: '2px solid var(--bg-primary)',
                aspectRatio: '1 / 1',
                flexShrink: 0
              }} />
            )}
          </div>

          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2px',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: 'clamp(14px, 2vw, 16px)',
                fontWeight: '600',
                color: 'var(--text-primary)',
                wordBreak: 'break-word',
                flex: '1 1 auto'
              }}>
                {employee.firstName} {employee.lastName}
              </h4>
              {employee.role === 'ceo' && (
                <span style={{
                  fontSize: 'clamp(10px, 1.4vw, 11px)',
                  padding: '2px 8px',
                  background: '#f59e0b',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>CEO</span>
              )}
              {employee.role === 'manager' && (
                <span style={{
                  fontSize: 'clamp(10px, 1.4vw, 11px)',
                  padding: '2px 8px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>MANAGER</span>
              )}
            </div>
            <p style={{
              margin: 0,
              fontSize: 'clamp(12px, 1.6vw, 13px)',
              color: 'var(--text-secondary)',
              wordBreak: 'break-word'
            }}>
              {employee.position} • {employee.department}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartChat(employee);
            }}
            style={{
              padding: 'clamp(6px, 1.2vw, 8px) clamp(12px, 2vw, 16px)',
              background: 'var(--accent-gradient)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 1.6vw, 13px)',
              fontWeight: '600',
              flexShrink: 0
            }}
          >
            💬
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingEmployee(employee); }}
            title="Редактировать"
            style={{ width: '36px', height: '36px', padding: '6px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✏️</button>
        </div>
      ))}
    </div>
  );

  // РЕЖИМ: ДРЕВО ПО ОТДЕЛАМ
  const renderTreeView = () => {
    const departmentGroups: Record<string, Employee[]> = {};
    
    filteredEmployees.forEach(emp => {
      if (!departmentGroups[emp.department]) {
        departmentGroups[emp.department] = [];
      }
      departmentGroups[emp.department].push(emp);
    });

    const renderDepartment = (deptName: string, employees: Employee[]) => {
      const manager = employees.find(e => e.role === 'manager');
      const ceo = employees.find(e => e.role === 'ceo');
      const staff = employees.filter(e => e.role === 'employee');
      const leader = manager || ceo;

      return (
        <div key={deptName} style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
          <div style={{
            padding: 'clamp(12px, 2vw, 16px) clamp(16px, 2.5vw, 20px)',
            background: 'var(--accent-gradient)',
            color: 'white',
            borderRadius: 'clamp(8px, 1.5vw, 12px)',
            marginBottom: 'clamp(12px, 2vw, 16px)',
            fontSize: 'clamp(16px, 2.2vw, 18px)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            boxShadow: 'var(--shadow-md)',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: 'clamp(20px, 3vw, 24px)' }}>🏢</span>
            <span style={{ flex: '1 1 auto' }}>{deptName}</span>
            <span style={{
              fontSize: 'clamp(12px, 1.6vw, 14px)',
              background: 'rgba(255,255,255,0.2)',
              padding: '4px 12px',
              borderRadius: '12px',
              whiteSpace: 'nowrap'
            }}>
              {employees.length} чел.
            </span>
          </div>

          {leader && (
            <div style={{ marginBottom: '12px' }}>
              <div
                onClick={() => handleStartChat(leader)}
                style={{
                  padding: 'clamp(12px, 2vw, 16px) clamp(16px, 2.5vw, 20px)',
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: 'clamp(8px, 1.5vw, 12px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  gap: 'clamp(12px, 2vw, 16px)',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  flexWrap: 'wrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    ...avatarStyle('clamp(48px, 7vw, 56px)'),
                    fontSize: 'clamp(16px, 2.5vw, 20px)'
                  }}>
                    {leader.avatar}
                  </div>
                  {leader.isOnline && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 'clamp(14px, 2vw, 16px)',
                      height: 'clamp(14px, 2vw, 16px)',
                      background: '#4ade80',
                      borderRadius: '50%',
                      border: '3px solid var(--bg-primary)',
                      aspectRatio: '1 / 1',
                      flexShrink: 0
                    }} />
                  )}
                </div>

                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: 'clamp(16px, 2.2vw, 18px)',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word'
                    }}>
                      {leader.firstName} {leader.lastName}
                    </h3>
                    {leader.role === 'ceo' && <span style={{ fontSize: 'clamp(16px, 2.5vw, 20px)' }}>👑</span>}
                    {leader.role === 'manager' && <span style={{ fontSize: 'clamp(16px, 2.5vw, 20px)' }}>⭐</span>}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: 'clamp(13px, 1.8vw, 15px)',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    wordBreak: 'break-word'
                  }}>
                    {leader.position}
                  </p>
                  {(leader.role === 'ceo' || leader.role === 'manager') && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: 'clamp(10px, 1.4vw, 11px)',
                      padding: '3px 10px',
                      background: leader.role === 'ceo' ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      borderRadius: '10px',
                      fontWeight: '700'
                    }}>
                      {leader.role === 'ceo' ? 'CEO' : 'РУКОВОДИТЕЛЬ'}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartChat(leader);
                  }}
                  style={{
                    padding: 'clamp(8px, 1.5vw, 10px) clamp(16px, 2.5vw, 20px)',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(12px, 1.8vw, 14px)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  💬 Написать
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingEmployee(leader); }}
                  title="Редактировать"
                  style={{ width: '38px', height: '38px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >✏️</button>
              </div>
            </div>
          )}

          {staff.length > 0 && (
            <div style={{
              marginLeft: 'clamp(20px, 4vw, 40px)',
              borderLeft: '3px solid var(--border-color)',
              paddingLeft: 'clamp(12px, 2.5vw, 20px)',
              position: 'relative'
            }}>
              {staff.map((employee, index) => (
                <div
                  key={employee.id}
                  onClick={() => handleStartChat(employee)}
                  style={{
                    padding: 'clamp(10px, 1.8vw, 14px) clamp(12px, 2vw, 16px)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'clamp(8px, 1.2vw, 10px)',
                    marginBottom: index < staff.length - 1 ? '10px' : '0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    gap: 'clamp(10px, 1.5vw, 12px)',
                    alignItems: 'center',
                    position: 'relative',
                    flexWrap: 'wrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.background = 'var(--bg-primary)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: 'clamp(-12px, -2.5vw, -20px)',
                    top: '50%',
                    width: 'clamp(12px, 2.5vw, 20px)',
                    height: '2px',
                    background: 'var(--border-color)'
                  }} />

                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      ...avatarStyle('clamp(36px, 5.5vw, 44px)'),
                      fontSize: 'clamp(14px, 2vw, 16px)'
                    }}>
                      {employee.avatar}
                    </div>
                    {employee.isOnline && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 'clamp(11px, 1.6vw, 13px)',
                        height: 'clamp(11px, 1.6vw, 13px)',
                        background: '#4ade80',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-primary)',
                        aspectRatio: '1 / 1',
                        flexShrink: 0
                      }} />
                    )}
                  </div>

                  <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: 'clamp(14px, 2vw, 16px)',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                      wordBreak: 'break-word'
                    }}>
                      {employee.firstName} {employee.lastName}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: 'clamp(12px, 1.6vw, 13px)',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-word'
                    }}>
                      {employee.position}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(employee);
                    }}
                    style={{
                      padding: 'clamp(5px, 1vw, 6px) clamp(10px, 1.8vw, 14px)',
                      background: 'var(--accent-gradient)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: 'clamp(12px, 1.6vw, 13px)',
                      fontWeight: '600',
                      flexShrink: 0
                    }}
                  >
                    💬
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingEmployee(employee); }}
                    title="Редактировать"
                    style={{ width: '32px', height: '32px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >✏️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        {Object.entries(departmentGroups)
          .sort(([a], [b]) => {
            if (a === 'Management') return -1;
            if (b === 'Management') return 1;
            return a.localeCompare(b);
          })
          .map(([dept, emps]) => renderDepartment(dept, emps))}
      </div>
    );
  };

  return (
    <>
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'var(--bg-secondary)',
      padding: 'clamp(16px, 4vw, 32px) 0'
    }}>
      <div style={{ 
        width: '100%',
        padding: '0 clamp(16px, 3vw, 24px)',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: 'clamp(20px, 3vw, 32px)' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            flexWrap: 'wrap'
          }}>
            👥 Сотрудники
            <span style={{
              background: 'var(--accent-gradient)',
              color: 'white',
              borderRadius: '20px',
              padding: '4px clamp(12px, 2vw, 16px)',
              fontSize: 'clamp(14px, 2.2vw, 18px)',
              fontWeight: '600'
            }}>
              {filteredEmployees.length}
            </span>
          </h1>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'clamp(8px, 1.5vw, 12px)',
          padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
          marginBottom: 'clamp(16px, 2.5vw, 24px)',
          display: 'flex',
          gap: 'clamp(8px, 1.5vw, 12px)',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: 'clamp(13px, 1.8vw, 14px)',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}>
            Режим:
          </span>

          <button
            onClick={() => handleViewModeChange('cards')}
            style={{
              padding: 'clamp(6px, 1.2vw, 8px) clamp(12px, 2vw, 16px)',
              background: viewMode === 'cards' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: viewMode === 'cards' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 1.8vw, 14px)',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            📋 Карточки
          </button>

          <button
            onClick={() => handleViewModeChange('list')}
            style={{
              padding: 'clamp(6px, 1.2vw, 8px) clamp(12px, 2vw, 16px)',
              background: viewMode === 'list' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 1.8vw, 14px)',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            📱 Лента
          </button>

          <button
            onClick={() => handleViewModeChange('tree')}
            style={{
              padding: 'clamp(6px, 1.2vw, 8px) clamp(12px, 2vw, 16px)',
              background: viewMode === 'tree' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: viewMode === 'tree' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 1.8vw, 14px)',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            🌳 Древо
          </button>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'clamp(8px, 1.5vw, 12px)',
          padding: 'clamp(16px, 3vw, 24px)',
          marginBottom: 'clamp(16px, 2.5vw, 24px)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ marginBottom: 'clamp(12px, 2vw, 16px)' }}>
            <input
              type="text"
              placeholder="🔍 Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: 'clamp(10px, 1.8vw, 14px) clamp(12px, 2vw, 16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: 'clamp(13px, 1.8vw, 15px)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setFilterDepartment(dept)}
                style={{
                  padding: 'clamp(6px, 1.2vw, 8px) clamp(12px, 2vw, 16px)',
                  background: filterDepartment === dept ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                  color: filterDepartment === dept ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: 'clamp(12px, 1.6vw, 14px)',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
              >
                {dept === 'all' ? 'Все' : dept}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'cards' && renderCardsView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'tree' && renderTreeView()}
      </div>
    </div>

    {editingEmployee && (
      <EditEmployeeModal
        employee={editingEmployee!}
        onClose={() => setEditingEmployee(null)}
        onSave={saveEmployeeEdits}
      />
    )}
    </>
  );
};

// ─── МОДАЛ РЕДАКТИРОВАНИЯ СОТРУДНИКА ─────────────────────────────────────
const DEPARTMENTS = ['IT', 'Marketing', 'Sales', 'HR', 'Finance', 'Management'];

const EditEmployeeModal: React.FC<{
  employee: Employee;
  onClose: () => void;
  onSave: (emp: Employee) => void;
}> = ({ employee, onClose, onSave }) => {
  const [firstName, setFirstName]   = useState(employee.firstName);
  const [lastName,  setLastName]    = useState(employee.lastName);
  const [email,     setEmail]       = useState(employee.email);
  const [department, setDepartment] = useState(employee.department);
  const [position,  setPosition]    = useState(employee.position || '');
  const [role,      setRole]        = useState<Employee['role']>(employee.role || 'employee');

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-color)',
    borderRadius: '9px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'border-color 0.2s'
  };
  const lbl = (t: string) => (
    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '6px' }}>{t}</div>
  );

  const newAvatar = `${firstName[0] || '?'}${lastName[0] || '?'}`.toUpperCase();

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-primary)', borderRadius: '20px', zIndex: 1001, maxWidth: '480px', width: '92%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
        {/* Шапка */}
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white' }}>{newAvatar}</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>Редактировать сотрудника</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{employee.firstName} {employee.lastName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Имя / Фамилия */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              {lbl('Имя')}
              <input value={firstName} onChange={e => setFirstName(e.target.value)} style={fieldStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <div>
              {lbl('Фамилия')}
              <input value={lastName} onChange={e => setLastName(e.target.value)} style={fieldStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            {lbl('Email')}
            <input value={email} onChange={e => setEmail(e.target.value)} style={fieldStyle}
              onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Отдел */}
          <div>
            {lbl('Отдел')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {DEPARTMENTS.map(d => (
                <button key={d} onClick={() => setDepartment(d)} style={{ padding: '8px', borderRadius: '9px', border: department === d ? '2px solid #667eea' : '1.5px solid var(--border-color)', background: department === d ? 'rgba(102,126,234,0.1)' : 'var(--bg-secondary)', color: department === d ? '#667eea' : 'var(--text-secondary)', fontSize: '13px', fontWeight: department === d ? '700' : '500', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Должность */}
          <div>
            {lbl('Должность')}
            <input value={position} onChange={e => setPosition(e.target.value)} placeholder="Например: Senior Developer" style={fieldStyle}
              onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Роль */}
          <div>
            {lbl('Роль в компании')}
            <div style={{ display: 'flex', gap: '8px' }}>
              {([['employee','👤','Сотрудник'],['manager','👔','Менеджер'],['ceo','👑','CEO']] as const).map(([key, icon, label]) => (
                <button key={key} onClick={() => setRole(key as Employee['role'])} style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: role === key ? '2px solid #667eea' : '1.5px solid var(--border-color)', background: role === key ? 'rgba(102,126,234,0.1)' : 'var(--bg-secondary)', color: role === key ? '#667eea' : 'var(--text-secondary)', fontSize: '12px', fontWeight: role === key ? '700' : '500', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '18px', marginBottom: '3px' }}>{icon}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Отмена</button>
            <button onClick={() => onSave({ ...employee, firstName, lastName, email, department, position, role, avatar: newAvatar })}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }}>
              💾 Сохранить изменения
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeesPage;