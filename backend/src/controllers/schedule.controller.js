const scheduleService = require('../services/schedule.service');

const scheduleController = {
    async getAll(req, res, next) {
        try {
            const schedules = await scheduleService.getAll(req.user.organization_id);
            res.json(schedules);
        } catch (error) { next(error); }
    },

    async getById(req, res, next) {
        try {
            const schedule = await scheduleService.getById(req.params.id, req.user.organization_id);
            res.json(schedule);
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { name, start_time, end_time } = req.body;
            if (!name || !start_time || !end_time) {
                return res.status(400).json({ error: 'Nama, waktu mulai, dan waktu selesai wajib diisi' });
            }
            const schedule = await scheduleService.create({ ...req.body, organization_id: req.user.organization_id });
            res.status(201).json(schedule);
        } catch (error) { next(error); }
    },

    async update(req, res, next) {
        try {
            const schedule = await scheduleService.update(req.params.id, req.user.organization_id, req.body);
            res.json(schedule);
        } catch (error) { next(error); }
    },

    async remove(req, res, next) {
        try {
            await scheduleService.remove(req.params.id, req.user.organization_id);
            res.json({ message: 'Jadwal berhasil dihapus' });
        } catch (error) { next(error); }
    },

    async assignToUser(req, res, next) {
        try {
            const { user_id, schedule_id, effective_date } = req.body;
            if (!user_id || !schedule_id || !effective_date) {
                return res.status(400).json({ error: 'User, jadwal, dan tanggal efektif wajib diisi' });
            }
            const result = await scheduleService.assignToUser(req.body);
            res.status(201).json(result);
        } catch (error) { next(error); }
    },

    async removeAssignment(req, res, next) {
        try {
            await scheduleService.removeAssignment(req.params.id);
            res.json({ message: 'Assignment berhasil dihapus' });
        } catch (error) { next(error); }
    }
};

module.exports = scheduleController;
