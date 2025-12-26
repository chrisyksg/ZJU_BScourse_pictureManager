// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 定义注册接口：POST /api/auth/register
router.post('/register', authController.register);

module.exports = router;