const overtimeService = require('../services/overtime.service');

const overtimeController = {
    async getAll(req, res, next) {
        try {
            const records = await overtimeService.getAll(req.user.organization_id, req.query);
            res.json({ records });
        } catch (error) { next(error); }
    },

    async getMyOvertime(req, res, next) {
        try {
            const records = await overtimeService.getMyOvertime(req.user.id);
            res.json({ records });
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { date, start_time, end_time, reason } = req.body;
            if (!date || !start_time || !end_time) return res.status(400).json({ error: 'Tanggal, jam mulai, dan jam selesai wajib diisi' });
            const record = await overtimeService.create({ user_id: req.user.id, date, start_time, end_time, reason });
            res.status(201).json(record);
        } catch (error) { next(error); }
    },

    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
            const result = await overtimeService.updateStatus(req.params.id, status, req.user.id);
            res.json(result);
        } catch (error) { next(error); }
    }
};

module.exports = overtimeController;
