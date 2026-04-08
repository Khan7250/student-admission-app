const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_enroll_pro';

// Middleware to verify session token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Format: Bearer <token>
  if (!token) {
    return res.status(403).json({ error: 'Invalid token format' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Check if user is suspended (we don't check DB here to save performance, but we rely on token validity)
    // For more security, we could query DB for user status.
    if (decoded.role === 'Suspended') {
      return res.status(401).json({ error: 'Account suspended' });
    }
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.username = decoded.username;
    next();
  });
};

// Middleware to enforce Admin role
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Require Admin Role' });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  JWT_SECRET
};
