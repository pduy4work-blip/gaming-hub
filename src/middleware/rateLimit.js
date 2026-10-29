const config = require('../config');

// In-memory rate limiting store: ip -> { count, resetTime }
const requestCounts = new Map();

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.maxRequests;
  const message = options.message || 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${options.prefix || 'global'}:${ip}`;
    const now = Date.now();

    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfterSeconds
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  authRateLimiter: createRateLimiter({
    prefix: 'auth',
    windowMs: 15 * 60 * 1000,
    max: config.rateLimit.authMaxRequests,
    message: 'Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút.'
  }),
  apiRateLimiter: createRateLimiter({
    prefix: 'api',
    windowMs: 15 * 60 * 1000,
    max: config.rateLimit.maxRequests
  })
};
