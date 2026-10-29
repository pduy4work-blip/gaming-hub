const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

router.get('/', optionalAuth, postsController.getPosts);
router.get('/:slug', optionalAuth, postsController.getPostBySlug);
router.post('/', requireAuth, postsController.createPost);
router.put('/:id', requireAuth, postsController.updatePost);
router.delete('/:id', requireAuth, postsController.deletePost);

router.post('/:id/like', requireAuth, postsController.toggleLike);
router.post('/:id/bookmark', requireAuth, postsController.toggleBookmark);

module.exports = router;
