const pool = require('../config/database');

const leaveService = {
    async getAll(organizationId, { status, page, limit }) {
        const params = [organizationId];
        let query = `SELECT lr.*, u.full_name, u.email, a.full_name as approver_name
                     FROM leave_requests lr
                     JOIN users u ON lr.user_id = u.id
                     LEFT JOIN users a ON lr.approved_by = a.id
                     WHERE u.organization_id = $1`;
        let idx = 2;

        if (status) {
            query += ` AND lr.status = $${idx}`;
            params.push(status);
            idx++;
        }

        const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) sub`, params);
        const total = parseInt(countResult.rows[0].count);

        const p = Math.max(1, parseInt(page) || 1);
        const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
        query += ` ORDER BY lr.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(l, (p - 1) * l);

        const result = await pool.query(query, params);
        return { leaves: result.rows, total, page: p, limit: l };
    },

    async getMyLeaves(userId) {
        const result = await pool.query(
            `SELECT lr.*, a.full_name as approver_name FROM leave_requests lr
             LEFT JOIN users a ON lr.approved_by = a.id
             WHERE lr.user_id = $1 ORDER BY lr.created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    async create({ user_id, type, start_date, end_date, reason }) {
        const result = await pool.query(
            `INSERT INTO leave_requests (user_id, type, start_date, end_date, reason)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, type, start_date, end_date, reason || null]
        );
        return result.rows[0];
    },

    async updateStatus(id, status, approvedBy) {
        const result = await pool.query(
            `UPDATE leave_requests SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *`,
            [status, approvedBy, id]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Permintaan izin tidak ditemukan'), { status: 404 });
        }

        if (status === 'approved') {
            const leave = result.rows[0];
            const startDate = new Date(leave.start_date);
            const endDate = new Date(leave.end_date);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                await pool.query(
                    `INSERT INTO attendance_records (user_id, date, status, notes)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (user_id, date) DO UPDATE SET status = $3, notes = $4`,
                    [leave.user_id, dateStr, leave.type === 'sick' ? 'sick' : 'leave', leave.reason]
                );
            }
        }
        return result.rows[0];
    }
};

module.exports = leaveService;
