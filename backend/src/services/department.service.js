const pool = require('../config/database');

const departmentService = {
    async getAll(organizationId) {
        const result = await pool.query(
            `SELECT d.*, COUNT(u.id)::int as member_count
             FROM departments d LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
             WHERE d.organization_id = $1
             GROUP BY d.id ORDER BY d.name`,
            [organizationId]
        );
        return result.rows;
    },

    async getById(id, organizationId) {
        const result = await pool.query(
            'SELECT * FROM departments WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Departemen tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async create({ organization_id, name, description }) {
        const result = await pool.query(
            'INSERT INTO departments (organization_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [organization_id, name, description || null]
        );
        return result.rows[0];
    },

    async update(id, organizationId, { name, description }) {
        const result = await pool.query(
            `UPDATE departments SET name = COALESCE($1, name), description = COALESCE($2, description)
             WHERE id = $3 AND organization_id = $4 RETURNING *`,
            [name, description, id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Departemen tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async remove(id, organizationId) {
        const result = await pool.query(
            'DELETE FROM departments WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Departemen tidak ditemukan'), { status: 404 });
        }
        return { deleted: true };
    }
};

module.exports = departmentService;
