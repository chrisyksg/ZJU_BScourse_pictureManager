// backend/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //  新增：非空校验
    if (!username || !email || !password) {
      return res.status(400).json({ message: "所有字段（用户名、邮箱、密码）均为必填" });
    }

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
    // 1. 从请求体获取 email 和 password
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "请提供邮箱和密码" });
    }

    // 2. 根据 email 查找用户
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      // 为了安全，通常提示“用户名或密码错误”，不具体说明是邮箱错了还是密码错了
      return res.status(401).json({ message: "邮箱或密码错误" });
    }

    const user = users[0];

    // 3. 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "邮箱或密码错误" });
    }

    // 4. 生成 JWT Token
    const token = jwt.sign(
      { userId: user.id, username: user.username }, // Token 里可以保留 username 方便前端显示
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "登录成功",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};