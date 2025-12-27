// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 从请求头获取 token (格式通常为: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "未授权，请先登录" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // 将解码后的用户信息（含userId）存入 req，方便后续使用
    next(); // 放行
  } catch (err) {
    res.status(403).json({ message: "Token 无效或已过期" });
  }
};