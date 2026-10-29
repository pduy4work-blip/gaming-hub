const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, notificationsController.getNotifications);
router.get('/unread-count', requireAuth, notificationsController.getUnreadCount);
router.put('/:id/read', requireAuth, notificationsController.markAsRead);
router.put('/mark-all-read', requireAuth, notificationsController.markAllAsRead);

module.exports = router;
