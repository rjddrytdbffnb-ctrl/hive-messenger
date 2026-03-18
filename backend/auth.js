// auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Неверный или просроченный токен' });
  }

  try {
    const userResult = await pool.query(
      `SELECT id, username, email, first_name, last_name, department, avatar, is_online
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'Пользователь не найден' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function checkPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

module.exports = { generateToken, verifyToken, authenticateToken, hashPassword, checkPassword };
