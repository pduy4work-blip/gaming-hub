const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

router.get('/profile/:username', optionalAuth, usersController.getUserProfile);
router.put('/profile', requireAuth, usersController.updateProfile);
router.get('/bookmarks/:username', optionalAuth, usersController.getUserBookmarks);
router.get('/followed-games/:username', optionalAuth, usersController.getUserFollowedGames);

module.exports = router;
