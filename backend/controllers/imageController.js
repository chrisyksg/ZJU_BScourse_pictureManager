// backend/controllers/imageController.js
const db = require('../config/db');
const { processImage } = require('../utils/imageProcessor');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { analyzeImage } = require('../services/aiService');

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
    const imageId = result.insertId;
    // --- 自动标签逻辑---
    const autoTags = [];
    if (exif?.Make) autoTags.push(exif.Make); // 品牌，如 Apple
    if (exif?.Model) autoTags.push(exif.Model); // 型号，如 iPhone 13
    if (width > 3000) autoTags.push("高清");
    if (capturedAt) {
        const month = new Date(capturedAt).getMonth() + 1;
        if (month >= 3 && month <= 5) autoTags.push("春天");
        if (month >= 6 && month <= 8) autoTags.push("夏天");
        if (month >= 9 && month <= 11) autoTags.push("秋天");
        if (month === 12 || month <= 2) autoTags.push("冬天");
    }

    // 循环将这些自动生成的标签存入数据库
    for (const tName of autoTags) {
        // 逻辑同 addTag：先查 tag_id，再插 image_tags
        let [tRow] = await db.execute('SELECT id FROM tags WHERE name = ?', [tName]);
        let tId;
        if (tRow.length === 0) {
            const [newT] = await db.execute('INSERT INTO tags (name) VALUES (?)', [tName]);
            tId = newT.insertId;
        } else {
            tId = tRow[0].id;
        }
        await db.execute('INSERT INTO image_tags (image_id, tag_id) VALUES (?, ?)', [imageId, tId]);
    }

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
exports.addTag = async (req, res) => {
  const { id } = req.params; // image_id
  const { tagName } = req.body;

  if (!tagName) return res.status(400).json({ message: "标签内容不能为空" });

  try {
    // 1. 检查标签是否已存在于 tags 表
    let [tag] = await db.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
    let tagId;

    if (tag.length === 0) {
      // 不存在则新建
      const [newTag] = await db.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);
      tagId = newTag.insertId;
    } else {
      tagId = tag[0].id;
    }

    // 2. 检查是否已经关联过（防止重复标签）
    const [existingRelation] = await db.execute(
      'SELECT * FROM image_tags WHERE image_id = ? AND tag_id = ?', 
      [id, tagId]
    );

    if (existingRelation.length === 0) {
      await db.execute('INSERT INTO image_tags (image_id, tag_id) VALUES (?, ?)', [id, tagId]);
    }

    res.json({ message: "标签添加成功", tagName });
  } catch (error) {
    res.status(500).json({ message: "添加标签失败", error: error.message });
  }
};
// 获取单张图片的标签
exports.getImageTags = async (req, res) => {
  try {
    const { id } = req.params;
    const [tags] = await db.execute(
      `SELECT t.name FROM tags t 
       JOIN image_tags it ON t.id = it.tag_id 
       WHERE it.image_id = ?`, [id]
    );
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: "获取标签失败" });
  }
};

// 编辑图片信息及替换图片文件
exports.editImage = async (req, res) => {
    // 1. 获取基础数据
    const imageId = req.params.id;
    const userId = req.user ? req.user.userId : null; // 检查 user 对象是否存在
    const newFile = req.file;

    if (!newFile || !userId || !imageId) {
        return res.status(400).json({ 
            message: "请求参数不全", 
            debug: { imageId, userId, hasFile: !!newFile } 
        });
    }

    try {
        // 2. 校验权限与存在性
        const [rows] = await db.execute(
            'SELECT file_path, thumbnail_path FROM images WHERE id = ? AND user_id = ?',
            [imageId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "未找到图片或无权编辑" });
        }

        const oldImagePath = path.join(__dirname, '..', rows[0].file_path);
        const oldThumbPath = path.join(__dirname, '..', rows[0].thumbnail_path);

        // 3. 处理路径
        const newFilePath = newFile.path.replace(/\\/g, '/');
        const newThumbName = 'thumb-' + newFile.filename;
        const newThumbPath = path.join('uploads/thumbnails', newThumbName).replace(/\\/g, '/');

        // 4. 使用 Sharp 处理缩略图并获取新尺寸
        // 确保 Sharp 处理完成后再继续
        await sharp(newFile.path)
            .resize(300, 300, { fit: 'cover' })
            .toFile(path.join(__dirname, '..', newThumbPath));

        const imageInfo = await sharp(newFile.path).metadata();

        // 5. 准备数据库参数（核心防御：确保没有任何值是 undefined）
        const updateParams = [
            newFilePath || null,
            newThumbPath || null,
            imageInfo.width || 0,
            imageInfo.height || 0,
            newFile.size || 0,
            imageId,
            userId
        ];

        // 6. 执行更新
        await db.execute(
            `UPDATE images 
             SET file_path = ?, thumbnail_path = ?, width = ?, height = ?, file_size = ? 
             WHERE id = ? AND user_id = ?`,
            updateParams
        );

        // 7. 清理旧文件
        try {
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
        } catch (e) { console.log("清理旧文件跳过:", e.message); }

        res.json({ message: "编辑成功", file_path: newFilePath });
        // 在后台启动 AI 分析 (不使用 await，因为不让用户等)
        // setImmediate(async () => {
        //     try {
        //         console.log("AI 正在分析图片...");
        //         const fullPath = path.join(__dirname, '..', newFilePath);
        //         const tags = await analyzeImage(fullPath);

        //         if (tags && tags.length > 0) {
        //             for (const tagName of tags) {
        //                 // 自动存入标签表并建立关联
        //                 await db.execute('INSERT IGNORE INTO tags (name, type) VALUES (?, "auto")', [tagName]);
        //                 const [tagRows] = await db.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
        //                 const tagId = tagRows[0].id;
        //                 await db.execute('INSERT IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)', [imageId, tagId]);
        //             }
        //             console.log("AI 自动打标签成功:", tags);
        //         }
        //     } catch (err) {
        //         console.error("后台 AI 处理失败:", err);
        //     }
        // });

    } catch (error) {
        console.error("editImage 内部错误:", error);
        res.status(500).json({ message: "后端处理失败" });
    }
};

exports.analyzeImageTags = async (req, res) => {
    const imageId = req.params.id;
    const userId = req.user.userId;

    try {
        // 1. 获取图片路径
        const [rows] = await db.execute(
            'SELECT file_path FROM images WHERE id = ? AND user_id = ?',
            [imageId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "未找到图片" });
        }

        // 2. 调用 AI 分析（同步等待结果，因为这是用户主动发起的请求）
        const fullPath = path.join(__dirname, '..', rows[0].file_path);
        const tags = await analyzeImage(fullPath);

        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // 插入标签并关联
                await db.execute('INSERT IGNORE INTO tags (name, type) VALUES (?, "auto")', [tagName]);
                const [tagRows] = await db.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
                const tagId = tagRows[0].id;
                await db.execute('INSERT IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)', [imageId, tagId]);
            }
            
            return res.json({ 
                message: "AI 标签生成成功", 
                tags: tags 
            });
        } else {
            return res.status(500).json({ message: "AI 未能识别出有效标签" });
        }

    } catch (error) {
        console.error("AI 分析接口报错:", error);
        res.status(500).json({ message: "服务器内部错误" });
    }
};