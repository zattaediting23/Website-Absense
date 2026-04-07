const pool = require('../config/database');

const settingsService = {
    async getOrganization(organizationId) {
        const result = await pool.query(
            'SELECT * FROM organizations WHERE id = $1',
            [organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Organisasi tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async updateOrganization(organizationId, data) {
        const fields = [];
        const params = [];
        let idx = 1;

        ['name', 'address', 'phone', 'email', 'logo_url'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx}`);
                params.push(data[field]);
                idx++;
            }
        });

        if (fields.length === 0) {
            throw Object.assign(new Error('Tidak ada data untuk diupdate'), { status: 400 });
        }

        params.push(organizationId);
        const result = await pool.query(
            `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );
        return result.rows[0];
    },

    async getTerminology(sector) {
        const result = await pool.query(
            'SELECT generic_term, sector_term FROM sector_terminology WHERE sector = $1',
            [sector]
        );
        return result.rows;
    }
};

module.exports = settingsService;
