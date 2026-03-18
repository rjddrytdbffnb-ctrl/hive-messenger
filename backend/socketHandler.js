const { verifyToken } = require('./auth');
const { NotificationService, NOTIFICATION_TYPES } = require('./notificationService');
const { pool } = require('./database');

function setupSocket(server) {
  const io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Middleware для аутентификации WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Токен аутентификации отсутствует'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Неверный токен'));
      }

      const userResult = await pool.query(
        'SELECT id, username, email, department FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('Пользователь не найден'));
      }

      socket.userId = decoded.userId;
      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      next(new Error('Ошибка аутентификации'));
    }
  });

  // Обработка подключения
  io.on('connection', (socket) => {
    console.log(`✅ Пользователь подключен: ${socket.user.username} (ID: ${socket.userId})`);

    // 🆕 ДОБАВЛЕНО: Присоединение к комнате уведомлений пользователя
    socket.on('join_user_room', () => {
      socket.join(`user_${socket.userId}`);
      console.log(`🔔 Пользователь ${socket.user.username} присоединился к своей комнате уведомлений`);
    });

    // Присоединение к комнатам чатов, где пользователь состоит
    socket.on('join_chats', async () => {
      try {
        const userChats = await pool.query(`
          SELECT chat_id FROM chat_members WHERE user_id = $1
          UNION 
          SELECT id as chat_id FROM chats WHERE created_by = $1
        `, [socket.userId]);

        userChats.rows.forEach(chat => {
          socket.join(`chat_${chat.chat_id}`);
          console.log(`👥 ${socket.user.username} присоединился к чату ${chat.chat_id}`);
        });
      } catch (error) {
        console.error('Ошибка при присоединении к чатам:', error);
      }
    });

    // Обработка отправки сообщения
    socket.on('send_message', async (data) => {
      try {
        const { chatId, text } = data;

        if (!text || text.trim() === '') {
          socket.emit('error', { message: 'Текст сообщения не может быть пустым' });
          return;
        }

        // Сохраняем сообщение в базу
        const result = await pool.query(
          'INSERT INTO messages (chat_id, user_id, text) VALUES ($1, $2, $3) RETURNING *',
          [chatId, socket.userId, text.trim()]
        );

        // Получаем сообщение с информацией о пользователе
        const messageResult = await pool.query(`
          SELECT m.*, u.username 
          FROM messages m 
          JOIN users u ON m.user_id = u.id 
          WHERE m.id = $1
        `, [result.rows[0].id]);

        const message = messageResult.rows[0];

        // 🆕 ДОБАВЛЕНО: Уведомления об упоминаниях
        const mentionedUsers = extractMentions(text);
        for (const username of mentionedUsers) {
          const userResult = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
          );
          
          if (userResult.rows.length > 0 && userResult.rows[0].id !== socket.userId) {
            const notification = await NotificationService.sendNotification(
              userResult.rows[0].id,
              NOTIFICATION_TYPES.MENTION,
              {
                mentionedBy: socket.user.username,
                messageId: result.rows[0].id,
                chatId: chatId,
                text: text
              }
            );
            
            NotificationService.sendRealTimeNotification(io, userResult.rows[0].id, notification);
          }
        }

        // Отправляем сообщение всем в чате
        io.to(`chat_${chatId}`).emit('new_message', {
          message,
          user: socket.user
        });

        console.log(`💬 ${socket.user.username} отправил сообщение в чат ${chatId}`);

      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        socket.emit('error', { message: 'Ошибка отправки сообщения' });
      }
    });

    // 🆕 ДОБАВЛЕНО: Обработка реакций на сообщения
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        const result = await pool.query(
          `INSERT INTO message_reactions (message_id, user_id, emoji) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (message_id, user_id, emoji) 
           DO UPDATE SET created_at = CURRENT_TIMESTAMP 
           RETURNING *`,
          [messageId, socket.userId, emoji]
        );

        const reactionResult = await pool.query(`
          SELECT mr.*, u.username 
          FROM message_reactions mr
          JOIN users u ON mr.user_id = u.id
          WHERE mr.id = $1
        `, [result.rows[0].id]);

        const reaction = reactionResult.rows[0];

        // Уведомление автору сообщения
        const messageAuthor = await pool.query(
          'SELECT user_id FROM messages WHERE id = $1',
          [messageId]
        );

        if (messageAuthor.rows.length > 0 && messageAuthor.rows[0].user_id !== socket.userId) {
          const notification = await NotificationService.sendNotification(
            messageAuthor.rows[0].user_id,
            NOTIFICATION_TYPES.MESSAGE_REACTION,
            {
              reactor: socket.user.username,
              emoji: emoji,
              messageId: messageId
            }
          );

          NotificationService.sendRealTimeNotification(io, messageAuthor.rows[0].user_id, notification);
        }

        // Рассылаем реакцию всем в чате
        const messageInfo = await pool.query(
          'SELECT chat_id FROM messages WHERE id = $1',
          [messageId]
        );

        if (messageInfo.rows.length > 0) {
          io.to(`chat_${messageInfo.rows[0].chat_id}`).emit('reaction_added', {
            reaction,
            messageId
          });
        }

      } catch (error) {
        console.error('Ошибка добавления реакции:', error);
        socket.emit('error', { message: 'Ошибка добавления реакции' });
      }
    });

    // 🆕 ДОБАВЛЕНО: Удаление реакции
    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        await pool.query(
          'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
          [messageId, socket.userId, emoji]
        );

        const messageInfo = await pool.query(
          'SELECT chat_id FROM messages WHERE id = $1',
          [messageId]
        );

        if (messageInfo.rows.length > 0) {
          io.to(`chat_${messageInfo.rows[0].chat_id}`).emit('reaction_removed', {
            messageId,
            userId: socket.userId,
            emoji
          });
        }

      } catch (error) {
        console.error('Ошибка удаления реакции:', error);
        socket.emit('error', { message: 'Ошибка удаления реакции' });
      }
    });

    // Пользователь печатает
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_stop_typing', {
        userId: socket.userId,
        chatId
      });
    });

    // Присоединение к конкретному чату
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`👥 ${socket.user.username} присоединился к чату ${chatId}`);
    });

    // Выход из чата
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`👋 ${socket.user.username} покинул чат ${chatId}`);
    });

    // Отслеживание онлайн статуса
    socket.on('user_online', () => {
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        username: socket.user.username,
        status: 'online'
      });
    });

    // Обработка отключения
    socket.on('disconnect', (reason) => {
      console.log(`❌ Пользователь отключен: ${socket.user.username} - ${reason}`);
      
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        username: socket.user.username,
        status: 'offline'
      });
    });
  });

  return io;
}

// 🆕 ДОБАВЛЕНО: Функция для извлечения упоминаний
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

module.exports = { setupSocket };