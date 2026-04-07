const pool = require('../config/database');
const { hashPassword, paginate } = require('../utils/helpers');

const userService = {
    async getAll(organizationId, { page, limit, search, department_id, role }) {
        const { limit: lim, offset } = paginate(page, limit);
        let query = `SELECT u.id, u.email, u.full_name, u.employee_id, u.phone, u.role,
                            u.is_active, u.created_at, d.name as department_name
                     FROM users u LEFT JOIN departments d ON u.department_id = d.id
                     WHERE u.organization_id = $1`;
        const params = [organizationId];
        let paramIdx = 2;

        if (search) {
            query += ` AND (u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.employee_id ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }
        if (department_id) {
            query += ` AND u.department_id = $${paramIdx}`;
            params.push(department_id);
            paramIdx++;
        }
        if (role) {
            query += ` AND u.role = $${paramIdx}`;
            params.push(role);
            paramIdx++;
        }

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM (${query}) sub`, params
        );
        const total = parseInt(countResult.rows[0].count);

        query += ` ORDER BY u.full_name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
        params.push(lim, offset);

        const result = await pool.query(query, params);
        return { users: result.rows, total, page: parseInt(page) || 1, limit: lim };
    },

    async getById(id, organizationId) {
        const result = await pool.query(
            `SELECT u.id, u.email, u.full_name, u.employee_id, u.phone, u.role,
                    u.department_id, u.is_active, u.created_at,
                    d.name as department_name
             FROM users u LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = $1 AND u.organization_id = $2`,
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('User tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async create({ organization_id, email, password, full_name, employee_id, phone, role, department_id }) {
        const passwordHash = await hashPassword(password);
        const result = await pool.query(
            `INSERT INTO users (organization_id, email, password_hash, full_name, employee_id, phone, role, department_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, email, full_name, employee_id, phone, role, department_id, is_active, created_at`,
            [organization_id, email, passwordHash, full_name, employee_id || null, phone || null, role || 'member', department_id || null]
        );
        return result.rows[0];
    },

    async update(id, organizationId, data) {
        const fields = [];
        const params = [];
        let idx = 1;

        ['full_name', 'email', 'employee_id', 'phone', 'role', 'department_id'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx}`);
                params.push(data[field]);
                idx++;
            }
        });

        if (data.password) {
            fields.push(`password_hash = $${idx}`);
            params.push(await hashPassword(data.password));
            idx++;
        }

        if (fields.length === 0) {
            throw Object.assign(new Error('Tidak ada data untuk diupdate'), { status: 400 });
        }

        params.push(id, organizationId);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1}
             RETURNING id, email, full_name, employee_id, phone, role, department_id, is_active`,
            params
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('User tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async toggleActive(id, organizationId) {
        const result = await pool.query(
            `UPDATE users SET is_active = NOT is_active WHERE id = $1 AND organization_id = $2
             RETURNING id, full_name, is_active`,
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('User tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async remove(id, organizationId) {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('User tidak ditemukan'), { status: 404 });
        }
        return { deleted: true };
    }
};

module.exports = userService;
