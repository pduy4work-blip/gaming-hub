const { queryAll, queryOne, queryRun } = require('../database');
const { generateSlug } = require('../utils/crypto');

function getGames(req, res) {
  const currentUserId = req.user ? req.user.id : 0;
  const { search } = req.query;

  let whereClause = "WHERE g.status = 'active'";
  const params = [currentUserId];

  if (search && search.trim()) {
    whereClause += ' AND (g.name LIKE ? OR g.description LIKE ?)';
    const kw = `%${search.trim()}%`;
    params.push(kw, kw);
  }

  const sql = `
    SELECT 
      g.id,
      g.name,
      g.slug,
      g.description,
      g.cover_image_url,
      g.created_at,
      (SELECT COUNT(*) FROM posts WHERE game_id = g.id AND status = 'published') AS posts_count,
      (SELECT COUNT(*) FROM game_follows WHERE game_id = g.id) AS followers_count,
      EXISTS(SELECT 1 FROM game_follows WHERE game_id = g.id AND user_id = ?) AS is_following
    FROM games g
    ${whereClause}
    ORDER BY posts_count DESC, followers_count DESC
  `;

  const games = queryAll(sql, params);

  return res.json({
    success: true,
    data: games.map(g => ({ ...g, is_following: Boolean(g.is_following) }))
  });
}

function getGameBySlug(req, res) {
  const { slug } = req.params;
  const currentUserId = req.user ? req.user.id : 0;

  const sql = `
    SELECT 
      g.id,
      g.name,
      g.slug,
      g.description,
      g.cover_image_url,
      g.created_at,
      (SELECT COUNT(*) FROM posts WHERE game_id = g.id AND status = 'published') AS posts_count,
      (SELECT COUNT(*) FROM game_follows WHERE game_id = g.id) AS followers_count,
      EXISTS(SELECT 1 FROM game_follows WHERE game_id = g.id AND user_id = ?) AS is_following
    FROM games g
    WHERE g.slug = ?
  `;

  const game = queryOne(sql, [currentUserId, slug]);
  if (!game) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy trò chơi.' });
  }

  game.is_following = Boolean(game.is_following);
  return res.json({ success: true, data: game });
}

function toggleFollowGame(req, res) {
  const gameId = parseInt(req.params.id, 10);
  const game = queryOne('SELECT id, name FROM games WHERE id = ?', [gameId]);

  if (!game) {
    return res.status(404).json({ success: false, error: 'Trò chơi không tồn tại.' });
  }

  const existing = queryOne(
    'SELECT 1 FROM game_follows WHERE user_id = ? AND game_id = ?',
    [req.user.id, gameId]
  );

  let following = false;
  if (existing) {
    queryRun('DELETE FROM game_follows WHERE user_id = ? AND game_id = ?', [req.user.id, gameId]);
    following = false;
  } else {
    queryRun('INSERT INTO game_follows (user_id, game_id) VALUES (?, ?)', [req.user.id, gameId]);
    following = true;
  }

  const countRow = queryOne('SELECT COUNT(*) AS c FROM game_follows WHERE game_id = ?', [gameId]);
  const followersCount = countRow ? countRow.c : 0;

  return res.json({
    success: true,
    following,
    followersCount,
    message: following ? `Đã theo dõi cộng đồng ${game.name}` : `Đã bỏ theo dõi cộng đồng ${game.name}`
  });
}

function createGame(req, res) {
  const { name, description, coverImageUrl } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Tên trò chơi không được để trống.' });
  }

  const cleanName = name.trim();
  const slug = generateSlug(cleanName);

  try {
    const insertRes = queryRun(
      'INSERT INTO games (name, slug, description, cover_image_url) VALUES (?, ?, ?, ?)',
      [cleanName, slug, description || '', coverImageUrl || '']
    );

    const newGame = queryOne('SELECT * FROM games WHERE id = ?', [Number(insertRes.lastInsertRowid)]);
    return res.status(201).json({ success: true, data: newGame, message: 'Thêm trò chơi thành công!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Lỗi khi tạo trò chơi.' });
  }
}

function updateGame(req, res) {
  const gameId = parseInt(req.params.id, 10);
  const { name, description, coverImageUrl, status } = req.body || {};

  const game = queryOne('SELECT * FROM games WHERE id = ?', [gameId]);
  if (!game) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy trò chơi.' });
  }

  queryRun(
    `UPDATE games
     SET name = ?, description = ?, cover_image_url = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      name ? name.trim() : game.name,
      description !== undefined ? description : game.description,
      coverImageUrl !== undefined ? coverImageUrl : game.cover_image_url,
      status || game.status,
      gameId
    ]
  );

  const updated = queryOne('SELECT * FROM games WHERE id = ?', [gameId]);
  return res.json({ success: true, data: updated, message: 'Cập nhật thành công!' });
}

module.exports = {
  getGames,
  getGameBySlug,
  toggleFollowGame,
  createGame,
  updateGame,
};
