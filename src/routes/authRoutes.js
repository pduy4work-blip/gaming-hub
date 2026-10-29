const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { optionalAuth } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimit');

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', optionalAuth, authController.getCurrentUser);

module.exports = router;
