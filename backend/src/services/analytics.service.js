const pool = require('../config/database');

const analyticsService = {
    async getDashboardStats(organizationId) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        // Today's attendance breakdown
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

        const stats = todayStats.rows[0];
        stats.absent = stats.total_members - stats.present - stats.late - stats.on_leave;

        return stats;
    },

    async getMonthlyTrend(organizationId, year, month) {
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || new Date().getMonth() + 1;
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT ar.date,
                    COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int as present,
                    COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int as late,
                    COUNT(CASE WHEN ar.status IN ('leave','sick','permission') THEN 1 END)::int as leave_count
             FROM attendance_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.organization_id = $1 AND ar.date BETWEEN $2 AND $3
             GROUP BY ar.date ORDER BY ar.date`,
            [organizationId, startDate, endDate]
        );
        return { month: m, year: y, data: result.rows };
    },

    async getDepartmentStats(organizationId) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const result = await pool.query(
            `SELECT d.id, d.name as department_name,
                    COUNT(DISTINCT u.id)::int as total_members,
                    COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.user_id END)::int as present_today,
                    COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.user_id END)::int as late_today
             FROM departments d
             LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true AND u.role = 'member'
             LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = $2
             WHERE d.organization_id = $1
             GROUP BY d.id, d.name
             ORDER BY d.name`,
            [organizationId, today]
        );
        return result.rows;
    },

    async getWeeklyTrend(organizationId) {
        const result = await pool.query(
            `SELECT ar.date, ar.status, COUNT(*)::int as count
             FROM attendance_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.organization_id = $1 AND ar.date >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY ar.date, ar.status
             ORDER BY ar.date`,
            [organizationId]
        );
        return result.rows;
    },

    async getTopPerformers(organizationId, { month, year }) {
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT u.id, u.full_name, u.employee_id, d.name as department_name,
                    COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int as present_count,
                    COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int as late_count,
                    COUNT(ar.id)::int as total_records,
                    ROUND(
                        CASE WHEN COUNT(ar.id) > 0
                        THEN COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::decimal / COUNT(ar.id) * 100
                        ELSE 0 END, 1
                    ) as attendance_rate
             FROM users u
             LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date BETWEEN $2 AND $3
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.organization_id = $1 AND u.is_active = true AND u.role = 'member'
             GROUP BY u.id, u.full_name, u.employee_id, d.name
             ORDER BY attendance_rate DESC, present_count DESC
             LIMIT 10`,
            [organizationId, startDate, endDate]
        );
        return result.rows;
    },

    async getStatusDistribution(organizationId, { month, year }) {
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT ar.status, COUNT(*)::int as count
             FROM attendance_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.organization_id = $1 AND ar.date BETWEEN $2 AND $3
             GROUP BY ar.status`,
            [organizationId, startDate, endDate]
        );
        return result.rows;
    }
};

module.exports = analyticsService;
