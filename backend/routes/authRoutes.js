// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 定义注册接口：POST /api/auth/register
router.post('/register', authController.register);
// 定义登录接口：POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;