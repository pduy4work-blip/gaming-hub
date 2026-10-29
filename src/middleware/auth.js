const { verifySignedToken } = require('../utils/session');
const { queryOne } = require('../database');
const config = require('../config');

/**
 * Middleware: parse user from cookie or authorization header (optional auth)
 */
function optionalAuth(req, res, next) {
  req.user = null;

  // 1. Check signed cookie
  let token = req.cookies && req.cookies[config.server.cookieName];

  // 2. Or check Authorization header: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return next();
  }

  const payload = verifySignedToken(token);
  if (!payload || !payload.userId) {
    return next();
  }

  // Fetch fresh user record from database
  const user = queryOne(
    'SELECT id, username, email, display_name, avatar_url, bio, role, status FROM users WHERE id = ?',
    [payload.userId]
  );

  if (user && user.status === 'active') {
    req.user = user;
  }

  next();
}

/**
 * Middleware: require authenticated user
 */
function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để thực hiện chức năng này.',
        code: 'UNAUTHORIZED'
      });
    }
    if (req.user.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.',
        code: 'USER_BANNED'
      });
    }
    next();
  });
}

/**
 * Middleware: require specific role (e.g. 'admin' or ['moderator', 'admin'])
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không có quyền truy cập vào tài nguyên này.',
          code: 'FORBIDDEN'
        });
      }
      next();
    });
  };
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole,
};
