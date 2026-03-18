-- ============================================================
-- КОРПОРАТИВНЫЙ МЕССЕНДЖЕР — Полная миграция БД
-- Запуск: psql -U postgres -d corp_messenger -f init.sql
-- ============================================================

-- Создаём БД если не существует (выполнять отдельно от psql):
-- CREATE DATABASE corp_messenger;

-- ============================================================
-- РАСШИРЕНИЯ
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ (для чистого рестарта)
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_members CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- ТАБЛИЦА: users
-- Фронтенд ожидает: id, username, email, firstName, lastName,
--                   department, avatar, isOnline
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,

    -- Поля которые ожидает фронтенд
    first_name  VARCHAR(100) NOT NULL DEFAULT '',
    last_name   VARCHAR(100) NOT NULL DEFAULT '',
    department  VARCHAR(100) NOT NULL DEFAULT 'Other',
    avatar      TEXT,                          -- URL аватара
    is_online   BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen   TIMESTAMP WITH TIME ZONE,

    -- Метаданные
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ТАБЛИЦА: chats
-- Типы: 'private' | 'group' | 'channel' (как на фронтенде)
-- ============================================================
CREATE TABLE chats (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'group'
                CHECK (type IN ('private', 'group', 'channel')),
    avatar      TEXT,                          -- URL аватара чата
    description TEXT,

    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Мета-флаги
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ТАБЛИЦА: chat_members
-- Участники чата + роли (owner/admin/member)
-- Нужна для: join_chats в socketHandler, /api/chats
-- ============================================================
CREATE TABLE chat_members (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id   UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(20) NOT NULL DEFAULT 'member'
              CHECK (role IN ('owner', 'admin', 'member')),

    -- Персональные настройки участника
    is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,   -- Закреплён чат у пользователя
    is_muted    BOOLEAN NOT NULL DEFAULT FALSE,   -- Уведомления отключены

    joined_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (chat_id, user_id)                     -- Нельзя добавить дважды
);

-- ============================================================
-- ТАБЛИЦА: messages
-- Поддержка: reply, system messages, soft delete
-- ============================================================
CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    text        TEXT NOT NULL DEFAULT '',

    -- Ответ на сообщение (replyTo на фронтенде)
    reply_to    UUID REFERENCES messages(id) ON DELETE SET NULL,

    -- Флаги
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,   -- Системное сообщение
    is_edited   BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at  TIMESTAMP WITH TIME ZONE,

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ТАБЛИЦА: message_attachments
-- Вложения: image | file (как на фронтенде)
-- ============================================================
CREATE TABLE message_attachments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('image', 'file')),
    url         TEXT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    size        BIGINT,                            -- Размер в байтах
    mime_type   VARCHAR(100),

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ТАБЛИЦА: message_reactions
-- Реакции с защитой от дублей (ON CONFLICT в socketHandler)
-- ============================================================
CREATE TABLE message_reactions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji       VARCHAR(10) NOT NULL,

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (message_id, user_id, emoji)            -- Нельзя ставить дважды одну реакцию
);

-- ============================================================
-- ТАБЛИЦА: notifications
-- Типы из notificationService.js: message | mention | chat_invite | system | message_reaction
-- ============================================================
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL
                CHECK (type IN ('message', 'mention', 'chat_invite', 'system', 'message_reaction')),
    data        JSONB NOT NULL DEFAULT '{}',       -- Гибкие данные (mentionedBy, chatId, emoji...)
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ИНДЕКСЫ — ускоряем частые запросы
-- ============================================================

-- Поиск сообщений в чате (самый частый запрос)
CREATE INDEX idx_messages_chat_id         ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_user_id         ON messages(user_id);

-- Полнотекстовый поиск по сообщениям (для /api/chats/:id/search)
CREATE INDEX idx_messages_text_search     ON messages USING GIN (to_tsvector('russian', text));

-- Участники чатов
CREATE INDEX idx_chat_members_user_id     ON chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id     ON chat_members(chat_id);

-- Реакции
CREATE INDEX idx_reactions_message_id     ON message_reactions(message_id);

-- Вложения
CREATE INDEX idx_attachments_message_id  ON message_attachments(message_id);

-- Уведомления пользователя (непрочитанные)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Онлайн-статус пользователей
CREATE INDEX idx_users_online            ON users(is_online);

-- ============================================================
-- ФУНКЦИЯ: автоматически обновляем updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA — тестовые данные для разработки
-- Пароль для всех: password123 (bcrypt hash)
-- ============================================================

-- Тестовые пользователи
INSERT INTO users (id, username, email, password, first_name, last_name, department, is_online)
VALUES
    ('00000000-0000-0000-0000-000000000001',
     'admin', 'admin@company.com',
     '$2b$10$YourHashedPasswordHere',   -- Замените на реальный hash!
     'Андрей', 'Калугин', 'IT', TRUE),

    ('00000000-0000-0000-0000-000000000002',
     'alexey', 'alexey@company.com',
     '$2b$10$YourHashedPasswordHere',
     'Алексей', 'Иванов', 'IT', TRUE),

    ('00000000-0000-0000-0000-000000000003',
     'maria', 'maria@company.com',
     '$2b$10$YourHashedPasswordHere',
     'Мария', 'Петрова', 'Marketing', FALSE),

    ('00000000-0000-0000-0000-000000000004',
     'dmitry', 'dmitry@company.com',
     '$2b$10$YourHashedPasswordHere',
     'Дмитрий', 'Сидоров', 'Sales', TRUE);

-- Тестовые чаты
INSERT INTO chats (id, name, type, created_by)
VALUES
    ('10000000-0000-0000-0000-000000000001',
     'Общий чат компании', 'group',
     '00000000-0000-0000-0000-000000000001'),

    ('10000000-0000-0000-0000-000000000002',
     'IT отдел', 'group',
     '00000000-0000-0000-0000-000000000001'),

    ('10000000-0000-0000-0000-000000000003',
     'Проект "Альфа"', 'channel',
     '00000000-0000-0000-0000-000000000001');

-- Участники чатов
INSERT INTO chat_members (chat_id, user_id, role) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'member'),

    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'owner'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin'),

    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'owner'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'member'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'member');

-- Тестовые сообщения
INSERT INTO messages (chat_id, user_id, text) VALUES
    ('10000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     'Добро пожаловать в корпоративный мессенджер! 🎉'),

    ('10000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     'Привет всем! Как дела?'),

    ('10000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000003',
     'Всем привет! Отлично, работаем 👍'),

    ('10000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     'Ребята из IT, не забудьте про митинг в 15:00'),

    ('10000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000001',
     'Первый спринт проекта Альфа стартует в понедельник');

-- ============================================================
-- ПОЛЕЗНЫЕ ЗАПРОСЫ ДЛЯ ПРОВЕРКИ
-- ============================================================
-- Проверить таблицы:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
--
-- Проверить пользователей:
--   SELECT id, username, email, department FROM users;
--
-- Сообщения с авторами:
--   SELECT m.text, u.username, m.created_at
--   FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.created_at;
