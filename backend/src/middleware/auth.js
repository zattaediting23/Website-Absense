const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token tidak ditemukan' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT u.id, u.organization_id, u.email, u.full_name, u.role, u.is_active, o.sector
             FROM users u JOIN organizations o ON u.organization_id = o.id
             WHERE u.id = $1`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User tidak ditemukan' });
        }

        if (!result.rows[0].is_active) {
            return res.status(403).json({ error: 'Akun tidak aktif' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
        }
        next(error);
    }
};

module.exports = { authenticate };
