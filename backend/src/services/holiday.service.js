const pool = require('../config/database');

const holidayService = {
    async getAll(organizationId, { year }) {
        const y = parseInt(year) || new Date().getFullYear();
        const result = await pool.query(
            `SELECT * FROM holidays
             WHERE organization_id = $1
               AND (EXTRACT(YEAR FROM date) = $2 OR is_recurring = true)
             ORDER BY date ASC`,
            [organizationId, y]
        );
        return result.rows;
    },

    async checkDate(organizationId, date) {
        const d = new Date(date);
        const result = await pool.query(
            `SELECT * FROM holidays
             WHERE organization_id = $1
               AND (date = $2 OR (is_recurring = true AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(DAY FROM date) = $4))
             LIMIT 1`,
            [organizationId, date, d.getMonth() + 1, d.getDate()]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    },

    async create({ organization_id, name, date, type, is_recurring }) {
        const result = await pool.query(
            `INSERT INTO holidays (organization_id, name, date, type, is_recurring)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [organization_id, name, date, type || 'company', is_recurring || false]
        );
        return result.rows[0];
    },

    async update(id, organizationId, data) {
        const fields = [];
        const params = [];
        let idx = 1;

        ['name', 'date', 'type', 'is_recurring'].forEach(field => {
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
            `UPDATE holidays SET ${fields.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Hari libur tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async remove(id, organizationId) {
        const result = await pool.query(
            'DELETE FROM holidays WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Hari libur tidak ditemukan'), { status: 404 });
        }
        return { deleted: true };
    },

    async seedNationalHolidays(organizationId, year) {
        const holidays2026 = [
            { name: 'Tahun Baru', date: `${year}-01-01`, type: 'national', is_recurring: true },
            { name: 'Hari Buruh', date: `${year}-05-01`, type: 'national', is_recurring: true },
            { name: 'Hari Pancasila', date: `${year}-06-01`, type: 'national', is_recurring: true },
            { name: 'Hari Kemerdekaan RI', date: `${year}-08-17`, type: 'national', is_recurring: true },
            { name: 'Hari Natal', date: `${year}-12-25`, type: 'religious', is_recurring: true },
        ];

        for (const h of holidays2026) {
            await pool.query(
                `INSERT INTO holidays (organization_id, name, date, type, is_recurring)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (organization_id, date) DO NOTHING`,
                [organizationId, h.name, h.date, h.type, h.is_recurring]
            );
        }
        return { seeded: holidays2026.length };
    }
};

module.exports = holidayService;
