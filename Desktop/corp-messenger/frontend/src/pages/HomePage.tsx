// src/pages/HomePage.tsx
import React, { useState } from 'react';

const HomePage: React.FC = () => {
  const [news, setNews] = useState([
    {
      id: 1,
      title: 'Обновление системы мессенджера',
      content: 'Мы рады представить новую версию корпоративного мессенджера с улучшенным интерфейсом и повышенной производительностью.',
      author: 'IT отдел',
      date: '2024-01-15',
      category: 'Обновление',
      isImportant: true
    },
    {
      id: 2,
      title: 'Корпоративное мероприятие',
      content: 'Приглашаем всех сотрудников на ежегодное корпоративное мероприятие, которое состоится в эту пятницу в 18:00 в главном зале.',
      author: 'HR отдел',
      date: '2024-01-14',
      category: 'Событие',
      isImportant: true
    },
    {
      id: 3,
      title: 'Новые правила использования чата',
      content: 'Обращаем внимание на обновленные правила использования корпоративного чата. Пожалуйста, ознакомьтесь с изменениями.',
      author: 'Администрация',
      date: '2024-01-13',
      category: 'Информация',
      isImportant: false
    },
    {
      id: 4,
      title: 'Запуск нового проекта',
      content: 'Компания начинает работу над новым крупным проектом. Подробности будут сообщены на собрании отделов.',
      author: 'Руководство',
      date: '2024-01-12',
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
      backgroundColor: '#ecf0f1',
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
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h1 style={{ 
              marginBottom: '30px', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📰 Корпоративные новости
            </h1>

            {/* Форма добавления новости */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Добавить новость</h3>
              <form onSubmit={handleAddNews}>
                <input
                  type="text"
                  placeholder="Заголовок новости..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  style={{
                    width: '90%',
                    padding: '12px',
                    border: '1px solid #ddd',
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
                    border: '1px solid #ddd',
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
                    backgroundColor: 'white',
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
                      color: '#2c3e50',
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
                      backgroundColor: '#ecf0f1',
                      color: '#7f8c8d',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: '#34495e', 
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
                    color: '#7f8c8d',
                    borderTop: '1px solid #ecf0f1',
                    paddingTop: '10px'
                  }}>
                    <span>👤 {item.author}</span>
                    <span>📅 {item.date}</span>
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
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              marginBottom: '15px', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔔 Уведомления
            </h3>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              <div style={{ padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
                Новое сообщение в чате
              </div>
              <div style={{ padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
                Завтра собрание отдела
              </div>
              <div style={{ padding: '8px 0' }}>
                Обновление системы завершено
              </div>
            </div>
          </div>

          {/* Блок календаря */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              marginBottom: '15px', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📅 Сегодня
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#e8f4fd',
                borderRadius: '5px',
                marginBottom: '8px'
              }}>
                <strong>10:00</strong> - Планерка
              </div>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#f0f8f0',
                borderRadius: '5px',
                marginBottom: '8px'
              }}>
                <strong>14:00</strong> - Встреча с клиентом
              </div>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#fff8e1',
                borderRadius: '5px'
              }}>
                <strong>16:30</strong> - Обучение
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;