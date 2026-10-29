/**
 * Basic XSS sanitizer and HTML escaper
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize rich content allowing only safe tags and attributes
 */
function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  
  // Remove script, iframe, object, embed, style, event handlers
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '') // remove onclick, onload, etc.
    .replace(/javascript:/gi, 'blocked:');

  // Strip disallowed tags (only allow: p, br, b, strong, i, em, u, h2, h3, h4, ul, ol, li, blockquote, pre, code, a, img)
  cleaned = cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    const safeTags = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'span'];
    const lowerTag = tag.toLowerCase();
    if (!safeTags.includes(lowerTag)) {
      return '';
    }
    
    // If it's a closing tag
    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }
    
    // Filter attributes
    let safeAttrs = '';
    if (lowerTag === 'a') {
      const hrefMatch = attrs.match(/href\s*=\s*(["'])(.*?)\1/i);
      if (hrefMatch && !hrefMatch[2].startsWith('javascript:')) {
        safeAttrs += ` href="${escapeHtml(hrefMatch[2])}" target="_blank" rel="noopener noreferrer"`;
      }
    } else if (lowerTag === 'img') {
      const srcMatch = attrs.match(/src\s*=\s*(["'])(.*?)\1/i);
      const altMatch = attrs.match(/alt\s*=\s*(["'])(.*?)\1/i);
      if (srcMatch && !srcMatch[2].startsWith('javascript:')) {
        safeAttrs += ` src="${escapeHtml(srcMatch[2])}" alt="${escapeHtml(altMatch ? altMatch[2] : '')}" loading="lazy"`;
      }
    } else if (lowerTag === 'code') {
      const classMatch = attrs.match(/class\s*=\s*(["'])(.*?)\1/i);
      if (classMatch) {
        safeAttrs += ` class="${escapeHtml(classMatch[2])}"`;
      }
    }
    
    return `<${lowerTag}${safeAttrs}>`;
  });

  return cleaned;
}

module.exports = {
  escapeHtml,
  sanitizeHtml,
};
