const analyticsService = require('../services/analytics.service');

const analyticsController = {
    async getDashboardStats(req, res, next) {
        try {
            const stats = await analyticsService.getDashboardStats(req.user.organization_id);
            res.json(stats);
        } catch (error) { next(error); }
    },

    async getMonthlyTrend(req, res, next) {
        try {
            const data = await analyticsService.getMonthlyTrend(req.user.organization_id, req.query.year, req.query.month);
            res.json(data);
        } catch (error) { next(error); }
    },

    async getDepartmentStats(req, res, next) {
        try {
            const data = await analyticsService.getDepartmentStats(req.user.organization_id);
            res.json({ departments: data });
        } catch (error) { next(error); }
    },

    async getWeeklyTrend(req, res, next) {
        try {
            const data = await analyticsService.getWeeklyTrend(req.user.organization_id);
            res.json({ data });
        } catch (error) { next(error); }
    },

    async getTopPerformers(req, res, next) {
        try {
            const data = await analyticsService.getTopPerformers(req.user.organization_id, req.query);
            res.json({ performers: data });
        } catch (error) { next(error); }
    },

    async getStatusDistribution(req, res, next) {
        try {
            const data = await analyticsService.getStatusDistribution(req.user.organization_id, req.query);
            res.json({ distribution: data });
        } catch (error) { next(error); }
    }
};

module.exports = analyticsController;
