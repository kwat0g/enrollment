const jwt = require('jsonwebtoken');

const JWT_SECRET = 'kwatog'; // Hardcoded for debug consistency
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// --- Auth Middleware ---
function authStudent(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid token format' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'student') return res.status(403).json({ error: 'Access denied: Student role required' });
    req.student = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Admin Auth Middleware ---
function authAdmin(req, res, next) {
  // DEBUG: Log the incoming Authorization header
  console.log('[authAdmin] Incoming Authorization header:', req.headers.authorization);

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });

  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid token format' });

  try {
    // DEBUG: Decode token without verifying for inspection
    try {
      const decodedDebug = jwt.decode(token);
      console.log('[authAdmin] Decoded JWT payload:', decodedDebug);
    } catch (e) {
      console.log('[authAdmin] Failed to decode JWT:', e);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Access denied: Admin role required' });
    req.admin = decoded;
    next();
  } catch (error) {
    console.log('[authAdmin] JWT verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authStudent, authAdmin, JWT_SECRET, JWT_EXPIRES_IN };
