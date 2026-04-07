const announcementService = require('../services/announcement.service');

const announcementController = {
    async getAll(req, res, next) {
        try {
            const result = await announcementService.getAll(req.user.organization_id, req.query);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getActive(req, res, next) {
        try {
            const announcements = await announcementService.getActive(req.user.organization_id);
            res.json({ announcements });
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { title, content, priority, is_pinned, expires_at } = req.body;
            if (!title || !content) return res.status(400).json({ error: 'Judul dan konten wajib diisi' });
            const announcement = await announcementService.create({
                organization_id: req.user.organization_id, title, content, priority, is_pinned, expires_at, created_by: req.user.id
            });
            res.status(201).json(announcement);
        } catch (error) { next(error); }
    },

    async update(req, res, next) {
        try {
            const result = await announcementService.update(req.params.id, req.user.organization_id, req.body);
            res.json(result);
        } catch (error) { next(error); }
    },

    async remove(req, res, next) {
        try {
            await announcementService.remove(req.params.id, req.user.organization_id);
            res.json({ message: 'Pengumuman berhasil dihapus' });
        } catch (error) { next(error); }
    }
};

module.exports = announcementController;
