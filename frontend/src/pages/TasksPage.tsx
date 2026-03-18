// src/pages/TasksPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../context/ChatContext';

interface TaskUser {
  id: string;
  name: string;
  avatar: string;
  department: string;
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
  assignedById: string;
  assignedByAvatar: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  files: TaskFile[];
  comments: TaskComment[];
  isCompleted: boolean;
}

const PRIORITY_CONFIG = {
  high:   { label: 'Высокий', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  medium: { label: 'Средний', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  low:    { label: 'Низкий',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

const STATUS_CONFIG = {
  'pending':     { label: 'Ожидает',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  'in-progress': { label: 'В работе',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  'completed':   { label: 'Выполнено', color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  'cancelled':   { label: 'Отменено',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
};

const EXECUTORS: TaskUser[] = [
  { id: 'exec_1', name: 'Алексей Иванов',  avatar: 'АИ', department: 'IT' },
  { id: 'exec_2', name: 'Мария Петрова',   avatar: 'МП', department: 'IT' },
  { id: 'exec_3', name: 'Дмитрий Сидоров', avatar: 'ДС', department: 'IT' },
  { id: 'exec_4', name: 'Елена Смирнова',  avatar: 'ЕС', department: 'IT' },
];

const DEPT_COLORS: Record<string, string> = {
  IT: '#6366f1', Marketing: '#ec4899', Sales: '#f59e0b', HR: '#10b981',
  Finance: '#3b82f6', Management: '#8b5cf6', Other: '#6b7280',
};

const INITIAL_TASKS: Task[] = [
  {
    id: 'task_1',
    title: 'Подготовить отчет по продажам',
    description: 'Квартальный отчет по продажам для руководства с графиками и аналитикой.',
    assignedTo: 'Алексей Иванов', assignedToId: 'exec_1', assignedToAvatar: 'АИ',
    assignedBy: 'Демо Пользователь', assignedById: '1', assignedByAvatar: 'ДП',
    status: 'in-progress', priority: 'high',
    dueDate: '2024-03-01', createdAt: '2024-02-14 10:30', isCompleted: false,
    files: [{ id: 'f1', name: 'Шаблон_отчета.xlsx', size: '2.3 MB', url: '#', uploadedBy: 'Демо Пользователь', uploadedAt: '14.02.2024' }],
    comments: [{ id: 'c1', author: 'Демо Пользователь', authorAvatar: 'ДП', text: 'Нужно сделать до конца недели', date: '14.02.2024', time: '10:35' }]
  },
  {
    id: 'task_2',
    title: 'Обновить документацию API',
    description: 'Обновить техническую документацию после последнего релиза.',
    assignedTo: 'Мария Петрова', assignedToId: 'exec_2', assignedToAvatar: 'МП',
    assignedBy: 'Демо Пользователь', assignedById: '1', assignedByAvatar: 'ДП',
    status: 'pending', priority: 'medium',
    dueDate: '2024-03-10', createdAt: '2024-02-15 09:00', isCompleted: false,
    files: [], comments: []
  },
];

function loadTasks(): Task[] {
  try {
    const s = localStorage.getItem('corp_tasks');
    return s ? JSON.parse(s) : INITIAL_TASKS;
  } catch { return INITIAL_TASKS; }
}
function saveTasks(tasks: Task[]) {
  try { localStorage.setItem('corp_tasks', JSON.stringify(tasks)); } catch {}
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────
const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const myName = user ? `${user.firstName} ${user.lastName}` : 'Вы';
  const myAvatar = user ? `${user.firstName[0]}${user.lastName[0]}` : 'ВЫ';
  const myId = user?.id || '1';

  const [view, setView] = useState<'my' | 'inbox'>('my');
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [selectedExecutor, setSelectedExecutor] = useState<TaskUser | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find(t => t.id === selectedTask.id);
      if (fresh) setSelectedTask(fresh);
    }
  }, [tasks]);

  const setTasksAndSync = (updater: (prev: Task[]) => Task[]) => {
    setTasks(prev => { const next = updater(prev); saveTasks(next); return next; });
  };

  const updateTask = (updated: Task) => {
    setTasksAndSync(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const myCreatedTasks = tasks.filter(t => t.assignedById === myId);
  const inboxTasks = tasks.filter(t => t.assignedTo === myName && t.assignedById !== myId);

  const executorsWithTasks = EXECUTORS.map(e => ({
    ...e,
    taskCount: myCreatedTasks.filter(t => t.assignedToId === e.id).length,
  }));
  const filteredByExecutor = selectedExecutor
    ? myCreatedTasks.filter(t => t.assignedToId === selectedExecutor.id)
    : [];

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    const comment: TaskComment = {
      id: Date.now().toString(),
      author: myName, authorAvatar: myAvatar,
      text: newComment,
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    updateTask({ ...selectedTask, comments: [...selectedTask.comments, comment] });
    setNewComment('');
  };

  const handleStatusChange = (status: Task['status']) => {
    if (!selectedTask) return;
    updateTask({ ...selectedTask, status, isCompleted: status === 'completed' });
  };

  const handleDeleteTask = () => {
    if (!selectedTask || !window.confirm('Удалить заявку?')) return;
    setTasksAndSync(prev => prev.filter(t => t.id !== selectedTask.id));
    setSelectedTask(null);
  };

  const handleDeleteFile = (fileId: string) => {
    if (!selectedTask || !window.confirm('Удалить файл?')) return;
    updateTask({ ...selectedTask, files: selectedTask.files.filter(f => f.id !== fileId) });
  };

  const switchView = (v: 'my' | 'inbox') => {
    setView(v);
    setSelectedExecutor(null);
    setSelectedTask(null);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--bg-secondary)', padding: '32px 0' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>

        {/* ЗАГОЛОВОК */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              ✅ Задачи
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              {view === 'my' ? 'Выберите исполнителя, чтобы увидеть его задачи' : `Входящие заявки назначенные вам — ${inboxTasks.length}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Переключатель вид */}
            <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)', gap: '2px' }}>
              <button
                onClick={() => switchView('my')}
                style={{
                  padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '700', transition: 'all 0.2s',
                  background: view === 'my' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                  color: view === 'my' ? 'white' : 'var(--text-secondary)',
                  boxShadow: view === 'my' ? '0 2px 8px rgba(102,126,234,0.35)' : 'none',
                }}
              >
                📋 Мои заявки
              </button>
              <button
                onClick={() => switchView('inbox')}
                style={{
                  padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '700', transition: 'all 0.2s', position: 'relative',
                  background: view === 'inbox' ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'transparent',
                  color: view === 'inbox' ? 'white' : 'var(--text-secondary)',
                  boxShadow: view === 'inbox' ? '0 2px 8px rgba(17,153,142,0.35)' : 'none',
                }}
              >
                📥 Входящие
                {inboxTasks.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    background: '#ef4444', color: 'white', borderRadius: '10px',
                    padding: '1px 5px', fontSize: '10px', fontWeight: '800',
                    minWidth: '16px', textAlign: 'center', lineHeight: '14px'
                  }}>{inboxTasks.length}</span>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowRequestModal(true)}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(102,126,234,0.35)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span>📝</span> Создать заявку
            </button>
          </div>
        </div>

        {/* КОЛОНКИ */}
        {view === 'my' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedTask
              ? '280px 360px 1fr'
              : selectedExecutor ? '280px 1fr' : '280px 1fr',
            gap: '20px',
            alignItems: 'start'
          }}>
            {/* Колонка исполнителей */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Исполнители</span>
                <span style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '20px', padding: '1px 8px', fontSize: '11px', fontWeight: '600' }}>
                  {EXECUTORS.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {executorsWithTasks.map(u => {
                  const deptColor = DEPT_COLORS[u.department] || '#6b7280';
                  const isSelected = selectedExecutor?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => { setSelectedExecutor(isSelected ? null : u); setSelectedTask(null); }}
                      style={{
                        padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-primary)',
                        border: isSelected ? 'none' : '1px solid var(--border-color)',
                        boxShadow: isSelected ? '0 8px 24px rgba(102,126,234,0.35)' : '0 1px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s', transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                          background: isSelected ? 'rgba(255,255,255,0.25)' : `${deptColor}20`,
                          border: isSelected ? '2px solid rgba(255,255,255,0.3)' : `2px solid ${deptColor}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? 'white' : deptColor, fontWeight: '800', fontSize: '13px'
                        }}>{u.avatar}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: isSelected ? 'white' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                          <div style={{ fontSize: '12px', color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)', marginTop: '1px' }}>{u.department}</div>
                        </div>
                        <div style={{
                          minWidth: '26px', height: '26px', borderRadius: '8px',
                          background: isSelected ? 'rgba(255,255,255,0.2)' : `${deptColor}15`,
                          color: isSelected ? 'white' : deptColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: '800'
                        }}>{u.taskCount}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Колонка задач выбранного исполнителя */}
            {selectedExecutor && (
              <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedExecutor.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {filteredByExecutor.length} задач · {filteredByExecutor.filter(t => t.isCompleted).length} выполнено
                    </div>
                  </div>
                  <button onClick={() => { setSelectedExecutor(null); setSelectedTask(null); }} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ padding: '12px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredByExecutor.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
                      <div style={{ fontSize: '14px' }}>Нет задач</div>
                    </div>
                  ) : filteredByExecutor.map(task => <TaskCard key={task.id} task={task} isSelected={selectedTask?.id === task.id} onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)} showAssignedBy={false} />)}
                </div>
              </div>
            )}

            {!selectedExecutor && (
              <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '60px 40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>👆</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Выберите исполнителя</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Нажмите на карточку слева чтобы увидеть задачи</div>
              </div>
            )}

            {/* Детали задачи */}
            {selectedTask && (
              <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onDeleteFile={handleDeleteFile}
                onAddComment={handleAddComment}
                newComment={newComment}
                setNewComment={setNewComment}
                canChangeStatus={false}
                canDeleteFiles={true}
              />
            )}
          </div>
        ) : (
          /* ── ВХОДЯЩИЕ ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedTask ? '1fr 420px' : '1fr',
            gap: '20px', alignItems: 'start'
          }}>
            <div>
              {inboxTasks.length === 0 ? (
                <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '60px 40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '14px' }}>📥</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Нет входящих заявок</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Когда кто-то назначит вам задачу — она появится здесь</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {inboxTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTask?.id === task.id}
                      onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      showAssignedBy={true}
                    />
                  ))}
                </div>
              )}
            </div>

            {selectedTask && (
              <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onDeleteFile={handleDeleteFile}
                onAddComment={handleAddComment}
                newComment={newComment}
                setNewComment={setNewComment}
                canChangeStatus={true}
                canDeleteFiles={false}
              />
            )}
          </div>
        )}
      </div>

      {showRequestModal && (
        <RequestModal
          executors={EXECUTORS}
          currentUser={{ id: myId, name: myName, avatar: myAvatar }}
          onClose={() => setShowRequestModal(false)}
          onSubmit={task => { setTasksAndSync(prev => [task, ...prev]); setShowRequestModal(false); }}
        />
      )}
    </div>
  );
};

// ─── КАРТОЧКА ЗАДАЧИ ──────────────────────────────────────────────────────
const TaskCard: React.FC<{
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  showAssignedBy: boolean;
}> = ({ task, isSelected, onClick, showAssignedBy }) => {
  const pr = PRIORITY_CONFIG[task.priority];
  const st = STATUS_CONFIG[task.status];
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-primary)', borderRadius: '14px',
        border: isSelected ? '2px solid #667eea' : '1px solid var(--border-color)',
        padding: '14px', cursor: 'pointer',
        boxShadow: isSelected ? '0 8px 20px rgba(102,126,234,0.18)' : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.18s', transform: isSelected ? 'scale(1.01)' : 'scale(1)'
      }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: task.isCompleted ? 'line-through' : 'none', flex: 1, lineHeight: '1.3' }}>
          {task.title}
        </div>
        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: pr.bg, color: pr.color, flexShrink: 0 }}>
          {pr.label}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {task.description}
      </div>
      {showAssignedBy && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '7px 10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: '800', flexShrink: 0 }}>
            {task.assignedByAvatar}
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>От кого</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{task.assignedBy}</div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: st.bg, color: st.color }}>{st.label}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {task.files.length > 0 && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>📎{task.files.length}</span>}
          {task.comments.length > 0 && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>💬{task.comments.length}</span>}
          {task.dueDate && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>📅{task.dueDate}</span>}
        </div>
      </div>
    </div>
  );
};

// ─── ПАНЕЛЬ ДЕТАЛЕЙ ───────────────────────────────────────────────────────
const TaskDetail: React.FC<{
  task: Task;
  onClose: () => void;
  onDelete: () => void;
  onStatusChange: (s: Task['status']) => void;
  onDeleteFile: (id: string) => void;
  onAddComment: () => void;
  newComment: string;
  setNewComment: (v: string) => void;
  canChangeStatus: boolean;
  canDeleteFiles: boolean;
}> = ({ task, onClose, onDelete, onStatusChange, onDeleteFile, onAddComment, newComment, setNewComment, canChangeStatus, canDeleteFiles }) => (
  <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'sticky', top: '24px' }}>
    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '6px', lineHeight: '1.3' }}>{task.title}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.2)', color: 'white' }}>{PRIORITY_CONFIG[task.priority].label}</span>
            <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.2)', color: 'white' }}>{STATUS_CONFIG[task.status].label}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {canDeleteFiles && (
            <button onClick={onDelete} title="Удалить заявку" style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.3)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
          )}
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      </div>
    </div>

    <div style={{ padding: '16px 20px', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {canChangeStatus && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Изменить статус</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {(Object.entries(STATUS_CONFIG) as [Task['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => onStatusChange(key)} style={{
                padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: task.status === key ? cfg.bg : 'var(--bg-secondary)',
                color: task.status === key ? cfg.color : 'var(--text-secondary)',
                fontSize: '12px', fontWeight: task.status === key ? '700' : '500',
                outline: task.status === key ? `2px solid ${cfg.color}` : 'none',
                transition: 'all 0.15s'
              }}>{cfg.label}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Заказчик',    value: task.assignedBy },
          { label: 'Исполнитель', value: task.assignedTo },
          { label: 'Создана',     value: task.createdAt },
          { label: 'Срок',        value: task.dueDate || '—' },
        ].map(f => (
          <div key={f.label} style={{ padding: '9px 11px', background: 'var(--bg-secondary)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{f.label}</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{f.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Описание</div>
        <div style={{ padding: '11px 13px', background: 'var(--bg-secondary)', borderRadius: '9px', border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {task.description}
        </div>
      </div>

      {task.files.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Файлы ({task.files.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {task.files.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', background: 'var(--bg-secondary)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
                <span>📎</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: f.url !== '#' ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{f.size}</div>
                </div>
                {f.url !== '#' && (
                  <a href={f.url} download={f.name} onClick={e => e.stopPropagation()} style={{ color: '#667eea', fontSize: '13px', textDecoration: 'none' }}>⬇</a>
                )}
                {canDeleteFiles && (
                  <button onClick={() => onDeleteFile(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Комментарии ({task.comments.length})
        </div>
        {task.comments.map(c => (
          <div key={c.id} style={{ marginBottom: '8px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: '800' }}>{c.authorAvatar}</div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.author}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{c.date} {c.time}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', paddingLeft: '31px', lineHeight: '1.5' }}>{c.text}</div>
          </div>
        ))}
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Написать комментарий... (Enter — отправить)"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAddComment(); } }}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: '9px', fontSize: '13px', minHeight: '68px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        />
        <button onClick={onAddComment} disabled={!newComment.trim()} style={{ width: '100%', marginTop: '7px', padding: '10px', border: 'none', borderRadius: '9px', background: newComment.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--bg-secondary)', color: newComment.trim() ? 'white' : 'var(--text-tertiary)', fontSize: '13px', fontWeight: '700', cursor: newComment.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          Отправить комментарий
        </button>
      </div>
    </div>
  </div>
);

// ─── МОДАЛ ЗАЯВКИ ─────────────────────────────────────────────────────────
const RequestModal: React.FC<{
  executors: TaskUser[];
  currentUser: { id: string; name: string; avatar: string };
  onClose: () => void;
  onSubmit: (task: Task) => void;
}> = ({ executors, currentUser, onClose, onSubmit }) => {
  const [executorId, setExecutorId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    setTimeout(() => { e.target.value = ''; }, 0);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word') || file.type.includes('document')) return '📝';
    if (file.type.includes('sheet') || file.type.includes('excel')) return '📊';
    return '📎';
  };

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!executorId) errs.executor = 'Выберите исполнителя';
    if (!title.trim()) errs.title = 'Введите тему';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const executor = executors.find(e => e.id === executorId)!;
    const taskFiles: TaskFile[] = attachedFiles.map((f, i) => ({
      id: `${Date.now()}_${i}`, name: f.name,
      size: f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : (f.size / 1024).toFixed(0) + ' KB',
      url: URL.createObjectURL(f), uploadedBy: currentUser.name, uploadedAt: new Date().toLocaleString('ru-RU')
    }));

    const newTask: Task = {
      id: `task_${Date.now()}`, title: title.trim(),
      description: description.trim() || 'Описание не указано',
      assignedTo: executor.name, assignedToId: executor.id, assignedToAvatar: executor.avatar,
      assignedBy: currentUser.name, assignedById: currentUser.id, assignedByAvatar: currentUser.avatar,
      status: 'pending', priority, dueDate,
      createdAt: new Date().toLocaleString('ru-RU'),
      isCompleted: false, files: taskFiles,
      comments: [{
        id: Date.now().toString(), author: currentUser.name, authorAvatar: currentUser.avatar,
        text: `Заявка создана и назначена исполнителю ${executor.name}`,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }]
    };
    setSubmitted(true);
    pushNotification(`📋 Новая заявка: «${newTask.title}»`, `Исполнитель: ${newTask.assignedTo}`, 'task');
    setTimeout(() => onSubmit(newTask), 1400);
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-color)', borderRadius: '9px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'border-color 0.2s'
  };

  const lbl = (text: string) => (
    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{text}</div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-primary)', borderRadius: '20px', zIndex: 1001, maxWidth: '520px', width: '92%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '52px 32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Заявка создана!</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              «{title}» назначена исполнителю<br />
              <strong>{executors.find(e => e.id === executorId)?.name}</strong>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '18px 22px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>📝 Новая заявка</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Создайте задачу и назначьте исполнителя</div>
              </div>
              <button onMouseDown={e => e.preventDefault()} onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                {lbl('Исполнитель *')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {executors.map(e => (
                    <div key={e.id} onClick={() => { setExecutorId(e.id); setErrors(p => ({...p, executor: ''})); }} style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: executorId === e.id ? 'rgba(102,126,234,0.1)' : 'var(--bg-secondary)', border: executorId === e.id ? '2px solid #667eea' : '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '9px', transition: 'all 0.15s' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: executorId === e.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: executorId === e.id ? 'white' : 'var(--text-secondary)', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>{e.avatar}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{e.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{e.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.executor && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>⚠ {errors.executor}</div>}
              </div>

              <div>
                {lbl('Тема заявки *')}
                <input type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({...p, title: ''})); }}
                  placeholder="Кратко опишите задачу..."
                  style={{ ...fieldStyle, borderColor: errors.title ? '#ef4444' : 'var(--border-color)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.title ? '#ef4444' : 'var(--border-color)'; }}
                />
                {errors.title && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>⚠ {errors.title}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  {lbl('Приоритет')}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(Object.entries(PRIORITY_CONFIG) as [Task['priority'], typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setPriority(key)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700', background: priority === key ? cfg.bg : 'var(--bg-secondary)', color: priority === key ? cfg.color : 'var(--text-tertiary)', outline: priority === key ? `2px solid ${cfg.color}` : 'none', transition: 'all 0.15s' }}>{cfg.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  {lbl('Срок')}
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={fieldStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  />
                </div>
              </div>

              <div>
                {lbl('Описание')}
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробно опишите задачу..."
                  style={{ ...fieldStyle, minHeight: '90px', resize: 'vertical' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                />
              </div>

              <div>
                {lbl('Прикрепить файлы')}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', border: '1.5px dashed #667eea', borderRadius: '9px', background: 'rgba(102,126,234,0.04)', color: '#667eea', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.09)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.04)'; }}
                >
                  📎 Прикрепить файл
                  <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
                {attachedFiles.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 11px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span>{getFileIcon(file)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB'}</div>
                        </div>
                        <button onClick={() => setAttachedFiles(p => p.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Отмена</button>
                <button onClick={handleSubmit} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }}>✅ Отправить заявку</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TasksPage;
