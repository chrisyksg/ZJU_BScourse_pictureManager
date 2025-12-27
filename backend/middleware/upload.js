// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');

// 配置存储逻辑
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/original/'); // 暂时先存到原图目录
  },
  filename: (req, file, cb) => {
    // 使用 时间戳 + 随机数 + 原始后缀名，防止重名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器（只允许图片）
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('请上传图片文件！'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制 5MB
  fileFilter: fileFilter
});

module.exports = upload;