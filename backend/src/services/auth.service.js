const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

const authService = {
    async register({ organizationName, sector, fullName, email, password }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const orgResult = await client.query(
                'INSERT INTO organizations (name, sector) VALUES ($1, $2) RETURNING *',
                [organizationName, sector]
            );
            const org = orgResult.rows[0];

            const passwordHash = await hashPassword(password);
            const userResult = await client.query(
                `INSERT INTO users (organization_id, email, password_hash, full_name, role)
                 VALUES ($1, $2, $3, $4, 'admin') RETURNING id, organization_id, email, full_name, role, is_active`,
                [org.id, email, passwordHash, fullName]
            );
            const user = userResult.rows[0];

            await client.query('COMMIT');

            const token = generateToken(user.id, user.role);
            return { user: { ...user, sector: org.sector }, token };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async login(email, password) {
        const result = await pool.query(
            `SELECT u.*, o.sector, o.name as organization_name
             FROM users u JOIN organizations o ON u.organization_id = o.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Email atau password salah'), { status: 401 });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            throw Object.assign(new Error('Akun tidak aktif'), { status: 403 });
        }

        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
            throw Object.assign(new Error('Email atau password salah'), { status: 401 });
        }

        const token = generateToken(user.id, user.role);
        const { password_hash, ...safeUser } = user;
        return { user: safeUser, token };
    },

    async getMe(userId) {
        const result = await pool.query(
            `SELECT u.id, u.organization_id, u.department_id, u.email, u.full_name, u.employee_id,
                    u.phone, u.role, u.avatar_url, u.is_active, u.created_at,
                    o.name as organization_name, o.sector,
                    d.name as department_name
             FROM users u
             JOIN organizations o ON u.organization_id = o.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('User tidak ditemukan'), { status: 404 });
        }

        return result.rows[0];
    }
};

module.exports = authService;
