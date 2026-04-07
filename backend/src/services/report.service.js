const pool = require('../config/database');

const reportService = {
    async getDailyReport(organizationId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.employee_id, d.name as department_name,
                    ar.clock_in, ar.clock_out, ar.status, ar.notes
             FROM users u
             LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = $2
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.organization_id = $1 AND u.is_active = true AND u.role = 'member'
             ORDER BY d.name, u.full_name`,
            [organizationId, targetDate]
        );

        const summary = { present: 0, late: 0, absent: 0, leave: 0, sick: 0, permission: 0 };
        result.rows.forEach(row => {
            if (!row.status || row.status === 'absent') summary.absent++;
            else summary[row.status] = (summary[row.status] || 0) + 1;
        });

        return { date: targetDate, records: result.rows, summary, total: result.rows.length };
    },

    async getMonthlyReport(organizationId, month, year) {
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT u.id, u.full_name, u.employee_id, d.name as department_name,
                    COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int as present_count,
                    COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int as late_count,
                    COUNT(CASE WHEN ar.status IN ('leave','sick','permission') THEN 1 END)::int as leave_count,
                    COUNT(ar.id)::int as total_records
             FROM users u
             LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date BETWEEN $2 AND $3
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.organization_id = $1 AND u.is_active = true AND u.role = 'member'
             GROUP BY u.id, u.full_name, u.employee_id, d.name
             ORDER BY d.name, u.full_name`,
            [organizationId, startDate, endDate]
        );

        return { month: m, year: y, startDate, endDate, records: result.rows };
    },

    async getSummary(organizationId) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const todayStats = await pool.query(
            `SELECT
                COUNT(DISTINCT u.id)::int as total_members,
                COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.user_id END)::int as present,
                COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.user_id END)::int as late,
                COUNT(DISTINCT CASE WHEN ar.status IN ('leave','sick','permission') THEN ar.user_id END)::int as on_leave
             FROM users u
             LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = $2
             WHERE u.organization_id = $1 AND u.is_active = true AND u.role = 'member'`,
            [organizationId, today]
        );

        const weeklyData = await pool.query(
            `SELECT ar.date, ar.status, COUNT(*)::int as count
             FROM attendance_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.organization_id = $1 AND ar.date >= CURRENT_DATE - INTERVAL '7 days'
             GROUP BY ar.date, ar.status
             ORDER BY ar.date`,
            [organizationId]
        );

        const monthlyStats = await pool.query(
            `SELECT ar.status, COUNT(*)::int as count
             FROM attendance_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.organization_id = $1 AND ar.date BETWEEN $2 AND $3
             GROUP BY ar.status`,
            [organizationId, startOfMonth, today]
        );

        const pendingLeaves = await pool.query(
            `SELECT COUNT(*)::int as count FROM leave_requests lr
             JOIN users u ON lr.user_id = u.id
             WHERE u.organization_id = $1 AND lr.status = 'pending'`,
            [organizationId]
        );

        const stats = todayStats.rows[0];
        stats.absent = stats.total_members - stats.present - stats.late - stats.on_leave;

        return {
            today: stats,
            weeklyChart: weeklyData.rows,
            monthlyStats: monthlyStats.rows,
            pendingLeaves: pendingLeaves.rows[0].count
        };
    },

    async getUserReport(userId, startDate, endDate) {
        const result = await pool.query(
            `SELECT * FROM attendance_records WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date`,
            [userId, startDate, endDate]
        );
        const summary = { present: 0, late: 0, absent: 0, leave: 0, sick: 0, permission: 0 };
        result.rows.forEach(r => { summary[r.status] = (summary[r.status] || 0) + 1; });
        return { records: result.rows, summary };
    }
};

module.exports = reportService;
