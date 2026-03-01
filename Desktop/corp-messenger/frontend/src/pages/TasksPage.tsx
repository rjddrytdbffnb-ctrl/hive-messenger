// src/pages/TasksPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  name: string;
  avatar: string;
  department: string;
  taskCount: number;
}

interface TaskFile {
  id: string;
  name: string;
  size: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface TaskComment {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  date: string;
  time: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToId: string;
  assignedToAvatar: string;
  assignedBy: string;
  assignedByAvatar: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  files: TaskFile[];
  comments: TaskComment[];
  isCompleted: boolean;
}

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const users: User[] = [
    { id: '1', name: 'Алексей Иванов', avatar: 'АИ', department: 'IT', taskCount: 3 },
    { id: '2', name: 'Мария Петрова', avatar: 'МП', department: 'Marketing', taskCount: 2 },
    { id: '3', name: 'Дмитрий Сидоров', avatar: 'ДС', department: 'Sales', taskCount: 1 },
    { id: '4', name: 'Елена Смирнова', avatar: 'ЕС', department: 'HR', taskCount: 4 },
  ];

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Подготовить отчет по продажам',
      description: 'Необходимо подготовить квартальный отчет по продажам для руководства. Включить графики и аналитику.',
      assignedTo: 'Мария Петрова',
      assignedToId: '2',
      assignedToAvatar: 'МП',
      assignedBy: 'Алексей Иванов',
      assignedByAvatar: 'АИ',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2024-02-20',
      createdAt: '2024-02-14 10:30',
      isCompleted: false,
      files: [
        { id: '1', name: 'Шаблон_отчета.xlsx', size: '2.3 MB', url: '#', uploadedBy: 'Алексей Иванов', uploadedAt: '14.02.2024 10:35' }
      ],
      comments: [
        { id: '1', author: 'Алексей Иванов', authorAvatar: 'АИ', text: 'Нужно сделать до конца недели', date: '14.02.2024', time: '10:35' },
      ]
    },
    {
      id: '2',
      title: 'Обновить документацию',
      description: 'Обновить техническую документацию после релиза',
      assignedTo: 'Дмитрий Сидоров',
      assignedToId: '3',
      assignedToAvatar: 'ДС',
      assignedBy: 'Вы',
      assignedByAvatar: 'ВЫ',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-02-25',
      createdAt: '2024-02-14 09:00',
      isCompleted: false,
      files: [],
      comments: []
    }
  ]);

  const filteredTasks = selectedUser ? tasks.filter(t => t.assignedToId === selectedUser.id) : [];

  const toggleCompleted = () => {
    if (!selectedTask) return;
    const updated = {
      ...selectedTask,
      isCompleted: !selectedTask.isCompleted,
      status: (!selectedTask.isCompleted ? 'completed' : 'in-progress') as Task['status']
    };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    const comment: TaskComment = {
      id: Date.now().toString(),
      author: 'Вы',
      authorAvatar: 'ВЫ',
      text: newComment,
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = { ...selectedTask, comments: [...selectedTask.comments, comment] };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    setNewComment('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const newFile: TaskFile = {
      id: Date.now().toString(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      url: URL.createObjectURL(file),
      uploadedBy: 'Вы',
      uploadedAt: new Date().toLocaleString('ru-RU')
    };

    const updated = { ...selectedTask, files: [...selectedTask.files, newFile] };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleDeleteFile = (fileId: string) => {
    if (!selectedTask) return;
    if (!window.confirm('Удалить этот файл?')) return;

    const updated = { ...selectedTask, files: selectedTask.files.filter(f => f.id !== fileId) };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'var(--bg-secondary)',
      padding: '32px 0'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>
        {/* ЗАГОЛОВОК */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              ✅ Задачи сотрудников
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              Выберите сотрудника, чтобы увидеть его задачи
            </p>
          </div>

          {/* КНОПКИ */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowRequestModal(true)}
              style={{
                padding: '14px 28px',
                border: '2px solid #667eea',
                borderRadius: '12px',
                background: 'var(--bg-primary)',
                color: '#667eea',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#667eea';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-primary)';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              📝 Заполнить заявку
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedTask ? '350px 400px 1fr' : selectedUser ? '350px 1fr' : '1fr',
          gap: '24px'
        }}>
          
          {/* ПОЛЬЗОВАТЕЛИ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              👥 Сотрудники ({users.length})
            </h3>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => { setSelectedUser(u); setSelectedTask(null); }}
                style={{
                  background: selectedUser?.id === u.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-primary)',
                  padding: '16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: selectedUser?.id === u.id ? '0 8px 24px rgba(102, 126, 234, 0.4)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: selectedUser?.id === u.id ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '16px'
                  }}>
                    {u.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: selectedUser?.id === u.id ? 'white' : 'var(--text-primary)' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '13px', color: selectedUser?.id === u.id ? 'rgba(255,255,255,0.9)' : '#7f8c8d' }}>
                      {u.department}
                    </div>
                  </div>
                  <div style={{
                    background: selectedUser?.id === u.id ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold'
                  }}>
                    {u.taskCount}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ЗАДАЧИ */}
          {selectedUser && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>📋 Задачи: {selectedUser.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Всего: {filteredTasks.length}</p>
                </div>
                <button onClick={() => { setSelectedUser(null); setSelectedTask(null); }} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-tertiary)', cursor: 'pointer' }}>✕</button>
              </div>
              {filteredTasks.map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} style={{
                  padding: '14px', borderRadius: '12px',
                  background: selectedTask?.id === task.id ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))' : 'var(--bg-secondary)',
                  border: selectedTask?.id === task.id ? '2px solid #667eea' : '2px solid transparent',
                  cursor: 'pointer', marginBottom: '12px'
                }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{task.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{task.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {task.files.length > 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📎 {task.files.length}</span>}
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>💬 {task.comments.length}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>📅 {task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ДЕТАЛИ */}
          {selectedTask && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedTask.title}</h2>
                <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>

              {/* ГАЛОЧКА */}
              <div onClick={toggleCompleted} style={{
                padding: '16px', borderRadius: '12px',
                background: selectedTask.isCompleted ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' : 'var(--bg-secondary)',
                border: selectedTask.isCompleted ? 'none' : '2px dashed #e0e0e0',
                cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: selectedTask.isCompleted ? 'rgba(255,255,255,0.3)' : 'var(--bg-card, var(--bg-primary))',
                  border: selectedTask.isCompleted ? 'none' : '2px solid #667eea',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', color: selectedTask.isCompleted ? 'white' : '#667eea'
                }}>
                  {selectedTask.isCompleted && '✓'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: selectedTask.isCompleted ? 'white' : 'var(--text-primary)' }}>
                    {selectedTask.isCompleted ? 'Задача выполнена!' : 'Отметить как выполненную'}
                  </div>
                  <div style={{ fontSize: '13px', color: selectedTask.isCompleted ? 'rgba(255,255,255,0.9)' : '#7f8c8d' }}>
                    Нажмите чтобы изменить
                  </div>
                </div>
              </div>

              {/* ОПИСАНИЕ */}
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>📄 Описание</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedTask.description}</p>
              </div>

              {/* КОММЕНТАРИИ */}
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>💬 Комментарии ({selectedTask.comments.length})</h3>
              {selectedTask.comments.map(c => (
                <div key={c.id} style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '11px', fontWeight: 'bold'
                      }}>{c.authorAvatar}</div>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{c.author}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{c.date} {c.time}</span>
                  </div>
                  <div style={{ fontSize: '14px', paddingLeft: '36px' }}>{c.text}</div>
                </div>
              ))}

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', minHeight: '80px', marginBottom: '10px', boxSizing: 'border-box' }}
              />
              <button onClick={handleAddComment} disabled={!newComment.trim()} style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
                background: newComment.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0',
                color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed'
              }}>💬 Отправить</button>
            </div>
          )}
        </div>

        {/* МОДАЛЬНОЕ ОКНО ЗАЯВКИ */}
        {showRequestModal && (
          <>
            <div onClick={() => setShowRequestModal(false)} style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)'
            }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'var(--bg-primary)', borderRadius: '20px', padding: '32px', zIndex: 1001,
              maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  📝 Заполнить заявку
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Создайте новую заявку для выполнения задачи
                </p>
              </div>

              {/* КОМУ ОТПРАВИТЬ */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Кому отправить *
                </label>
                <select style={{
                  width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0',
                  borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                  cursor: 'pointer', background: 'var(--bg-primary)'
                }}>
                  <option value="">Выберите получателя...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.department}</option>
                  ))}
                </select>
              </div>

              {/* ТЕМА ЗАЯВКИ */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Тема заявки *
                </label>
                <input type="text" placeholder="Например: Заявка на покупку оборудования" style={{
                  width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0',
                  borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>

              {/* ОПИСАНИЕ */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Описание
                </label>
                <textarea placeholder="Подробно опишите вашу заявку..." style={{
                  width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0',
                  borderRadius: '12px', fontSize: '15px', minHeight: '120px',
                  fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>

              {/* ПРИКРЕПИТЬ ФАЙЛЫ */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Прикрепить файлы
                </label>
                <label style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px',
                  border: '2px dashed #667eea',
                  borderRadius: '12px',
                  background: 'rgba(102, 126, 234, 0.05)',
                  color: '#667eea',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s'
                }}>
                  📎 Прикрепить файл
                  <input type="file" multiple style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                  Вы можете прикрепить документы, изображения или другие файлы
                </p>
              </div>

              {/* КНОПКИ */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRequestModal(false)} style={{
                  padding: '12px 24px', border: '2px solid #e0e0e0', borderRadius: '12px',
                  background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                }}>Отмена</button>
                <button onClick={() => { alert('Заявка отправлена!'); setShowRequestModal(false); }} style={{
                  padding: '12px 24px', border: 'none', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>✅ Отправить заявку</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
