const { queryAll, queryOne, queryRun } = require('../database');

function getNotifications(req, res) {
  const sql = `
    SELECT 
      n.id,
      n.type,
      n.target_type,
      n.target_id,
      n.message,
      n.read_at,
      n.created_at,
      u.username AS actor_username,
      u.display_name AS actor_display_name,
      u.avatar_url AS actor_avatar_url
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.recipient_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `;

  const notifications = queryAll(sql, [req.user.id]);
  return res.json({
    success: true,
    data: notifications
  });
}

function getUnreadCount(req, res) {
  const row = queryOne(
    'SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND read_at IS NULL',
    [req.user.id]
  );
  return res.json({
    success: true,
    unreadCount: row ? row.count : 0
  });
}

function markAsRead(req, res) {
  const id = parseInt(req.params.id, 10);
  queryRun(
    'UPDATE notifications SET read_at = datetime(\'now\') WHERE id = ? AND recipient_id = ?',
    [id, req.user.id]
  );
  return res.json({ success: true, message: 'Đã đánh dấu đã đọc.' });
}

function markAllAsRead(req, res) {
  queryRun(
    'UPDATE notifications SET read_at = datetime(\'now\') WHERE recipient_id = ? AND read_at IS NULL',
    [req.user.id]
  );
  return res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc.' });
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
