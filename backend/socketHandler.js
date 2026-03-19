const { verifyToken } = require('./auth');
const { NotificationService, NOTIFICATION_TYPES } = require('./notificationService');
const { pool } = require('./database');

function setupSocket(server) {
  const io = require('socket.io')(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Токен отсутствует'));

      const decoded = verifyToken(token);
      if (!decoded) return next(new Error('Неверный токен'));

      const { rows } = await pool.query(
        'SELECT id, username, email, first_name, last_name, department FROM users WHERE id=$1',
        [decoded.userId]
      );
      if (!rows.length) return next(new Error('Пользователь не найден'));

      socket.userId = decoded.userId;
      socket.user   = rows[0];
      next();
    } catch (err) {
      next(new Error('Ошибка аутентификации'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Подключён: ${socket.user.username} (ID: ${socket.userId})`);

    socket.on('join_user_room', () => {
      socket.join(`user_${socket.userId}`);
    });

    socket.on('join_chats', async () => {
      try {
        const { rows } = await pool.query(
          `SELECT chat_id FROM chat_members WHERE user_id=$1
           UNION SELECT id AS chat_id FROM chats WHERE created_by=$1`,
          [socket.userId]
        );
        rows.forEach(r => socket.join(`chat_${r.chat_id}`));
      } catch (err) {
        console.error('join_chats error:', err.message);
      }
    });

    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    // Отправка через сокет (запасной путь — основной через HTTP)
    // ИСПРАВЛЕНО: user_id → sender_id
    socket.on('send_message', async (data) => {
      try {
        const { chatId, text } = data;
        if (!text?.trim()) return socket.emit('error', { message: 'Пустой текст' });

        const ins = await pool.query(
          'INSERT INTO messages (chat_id, sender_id, text) VALUES ($1,$2,$3) RETURNING *',
          [chatId, socket.userId, text.trim()]
        );

        // ИСПРАВЛЕНО: JOIN по sender_id
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

        const message = rows[0];

        // Уведомления об упоминаниях
        const mentions = extractMentions(text);
        for (const username of mentions) {
          const { rows: urows } = await pool.query('SELECT id FROM users WHERE username=$1', [username]);
          if (urows.length && urows[0].id !== socket.userId) {
            try {
              const notif = await NotificationService.sendNotification(
                urows[0].id, NOTIFICATION_TYPES.MENTION,
                { mentionedBy: socket.user.username, messageId: ins.rows[0].id, chatId, text }
              );
              NotificationService.sendRealTimeNotification(io, urows[0].id, notif);
            } catch {}
          }
        }

        io.to(`chat_${chatId}`).emit('new_message', { message });
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('error', { message: 'Ошибка отправки' });
      }
    });

    // Реакции — ИСПРАВЛЕНО: таблица может отсутствовать, добавим graceful
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        // Получаем chat_id сообщения — ИСПРАВЛЕНО: sender_id вместо user_id
        const { rows: msgRows } = await pool.query(
          'SELECT chat_id, sender_id FROM messages WHERE id=$1', [messageId]
        );
        if (!msgRows.length) return;

        const chatId = msgRows[0].chat_id;

        io.to(`chat_${chatId}`).emit('reaction_added', {
          messageId,
          emoji,
          userId: socket.userId,
          username: socket.user.username,
        });
      } catch (err) {
        console.error('add_reaction error:', err.message);
      }
    });

    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const { rows: msgRows } = await pool.query(
          'SELECT chat_id FROM messages WHERE id=$1', [messageId]
        );
        if (!msgRows.length) return;

        io.to(`chat_${msgRows[0].chat_id}`).emit('reaction_removed', {
          messageId, emoji, userId: socket.userId,
        });
      } catch (err) {
        console.error('remove_reaction error:', err.message);
      }
    });

    socket.on('typing_start', ({ chatId }) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId, username: socket.user.username, chatId
      });
    });

    socket.on('typing_stop', ({ chatId }) => {
      socket.to(`chat_${chatId}`).emit('user_stop_typing', {
        userId: socket.userId, chatId
      });
    });

    socket.on('user_online', async () => {
      // Сообщаем всем что этот юзер онлайн
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId, username: socket.user.username, status: 'online'
      });
      // Обновляем БД
      try { await pool.query('UPDATE users SET is_online=true WHERE id=$1', [socket.userId]); } catch {}
      // Отправляем этому юзеру список кто уже онлайн
      try {
        const { rows } = await pool.query(
          'SELECT id FROM users WHERE is_online=true AND id!=$1', [socket.userId]
        );
        rows.forEach(u => socket.emit('user_status_change', { userId: String(u.id), status: 'online' }));
      } catch {}
    });

    socket.on('disconnect', async (reason) => {
      console.log(`❌ Отключён: ${socket.user.username} — ${reason}`);
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId, username: socket.user.username, status: 'offline'
      });
      try {
        await pool.query('UPDATE users SET is_online=false, last_seen=NOW() WHERE id=$1', [socket.userId]);
      } catch {}
    });
  });

  return io;
}

function extractMentions(text) {
  const re = /@(\w+)/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

module.exports = { setupSocket };
