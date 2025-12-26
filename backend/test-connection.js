// backend/test-connection.js
const db = require('./config/db');

async function checkConnection() {
  try {
    // 执行一个简单的 SQL：查询当前时间
    const [rows] = await db.execute('SELECT NOW() AS currentTime');
    console.log('✅ 数据库连接成功！');
    console.log('📅 MySQL 当前时间是：', rows[0].currentTime);
    process.exit(0); // 测试完成，正常退出
  } catch (err) {
    console.error('❌ 数据库连接失败，请检查密码或数据库名是否正确！');
    console.error('错误信息：', err.message);
    process.exit(1);
  }
}

checkConnection();