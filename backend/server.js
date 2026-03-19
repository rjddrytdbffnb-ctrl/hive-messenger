// server.js — совместим со схемой 001_initial_schema_FINAL.sql
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const http       = require('http');
const { pool, runMigrations } = require('./database');
const { authenticateToken, generateToken, hashPassword, checkPassword } = require('./auth');
const { setupSocket } = require('./socketHandler');
const { NotificationService } = require('./notificationService');

const multer = require('multer');
const app    = express();
const PORT   = process.env.PORT || 3000;
const server = http.createServer(app);
const io     = setupSocket(server);
app.set('io', io);

// Multer — хранение в памяти (Railway не имеет постоянного диска)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================
// DEBUG
// ============================================================
app.get('/api/debug/db', async (req, res) => {
  try {
    const time   = await pool.query('SELECT NOW() as t');
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    res.json({
      connection: 'OK',
      time: time.rows[0].t,
      tables: tables.rows.map(r => r.table_name)
    });
  } catch (err) {
    res.status(500).json({ connection: 'ERROR', error: err.message });
  }
});

// ============================================================
// AUTH
// ============================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, firstName, lastName, department } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email и password обязательны' });

    const exists = await pool.query(
      'SELECT id FROM users WHERE email=$1 OR username=$2', [email, username]
    );
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });

    const hash = await hashPassword(password);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, department)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, username, email, first_name, last_name, department, avatar, is_online`,
      [
        username, email, hash,
        first_name ?? firstName ?? '',
        last_name  ?? lastName  ?? '',
        department ?? 'Other'
      ]
    );

    const user  = rows[0];
    const token = generateToken(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email и пароль обязательны' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length)
      return res.status(401).json({ error: 'Неверный email или пароль' });

    const user = rows[0];
    if (!(await checkPassword(password, user.password)))
      return res.status(401).json({ error: 'Неверный email или пароль' });

    await pool.query('UPDATE users SET is_online=true, last_seen=NOW() WHERE id=$1', [user.id]);
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id:         user.id,
        username:   user.username,
        email:      user.email,
        first_name: user.first_name,
        last_name:  user.last_name,
        department: user.department,
        avatar:     user.avatar,
        is_online:  true,
      }
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// ============================================================
// USERS
// ============================================================

app.get('/api/users/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, department, firstName, lastName } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
        first_name  = COALESCE($1, first_name),
        last_name   = COALESCE($2, last_name),
        department  = COALESCE($3, department)
       WHERE id=$4
       RETURNING id, username, email, first_name, last_name, department, avatar, is_online`,
      [
        first_name ?? firstName ?? null,
        last_name  ?? lastName  ?? null,
        department ?? null,
        req.user.id
      ]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, first_name, last_name, department, avatar, is_online
       FROM users ORDER BY username`
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, department, position, role } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name  = COALESCE($2, last_name),
        email      = COALESCE($3, email),
        department = COALESCE($4, department)
       WHERE id = $5
       RETURNING id, username, email, first_name, last_name, department, avatar, is_online`,
      [first_name ?? null, last_name ?? null, email ?? null, department ?? null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// CHATS
// ============================================================

// Все чаты текущего пользователя
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.name, c.type, c.avatar, c.created_at, c.updated_at,

        (SELECT row_to_json(lm) FROM (
          SELECT m.id, m.text, m.created_at,
                 u2.username, u2.first_name, u2.last_name
          FROM messages m
          JOIN users u2 ON u2.id = m.sender_id
          WHERE m.chat_id = c.id
          ORDER BY m.created_at DESC LIMIT 1
        ) lm) AS last_message,

        (SELECT json_agg(row_to_json(p)) FROM (
          SELECT u3.id, u3.username, u3.first_name, u3.last_name,
                 u3.department, u3.avatar, u3.is_online, cm2.role
          FROM chat_members cm2
          JOIN users u3 ON u3.id = cm2.user_id
          WHERE cm2.chat_id = c.id
        ) p) AS participants,

        (SELECT COUNT(*) FROM messages m2
         WHERE m2.chat_id = c.id
           AND m2.sender_id != $1
           AND m2.is_read = false)::int AS unread_count

      FROM chats c
      JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = $1
      ORDER BY c.updated_at DESC
    `, [req.user.id]);

    res.json({ chats: rows });
  } catch (err) {
    console.error('Ошибка получения чатов:', err.message);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// Создать группу / канал
app.post('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { name, type = 'group', memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });

    const validType = ['group', 'channel', 'direct'].includes(type) ? type : 'group';

    const { rows } = await pool.query(
      `INSERT INTO chats (name, type, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [name, validType, req.user.id]
    );
    const chat = rows[0];

    const allIds = [req.user.id, ...memberIds.filter(id => String(id) !== String(req.user.id))];
    for (const uid of allIds) {
      const role = String(uid) === String(req.user.id) ? 'admin' : 'member';
      await pool.query(
        `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [chat.id, uid, role]
      );
    }

    io.emit('new_chat', { chat });
    res.status(201).json({ chat });
  } catch (err) {
    console.error('Ошибка создания чата:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// Создать личный чат
app.post('/api/chats/direct', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId обязателен' });

    const existing = await pool.query(`
      SELECT c.id FROM chats c
      JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = $1
      JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = $2
      WHERE c.type = 'direct'
    `, [req.user.id, targetUserId]);

    if (existing.rows.length > 0) {
      // Возвращаем полный объект чата чтобы фронтенд мог правильно отобразить
      const { rows: fullChat } = await pool.query(`
        SELECT c.*, 
          (SELECT json_agg(row_to_json(p)) FROM (
            SELECT u3.id, u3.username, u3.first_name, u3.last_name,
                   u3.department, u3.avatar, u3.is_online
            FROM chat_members cm2
            JOIN users u3 ON u3.id = cm2.user_id
            WHERE cm2.chat_id = c.id
          ) p) AS participants
        FROM chats c WHERE c.id = $1
      `, [existing.rows[0].id]);
      return res.json({ chat: fullChat[0] });
    }

    const target = await pool.query(
      'SELECT first_name, last_name, username FROM users WHERE id=$1', [targetUserId]
    );
    if (!target.rows.length) return res.status(404).json({ error: 'Пользователь не найден' });

    const t    = target.rows[0];
    const name = t.first_name ? `${t.first_name} ${t.last_name}`.trim() : t.username;

    const { rows } = await pool.query(
      `INSERT INTO chats (name, type, created_by) VALUES ($1,'direct',$2) RETURNING *`,
      [name, req.user.id]
    );
    const chat = rows[0];

    await pool.query(
      `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1,$2,'admin'),($1,$3,'member')`,
      [chat.id, req.user.id, targetUserId]
    );

    res.status(201).json({ chat });
  } catch (err) {
    console.error('Ошибка создания direct чата:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// Участники
app.get('/api/chats/:chatId/members', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.first_name, u.last_name,
             u.department, u.avatar, u.is_online, cm.role, cm.joined_at
      FROM chat_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.chat_id = $1
      ORDER BY cm.role DESC, u.username
    `, [req.params.chatId]);
    res.json({ members: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.post('/api/chats/:chatId/members', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO chat_members (chat_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.params.chatId, req.body.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.delete('/api/chats/:chatId/members/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM chat_members WHERE chat_id=$1 AND user_id=$2',
      [req.params.chatId, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// MESSAGES — используем sender_id (по схеме БД!)
// ============================================================

app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit  = parseInt(req.query.limit) || 50;
    const page   = parseInt(req.query.page)  || 1;
    const offset = (page - 1) * limit;

    // Помечаем как прочитанные
    await pool.query(
      `UPDATE messages SET is_read=true WHERE chat_id=$1 AND sender_id!=$2`,
      [chatId, req.user.id]
    );

    const { rows } = await pool.query(`
      SELECT
        m.id, m.chat_id, m.text, m.is_read, m.is_edited,
        m.reply_to, m.created_at, m.updated_at,
        json_build_object(
          'id',         u.id,
          'username',   u.username,
          'first_name', u.first_name,
          'last_name',  u.last_name,
          'department', u.department,
          'avatar',     u.avatar,
          'is_online',  u.is_online
        ) AS sender,
        (SELECT json_agg(json_build_object(
          'id',        f.id,
          'url',       f.url,
          'name',      f.original_name,
          'type',      CASE WHEN f.mime_type LIKE 'image/%' THEN 'image' ELSE 'file' END,
          'size',      f.size,
          'mime_type', f.mime_type
        )) FROM files f WHERE f.message_id = m.id) AS attachments
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `, [chatId, limit, offset]);

    res.json({ messages: rows });
  } catch (err) {
    console.error('Ошибка получения сообщений:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.post('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId }         = req.params;
    const { text, reply_to } = req.body;

    if (!text?.trim()) return res.status(400).json({ error: 'Текст не может быть пустым' });

    const member = await pool.query(
      'SELECT id FROM chat_members WHERE chat_id=$1 AND user_id=$2',
      [chatId, req.user.id]
    );
    if (!member.rows.length)
      return res.status(403).json({ error: 'Вы не участник этого чата' });

    const ins = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, text, reply_to)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [chatId, req.user.id, text.trim(), reply_to ?? null]
    );

    await pool.query('UPDATE chats SET updated_at=NOW() WHERE id=$1', [chatId]);

    const { rows } = await pool.query(`
      SELECT m.*,
        json_build_object(
          'id',         u.id,
          'username',   u.username,
          'first_name', u.first_name,
          'last_name',  u.last_name,
          'avatar',     u.avatar,
          'is_online',  u.is_online
        ) AS sender
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = $1
    `, [ins.rows[0].id]);

    const message = rows[0];
    io.to(`chat_${chatId}`).emit('new_message', { message });

    res.status(201).json({ message });
  } catch (err) {
    console.error('Ошибка отправки:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// Загрузка файлов с сообщением
app.post('/api/chats/:chatId/messages/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { chatId } = req.params;
    const text = req.body.text?.trim() || '';

    const member = await pool.query(
      'SELECT id FROM chat_members WHERE chat_id= AND user_id=',
      [chatId, req.user.id]
    );
    if (!member.rows.length)
      return res.status(403).json({ error: 'Вы не участник этого чата' });

    // Сохраняем сообщение (text может быть пустым если только файлы)
    const ins = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, text) VALUES (,,) RETURNING *',
      [chatId, req.user.id, text || ' ']
    );
    const msgId = ins.rows[0].id;

    // Сохраняем файлы
    const files = req.files || [];
    for (const file of files) {
      // В Railway нет постоянного хранилища — сохраняем путь как URL
      // В продакшене стоит использовать S3/Cloudinary
      const url = '/uploads/' + file.filename;
      await pool.query(
        'INSERT INTO files (message_id, filename, original_name, mime_type, size, url) VALUES (,,,,,)',
        [msgId, file.filename, file.originalname, file.mimetype, file.size, url]
      );
    }

    await pool.query('UPDATE chats SET updated_at=NOW() WHERE id=', [chatId]);

    const { rows } = await pool.query(`
      SELECT m.*,
        json_build_object(
          'id', u.id, 'username', u.username,
          'first_name', u.first_name, 'last_name', u.last_name,
          'avatar', u.avatar, 'is_online', u.is_online
        ) AS sender,
        (SELECT json_agg(json_build_object(
          'id', f.id, 'url', f.url, 'name', f.original_name,
          'type', CASE WHEN f.mime_type LIKE 'image/%' THEN 'image' ELSE 'file' END,
          'size', f.size, 'mime_type', f.mime_type
        )) FROM files f WHERE f.message_id = m.id) AS attachments
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id=$1
    `, [msgId]);

    const message = rows[0];
    io.to(`chat_${chatId}`).emit('new_message', { message });
    res.status(201).json({ message });
  } catch (err) {
    console.error('Ошибка загрузки файла:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.get('/api/chats/:chatId/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || String(query).trim().length < 2)
      return res.status(400).json({ error: 'Минимум 2 символа' });

    const { rows } = await pool.query(`
      SELECT m.*, u.username, u.first_name, u.last_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.chat_id=$1 AND m.text ILIKE $2
      ORDER BY m.created_at DESC LIMIT 50
    `, [req.params.chatId, `%${query}%`]);

    res.json({ results: rows, query });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// UPLOAD — загрузка файлов с сообщением
// ============================================================

app.post('/api/chats/:chatId/messages/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { chatId } = req.params;
    const text = req.body.text?.trim() || '📎 Файл';
    const uploadedFiles = req.files || [];

    const member = await pool.query(
      'SELECT id FROM chat_members WHERE chat_id=$1 AND user_id=$2',
      [chatId, req.user.id]
    );
    if (!member.rows.length)
      return res.status(403).json({ error: 'Вы не участник этого чата' });

    const ins = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, text) VALUES ($1,$2,$3) RETURNING *',
      [chatId, req.user.id, text]
    );

    await pool.query('UPDATE chats SET updated_at=NOW() WHERE id=$1', [chatId]);

    // Сохраняем файлы в БД как ссылки (base64 data URL для Railway без диска)
    const savedFiles = [];
    for (const file of uploadedFiles) {
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;
      const { rows: frows } = await pool.query(
        `INSERT INTO files (message_id, filename, original_name, mime_type, size, url)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [ins.rows[0].id, file.originalname, file.originalname, file.mimetype, file.size, dataUrl]
      );
      savedFiles.push(frows[0]);
    }

    const { rows } = await pool.query(`
      SELECT m.*,
        json_build_object(
          'id', u.id, 'username', u.username,
          'first_name', u.first_name, 'last_name', u.last_name,
          'avatar', u.avatar, 'is_online', u.is_online
        ) AS sender
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id=$1
    `, [ins.rows[0].id]);

    const message = { ...rows[0], attachments: savedFiles };
    io.to(`chat_${chatId}`).emit('new_message', { message });

    res.status(201).json({ message });
  } catch (err) {
    console.error('Ошибка загрузки файла:', err);
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// TASKS
// ============================================================

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*,
        json_build_object('id',ua.id,'username',ua.username,
          'first_name',ua.first_name,'last_name',ua.last_name) AS assigned_user,
        json_build_object('id',uc.id,'username',uc.username,
          'first_name',uc.first_name,'last_name',uc.last_name) AS creator
      FROM tasks t
      LEFT JOIN users ua ON ua.id = t.assigned_to
      LEFT JOIN users uc ON uc.id = t.created_by
      WHERE t.assigned_to=$1 OR t.created_by=$1
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    res.json({ tasks: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority = 'medium', assigned_to, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Название задачи обязательно' });

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority, assigned_to, created_by, due_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, priority, assigned_to ?? null, req.user.id, due_date ?? null]
    );
    res.status(201).json({ task: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { status, title, description, priority, assigned_to, due_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE tasks SET
        status       = COALESCE($1, status),
        title        = COALESCE($2, title),
        description  = COALESCE($3, description),
        priority     = COALESCE($4, priority),
        assigned_to  = COALESCE($5, assigned_to),
        due_date     = COALESCE($6, due_date),
        completed_at = CASE WHEN $1='done' THEN NOW() ELSE completed_at END
       WHERE id=$7 RETURNING *`,
      [status, title, description, priority, assigned_to, due_date, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ task: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM tasks WHERE id=$1 AND created_by=$2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// TASK COMMENTS
// ============================================================

app.get('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tc.*, 
        json_build_object('id', u.id, 'username', u.username,
          'first_name', u.first_name, 'last_name', u.last_name, 'avatar', u.avatar) AS author
      FROM task_comments tc
      JOIN users u ON u.id = tc.user_id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `, [req.params.id]);
    res.json({ comments: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.post('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Текст комментария обязателен' });
    const { rows } = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, text) VALUES ($1,$2,$3)
       RETURNING *`,
      [req.params.id, req.user.id, text.trim()]
    );
    const full = await pool.query(`
      SELECT tc.*, 
        json_build_object('id', u.id, 'username', u.username,
          'first_name', u.first_name, 'last_name', u.last_name, 'avatar', u.avatar) AS author
      FROM task_comments tc
      JOIN users u ON u.id = tc.user_id
      WHERE tc.id = $1
    `, [rows[0].id]);
    res.status(201).json({ comment: full.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// TASK FILES  
// ============================================================

app.get('/api/tasks/:id/files', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tf.*,
        json_build_object('id', u.id, 'username', u.username,
          'first_name', u.first_name, 'last_name', u.last_name) AS uploader
      FROM task_files tf
      JOIN users u ON u.id = tf.uploaded_by
      WHERE tf.task_id = $1
      ORDER BY tf.created_at ASC
    `, [req.params.id]);
    res.json({ files: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.delete('/api/tasks/:taskId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM task_files WHERE id=$1 AND task_id=$2',
      [req.params.fileId, req.params.taskId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// NOTIFICATIONS
// ============================================================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json({ notification: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера', detail: err.message });
  }
});

// ============================================================
// ЗАПУСК
// ============================================================
async function start() {
  try {
    await runMigrations();
    server.listen(PORT, () => {
      console.log('══════════════════════════════════════');
      console.log('🐝 HIVE MESSENGER запущен!');
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🔍 Проверка БД: http://localhost:${PORT}/api/debug/db`);
      console.log('══════════════════════════════════════');
    });
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
    process.exit(1);
  }
}

start();
