# 🐝 Hive Messenger - Корпоративный мессенджер

Современный корпоративный мессенджер с интегрированной системой управления задачами.

## ✨ Новые возможности

### 🎨 Темная тема
- Переключение между светлой и темной темой
- Автоматическое сохранение предпочтений
- Плавные переходы между темами
- CSS-переменные для легкой кастомизации

### 📎 Drag & Drop для файлов
- Перетаскивание файлов в любое место
- Поддержка множественного выбора
- Валидация размера файлов
- Визуальная обратная связь при перетаскивании

### 💬 Упоминания пользователей (@username)
- Автодополнение при вводе @
- Навигация клавиатурой (стрелки вверх/вниз, Enter)
- Подсветка упоминаний в тексте
- Фильтрация пользователей в реальном времени

### ⚡ Skeleton Loaders
- Красивая загрузка контента
- Различные типы скелетонов (сообщения, чаты, задачи, профили)
- Плавная анимация shimmer эффекта

### 🎭 Анимации и переходы
- Плавные переходы между страницами
- Fade-in анимации для элементов
- Hover эффекты с трансформацией
- Красивые модальные окна с backdrop

### 📱 Адаптивная верстка
- Поддержка мобильных устройств
- Responsive дизайн
- Touch-friendly интерфейс
- Адаптивные модальные окна

## 🚀 Быстрый старт

### Установка

\`\`\`bash
# Клонируйте репозиторий
git clone https://github.com/YOUR_USERNAME/hive-messenger.git

# Перейдите в папку
cd hive-messenger

# Установите зависимости
npm install

# Запустите проект
npm start
\`\`\`

### Требования

- Node.js >= 16.0.0
- npm >= 8.0.0

## 📚 Использование

### Переключение темы

\`\`\`tsx
import { useTheme } from './context/ThemeContext';

const MyComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Светлая тема' : 'Темная тема'}
    </button>
  );
};
\`\`\`

### Drag & Drop файлов

\`\`\`tsx
import FileDropZone from './components/FileDropZone';

const MyComponent = () => {
  const handleFiles = (files: File[]) => {
    console.log('Выбраны файлы:', files);
  };

  return (
    <FileDropZone
      onFilesSelected={handleFiles}
      maxSize={10} // MB
      multiple={true}
    />
  );
};
\`\`\`

### Skeleton Loaders

\`\`\`tsx
import { Skeleton } from './components/SkeletonLoaders';

const MyComponent = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <Skeleton type="message" count={5} />;
  }

  return <div>Контент загружен!</div>;
};
\`\`\`

### Упоминания пользователей

\`\`\`tsx
import MentionInput from './components/MentionInput';

const MyComponent = () => {
  const [comment, setComment] = useState('');
  const users = [
    { id: '1', name: 'Алексей Иванов', avatar: 'АИ' },
    { id: '2', name: 'Мария Петрова', avatar: 'МП' }
  ];

  return (
    <MentionInput
      value={comment}
      onChange={setComment}
      users={users}
      placeholder="Напишите комментарий..."
    />
  );
};
\`\`\`

## 🎨 Кастомизация темы

Все цвета определены через CSS-переменные в `src/styles/theme.css`:

\`\`\`css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #2c3e50;
  --accent-primary: #667eea;
  /* ... */
}

:root[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --text-primary: #e0e0e0;
  --accent-primary: #7c8eea;
  /* ... */
}
\`\`\`

Вы можете легко изменить цвета под свой бренд!

## 📁 Структура проекта

\`\`\`
src/
├── components/          # Компоненты
│   ├── FileDropZone.tsx       # Drag & Drop
│   ├── SkeletonLoaders.tsx    # Загрузчики
│   ├── MentionInput.tsx       # Упоминания
│   ├── ThemeToggle.tsx        # Переключатель темы
│   └── ...
├── context/            # Контексты
│   ├── ThemeContext.tsx       # Тема
│   ├── AuthContext.tsx        # Авторизация
│   └── ChatContext.tsx        # Чат
├── pages/              # Страницы
│   ├── TasksPage.tsx
│   ├── ChatPage.tsx
│   └── ...
├── styles/             # Стили
│   └── theme.css              # CSS-переменные и анимации
└── App.tsx             # Главный компонент
\`\`\`

## 🛠️ Технологии

- **React 18** - UI библиотека
- **TypeScript** - Типизация
- **React Router** - Навигация
- **CSS Variables** - Темизация
- **Context API** - Управление состоянием

## 🎯 Roadmap

- [ ] Виртуализация списков (react-window)
- [ ] WebSocket для real-time обновлений
- [ ] Push-уведомления
- [ ] Голосовые сообщения
- [ ] Видеозвонки
- [ ] E2E шифрование

## 📄 Лицензия

MIT

## 👥 Авторы

- Андрей - разработчик

## 🤝 Вклад

Буду рад любым предложениям и PR!

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📞 Контакты

- GitHub: [@your-username](https://github.com/your-username)
- Email: your-email@example.com

---

**Сделано с ❤️ для улучшения корпоративной коммуникации**
