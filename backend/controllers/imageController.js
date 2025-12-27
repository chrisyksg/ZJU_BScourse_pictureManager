// backend/controllers/imageController.js
const db = require('../config/db');
const { processImage } = require('../utils/imageProcessor');
const fs = require('fs').promises;
const path = require('path');

// 图片上传处理
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择要上传的图片" });
    }

    // 1. 调用加工厂：生成缩略图并提取 EXIF
    const { exif, thumbPath } = await processImage(req.file);

    // 2. 准备数据
    const userId = req.user.userId;
    const { title, description, privacy } = req.body;
    
    // --- 对应数据库字段的精确提取 ---
    const capturedAt = exif?.DateTimeOriginal || null;
    const width = exif?.ExifImageWidth || null;
    const height = exif?.ExifImageHeight || null;
    
    // 地理位置处理：如果有经纬度，存为一个字符串 "lat, lng"
    // 如果你有逆地理编码 API，这里可以存具体的街道地址
    let locationAddress = null;
    if (exif?.latitude && exif?.longitude) {
      locationAddress = `${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`;
    }

    // 3. 存入数据库 (字段顺序必须与 SQL 语句完全一致)
    const [result] = await db.execute(
      `INSERT INTO images 
      (user_id, title, description, original_filename, file_path, thumbnail_path, file_size, mime_type, width, height, captured_at, location_address, exif_data, privacy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        title || req.file.originalname, 
        description || '', 
        req.file.originalname,
        req.file.path, 
        thumbPath, 
        req.file.size, 
        req.file.mimetype,
        width,
        height,
        capturedAt,
        locationAddress,
        JSON.stringify(exif || {}), // 存储完整原始 JSON
        privacy || 'private'
      ]
    );

    res.status(201).json({
      message: "图片上传并处理成功！",
      imageId: result.insertId,
      thumbnail: thumbPath,
      exif: exif // 返回给前端确认
    });
  } catch (error) {
    console.error("上传出错:", error);
    res.status(500).json({ message: "图片上传失败", error: error.message });
  }
};

// 查询图片列表，支持多种筛选条件
exports.getImages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, startDate, endDate, privacy } = req.query;

    // 基础 SQL
    let sql = 'SELECT * FROM images WHERE user_id = ?';
    let params = [userId];

    // 动态拼接查询条件
    if (title) {
      sql += ' AND title LIKE ?';
      params.push(`%${title}%`);
    }
    if (startDate && endDate) {
      sql += ' AND captured_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    if (privacy) {
      sql += ' AND privacy = ?';
      params.push(privacy);
    }

    sql += ' ORDER BY upload_date DESC';

    const [images] = await db.execute(sql, params);
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: "查询失败", error: error.message });
  }
};

// 删除图片及其相关文件
exports.deleteImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const imageId = req.params.id;

    // 1. 先查出文件路径
    const [images] = await db.execute(
      'SELECT file_path, thumbnail_path FROM images WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: "未找到图片或无权删除" });
    }

    const { file_path, thumbnail_path } = images[0];

    // 2. 物理删除文件
    try {
      await fs.unlink(path.resolve(file_path));
      if (thumbnail_path) await fs.unlink(path.resolve(thumbnail_path));
    } catch (fileErr) {
      console.error("物理文件删除失败（可能文件已不存在）:", fileErr.message);
    }

    // 3. 删除数据库记录
    await db.execute('DELETE FROM images WHERE id = ?', [imageId]);

    res.json({ message: "图片已成功删除" });
  } catch (error) {
    res.status(500).json({ message: "删除失败", error: error.message });
  }
};

// 添加人工标签
exports.addTags = async (req, res) => {
  try {
    const { imageId, tags } = req.body; // tags 是个数组，如 ["风景", "杭州"]
    
    for (const tagName of tags) {
      // 1. 插入或忽略标签名到 tags 表
      await db.execute('INSERT IGNORE INTO tags (name, type) VALUES (?, ?)', [tagName, 'manual']);
      
      // 2. 获取标签 ID
      const [tagRows] = await db.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
      const tagId = tagRows[0].id;
      
      // 3. 关联图片和标签
      await db.execute('INSERT IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)', [imageId, tagId]);
    }
    
    res.json({ message: "标签添加成功" });
  } catch (error) {
    res.status(500).json({ message: "添加标签失败", error: error.message });
  }
};