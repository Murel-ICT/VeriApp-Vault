const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/profile', userController.getProfile);
router.post('/generate-otp', userController.generateOTP);

module.exports = router;