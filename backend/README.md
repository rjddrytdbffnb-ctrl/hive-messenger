# 🐝 Hive Messenger - Backend

Современный backend для корпоративного мессенджера с поддержкой WebSocket, файлов и задач.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка БД

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE corp_messenger;
```

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите свои данные:

```env
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_NAME=corp_messenger
JWT_SECRET=ваш_секретный_ключ
```

### 4. Запуск миграций

```bash
npm run migrate
```

Или вручную выполните SQL из `migrations/001_initial_schema.sql`

### 5. Запуск сервера

**Разработка (с hot-reload):**
```bash
npm run dev
```

**Продакшн:**
```bash
npm start
```

Сервер запустится на `http://localhost:3000`

---

## 📁 Структура проекта

```
backend/
├── migrations/              # SQL миграции
│   └── 001_initial_schema.sql
├── routes/                  # API маршруты
│   ├── auth.js
│   ├── users.js
│   ├── chats.js
│   ├── messages.js
│   └── tasks.js
├── controllers/             # Контроллеры
│   ├── authController.js
│   ├── chatController.js
│   └── taskController.js
├── middleware/              # Middleware
│   ├── auth.js
│   └── upload.js
├── uploads/                 # Загруженные файлы
├── .env                     # Переменные окружения
├── .env.example             # Пример .env
├── database.js              # Подключение к БД
├── server.js                # Главный файл
├── socketHandler.js         # WebSocket логика
└── package.json

```

---

## 🔌 API Endpoints

### 🔐 Аутентификация

#### POST `/api/auth/register`
Регистрация нового пользователя

**Body:**
```json
{
  "username": "ivanov",
  "email": "ivanov@company.com",
  "password": "password123",
  "first_name": "Иван",
  "last_name": "Иванов",
  "department": "IT"
}
```

**Response:**
```json
{
  "message": "Пользователь зарегистрирован",
  "user": {
    "id": 1,
    "username": "ivanov",
    "email": "ivanov@company.com",
    "first_name": "Иван",
    "last_name": "Иванов"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/login`
Вход в систему

**Body:**
```json
{
  "email": "ivanov@company.com",
  "password": "password123"
}
```

---

### 👥 Пользователи

#### GET `/api/users`
Получить список всех пользователей (требуется токен)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "ivanov",
      "first_name": "Иван",
      "last_name": "Иванов",
      "department": "IT",
      "is_online": true
    }
  ]
}
```

#### GET `/api/users/:id`
Получить информацию о пользователе

#### PUT `/api/users/:id`
Обновить профиль пользователя

---

### 💬 Чаты

#### GET `/api/chats`
Получить список чатов пользователя

**Response:**
```json
{
  "chats": [
    {
      "id": 1,
      "name": "IT отдел",
      "type": "group",
      "last_message": "Привет всем!",
      "unread_count": 3
    }
  ]
}
```

#### POST `/api/chats`
Создать новый чат

**Body:**
```json
{
  "name": "Команда разработки",
  "type": "group",
  "participants": [2, 3, 4]
}
```

#### GET `/api/chats/:chatId/messages`
Получить сообщения чата

**Query параметры:**
- `limit` - количество сообщений (по умолчанию 50)
- `before` - ID сообщения для пагинации

---

### 📝 Сообщения

#### POST `/api/messages`
Отправить сообщение

**Body:**
```json
{
  "chat_id": 1,
  "text": "Привет всем!",
  "reply_to": null
}
```

#### PUT `/api/messages/:id`
Редактировать сообщение

#### DELETE `/api/messages/:id`
Удалить сообщение

---

### ✅ Задачи

#### GET `/api/tasks`
Получить список задач

**Query параметры:**
- `status` - фильтр по статусу (pending, in_progress, completed)
- `assigned_to` - фильтр по исполнителю

#### POST `/api/tasks`
Создать новую задачу

**Body:**
```json
{
  "title": "Исправить баг #123",
  "description": "Необходимо исправить ошибку в модуле авторизации",
  "assigned_to": 2,
  "priority": "high",
  "due_date": "2024-12-31"
}
```

#### PUT `/api/tasks/:id`
Обновить задачу

#### POST `/api/tasks/:id/comments`
Добавить комментарий к задаче

---

### 📁 Файлы

#### POST `/api/upload`
Загрузить файл

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form data:**
- `file` - файл для загрузки
- `chat_id` или `task_id` - ID чата или задачи

**Response:**
```json
{
  "message": "Файл загружен",
  "file": {
    "id": 1,
    "filename": "document.pdf",
    "url": "/uploads/1234567890-document.pdf",
    "size": 102400
  }
}
```

---

## 🔌 WebSocket Events

### Client → Server

#### `join`
Присоединиться к чату
```javascript
socket.emit('join', { chatId: 1 });
```

#### `message`
Отправить сообщение
```javascript
socket.emit('message', {
  chatId: 1,
  text: 'Привет!',
  replyTo: null
});
```

#### `typing`
Индикатор печатания
```javascript
socket.emit('typing', { chatId: 1, isTyping: true });
```

### Server → Client

#### `message`
Новое сообщение
```javascript
socket.on('message', (data) => {
  console.log('Новое сообщение:', data);
});
```

#### `user_online`
Пользователь онлайн
```javascript
socket.on('user_online', (userId) => {
  console.log(`Пользователь ${userId} онлайн`);
});
```

#### `typing`
Кто-то печатает
```javascript
socket.on('typing', ({ userId, chatId, isTyping }) => {
  console.log(`${userId} печатает...`);
});
```

---

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `PORT` | Порт сервера | 3000 |
| `DB_HOST` | Хост БД | localhost |
| `DB_PORT` | Порт БД | 5432 |
| `DB_NAME` | Имя БД | corp_messenger |
| `DB_USER` | Пользователь БД | postgres |
| `DB_PASSWORD` | Пароль БД | - |
| `JWT_SECRET` | Секрет для JWT | - |
| `JWT_EXPIRES_IN` | Время жизни токена | 7d |
| `MAX_FILE_SIZE` | Макс размер файла | 10MB |
| `CORS_ORIGIN` | CORS origin | http://localhost:3001 |

---

## 📊 База данных

### Таблицы

- **users** - пользователи
- **chats** - чаты
- **chat_members** - участники чатов
- **messages** - сообщения
- **files** - файлы
- **tasks** - задачи
- **task_comments** - комментарии к задачам
- **task_files** - файлы задач
- **notifications** - уведомления

### ER Диаграмма

```
users ──┬── chats (created_by)
        ├── chat_members
        ├── messages (sender_id)
        ├── tasks (assigned_to, created_by)
        └── notifications

chats ──┬── chat_members
        ├── messages
        └── files

tasks ──┬── task_comments
        └── task_files

messages ──── files
```

---

## 🧪 Тестирование

```bash
npm test
```

---

## 📝 Логирование

Логи сохраняются в:
- `logs/error.log` - ошибки
- `logs/combined.log` - все логи

Уровни логирования:
- `error` - только ошибки
- `warn` - предупреждения и ошибки
- `info` - информация, предупреждения и ошибки
- `debug` - все логи

---

## 🔒 Безопасность

### Реализовано:
- ✅ JWT аутентификация
- ✅ Bcrypt хеширование паролей
- ✅ Helmet (HTTP headers security)
- ✅ Rate limiting (ограничение запросов)
- ✅ CORS настройка
- ✅ SQL injection защита (parametrized queries)
- ✅ XSS защита

### Рекомендации для продакшна:
- [ ] HTTPS
- [ ] Firewall
- [ ] Регулярные backup БД
- [ ] Мониторинг (PM2, New Relic)
- [ ] Логирование в внешний сервис

---

## 🚀 Деплой

### С помощью PM2

```bash
npm install -g pm2
pm2 start server.js --name hive-backend
pm2 save
pm2 startup
```

### Docker (скоро)

---

## 📄 Лицензия

MIT

---

## 👥 Авторы

- Андрей Калугин

---

## 🤝 Вклад

Pull requests приветствуются!

1. Fork проекта
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Откройте Pull Request

---

**Сделано с ❤️ для Hive Messenger**
