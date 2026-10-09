const jwt = require('jsonwebtoken');
const db = require('../data/database');

const JWT_SECRET = process.env.JWT_SECRET || 'shopsphere_super_secure_jwt_token_2026_secret_key';

// Middleware to authenticate any logged-in user
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

// Middleware to require admin privileges
function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access restricted: Administrator privileges required.' });
    }
  });
}

// Optional auth for cart or reviews (doesn't reject if guest)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findUserById(decoded.id);
      if (user) {
        req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    } catch (e) {}
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth,
  JWT_SECRET
};
