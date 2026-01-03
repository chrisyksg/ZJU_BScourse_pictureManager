// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const imageRoutes = require('./routes/imageRoutes');

// 获取本机所有非内部IPv4地址
const getNetworkIPs = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const ips = ['http://localhost:5173']; // 总是包含localhost
  
  Object.values(interfaces).forEach(iface => {
    iface.forEach(config => {
      if (config.family === 'IPv4' && !config.internal) {
        // 添加前端访问地址
        ips.push(`http://${config.address}:5173`);
        // 也可以添加后端地址（如果需要）
        ips.push(`http://${config.address}:3000`);
      }
    });
  });
  
  return ips;
};

const app = express();

// 中间件配置
//app.use(cors()); // 允许前端 React 访问
const allowedOrigins = getNetworkIPs();
console.log('🌐 允许的CORS源:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // 允许没有来源的请求（如curl、Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ 被阻止的CORS请求来源:', origin);
      // 生产环境应该严格限制，开发环境可以放宽
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true); // 开发环境允许所有
      } else {
        callback(new Error('不允许的CORS来源'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // 允许解析 JSON 格式的请求体
app.use('/api/images', imageRoutes); // 图片相关路由
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
  res.set('Access-Control-Allow-Origin', '*'); 
  }
})); // 静态文件服务

// 基础路由测试
app.get('/', (req, res) => {
  res.send('PictureManager 后端服务已启动！');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); // 用户认证路由

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST,() => {
  // 获取本机IP地址用于显示
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const networkIPs = [];
  
  Object.values(interfaces).forEach(iface => {
    iface.forEach(config => {
      if (config.family === 'IPv4' && !config.internal) {
        networkIPs.push(config.address);
      }
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PictureManager 后端服务器启动成功');
  console.log('='.repeat(60));
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  
  // 显示所有网络接口地址
  networkIPs.forEach(ip => {
    console.log(`🌐 网络地址: http://${ip}:${PORT}`);
  });
  
  console.log(`📱 移动设备访问: 使用上面的IP地址`);
  console.log('='.repeat(60) + '\n');
});