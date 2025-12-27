// backend/utils/imageProcessor.js
const sharp = require('sharp');
const exifr = require('exifr');
const fs = require('fs');
const path = require('path');

const dirs = ['uploads/original', 'uploads/thumbnails'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 已自动创建目录: ${dir}`);
  }
});
exports.processImage = async (file) => {
  const originalPath = file.path;
  const thumbName = 'thumb-' + file.filename;
  const thumbPath = path.join('uploads/thumbnails/', thumbName);

  // 1. 提取 EXIF 信息
  let exifData = {};
  try {
    // 提取时间、地点、分辨率等
    exifData = await exifr.parse(originalPath, {
      pick: ['DateTimeOriginal', 'latitude', 'longitude', 'ExifImageWidth', 'ExifImageHeight']
    });
  } catch (err) {
    console.log('EXIF提取失败（可能图片无元数据）:', err.message);
  }

  // 2. 使用 Sharp 生成缩略图
  await sharp(originalPath)
    .resize(300, 300, { fit: 'cover' })
    .toFile(thumbPath);

  return {
    exif: exifData,
    thumbPath: thumbPath
  };
};