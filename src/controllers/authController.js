const { queryOne, queryRun } = require('../database');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { createSignedToken } = require('../utils/session');
const config = require('../config');

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: config.server.env === 'production',
  sameSite: 'lax',
  maxAge: config.server.tokenExpiresInHours * 3600 * 1000,
  path: '/'
};

/**
 * Register a new user
 */
function register(req, res) {
  const { username, email, password, confirmPassword, displayName } = req.body || {};

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng điền đầy đủ tên đăng nhập, email và mật khẩu.',
      code: 'VALIDATION_ERROR'
    });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // Username validation: 3-20 chars, alphanumeric + underscores
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return res.status(400).json({
      success: false,
      error: 'Tên đăng nhập phải từ 3 đến 20 ký tự và chỉ chứa chữ cái, số hoặc dấu gạch dưới (_).',
      code: 'INVALID_USERNAME'
    });
  }

  // Email regex
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Địa chỉ email không đúng định dạng.',
      code: 'INVALID_EMAIL'
    });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.',
      code: 'WEAK_PASSWORD'
    });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'Mật khẩu xác nhận không khớp.',
      code: 'PASSWORD_MISMATCH'
    });
  }

  // Check unique username
  const existingUser = queryOne('SELECT id FROM users WHERE username = ?', [cleanUsername]);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.',
      code: 'USERNAME_TAKEN'
    });
  }

  // Check unique email
  const existingEmail = queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      error: 'Email này đã được đăng ký tài khoản.',
      code: 'EMAIL_TAKEN'
    });
  }

  const name = displayName && displayName.trim() ? displayName.trim() : cleanUsername;
  const passwordHash = hashPassword(password);

  try {
    const insertRes = queryRun(
      `INSERT INTO users (username, email, password_hash, display_name, role, status)
       VALUES (?, ?, ?, ?, 'member', 'active')`,
      [cleanUsername, cleanEmail, passwordHash, name]
    );

    const userId = Number(insertRes.lastInsertRowid);
    const token = createSignedToken({ userId, username: cleanUsername, role: 'member' });

    res.cookie(config.server.cookieName, token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        displayName: name,
        avatarUrl: '',
        bio: '',
        role: 'member'
      },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi máy chủ trong quá trình đăng ký. Vui lòng thử lại sau.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Login
 */
function login(req, res) {
  const { usernameOrEmail, password } = req.body || {};

  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu.',
      code: 'VALIDATION_ERROR'
    });
  }

  const queryIdentifier = usernameOrEmail.trim().toLowerCase();

  const user = queryOne(
    `SELECT id, username, email, password_hash, display_name, avatar_url, bio, role, status
     FROM users
     WHERE username = ? OR email = ?`,
    [queryIdentifier, queryIdentifier]
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  if (user.status === 'banned') {
    return res.status(403).json({
      success: false,
      error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để biết thêm chi tiết.',
      code: 'USER_BANNED'
    });
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  const token = createSignedToken({
    userId: user.id,
    username: user.username,
    role: user.role
  });

  res.cookie(config.server.cookieName, token, cookieOptions);

  return res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      role: user.role
    },
    token
  });
}

/**
 * Logout
 */
function logout(req, res) {
  res.clearCookie(config.server.cookieName, { path: '/' });
  return res.json({
    success: true,
    message: 'Đã đăng xuất thành công.'
  });
}

/**
 * Get current user profile
 */
function getCurrentUser(req, res) {
  if (!req.user) {
    return res.json({
      success: true,
      user: null
    });
  }

  return res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      displayName: req.user.display_name,
      avatarUrl: req.user.avatar_url,
      bio: req.user.bio,
      role: req.user.role
    }
  });
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
