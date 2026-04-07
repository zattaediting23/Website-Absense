const shiftSwapService = require('../services/shiftswap.service');

const shiftSwapController = {
    async getAll(req, res, next) {
        try {
            const result = await shiftSwapService.getAll(req.user.organization_id, req.query);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getMySwaps(req, res, next) {
        try {
            const swaps = await shiftSwapService.getMySwaps(req.user.id);
            res.json({ swaps });
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { target_id, requester_schedule_id, target_schedule_id, swap_date, reason } = req.body;
            if (!target_id || !swap_date) return res.status(400).json({ error: 'Target dan tanggal wajib diisi' });
            const swap = await shiftSwapService.create({
                requester_id: req.user.id, target_id, requester_schedule_id, target_schedule_id, swap_date, reason
            });
            res.status(201).json(swap);
        } catch (error) { next(error); }
    },

    async respondTarget(req, res, next) {
        try {
            const { response } = req.body;
            if (!['accepted', 'rejected'].includes(response)) return res.status(400).json({ error: 'Respon tidak valid' });
            const result = await shiftSwapService.respondTarget(req.params.id, req.user.id, response);
            res.json(result);
        } catch (error) { next(error); }
    },

    async adminApprove(req, res, next) {
        try {
            const { status } = req.body;
            if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
            const result = await shiftSwapService.adminApprove(req.params.id, req.user.organization_id, status, req.user.id);
            res.json(result);
        } catch (error) { next(error); }
    }
};

module.exports = shiftSwapController;
