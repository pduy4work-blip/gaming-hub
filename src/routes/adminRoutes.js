const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

// Allow moderator or admin for stats, reports, logs
router.get('/stats', requireRole(['moderator', 'admin']), adminController.getAdminStats);
router.get('/reports', requireRole(['moderator', 'admin']), adminController.getReportsList);
router.put('/reports/:id', requireRole(['moderator', 'admin']), adminController.reviewReport);
router.get('/moderation-logs', requireRole(['moderator', 'admin']), adminController.getModerationLogs);

// Admin-only operations: user role/status management
router.get('/users', requireRole('admin'), adminController.getUsersList);
router.put('/users/:id/role', requireRole('admin'), adminController.updateUserRole);
router.put('/users/:id/status', requireRole('admin'), adminController.updateUserStatus);

module.exports = router;
