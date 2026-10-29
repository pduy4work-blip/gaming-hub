const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, adminController.submitReport);

module.exports = router;
