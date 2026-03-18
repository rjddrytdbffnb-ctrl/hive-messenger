const { pool } = require('./database');

class NotificationService {
  static async sendNotification(userId, type, data) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, data, is_read) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, type, data, false]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка создания уведомления:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications SET is_read = true 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [notificationId, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка обновления уведомления:', error);
      throw error;
    }
  }

  static sendRealTimeNotification(io, userId, notification) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
}

const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  MENTION: 'mention',
  CHAT_INVITE: 'chat_invite',
  SYSTEM: 'system',
  MESSAGE_REACTION: 'message_reaction'
};

module.exports = { NotificationService, NOTIFICATION_TYPES };