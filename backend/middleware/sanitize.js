// Generic sanitization middleware for Express
// - Trims strings
// - Collapses excessive whitespace
// - Strips HTML tags
// - Optionally limits string length

const DEFAULT_MAX = 1000;

function stripTags(str) {
  return String(str).replace(/<[^>]*>/g, '');
}

function normalizeWS(str) {
  return String(str).replace(/\s+/g, ' ').trim();
}

function limit(str, max = DEFAULT_MAX) {
  const s = String(str);
  return s.length > max ? s.slice(0, max) : s;
}

function sanitizeString(value) {
  if (value == null) return value;
  let s = String(value);
  s = stripTags(s);
  s = normalizeWS(s);
  s = limit(s);
  return s;
}

function sanitizeObject(input) {
  if (!input) return input;
  if (Array.isArray(input)) {
    return input.map((v) => (typeof v === 'string' ? sanitizeString(v) : sanitizeObject(v)));
  } else if (typeof input === 'object') {
    for (const key of Object.keys(input)) {
      const v = input[key];
      if (typeof v === 'string') {
        input[key] = sanitizeString(v);
      } else if (v && typeof v === 'object') {
        input[key] = sanitizeObject(v);
      }
    }
    return input;
  }
  return input;
}

module.exports = function sanitizeMiddleware(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') req.body = sanitizeObject(req.body);
    if (req.query && typeof req.query === 'object') req.query = sanitizeObject(req.query);
    if (req.params && typeof req.params === 'object') req.params = sanitizeObject(req.params);
  } catch (e) {
    console.error('Sanitize middleware error:', e);
  }
  next();
};
