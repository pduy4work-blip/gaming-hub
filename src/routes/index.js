const express = require('express');
const router = express.Router();
const config = require('../config');

const authRoutes = require('./authRoutes');
const postsRoutes = require('./postsRoutes');
const commentsRoutes = require('./commentsRoutes');
const gamesRoutes = require('./gamesRoutes');
const usersRoutes = require('./usersRoutes');
const notificationsRoutes = require('./notificationsRoutes');
const adminRoutes = require('./adminRoutes');
const reportsRoutes = require('./reportsRoutes');
const uploadRoutes = require('./uploadRoutes');

// API Brand & Info
router.get('/info', (req, res) => {
  res.json({
    name: config.app.name,
    shortName: config.app.shortName,
    tagline: config.app.tagline,
    description: config.app.description,
    version: config.app.version,
    status: 'online'
  });
});

router.use('/auth', authRoutes);
router.use('/posts', postsRoutes);
router.use('/comments', commentsRoutes);
router.use('/games', gamesRoutes);
router.use('/users', usersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportsRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
