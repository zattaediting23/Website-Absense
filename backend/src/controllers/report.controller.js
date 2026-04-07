const reportService = require('../services/report.service');

const reportController = {
    async getDailyReport(req, res, next) {
        try {
            const result = await reportService.getDailyReport(req.user.organization_id, req.query.date);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getMonthlyReport(req, res, next) {
        try {
            const result = await reportService.getMonthlyReport(
                req.user.organization_id, req.query.month, req.query.year
            );
            res.json(result);
        } catch (error) { next(error); }
    },

    async getSummary(req, res, next) {
        try {
            const result = await reportService.getSummary(req.user.organization_id);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getUserReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Tanggal mulai dan selesai wajib diisi' });
            }
            const result = await reportService.getUserReport(req.params.userId, startDate, endDate);
            res.json(result);
        } catch (error) { next(error); }
    }
};

module.exports = reportController;
