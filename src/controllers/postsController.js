const { queryAll, queryOne, queryRun } = require('../database');
const { generateSlug } = require('../utils/crypto');
const { sanitizeHtml, escapeHtml } = require('../utils/sanitize');
const config = require('../config');

/**
 * List posts with filtering, search, tabs, and pagination
 */
function getPosts(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(req.query.limit || String(config.pagination.defaultLimit), 10))
  );
  const offset = (page - 1) * limit;

  const { tab = 'latest', gameSlug, gameId, search, author, status = 'published' } = req.query;
  const currentUserId = req.user ? req.user.id : 0;

  const conditions = [];
  const params = [];

  // Status condition
  if (status && ['published', 'draft', 'hidden'].includes(status)) {
    // Only author or moderator/admin can view drafts/hidden
    if (status !== 'published') {
      if (!req.user) {
        return res.status(403).json({ success: false, error: 'Không có quyền truy cập.' });
      }
      if (req.user.role === 'member') {
        conditions.push('p.author_id = ?');
        params.push(req.user.id);
      }
    }
    conditions.push('p.status = ?');
    params.push(status);
  }

  // Filter by Game
  if (gameSlug) {
    conditions.push('g.slug = ?');
    params.push(gameSlug);
  } else if (gameId) {
    conditions.push('p.game_id = ?');
    params.push(parseInt(gameId, 10));
  }

  // Filter by Author username
  if (author) {
    conditions.push('u.username = ?');
    params.push(author);
  }

  // Search keyword in title or content
  if (search && search.trim()) {
    const keyword = `%${search.trim()}%`;
    conditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)');
    params.push(keyword, keyword, keyword);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Order clause by tab
  let orderClause = 'ORDER BY p.created_at DESC';
  if (tab === 'trending') {
    // Trending: weighted combination of views, likes, and recency
    orderClause = 'ORDER BY (p.view_count * 1 + likes_count * 3 + comments_count * 2) DESC, p.created_at DESC';
  } else if (tab === 'most_discussed') {
    orderClause = 'ORDER BY comments_count DESC, p.created_at DESC';
  }

  // Count total matching posts
  const countSql = `
    SELECT COUNT(p.id) AS total
    FROM posts p
    LEFT JOIN games g ON p.game_id = g.id
    LEFT JOIN users u ON p.author_id = u.id
    ${whereClause}
  `;
  const countRow = queryOne(countSql, params);
  const total = countRow ? countRow.total : 0;
  const totalPages = Math.ceil(total / limit);

  // Fetch paginated posts
  const postsSql = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      p.view_count,
      p.status,
      p.created_at,
      p.published_at,
      u.id AS author_id,
      u.username AS author_username,
      u.display_name AS author_display_name,
      u.avatar_url AS author_avatar_url,
      u.role AS author_role,
      g.id AS game_id,
      g.name AS game_name,
      g.slug AS game_slug,
      g.cover_image_url AS game_cover_url,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active') AS comments_count,
      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
      EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN games g ON p.game_id = g.id
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [currentUserId, currentUserId, ...params, limit, offset];
  const posts = queryAll(postsSql, queryParams);

  // Transform boolean fields
  const formattedPosts = posts.map(post => ({
    ...post,
    is_liked: Boolean(post.is_liked),
    is_bookmarked: Boolean(post.is_bookmarked)
  }));

  return res.json({
    success: true,
    data: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}

/**
 * Get single post by slug
 */
function getPostBySlug(req, res) {
  const { slug } = req.params;
  const currentUserId = req.user ? req.user.id : 0;

  const sql = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.content,
      p.excerpt,
      p.view_count,
      p.status,
      p.created_at,
      p.updated_at,
      p.published_at,
      u.id AS author_id,
      u.username AS author_username,
      u.display_name AS author_display_name,
      u.avatar_url AS author_avatar_url,
      u.bio AS author_bio,
      u.role AS author_role,
      g.id AS game_id,
      g.name AS game_name,
      g.slug AS game_slug,
      g.description AS game_description,
      g.cover_image_url AS game_cover_url,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active') AS comments_count,
      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
      EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN games g ON p.game_id = g.id
    WHERE p.slug = ?
  `;

  const post = queryOne(sql, [currentUserId, currentUserId, slug]);

  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Bài viết không tồn tại hoặc đã bị xóa.',
      code: 'POST_NOT_FOUND'
    });
  }

  // Check draft or hidden access
  if (post.status !== 'published') {
    if (!req.user || (req.user.id !== post.author_id && !['moderator', 'admin'].includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        error: 'Bài viết này hiện chưa được công khai.',
        code: 'POST_UNAVAILABLE'
      });
    }
  }

  // Increment view count safely
  queryRun('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);
  post.view_count += 1;

  // Format boolean flags
  post.is_liked = Boolean(post.is_liked);
  post.is_bookmarked = Boolean(post.is_bookmarked);

  return res.json({
    success: true,
    data: post
  });
}

/**
 * Create a new post
 */
function createPost(req, res) {
  const { title, content, gameId, excerpt, status = 'published' } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Tiêu đề bài viết không được để trống.',
      code: 'VALIDATION_ERROR'
    });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Nội dung bài viết không được để trống.',
      code: 'VALIDATION_ERROR'
    });
  }

  const cleanTitle = title.trim();
  const slug = generateSlug(cleanTitle);
  const sanitizedContent = sanitizeHtml(content);

  // Auto excerpt if not provided: strip HTML tags and take first 160 chars
  let cleanExcerpt = excerpt ? excerpt.trim() : '';
  if (!cleanExcerpt) {
    cleanExcerpt = sanitizedContent.replace(/<[^>]*>/g, '').slice(0, 160).trim();
    if (cleanExcerpt.length === 160) cleanExcerpt += '...';
  }

  const postStatus = ['published', 'draft'].includes(status) ? status : 'published';
  const targetGameId = gameId ? parseInt(gameId, 10) : null;

  try {
    const insertRes = queryRun(
      `INSERT INTO posts (author_id, game_id, title, slug, content, excerpt, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [req.user.id, targetGameId, cleanTitle, slug, sanitizedContent, cleanExcerpt, postStatus]
    );

    const newPostId = Number(insertRes.lastInsertRowid);
    const newPost = queryOne('SELECT * FROM posts WHERE id = ?', [newPostId]);

    return res.status(201).json({
      success: true,
      message: 'Tạo bài viết thành công!',
      data: newPost
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo bài viết vào lúc này. Vui lòng thử lại.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Update an existing post
 */
function updatePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  const post = queryOne('SELECT * FROM posts WHERE id = ?', [postId]);

  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy bài viết.',
      code: 'POST_NOT_FOUND'
    });
  }

  // Permission check: owner or moderator/admin
  const isOwner = req.user.id === post.author_id;
  const isStaff = ['moderator', 'admin'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({
      success: false,
      error: 'Bạn không có quyền chỉnh sửa bài viết này.',
      code: 'FORBIDDEN'
    });
  }

  const { title, content, gameId, excerpt, status } = req.body || {};

  const cleanTitle = title && title.trim() ? title.trim() : post.title;
  const cleanContent = content && content.trim() ? sanitizeHtml(content) : post.content;
  const targetGameId = gameId !== undefined ? (gameId ? parseInt(gameId, 10) : null) : post.game_id;
  const cleanExcerpt = excerpt !== undefined ? excerpt.trim() : post.excerpt;
  const postStatus = status && ['published', 'draft', 'hidden'].includes(status) ? status : post.status;

  queryRun(
    `UPDATE posts
     SET title = ?, content = ?, game_id = ?, excerpt = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [cleanTitle, cleanContent, targetGameId, cleanExcerpt, postStatus, postId]
  );

  const updated = queryOne('SELECT * FROM posts WHERE id = ?', [postId]);

  return res.json({
    success: true,
    message: 'Cập nhật bài viết thành công!',
    data: updated
  });
}

/**
 * Delete a post
 */
function deletePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  const post = queryOne('SELECT * FROM posts WHERE id = ?', [postId]);

  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy bài viết.',
      code: 'POST_NOT_FOUND'
    });
  }

  const isOwner = req.user.id === post.author_id;
  const isStaff = ['moderator', 'admin'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({
      success: false,
      error: 'Bạn không có quyền xóa bài viết này.',
      code: 'FORBIDDEN'
    });
  }

  queryRun('DELETE FROM posts WHERE id = ?', [postId]);

  return res.json({
    success: true,
    message: 'Đã xóa bài viết thành công.'
  });
}

/**
 * Toggle like for a post
 */
function toggleLike(req, res) {
  const postId = parseInt(req.params.id, 10);
  const post = queryOne('SELECT id, author_id, title FROM posts WHERE id = ?', [postId]);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Bài viết không tồn tại.' });
  }

  const existing = queryOne(
    'SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?',
    [req.user.id, postId]
  );

  let liked = false;
  if (existing) {
    queryRun('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);
    liked = false;
  } else {
    queryRun('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
    liked = true;

    // Send notification to post author if different user
    if (post.author_id !== req.user.id) {
      queryRun(
        `INSERT INTO notifications (recipient_id, actor_id, type, target_type, target_id, message)
         VALUES (?, ?, 'like', 'post', ?, ?)`,
        [
          post.author_id,
          req.user.id,
          post.id,
          `${req.user.display_name} đã thích bài viết của bạn.`
        ]
      );
    }
  }

  const countRow = queryOne('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?', [postId]);
  const likesCount = countRow ? countRow.count : 0;

  return res.json({
    success: true,
    liked,
    likesCount,
    message: liked ? 'Đã thích bài viết!' : 'Đã bỏ thích bài viết.'
  });
}

/**
 * Toggle bookmark for a post
 */
function toggleBookmark(req, res) {
  const postId = parseInt(req.params.id, 10);
  const post = queryOne('SELECT id FROM posts WHERE id = ?', [postId]);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Bài viết không tồn tại.' });
  }

  const existing = queryOne(
    'SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?',
    [req.user.id, postId]
  );

  let bookmarked = false;
  if (existing) {
    queryRun('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);
    bookmarked = false;
  } else {
    queryRun('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
    bookmarked = true;
  }

  return res.json({
    success: true,
    bookmarked,
    message: bookmarked ? 'Đã lưu bài viết vào danh sách đánh dấu.' : 'Đã bỏ lưu bài viết.'
  });
}

module.exports = {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
};
