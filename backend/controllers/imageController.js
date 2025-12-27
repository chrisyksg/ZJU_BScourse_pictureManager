// backend/controllers/imageController.js
const db = require('../config/db');
const { processImage } = require('../utils/imageProcessor');

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