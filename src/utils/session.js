const crypto = require('node:crypto');
const config = require('../config');

/**
 * Sign a payload object into a signed token: base64(payload).signature
 */
function createSignedToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + config.server.tokenExpiresInHours * 3600 * 1000
  };
  const jsonStr = JSON.stringify(data);
  const base64Payload = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.server.sessionSecret)
    .update(base64Payload)
    .digest('base64url');
  
  return `${base64Payload}.${signature}`;
}

/**
 * Verify and decode a signed token
 */
function verifySignedToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  
  const [base64Payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', config.server.sessionSecret)
    .update(base64Payload)
    .digest('base64url');
  
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;
  
  try {
    const jsonStr = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);
    if (!data.exp || Date.now() > data.exp) {
      return null; // Expired
    }
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  createSignedToken,
  verifySignedToken
};
