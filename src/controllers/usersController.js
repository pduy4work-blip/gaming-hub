const { queryOne, queryAll, queryRun } = require('../database');

function getUserProfile(req, res) {
  const { username } = req.params;

  const sql = `
    SELECT 
      u.id,
      u.username,
      u.display_name,
      u.avatar_url,
      u.bio,
      u.role,
      u.created_at,
      (SELECT COUNT(*) FROM posts WHERE author_id = u.id AND status = 'published') AS posts_count,
      (SELECT COUNT(*) FROM game_follows WHERE user_id = u.id) AS followed_games_count,
      (SELECT COUNT(*) FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.author_id = u.id) AS total_likes_received
    FROM users u
    WHERE u.username = ? AND u.status = 'active'
  `;

  const user = queryOne(sql, [username]);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy người dùng.',
      code: 'USER_NOT_FOUND'
    });
  }

  return res.json({
    success: true,
    data: user
  });
}

function updateProfile(req, res) {
  const { displayName, bio, avatarUrl } = req.body || {};

  if (!displayName || !displayName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Tên hiển thị không được để trống.'
    });
  }

  const cleanName = displayName.trim();
  const cleanBio = bio !== undefined ? bio.trim() : req.user.bio;
  const cleanAvatar = avatarUrl !== undefined ? avatarUrl.trim() : req.user.avatar_url;

  queryRun(
    `UPDATE users
     SET display_name = ?, bio = ?, avatar_url = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [cleanName, cleanBio, cleanAvatar, req.user.id]
  );

  const updatedUser = queryOne(
    'SELECT id, username, email, display_name, avatar_url, bio, role FROM users WHERE id = ?',
    [req.user.id]
  );

  return res.json({
    success: true,
    message: 'Cập nhật hồ sơ thành công!',
    user: updatedUser
  });
}

function getUserBookmarks(req, res) {
  const { username } = req.params;

  // Bookmarks are private to the user themselves (or admin)
  if (!req.user || (req.user.username !== username && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      error: 'Danh sách bài viết đã lưu là riêng tư.'
    });
  }

  const targetUser = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
  }

  const sql = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      p.view_count,
      p.created_at,
      u.username AS author_username,
      u.display_name AS author_display_name,
      u.avatar_url AS author_avatar_url,
      g.name AS game_name,
      g.slug AS game_slug,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active') AS comments_count,
      1 AS is_bookmarked,
      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked
    FROM bookmarks b
    JOIN posts p ON b.post_id = p.id
    JOIN users u ON p.author_id = u.id
    LEFT JOIN games g ON p.game_id = g.id
    WHERE b.user_id = ? AND p.status = 'published'
    ORDER BY b.created_at DESC
  `;

  const posts = queryAll(sql, [req.user.id, targetUser.id]);
  return res.json({
    success: true,
    data: posts.map(p => ({ ...p, is_liked: Boolean(p.is_liked), is_bookmarked: true }))
  });
}

function getUserFollowedGames(req, res) {
  const { username } = req.params;
  const targetUser = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
  }

  const sql = `
    SELECT 
      g.id,
      g.name,
      g.slug,
      g.description,
      g.cover_image_url,
      (SELECT COUNT(*) FROM posts WHERE game_id = g.id AND status = 'published') AS posts_count,
      (SELECT COUNT(*) FROM game_follows WHERE game_id = g.id) AS followers_count,
      1 AS is_following
    FROM game_follows gf
    JOIN games g ON gf.game_id = g.id
    WHERE gf.user_id = ? AND g.status = 'active'
    ORDER BY gf.created_at DESC
  `;

  const games = queryAll(sql, [targetUser.id]);
  return res.json({
    success: true,
    data: games.map(g => ({ ...g, is_following: true }))
  });
}

module.exports = {
  getUserProfile,
  updateProfile,
  getUserBookmarks,
  getUserFollowedGames,
};
