CREATE DATABASE IF NOT EXISTS picture_manager;
USE picture_manager; 
-- 1. 用户表 (增加密码长度和格式校验在逻辑层处理)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL, 
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 图片表 (增加独立EXIF查询列)
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  original_filename VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  file_size INT NOT NULL,
  mime_type VARCHAR(50),
  width INT,
  height INT,
  -- 核心：提取EXIF关键字段方便查询
  captured_at DATETIME,          -- 拍摄时间
  location_address VARCHAR(255),  -- 地理位置(解析后的字符串)
  exif_data JSON,                 -- 原始完整JSON
  privacy ENUM('public', 'private') DEFAULT 'private',
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 标签表与关联表 (保持你的设计，非常棒)
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('auto', 'manual') DEFAULT 'manual' -- 区分AI和人工
);

CREATE TABLE image_tags (
  image_id INT NOT NULL,
  tag_id INT NOT NULL,
  confidence FLOAT DEFAULT 1.0, 
  PRIMARY KEY (image_id, tag_id),
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);