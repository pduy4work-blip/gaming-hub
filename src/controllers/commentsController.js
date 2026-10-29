const { queryAll, queryOne, queryRun } = require('../database');
const { sanitizeHtml } = require('../utils/sanitize');

/**
 * Get comments for a post organized into tree structure
 */
function getPostComments(req, res) {
  const postId = parseInt(req.params.postId, 10);

  const commentsSql = `
    SELECT 
      c.id,
      c.post_id,
      c.author_id,
      c.parent_id,
      c.content,
      c.status,
      c.created_at,
      c.updated_at,
      u.username AS author_username,
      u.display_name AS author_display_name,
      u.avatar_url AS author_avatar_url,
      u.role AS author_role
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = ? AND c.status = 'active'
    ORDER BY c.created_at ASC
  `;

  const rows = queryAll(commentsSql, [postId]);

  // Construct nested tree
  const commentMap = {};
  const rootComments = [];

  for (const c of rows) {
    commentMap[c.id] = { ...c, replies: [] };
  }

  for (const c of rows) {
    if (c.parent_id && commentMap[c.parent_id]) {
      commentMap[c.parent_id].replies.push(commentMap[c.id]);
    } else {
      rootComments.push(commentMap[c.id]);
    }
  }

  return res.json({
    success: true,
    data: rootComments,
    total: rows.length
  });
}

/**
 * Add a comment or reply
 */
function createComment(req, res) {
  const postId = parseInt(req.params.postId, 10);
  const { content, parentId } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Nội dung bình luận không được để trống.',
      code: 'VALIDATION_ERROR'
    });
  }

  const post = queryOne('SELECT id, author_id, title FROM posts WHERE id = ?', [postId]);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Bài viết không tồn tại.',
      code: 'POST_NOT_FOUND'
    });
  }

  const cleanContent = sanitizeHtml(content.trim());
  let targetParentId = null;

  if (parentId) {
    const parentComment = queryOne('SELECT id, author_id FROM comments WHERE id = ? AND post_id = ?', [parentId, postId]);
    if (parentComment) {
      targetParentId = parentComment.id;
    }
  }

  try {
    const insertRes = queryRun(
      `INSERT INTO comments (post_id, author_id, parent_id, content)
       VALUES (?, ?, ?, ?)`,
      [postId, req.user.id, targetParentId, cleanContent]
    );

    const commentId = Number(insertRes.lastInsertRowid);
    const newComment = queryOne(
      `SELECT 
        c.id, c.post_id, c.author_id, c.parent_id, c.content, c.status, c.created_at,
        u.username AS author_username, u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url, u.role AS author_role
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    // Notify author of post or parent comment
    if (targetParentId) {
      const parent = queryOne('SELECT author_id FROM comments WHERE id = ?', [targetParentId]);
      if (parent && parent.author_id !== req.user.id) {
        queryRun(
          `INSERT INTO notifications (recipient_id, actor_id, type, target_type, target_id, message)
           VALUES (?, ?, 'reply', 'comment', ?, ?)`,
          [
            parent.author_id,
            req.user.id,
            commentId,
            `${req.user.display_name} đã trả lời bình luận của bạn trong bài viết "${post.title}".`
          ]
        );
      }
    } else if (post.author_id !== req.user.id) {
      queryRun(
        `INSERT INTO notifications (recipient_id, actor_id, type, target_type, target_id, message)
         VALUES (?, ?, 'comment', 'post', ?, ?)`,
        [
          post.author_id,
          req.user.id,
          postId,
          `${req.user.display_name} đã bình luận về bài viết của bạn.`
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Bình luận thành công!',
      data: { ...newComment, replies: [] }
    });
  } catch (err) {
    console.error('Comment error:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể đăng bình luận vào lúc này.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Edit own comment
 */
function updateComment(req, res) {
  const commentId = parseInt(req.params.id, 10);
  const { content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Nội dung không được để trống.' });
  }

  const comment = queryOne('SELECT * FROM comments WHERE id = ?', [commentId]);
  if (!comment) {
    return res.status(404).json({ success: false, error: 'Bình luận không tồn tại.' });
  }

  if (comment.author_id !== req.user.id && !['moderator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Bạn không có quyền sửa bình luận này.' });
  }

  const cleanContent = sanitizeHtml(content.trim());
  queryRun('UPDATE comments SET content = ?, updated_at = datetime(\'now\') WHERE id = ?', [cleanContent, commentId]);

  return res.json({
    success: true,
    message: 'Cập nhật bình luận thành công!'
  });
}

/**
 * Delete comment
 */
function deleteComment(req, res) {
  const commentId = parseInt(req.params.id, 10);
  const comment = queryOne('SELECT * FROM comments WHERE id = ?', [commentId]);

  if (!comment) {
    return res.status(404).json({ success: false, error: 'Bình luận không tồn tại.' });
  }

  if (comment.author_id !== req.user.id && !['moderator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bình luận này.' });
  }

  queryRun('DELETE FROM comments WHERE id = ?', [commentId]);

  return res.json({
    success: true,
    message: 'Đã xóa bình luận thành công.'
  });
}

module.exports = {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
};
