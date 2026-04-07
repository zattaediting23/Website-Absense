const holidayService = require('../services/holiday.service');

const holidayController = {
    async getAll(req, res, next) {
        try {
            const holidays = await holidayService.getAll(req.user.organization_id, req.query);
            res.json({ holidays });
        } catch (error) { next(error); }
    },

    async checkDate(req, res, next) {
        try {
            const holiday = await holidayService.checkDate(req.user.organization_id, req.query.date);
            res.json({ is_holiday: !!holiday, holiday });
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { name, date, type, is_recurring } = req.body;
            if (!name || !date) return res.status(400).json({ error: 'Nama dan tanggal wajib diisi' });
            const holiday = await holidayService.create({
                organization_id: req.user.organization_id, name, date, type, is_recurring
            });
            res.status(201).json(holiday);
        } catch (error) { next(error); }
    },

    async update(req, res, next) {
        try {
            const result = await holidayService.update(req.params.id, req.user.organization_id, req.body);
            res.json(result);
        } catch (error) { next(error); }
    },

    async remove(req, res, next) {
        try {
            await holidayService.remove(req.params.id, req.user.organization_id);
            res.json({ message: 'Hari libur berhasil dihapus' });
        } catch (error) { next(error); }
    },

    async seedNational(req, res, next) {
        try {
            const year = req.body.year || new Date().getFullYear();
            const result = await holidayService.seedNationalHolidays(req.user.organization_id, year);
            res.json({ message: 'Hari libur nasional berhasil ditambahkan', ...result });
        } catch (error) { next(error); }
    }
};

module.exports = holidayController;
