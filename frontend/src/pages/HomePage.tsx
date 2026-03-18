// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

const COLOR_BORDERS: Record<string, string> = {
  blue: '#3498db', green: '#2ecc71', orange: '#f39c12', red: '#e74c3c', purple: '#667eea', pink: '#ec4899'
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [todayNotifications, setTodayNotifications] = useState<any[]>([]);

  // Загружаем уведомления из localStorage
  useEffect(() => {
    const loadNotifs = () => {
      try {
        const notifs = JSON.parse(localStorage.getItem('corp_notifications') || '[]');
        setTodayNotifications(notifs.slice(0, 10));
      } catch {}
    };
    loadNotifs();
    // Обновляем каждые 5 секунд (для реакции на новые сообщения/задачи)
    const interval = setInterval(loadNotifs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('corp_calendar') || '[]');
      const today = all.filter((e: any) => e.date === todayKey()).sort((a: any, b: any) => a.time.localeCompare(b.time));
      setTodayEvents(today);
    } catch {}
  }, []);
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  const [news, setNews] = useState([
    {
      id: 1,
      title: 'Обновление системы мессенджера',
      content: 'Мы рады представить новую версию корпоративного мессенджера с улучшенным интерфейсом и повышенной производительностью.',
      author: 'IT отдел',
      date: daysAgo(0),
      category: 'Обновление',
      isImportant: true
    },
    {
      id: 2,
      title: 'Корпоративное мероприятие',
      content: 'Приглашаем всех сотрудников на ежегодное корпоративное мероприятие, которое состоится в эту пятницу в 18:00 в главном зале.',
      author: 'HR отдел',
      date: daysAgo(1),
      category: 'Событие',
      isImportant: true
    },
    {
      id: 3,
      title: 'Новые правила использования чата',
      content: 'Обращаем внимание на обновлённые правила использования корпоративного чата. Пожалуйста, ознакомьтесь с изменениями.',
      author: 'Администрация',
      date: daysAgo(3),
      category: 'Информация',
      isImportant: false
    },
    {
      id: 4,
      title: 'Запуск нового проекта',
      content: 'Компания начинает работу над новым крупным проектом. Подробности будут сообщены на собрании отделов.',
      author: 'Руководство',
      date: daysAgo(5),
      category: 'Проект',
      isImportant: true
    }
  ]);

  const [newPost, setNewPost] = useState({
    title: '',
    content: ''
  });

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.title.trim() && newPost.content.trim()) {
      const newsItem = {
        id: news.length + 1,
        title: newPost.title,
        content: newPost.content,
        author: 'Вы',
        date: new Date().toISOString().split('T')[0],
        category: 'Новость',
        isImportant: false
      };
      setNews([newsItem, ...news]);
      setNewPost({ title: '', content: '' });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        gap: '20px'
      }}>
        {/* Основной контент - Новости */}
        <div style={{ flex: 1 }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '10px',
            padding: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h1 style={{ 
              marginBottom: '30px', 
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📰 Корпоративные новости
            </h1>

            {/* Форма добавления новости */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Добавить новость</h3>
              <form onSubmit={handleAddNews}>
                <input
                  type="text"
                  placeholder="Заголовок новости..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  style={{
                    width: '90%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '5px',
                    fontSize: '16px',
                    marginBottom: '10px'
                  }}
                />
                <textarea
                  placeholder="Содержание новости..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  style={{
                    width: '90%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '5px',
                    fontSize: '16px',
                    marginBottom: '10px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Опубликовать
                </button>
              </form>
            </div>

            {/* Список новостей */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {news.map(item => (
                <div 
                  key={item.id}
                  style={{
                    border: item.isImportant ? '2px solid #e74c3c' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-primary)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: item.isImportant ? '4px solid #e74c3c' : '4px solid #3498db'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: 'var(--text-primary)',
                      fontSize: '18px'
                    }}>
                      {item.title}
                      {item.isImportant && (
                        <span style={{
                          marginLeft: '10px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}>
                          Важно
                        </span>
                      )}
                    </h3>
                    <span style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: 'var(--text-primary)', 
                    lineHeight: '1.6',
                    marginBottom: '15px'
                  }}>
                    {item.content}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '10px'
                  }}>
                    <span>👤 {item.author}</span>
                    <span>📅 {(() => {
                      const diff = Math.round((new Date().setHours(0,0,0,0) - new Date(item.date).setHours(0,0,0,0)) / 86400000);
                      if (diff === 0) return 'Сегодня';
                      if (diff === 1) return 'Вчера';
                      if (diff <= 6) return `${diff} дня назад`;
                      return new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                    })()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Боковая панель */}
        <div style={{ width: '300px' }}>
          {/* Блок уведомлений */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔔 Уведомления
                {todayNotifications.filter((n: any) => !n.is_read).length > 0 && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '800' }}>
                    {todayNotifications.filter((n: any) => !n.is_read).length}
                  </span>
                )}
              </span>
              <button onClick={() => navigate('/notifications')} style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', background: 'rgba(102,126,234,0.1)', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}>
                Все →
              </button>
            </h3>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {todayNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  Нет уведомлений
                </div>
              ) : todayNotifications.slice(0, 4).map((n: any, i: number) => (
                <div key={n.id} onClick={() => navigate('/notifications')} style={{ padding: '9px 0', borderBottom: i < Math.min(todayNotifications.length, 4) - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {!n.is_read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#667eea', flexShrink: 0 }} />}
                  <span style={{ fontWeight: n.is_read ? '400' : '600', color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{n.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Блок календаря */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Сегодня</span>
              <button onClick={() => navigate('/calendar')} style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', background: 'rgba(102,126,234,0.1)', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}>
                Открыть →
              </button>
            </h3>
            <div style={{ fontSize: '14px' }}>
              {todayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontSize: '13px' }}>Нет событий на сегодня</div>
                  <button onClick={() => navigate('/calendar')} style={{ marginTop: '10px', fontSize: '12px', fontWeight: '600', color: '#667eea', background: 'transparent', border: '1px solid #667eea', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>
                    + Добавить событие
                  </button>
                </div>
              ) : todayEvents.map((ev: any) => (
                <div key={ev.id} onClick={() => navigate('/calendar')} style={{ padding: '10px 10px 10px 14px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', marginBottom: '8px', borderLeft: `3px solid ${COLOR_BORDERS[ev.color] || '#667eea'}`, color: 'var(--text-primary)', cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <strong style={{ color: COLOR_BORDERS[ev.color] || '#667eea' }}>{ev.time}</strong>
                  <span style={{ marginLeft: '6px' }}>{ev.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;