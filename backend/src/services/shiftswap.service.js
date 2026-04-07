const pool = require('../config/database');

const shiftSwapService = {
    async getAll(organizationId, { status, page, limit }) {
        const params = [organizationId];
        let query = `SELECT ss.*,
                        r.full_name as requester_name, r.employee_id as requester_employee_id,
                        t.full_name as target_name, t.employee_id as target_employee_id,
                        rs.name as requester_schedule_name, ts.name as target_schedule_name,
                        a.full_name as approver_name
                     FROM shift_swap_requests ss
                     JOIN users r ON ss.requester_id = r.id
                     JOIN users t ON ss.target_id = t.id
                     LEFT JOIN schedules rs ON ss.requester_schedule_id = rs.id
                     LEFT JOIN schedules ts ON ss.target_schedule_id = ts.id
                     LEFT JOIN users a ON ss.approved_by = a.id
                     WHERE r.organization_id = $1`;
        let idx = 2;

        if (status) {
            query += ` AND ss.status = $${idx}`;
            params.push(status);
            idx++;
        }

        const p = Math.max(1, parseInt(page) || 1);
        const l = Math.min(50, Math.max(1, parseInt(limit) || 10));
        query += ` ORDER BY ss.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(l, (p - 1) * l);

        const result = await pool.query(query, params);
        return { swaps: result.rows, page: p, limit: l };
    },

    async getMySwaps(userId) {
        const result = await pool.query(
            `SELECT ss.*,
                    r.full_name as requester_name, t.full_name as target_name,
                    rs.name as requester_schedule_name, ts.name as target_schedule_name,
                    a.full_name as approver_name
             FROM shift_swap_requests ss
             JOIN users r ON ss.requester_id = r.id
             JOIN users t ON ss.target_id = t.id
             LEFT JOIN schedules rs ON ss.requester_schedule_id = rs.id
             LEFT JOIN schedules ts ON ss.target_schedule_id = ts.id
             LEFT JOIN users a ON ss.approved_by = a.id
             WHERE ss.requester_id = $1 OR ss.target_id = $1
             ORDER BY ss.created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    async create({ requester_id, target_id, requester_schedule_id, target_schedule_id, swap_date, reason }) {
        if (requester_id === target_id) {
            throw Object.assign(new Error('Tidak bisa tukar shift dengan diri sendiri'), { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO shift_swap_requests (requester_id, target_id, requester_schedule_id, target_schedule_id, swap_date, reason)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [requester_id, target_id, requester_schedule_id || null, target_schedule_id || null, swap_date, reason || null]
        );
        return result.rows[0];
    },

    async respondTarget(id, userId, response) {
        const swap = await pool.query('SELECT * FROM shift_swap_requests WHERE id = $1 AND target_id = $2', [id, userId]);
        if (swap.rows.length === 0) {
            throw Object.assign(new Error('Request tidak ditemukan'), { status: 404 });
        }

        if (response === 'rejected') {
            const result = await pool.query(
                `UPDATE shift_swap_requests SET target_response = 'rejected', status = 'rejected' WHERE id = $1 RETURNING *`,
                [id]
            );
            return result.rows[0];
        }

        const result = await pool.query(
            `UPDATE shift_swap_requests SET target_response = 'accepted', status = 'target_approved' WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    },

    async adminApprove(id, organizationId, status, approvedBy) {
        const result = await pool.query(
            `UPDATE shift_swap_requests SET status = $1, approved_by = $2
             WHERE id = $3 AND EXISTS (
                SELECT 1 FROM users WHERE id = shift_swap_requests.requester_id AND organization_id = $4
             ) RETURNING *`,
            [status, approvedBy, id, organizationId]
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Request tidak ditemukan'), { status: 404 });
        }

        // If approved, actually swap the schedule assignments
        if (status === 'approved') {
            const swap = result.rows[0];
            if (swap.requester_schedule_id && swap.target_schedule_id) {
                // swap user_schedules for that date
                await pool.query(
                    `UPDATE user_schedules SET schedule_id = $1
                     WHERE user_id = $2 AND schedule_id = $3 AND effective_date <= $4 AND (end_date IS NULL OR end_date >= $4)`,
                    [swap.target_schedule_id, swap.requester_id, swap.requester_schedule_id, swap.swap_date]
                );
                await pool.query(
                    `UPDATE user_schedules SET schedule_id = $1
                     WHERE user_id = $2 AND schedule_id = $3 AND effective_date <= $4 AND (end_date IS NULL OR end_date >= $4)`,
                    [swap.requester_schedule_id, swap.target_id, swap.target_schedule_id, swap.swap_date]
                );
            }
        }
        return result.rows[0];
    }
};

module.exports = shiftSwapService;
