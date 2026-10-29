const { queryAll, queryOne, queryRun } = require('../database');

/**
 * Submit a report for a post, comment, or user
 */
function submitReport(req, res) {
  const { targetType, targetId, reason, description } = req.body || {};

  if (!targetType || !['post', 'comment', 'user'].includes(targetType)) {
    return res.status(400).json({ success: false, error: 'Loại nội dung báo cáo không hợp lệ.' });
  }

  if (!targetId || !reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'Vui lòng chọn lý do báo cáo.' });
  }

  queryRun(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, targetType, parseInt(targetId, 10), reason.trim(), (description || '').trim()]
  );

  return res.status(201).json({
    success: true,
    message: 'Báo cáo của bạn đã được gửi tới Ban quản trị để xem xét. Cảm ơn bạn!'
  });
}

/**
 * Get dashboard statistics
 */
function getAdminStats(req, res) {
  const totalUsers = queryOne('SELECT COUNT(*) AS c FROM users').c;
  const totalPosts = queryOne('SELECT COUNT(*) AS c FROM posts WHERE status = \'published\'').c;
  const totalComments = queryOne('SELECT COUNT(*) AS c FROM comments WHERE status = \'active\'').c;
  const pendingReports = queryOne('SELECT COUNT(*) AS c FROM reports WHERE status = \'pending\'').c;

  return res.json({
    success: true,
    data: {
      totalUsers,
      totalPosts,
      totalComments,
      pendingReports
    }
  });
}

/**
 * List all users for management
 */
function getUsersList(req, res) {
  const { search, role, status } = req.query;
  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    conditions.push('(username LIKE ? OR display_name LIKE ? OR email LIKE ?)');
    const kw = `%${search.trim()}%`;
    params.push(kw, kw, kw);
  }

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      id, username, email, display_name, avatar_url, role, status, created_at,
      (SELECT COUNT(*) FROM posts WHERE author_id = users.id) AS posts_count,
      (SELECT COUNT(*) FROM comments WHERE author_id = users.id) AS comments_count
    FROM users
    ${where}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const users = queryAll(sql, params);
  return res.json({ success: true, data: users });
}

/**
 * Update user role (admin only)
 */
function updateUserRole(req, res) {
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body || {};

  if (!['member', 'moderator', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Vai trò không hợp lệ.' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ success: false, error: 'Bạn không thể tự thay đổi vai trò của chính mình.' });
  }

  queryRun('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?', [role, userId]);

  queryRun(
    `INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, reason)
     VALUES (?, ?, 'user', ?, ?)`,
    [req.user.id, `Cập nhật vai trò thành ${role}`, userId, 'Quản lý phân quyền']
  );

  return res.json({ success: true, message: `Đã cập nhật vai trò người dùng thành ${role}.` });
}

/**
 * Update user status (ban / activate)
 */
function updateUserStatus(req, res) {
  const userId = parseInt(req.params.id, 10);
  const { status, reason } = req.body || {};

  if (!['active', 'banned'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ.' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ success: false, error: 'Bạn không thể tự khóa tài khoản của chính mình.' });
  }

  queryRun('UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', [status, userId]);

  queryRun(
    `INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, reason)
     VALUES (?, ?, 'user', ?, ?)`,
    [req.user.id, status === 'banned' ? 'Khóa tài khoản' : 'Kích hoạt lại tài khoản', userId, reason || '']
  );

  return res.json({ success: true, message: `Đã cập nhật trạng thái người dùng thành ${status}.` });
}

/**
 * Get reports list
 */
function getReportsList(req, res) {
  const { status = 'pending' } = req.query;

  const sql = `
    SELECT 
      r.id,
      r.target_type,
      r.target_id,
      r.reason,
      r.description,
      r.status,
      r.created_at,
      r.reviewed_at,
      u_rep.username AS reporter_username,
      u_rep.display_name AS reporter_display_name,
      u_rev.username AS reviewer_username
    FROM reports r
    JOIN users u_rep ON r.reporter_id = u_rep.id
    LEFT JOIN users u_rev ON r.reviewed_by = u_rev.id
    WHERE r.status = ?
    ORDER BY r.created_at DESC
  `;

  const reports = queryAll(sql, [status]);
  return res.json({ success: true, data: reports });
}

/**
 * Review report (resolve or dismiss)
 */
function reviewReport(req, res) {
  const reportId = parseInt(req.params.id, 10);
  const { status, actionNotes } = req.body || {};

  if (!['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Trạng thái xử lý không hợp lệ.' });
  }

  queryRun(
    `UPDATE reports
     SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
     WHERE id = ?`,
    [status, req.user.id, reportId]
  );

  queryRun(
    `INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, reason)
     VALUES (?, ?, 'report', ?, ?)`,
    [req.user.id, `Xử lý báo cáo: ${status}`, reportId, actionNotes || '']
  );

  return res.json({ success: true, message: `Báo cáo đã được chuyển sang trạng thái ${status}.` });
}

/**
 * Get moderation logs
 */
function getModerationLogs(req, res) {
  const sql = `
    SELECT 
      ml.id,
      ml.action,
      ml.target_type,
      ml.target_id,
      ml.reason,
      ml.created_at,
      u.username AS moderator_username,
      u.display_name AS moderator_display_name
    FROM moderation_logs ml
    JOIN users u ON ml.moderator_id = u.id
    ORDER BY ml.created_at DESC
    LIMIT 100
  `;

  const logs = queryAll(sql);
  return res.json({ success: true, data: logs });
}

module.exports = {
  submitReport,
  getAdminStats,
  getUsersList,
  updateUserRole,
  updateUserStatus,
  getReportsList,
  reviewReport,
  getModerationLogs,
};
