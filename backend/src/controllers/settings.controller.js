const settingsService = require('../services/settings.service');

const settingsController = {
    async getOrganization(req, res, next) {
        try {
            const org = await settingsService.getOrganization(req.user.organization_id);
            res.json(org);
        } catch (error) { next(error); }
    },

    async updateOrganization(req, res, next) {
        try {
            const org = await settingsService.updateOrganization(req.user.organization_id, req.body);
            res.json(org);
        } catch (error) { next(error); }
    },

    async getTerminology(req, res, next) {
        try {
            const terminology = await settingsService.getTerminology(req.user.sector);
            res.json({ sector: req.user.sector, terminology });
        } catch (error) { next(error); }
    }
};

module.exports = settingsController;
