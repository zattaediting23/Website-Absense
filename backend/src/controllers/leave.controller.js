const leaveService = require('../services/leave.service');

const leaveController = {
    async getAll(req, res, next) {
        try {
            const result = await leaveService.getAll(req.user.organization_id, req.query);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getMyLeaves(req, res, next) {
        try {
            const leaves = await leaveService.getMyLeaves(req.user.id);
            res.json(leaves);
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { type, start_date, end_date } = req.body;
            if (!type || !start_date || !end_date) {
                return res.status(400).json({ error: 'Tipe, tanggal mulai, dan tanggal selesai wajib diisi' });
            }
            const leave = await leaveService.create({ ...req.body, user_id: req.user.id });
            res.status(201).json(leave);
        } catch (error) { next(error); }
    },

    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Status harus approved atau rejected' });
            }
            const leave = await leaveService.updateStatus(req.params.id, status, req.user.id);
            res.json(leave);
        } catch (error) { next(error); }
    }
};

module.exports = leaveController;
