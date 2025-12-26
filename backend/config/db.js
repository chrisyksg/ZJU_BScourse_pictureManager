// backend/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 使用 Promise 封装，方便后续使用 async/await 语法
module.exports = pool.promise();