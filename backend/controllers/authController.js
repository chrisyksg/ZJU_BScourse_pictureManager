// backend/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 查找用户是否存在
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const user = users[0];

    // 2. 验证密码（将输入的明文密码与数据库的哈希值对比）
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    // 3. 生成 JWT Token (有效期 24 小时)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "登录成功",
      token, // 以后前端访问“上传图片”等接口，必须在 Header 里带上这个
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    res.status(500).json({ message: "服务器内部错误" });
  }
};