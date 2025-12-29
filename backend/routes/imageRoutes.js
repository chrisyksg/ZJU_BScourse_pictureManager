// backend/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/auth');

// 查询图片列表 (GET)
router.get('/', verifyToken, imageController.getImages);
// 上传图片（POST）只有登录用户（verifyToken）可以上传，单图上传字段名为 'image'
router.post('/upload', verifyToken, upload.single('image'), imageController.uploadImage);
// 删除图片（DELETE）
router.delete('/:id', verifyToken, imageController.deleteImage);
// 人工添加标签（POST）
router.post('/:id/tags', verifyToken, imageController.addTag);
// 获取图片标签（GET）
router.get('/:id/tags', verifyToken, imageController.getImageTags);
module.exports = router;