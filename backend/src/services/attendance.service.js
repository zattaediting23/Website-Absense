const pool = require('../config/database');

const attendanceService = {
    async clockIn(userId, { latitude, longitude, photo_url, device_info } = {}) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const existing = await pool.query(
            'SELECT id, clock_in FROM attendance_records WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        if (existing.rows.length > 0 && existing.rows[0].clock_in) {
            throw Object.assign(new Error('Anda sudah melakukan clock in hari ini'), { status: 400 });
        }

        // Check if today is a holiday
        const userOrg = await pool.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
        if (userOrg.rows.length > 0) {
            const holidayCheck = await pool.query(
                `SELECT id FROM holidays WHERE organization_id = $1 AND date = $2`,
                [userOrg.rows[0].organization_id, today]
            );
            if (holidayCheck.rows.length > 0) {
                // Allow clock in on holidays but flag it
            }
        }

        const scheduleResult = await pool.query(
            `SELECT s.* FROM schedules s
             JOIN user_schedules us ON s.id = us.schedule_id
             WHERE us.user_id = $1 AND us.effective_date <= $2
             AND (us.end_date IS NULL OR us.end_date >= $2)
             AND s.is_active = true
             ORDER BY us.effective_date DESC LIMIT 1`,
            [userId, today]
        );

        let status = 'present';
        let scheduleId = null;
        let locationValid = true;

        if (scheduleResult.rows.length > 0) {
            const schedule = scheduleResult.rows[0];
            scheduleId = schedule.id;
            const [h, m] = schedule.start_time.split(':').map(Number);
            const scheduledStart = new Date(now);
            scheduledStart.setHours(h, m, 0, 0);
            const diffMinutes = (now - scheduledStart) / 60000;
            if (diffMinutes > (schedule.tolerance_minutes || 15)) {
                status = 'late';
            }

            // Geofence check
            if (latitude && longitude && schedule.geofence_lat && schedule.geofence_lng) {
                const distance = haversineDistance(
                    latitude, longitude,
                    parseFloat(schedule.geofence_lat), parseFloat(schedule.geofence_lng)
                );
                const radius = schedule.geofence_radius || 100;
                if (distance > radius) {
                    locationValid = false;
                }
            }
        }

        if (existing.rows.length > 0) {
            const result = await pool.query(
                `UPDATE attendance_records SET clock_in = $1, status = $2, schedule_id = $3,
                 latitude = $4, longitude = $5, photo_url = $6, device_info = $7, clock_in_location_valid = $8
                 WHERE id = $9 RETURNING *`,
                [now, status, scheduleId, latitude || null, longitude || null, photo_url || null,
                 device_info ? JSON.stringify(device_info) : null, locationValid, existing.rows[0].id]
            );
            return result.rows[0];
        }

        const result = await pool.query(
            `INSERT INTO attendance_records (user_id, schedule_id, date, clock_in, status, latitude, longitude, photo_url, device_info, clock_in_location_valid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [userId, scheduleId, today, now, status, latitude || null, longitude || null,
             photo_url || null, device_info ? JSON.stringify(device_info) : null, locationValid]
        );
        return result.rows[0];
    },

    async clockOut(userId, { latitude, longitude, photo_url, device_info } = {}) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const result = await pool.query(
            `UPDATE attendance_records SET clock_out = $1
             WHERE user_id = $2 AND date = $3 AND clock_in IS NOT NULL AND clock_out IS NULL
             RETURNING *`,
            [now, userId, today]
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Tidak ada record clock in untuk hari ini atau sudah clock out'), { status: 400 });
        }
        return result.rows[0];
    },

    async getToday(userId) {
        const today = new Date().toISOString().split('T')[0];
        const result = await pool.query(
            'SELECT * FROM attendance_records WHERE user_id = $1 AND date = $2',
            [userId, today]
        );
        return result.rows[0] || null;
    },

    async getMyHistory(userId, { startDate, endDate, page, limit }) {
        const params = [userId];
        let query = 'SELECT * FROM attendance_records WHERE user_id = $1';
        let idx = 2;

        if (startDate) {
            query += ` AND date >= $${idx}`;
            params.push(startDate);
            idx++;
        }
        if (endDate) {
            query += ` AND date <= $${idx}`;
            params.push(endDate);
            idx++;
        }

        const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) sub`, params);
        const total = parseInt(countResult.rows[0].count);

        const p = Math.max(1, parseInt(page) || 1);
        const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
        query += ` ORDER BY date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(l, (p - 1) * l);

        const result = await pool.query(query, params);
        return { records: result.rows, total, page: p, limit: l };
    },

    async getTodaySummary(organizationId) {
        const today = new Date().toISOString().split('T')[0];
        const result = await pool.query(
            `SELECT
                COUNT(DISTINCT u.id) as total_members,
                COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.user_id END) as present,
                COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.user_id END) as late,
                COUNT(DISTINCT CASE WHEN ar.status IN ('leave', 'sick', 'permission') THEN ar.user_id END) as on_leave
             FROM users u
             LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = $1
             WHERE u.organization_id = $2 AND u.is_active = true AND u.role = 'member'`,
            [today, organizationId]
        );
        const row = result.rows[0];
        row.absent = row.total_members - row.present - row.late - row.on_leave;
        return row;
    },

    async getAllAttendance(organizationId, { date, department_id, page, limit }) {
        const params = [organizationId];
        let query = `SELECT ar.*, u.full_name, u.employee_id, d.name as department_name
                     FROM attendance_records ar
                     JOIN users u ON ar.user_id = u.id
                     LEFT JOIN departments d ON u.department_id = d.id
                     WHERE u.organization_id = $1`;
        let idx = 2;

        if (date) {
            query += ` AND ar.date = $${idx}`;
            params.push(date);
            idx++;
        }
        if (department_id) {
            query += ` AND u.department_id = $${idx}`;
            params.push(department_id);
            idx++;
        }

        const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) sub`, params);
        const total = parseInt(countResult.rows[0].count);

        const p = Math.max(1, parseInt(page) || 1);
        const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
        query += ` ORDER BY ar.date DESC, u.full_name ASC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(l, (p - 1) * l);

        const result = await pool.query(query, params);
        return { records: result.rows, total, page: p, limit: l };
    }
};

// Haversine formula for distance between two coordinates (meters)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = attendanceService;
