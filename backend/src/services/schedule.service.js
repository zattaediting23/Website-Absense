const pool = require('../config/database');

const scheduleService = {
    async getAll(organizationId) {
        const result = await pool.query(
            'SELECT * FROM schedules WHERE organization_id = $1 ORDER BY name',
            [organizationId]
        );
        return result.rows;
    },

    async getById(id, organizationId) {
        const result = await pool.query(
            'SELECT * FROM schedules WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Jadwal tidak ditemukan'), { status: 404 });
        }

        const assignments = await pool.query(
            `SELECT us.*, u.full_name, u.email FROM user_schedules us
             JOIN users u ON us.user_id = u.id
             WHERE us.schedule_id = $1 ORDER BY u.full_name`,
            [id]
        );
        return { ...result.rows[0], assignments: assignments.rows };
    },

    async create({ organization_id, name, start_time, end_time, days_of_week, tolerance_minutes }) {
        const result = await pool.query(
            `INSERT INTO schedules (organization_id, name, start_time, end_time, days_of_week, tolerance_minutes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [organization_id, name, start_time, end_time, days_of_week || [1,2,3,4,5], tolerance_minutes || 15]
        );
        return result.rows[0];
    },

    async update(id, organizationId, data) {
        const fields = [];
        const params = [];
        let idx = 1;

        ['name', 'start_time', 'end_time', 'days_of_week', 'tolerance_minutes', 'is_active'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx}`);
                params.push(data[field]);
                idx++;
            }
        });

        if (fields.length === 0) {
            throw Object.assign(new Error('Tidak ada data untuk diupdate'), { status: 400 });
        }

        params.push(id, organizationId);
        const result = await pool.query(
            `UPDATE schedules SET ${fields.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Jadwal tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async remove(id, organizationId) {
        const result = await pool.query(
            'DELETE FROM schedules WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Jadwal tidak ditemukan'), { status: 404 });
        }
        return { deleted: true };
    },

    async assignToUser({ user_id, schedule_id, effective_date, end_date }) {
        const result = await pool.query(
            `INSERT INTO user_schedules (user_id, schedule_id, effective_date, end_date)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, schedule_id, effective_date, end_date || null]
        );
        return result.rows[0];
    },

    async removeAssignment(id) {
        const result = await pool.query(
            'DELETE FROM user_schedules WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Assignment tidak ditemukan'), { status: 404 });
        }
        return { deleted: true };
    }
};

module.exports = scheduleService;
