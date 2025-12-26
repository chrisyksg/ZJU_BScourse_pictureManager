// backend/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. 验证基本格式 (对应作业要求：6字节以上)
    if (username.length < 6 || password.length < 6) {
      return res.status(400).json({ message: "用户名和密码必须至少6个字符" });
    }

    // 2. 检查用户名和 Email 是否已存在 (对应作业要求：保证系统唯一)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "用户名或邮箱已被注册" });
    }

    // 3. 密码加密 (安全存储)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 存入数据库
    await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "注册成功！" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};