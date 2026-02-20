const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly };
