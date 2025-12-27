// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const imageRoutes = require('./routes/imageRoutes');


const app = express();

// 中间件配置
app.use(cors()); // 允许前端 React 访问
app.use(express.json()); // 允许解析 JSON 格式的请求体
app.use('/api/images', imageRoutes); // 图片相关路由
app.use('/uploads', express.static('uploads')); // 静态文件服务

// 基础路由测试
app.get('/', (req, res) => {
  res.send('PictureManager 后端服务已启动！');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在: http://localhost:${PORT}`);
});