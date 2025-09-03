export function requireAdmin(req, res, next) {
    if (!req.user || req.user.isAdmin !== true) {
        return res.status(403).json({ status: 'error', message: 'Admin only' });
    }
    next();
}
