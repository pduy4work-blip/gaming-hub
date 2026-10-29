const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const { requireAuth } = require('../middleware/auth');

router.get('/post/:postId', commentsController.getPostComments);
router.post('/post/:postId', requireAuth, commentsController.createComment);
router.put('/:id', requireAuth, commentsController.updateComment);
router.delete('/:id', requireAuth, commentsController.deleteComment);

module.exports = router;
