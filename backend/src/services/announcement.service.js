const pool = require('../config/database');

const announcementService = {
    async getAll(organizationId, { page, limit }) {
        const p = Math.max(1, parseInt(page) || 1);
        const l = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const offset = (p - 1) * l;

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM announcements WHERE organization_id = $1',
            [organizationId]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT a.*, u.full_name as created_by_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             WHERE a.organization_id = $1
             ORDER BY a.is_pinned DESC, a.published_at DESC
             LIMIT $2 OFFSET $3`,
            [organizationId, l, offset]
        );

        return { announcements: result.rows, total, page: p, limit: l };
    },

    async getActive(organizationId) {
        const result = await pool.query(
            `SELECT a.*, u.full_name as created_by_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             WHERE a.organization_id = $1
               AND (a.expires_at IS NULL OR a.expires_at > NOW())
             ORDER BY a.is_pinned DESC, a.priority DESC, a.published_at DESC
             LIMIT 10`,
            [organizationId]
        );
        return result.rows;
    },

    async create({ organization_id, title, content, priority, is_pinned, expires_at, created_by }) {
        const result = await pool.query(
            `INSERT INTO announcements (organization_id, title, content, priority, is_pinned, expires_at, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [organization_id, title, content, priority || 'normal', is_pinned || false, expires_at || null, created_by]
        );
        return result.rows[0];
    },

    async update(id, organizationId, data) {
        const fields = [];
        const params = [];
        let idx = 1;

        ['title', 'content', 'priority', 'is_pinned', 'expires_at'].forEach(field => {
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
            `UPDATE announcements SET ${fields.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Pengumuman tidak ditemukan'), { status: 404 });
        }
        return result.rows[0];
    },

    async remove(id, organizationId) {
        const result = await pool.query(
            'DELETE FROM announcements WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, organizationId]
        );
        if (result.rows.length === 0) {
            throw Object.assign(new Error('Pengumuman tidak ditemukan'), { status: 404 });
        }
        return { deleted: true };
    }
};

module.exports = announcementService;
