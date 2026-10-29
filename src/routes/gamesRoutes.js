const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/gamesController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/auth');

router.get('/', optionalAuth, gamesController.getGames);
router.get('/:slug', optionalAuth, gamesController.getGameBySlug);
router.post('/:id/follow', requireAuth, gamesController.toggleFollowGame);
router.post('/', requireRole('admin'), gamesController.createGame);
router.put('/:id', requireRole('admin'), gamesController.updateGame);

module.exports = router;
