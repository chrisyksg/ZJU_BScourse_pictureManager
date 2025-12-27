// backend/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/auth');

// 只有登录用户（verifyToken）可以上传，单图上传字段名为 'image'
router.post('/upload', verifyToken, upload.single('image'), imageController.uploadImage);

module.exports = router;