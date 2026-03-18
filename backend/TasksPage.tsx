// src/pages/TasksPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, usersAPI } from '../services/api';

interface ApiUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  department: string;
  avatar?: string;
}

interface TaskComment {
  id: string;
  text: string;
  created_at: string;
  author: ApiUser;
}

interface TaskFile {
  id: string;
  original_name: string;
  size: number;
  url: string;
  created_at: string;
  uploader: ApiUser;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  assigned_user: ApiUser | null;
  creator: ApiUser | null;
  assigned_to: string | null;
  created_by: string | null;
}

const priorityLabel: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
const priorityColor: Record<string, string> = { low: '#27ae60', medium: '#f39c12', high: '#e74c3c' };
const statusLabel: Record<string, string> = { pending: 'Ожидает', in_progress: 'В работе', done: 'Выполнено', cancelled: 'Отменено' };
const statusColor: Record<string, string> = { pending: '#95a5a6', in_progress: '#3498db', done: '#27ae60', cancelled: '#e74c3c' };

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

function userDisplayName(u: ApiUser | null | undefined): string {
  if (!u) return 'Неизвестно';
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return name || u.username;
}

function userInitials(u: ApiUser | null | undefined): string {
  if (!u) return '?';
  if (u.first_name && u.last_name) return u.first_name[0] + u.last_name[0];
  return u.username.slice(0, 2).toUpperCase();
}

const TasksPage: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: '',
    due_date: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        tasksAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setTasks(tasksRes.data.tasks ?? []);
      setUsers(usersRes.data.users ?? []);
    } catch (err: any) {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedTask) return;
    setLoadingComments(true);
    setComments([]);
    setFiles([]);
    Promise.all([
      tasksAPI.getComments(selectedTask.id),
      tasksAPI.getFiles(selectedTask.id),
    ])
      .then(([commentsRes, filesRes]) => {
        setComments(commentsRes.data.comments ?? []);
        setFiles(filesRes.data.files ?? []);
      })
      .finally(() => setLoadingComments(false));
  }, [selectedTask?.id]);

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setNewComment('');
  };

  const handleToggleStatus = async () => {
    if (!selectedTask) return;
    const newStatus = selectedTask.status === 'done' ? 'in_progress' : 'done';
    try {
      const res = await tasksAPI.update(selectedTask.id, { status: newStatus });
      const updated = res.data.task;
      setTasks(prev => prev.map(t => t.id === String(updated.id) ? { ...t, ...updated, id: String(updated.id) } : t));
      setSelectedTask(prev => prev ? { ...prev, ...updated, id: String(updated.id) } : null);
    } catch {
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    setSubmittingComment(true);
    try {
      const res = await tasksAPI.addComment(selectedTask.id, newComment.trim());
      setComments(prev => [...prev, res.data.comment]);
      setNewComment('');
    } catch {
      alert('Ошибка при добавлении комментария');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!selectedTask || !window.confirm('Удалить файл?')) return;
    try {
      await tasksAPI.deleteFile(selectedTask.id, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch {
      alert('Ошибка при удалении файла');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setSubmittingCreate(true);
    try {
      const res = await tasksAPI.create({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        priority: createForm.priority,
        assigned_to: createForm.assigned_to || undefined,
        due_date: createForm.due_date || undefined,
      });
      const newTask = { ...res.data.task, id: String(res.data.task.id) };
      setTasks(prev => [newTask, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
    } catch {
      alert('Ошибка при создании задачи');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const usersWithTasks = users.filter(u =>
    tasks.some(t => String(t.assigned_to) === String(u.id))
  );
  const myCreatedTasks = tasks.filter(t => String(t.created_by) === String(user?.id));
  const filteredTasks = selectedUserId && selectedUserId !== '__mine__'
    ? tasks.filter(t => String(t.assigned_to) === selectedUserId)
    : selectedUserId === '__mine__' ? myCreatedTasks : [];

  const gridCols = selectedTask ? '300px 360px 1fr' : selectedUserId ? '300px 1fr' : '1fr';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>⏳ Загрузка задач...</div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', gap: '16px' }}>
      <div style={{ fontSize: '18px', color: '#e74c3c' }}>❌ {error}</div>
      <button onClick={fetchData} style={{ padding: '10px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Попробовать снова</button>
    </div>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--bg-secondary)', padding: '32px 0' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>✅ Задачи сотрудников</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              Всего: {tasks.length} · Выполнено: {tasks.filter(t => t.status === 'done').length}
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{
            padding: '14px 28px', border: 'none', borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
          }}>➕ Создать задачу</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '24px' }}>

          {/* СОТРУДНИКИ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              👥 Сотрудники ({usersWithTasks.length})
            </h3>

            {myCreatedTasks.length > 0 && (
              <div onClick={() => { setSelectedUserId('__mine__'); setSelectedTask(null); }} style={{
                background: selectedUserId === '__mine__' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-primary)',
                padding: '16px', borderRadius: '16px', cursor: 'pointer',
                boxShadow: selectedUserId === '__mine__' ? '0 8px 24px rgba(102,126,234,0.4)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>⭐</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: selectedUserId === '__mine__' ? 'white' : 'var(--text-primary)' }}>Мои задачи (создал я)</div>
                    <div style={{ fontSize: '13px', color: selectedUserId === '__mine__' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>{myCreatedTasks.filter(t => t.status !== 'done').length} активных</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.25)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>{myCreatedTasks.length}</div>
                </div>
              </div>
            )}

            {usersWithTasks.map(u => {
              const count = tasks.filter(t => String(t.assigned_to) === String(u.id)).length;
              const activeCount = tasks.filter(t => String(t.assigned_to) === String(u.id) && t.status !== 'done').length;
              const isSel = selectedUserId === String(u.id);
              return (
                <div key={u.id} onClick={() => { setSelectedUserId(String(u.id)); setSelectedTask(null); }} style={{
                  background: isSel ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-primary)',
                  padding: '16px', borderRadius: '16px', cursor: 'pointer',
                  boxShadow: isSel ? '0 8px 24px rgba(102,126,234,0.4)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #f093fb, #f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{userInitials(u)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: isSel ? 'white' : 'var(--text-primary)' }}>{userDisplayName(u)}</div>
                      <div style={{ fontSize: '13px', color: isSel ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>{u.department} · {activeCount} активных</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.25)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>{count}</div>
                  </div>
                </div>
              );
            })}

            {usersWithTasks.length === 0 && myCreatedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderRadius: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <div>Задач пока нет</div>
              </div>
            )}
          </div>

          {/* ЗАДАЧИ */}
          {selectedUserId && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    📋 {selectedUserId === '__mine__' ? 'Мои задачи' : `Задачи: ${userDisplayName(users.find(u => String(u.id) === selectedUserId) ?? null)}`}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Всего: {filteredTasks.length}</p>
                </div>
                <button onClick={() => { setSelectedUserId(null); setSelectedTask(null); }} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-tertiary)' }}>✕</button>
              </div>

              {filteredTasks.map(task => {
                const isSel = selectedTask?.id === task.id;
                return (
                  <div key={task.id} onClick={() => handleSelectTask(task)} style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer', marginBottom: '12px',
                    background: isSel ? 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))' : 'var(--bg-secondary)',
                    border: isSel ? '2px solid #667eea' : '2px solid transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                        {task.status === 'done' && '✅ '}{task.title}
                      </h4>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', background: priorityColor[task.priority] + '22', color: priorityColor[task.priority], marginLeft: '8px' }}>
                        {priorityLabel[task.priority]}
                      </span>
                    </div>
                    {task.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                        {task.description.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', background: statusColor[task.status] + '22', color: statusColor[task.status] }}>
                        {statusLabel[task.status] ?? task.status}
                      </span>
                      {task.due_date && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>📅 {new Date(task.due_date).toLocaleDateString('ru-RU')}</span>}
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Задач нет</div>
              )}
            </div>
          )}

          {/* ДЕТАЛИ */}
          {selectedTask && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', flex: 1 }}>{selectedTask.title}</h2>
                <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>

              <div onClick={handleToggleStatus} style={{
                padding: '16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px',
                background: selectedTask.status === 'done' ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'var(--bg-secondary)',
                border: selectedTask.status === 'done' ? 'none' : '2px dashed #e0e0e0',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: selectedTask.status === 'done' ? 'rgba(255,255,255,0.3)' : 'var(--bg-primary)', border: selectedTask.status === 'done' ? 'none' : '2px solid #667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: selectedTask.status === 'done' ? 'white' : '#667eea' }}>
                  {selectedTask.status === 'done' && '✓'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: selectedTask.status === 'done' ? 'white' : 'var(--text-primary)' }}>
                    {selectedTask.status === 'done' ? 'Задача выполнена!' : 'Отметить как выполненную'}
                  </div>
                  <div style={{ fontSize: '13px', color: selectedTask.status === 'done' ? 'rgba(255,255,255,0.9)' : '#7f8c8d' }}>Нажмите чтобы изменить</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  ['Статус', <span style={{ color: statusColor[selectedTask.status], fontWeight: '700' }}>{statusLabel[selectedTask.status]}</span>],
                  ['Приоритет', <span style={{ color: priorityColor[selectedTask.priority], fontWeight: '700' }}>{priorityLabel[selectedTask.priority]}</span>],
                  ['Назначено', userDisplayName(selectedTask.assigned_user)],
                  ['Создал', userDisplayName(selectedTask.creator)],
                  selectedTask.due_date ? ['Срок', new Date(selectedTask.due_date).toLocaleDateString('ru-RU')] : null,
                  ['Создано', timeAgo(selectedTask.created_at)],
                ].filter(Boolean).map(([label, value]: any, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {selectedTask.description && (
                <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>📄 Описание</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{selectedTask.description}</p>
                </div>
              )}

              {files.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>📎 Файлы ({files.length})</h3>
                  {files.map(f => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{f.original_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatSize(f.size)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={f.url} download style={{ padding: '6px 10px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '12px' }}>⬇️</a>
                        <button onClick={() => handleDeleteFile(f.id)} style={{ padding: '6px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>
                💬 Комментарии ({loadingComments ? '...' : comments.length})
              </h3>

              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Загрузка...</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ marginBottom: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{userInitials(c.author)}</div>
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>{userDisplayName(c.author)}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '13px', paddingLeft: '36px', lineHeight: '1.5' }}>{c.text}</div>
                  </div>
                ))
              )}

              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleAddComment(); }}
                placeholder="Комментарий... (Ctrl+Enter)"
                style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', minHeight: '72px', marginBottom: '8px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              <button onClick={handleAddComment} disabled={!newComment.trim() || submittingComment} style={{
                width: '100%', padding: '10px', border: 'none', borderRadius: '10px',
                background: newComment.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e0e0e0',
                color: 'white', fontSize: '14px', fontWeight: '600',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed'
              }}>
                {submittingComment ? '⏳ Отправка...' : '💬 Отправить'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛ СОЗДАТЬ */}
      {showCreateModal && (
        <>
          <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-primary)', borderRadius: '20px', padding: '32px', zIndex: 1001, maxWidth: '540px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>➕ Создать задачу</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Название *</label>
              <input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="Введите название" style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Описание</label>
              <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Описание задачи..." style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', minHeight: '90px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Приоритет</label>
                <select value={createForm.priority} onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value as any }))} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <option value="low">🟢 Низкий</option>
                  <option value="medium">🟡 Средний</option>
                  <option value="high">🔴 Высокий</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Срок</label>
                <input type="date" value={createForm.due_date} onChange={e => setCreateForm(p => ({ ...p, due_date: e.target.value }))} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Назначить сотруднику</label>
              <select value={createForm.assigned_to} onChange={e => setCreateForm(p => ({ ...p, assigned_to: e.target.value }))} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <option value="">— Не назначено —</option>
                {users.map(u => <option key={u.id} value={String(u.id)}>{userDisplayName(u)} · {u.department}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '12px 24px', border: '2px solid #e0e0e0', borderRadius: '12px', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Отмена</button>
              <button onClick={handleCreateTask} disabled={!createForm.title.trim() || submittingCreate} style={{
                padding: '12px 24px', border: 'none', borderRadius: '12px',
                background: createForm.title.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e0e0e0',
                color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: createForm.title.trim() ? 'pointer' : 'not-allowed'
              }}>
                {submittingCreate ? '⏳...' : '✅ Создать'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TasksPage;
