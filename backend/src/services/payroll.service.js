const pool = require('../config/database');

const payrollService = {
    async getSettings(organizationId) {
        let result = await pool.query(
            'SELECT * FROM payroll_settings WHERE organization_id = $1',
            [organizationId]
        );
        if (result.rows.length === 0) {
            result = await pool.query(
                `INSERT INTO payroll_settings (organization_id, base_salary, transport_allowance, meal_allowance, late_deduction_per_minute, absent_deduction_per_day, overtime_rate_per_hour)
                 VALUES ($1, 5000000, 500000, 300000, 5000, 200000, 25000) RETURNING *`,
                [organizationId]
            );
        }
        return result.rows[0];
    },

    async updateSettings(organizationId, data) {
        const fields = [];
        const params = [];
        let idx = 1;

        ['base_salary', 'transport_allowance', 'meal_allowance', 'late_deduction_per_minute', 'absent_deduction_per_day', 'overtime_rate_per_hour'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx}`);
                params.push(parseFloat(data[field]));
                idx++;
            }
        });

        if (fields.length === 0) {
            throw Object.assign(new Error('Tidak ada data untuk diupdate'), { status: 400 });
        }

        params.push(organizationId);
        const result = await pool.query(
            `UPDATE payroll_settings SET ${fields.join(', ')} WHERE organization_id = $${idx} RETURNING *`,
            params
        );
        return result.rows[0];
    },

    async generate(organizationId, month, year, generatedBy) {
        const m = parseInt(month);
        const y = parseInt(year);
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0];

        const settings = await this.getSettings(organizationId);

        // Get all active members
        const usersResult = await pool.query(
            `SELECT id, full_name, employee_id, department_id FROM users
             WHERE organization_id = $1 AND is_active = true AND role = 'member'`,
            [organizationId]
        );

        // Count holidays in this period
        const holidaysResult = await pool.query(
            `SELECT COUNT(*)::int as count FROM holidays
             WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
            [organizationId, startDate, endDate]
        );
        const holidayCount = holidaysResult.rows[0].count;

        // Calculate working days (weekdays minus holidays)
        let workingDays = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay();
            if (dow !== 0 && dow !== 6) workingDays++;
        }
        workingDays = Math.max(0, workingDays - holidayCount);

        const payrolls = [];
        for (const user of usersResult.rows) {
            // Get attendance stats for this user in this period
            const attendanceResult = await pool.query(
                `SELECT
                    COUNT(CASE WHEN status = 'present' THEN 1 END)::int as present_count,
                    COUNT(CASE WHEN status = 'late' THEN 1 END)::int as late_count,
                    COUNT(CASE WHEN status IN ('leave', 'sick', 'permission') THEN 1 END)::int as leave_count
                 FROM attendance_records
                 WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
                [user.id, startDate, endDate]
            );

            const stats = attendanceResult.rows[0];
            const presentDays = stats.present_count + stats.late_count;
            const lateDays = stats.late_count;
            const leaveDays = stats.leave_count;
            const absentDays = Math.max(0, workingDays - presentDays - leaveDays);

            // Get overtime
            const overtimeResult = await pool.query(
                `SELECT COALESCE(SUM(hours), 0)::decimal as total_hours
                 FROM overtime_records
                 WHERE user_id = $1 AND date BETWEEN $2 AND $3 AND status = 'approved'`,
                [user.id, startDate, endDate]
            );
            const overtimeHours = parseFloat(overtimeResult.rows[0].total_hours);

            // Calculate
            const baseSalary = parseFloat(settings.base_salary);
            const allowances = parseFloat(settings.transport_allowance) + parseFloat(settings.meal_allowance);
            const lateDeduction = lateDays * 15 * parseFloat(settings.late_deduction_per_minute); // assume avg 15 min late
            const absentDeduction = absentDays * parseFloat(settings.absent_deduction_per_day);
            const deductions = lateDeduction + absentDeduction;
            const overtimePay = overtimeHours * parseFloat(settings.overtime_rate_per_hour);
            const grossPay = baseSalary + allowances + overtimePay;
            const netPay = grossPay - deductions;

            const details = {
                base_salary: baseSalary,
                transport_allowance: parseFloat(settings.transport_allowance),
                meal_allowance: parseFloat(settings.meal_allowance),
                late_deduction: lateDeduction,
                absent_deduction: absentDeduction,
                overtime_pay: overtimePay,
                working_days: workingDays,
                holidays: holidayCount
            };

            // Upsert payroll
            const payrollResult = await pool.query(
                `INSERT INTO payrolls (organization_id, user_id, period_month, period_year, working_days, present_days, late_days, absent_days, leave_days, overtime_hours, base_salary, allowances, deductions, overtime_pay, gross_pay, net_pay, details, generated_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                 ON CONFLICT (user_id, period_month, period_year)
                 DO UPDATE SET working_days=$5, present_days=$6, late_days=$7, absent_days=$8, leave_days=$9, overtime_hours=$10, base_salary=$11, allowances=$12, deductions=$13, overtime_pay=$14, gross_pay=$15, net_pay=$16, details=$17, generated_by=$18, generated_at=NOW(), status='draft'
                 RETURNING *`,
                [organizationId, user.id, m, y, workingDays, presentDays, lateDays, absentDays, leaveDays, overtimeHours, baseSalary, allowances, deductions, overtimePay, grossPay, netPay, JSON.stringify(details), generatedBy]
            );
            payrolls.push({ ...payrollResult.rows[0], full_name: user.full_name, employee_id: user.employee_id });
        }

        return { period: { month: m, year: y }, working_days: workingDays, holidays: holidayCount, payrolls };
    },

    async getAll(organizationId, { month, year, status }) {
        const params = [organizationId];
        let query = `SELECT p.*, u.full_name, u.employee_id, d.name as department_name
                     FROM payrolls p
                     JOIN users u ON p.user_id = u.id
                     LEFT JOIN departments d ON u.department_id = d.id
                     WHERE p.organization_id = $1`;
        let idx = 2;

        if (month) { query += ` AND p.period_month = $${idx}`; params.push(parseInt(month)); idx++; }
        if (year) { query += ` AND p.period_year = $${idx}`; params.push(parseInt(year)); idx++; }
        if (status) { query += ` AND p.status = $${idx}`; params.push(status); idx++; }

        query += ' ORDER BY u.full_name ASC';
        const result = await pool.query(query, params);
        return result.rows;
    },

    async getById(id, organizationId) {
        const result = await pool.query(
            `SELECT p.*, u.full_name, u.employee_id, u.email, u.phone,
                    d.name as department_name, o.name as organization_name, o.address as organization_address
             FROM payrolls p
             JOIN users u ON p.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             JOIN organizations o ON p.organization_id = o.id
             WHERE p.id = $1 AND p.organization_id = $2`,
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Slip gaji tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async updateStatus(id, organizationId, status) {
        const result = await pool.query(
            `UPDATE payrolls SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *`,
            [status, id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Slip gaji tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    }
};

module.exports = payrollService;
