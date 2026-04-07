const pool = require('../config/database');

const overtimeService = {
    async getAll(organizationId, { month, year, status }) {
        const params = [organizationId];
        let query = `SELECT ot.*, u.full_name, u.employee_id, d.name as department_name, a.full_name as approver_name
                     FROM overtime_records ot
                     JOIN users u ON ot.user_id = u.id
                     LEFT JOIN departments d ON u.department_id = d.id
                     LEFT JOIN users a ON ot.approved_by = a.id
                     WHERE u.organization_id = $1`;
        let idx = 2;

        if (month && year) {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            query += ` AND ot.date BETWEEN $${idx} AND $${idx + 1}`;
            params.push(startDate, endDate);
            idx += 2;
        }
        if (status) { query += ` AND ot.status = $${idx}`; params.push(status); idx++; }

        query += ' ORDER BY ot.date DESC, u.full_name ASC';
        const result = await pool.query(query, params);
        return result.rows;
    },

    async getMyOvertime(userId) {
        const result = await pool.query(
            `SELECT ot.*, a.full_name as approver_name FROM overtime_records ot
             LEFT JOIN users a ON ot.approved_by = a.id
             WHERE ot.user_id = $1 ORDER BY ot.date DESC`,
            [userId]
        );
        return result.rows;
    },

    async create({ user_id, date, start_time, end_time, reason }) {
        // Calculate hours
        const [sh, sm] = start_time.split(':').map(Number);
        const [eh, em] = end_time.split(':').map(Number);
        const hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100;

        if (hours <= 0) {
            throw Object.assign(new Error('Jam lembur tidak valid'), { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO overtime_records (user_id, date, start_time, end_time, hours, reason)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [user_id, date, start_time, end_time, hours, reason || null]
        );
        return result.rows[0];
    },

    async updateStatus(id, status, approvedBy) {
        const result = await pool.query(
            `UPDATE overtime_records SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *`,
            [status, approvedBy, id]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Record lembur tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    }
};

module.exports = overtimeService;
