const payrollService = require('../services/payroll.service');

const payrollController = {
    async getSettings(req, res, next) {
        try {
            const settings = await payrollService.getSettings(req.user.organization_id);
            res.json(settings);
        } catch (error) { next(error); }
    },

    async updateSettings(req, res, next) {
        try {
            const result = await payrollService.updateSettings(req.user.organization_id, req.body);
            res.json({ message: 'Pengaturan gaji berhasil disimpan', settings: result });
        } catch (error) { next(error); }
    },

    async generate(req, res, next) {
        try {
            const { month, year } = req.body;
            if (!month || !year) return res.status(400).json({ error: 'Bulan dan tahun wajib diisi' });
            const result = await payrollService.generate(req.user.organization_id, month, year, req.user.id);
            res.json({ message: 'Payroll berhasil di-generate', ...result });
        } catch (error) { next(error); }
    },

    async getAll(req, res, next) {
        try {
            const payrolls = await payrollService.getAll(req.user.organization_id, req.query);
            res.json({ payrolls });
        } catch (error) { next(error); }
    },

    async getById(req, res, next) {
        try {
            const payroll = await payrollService.getById(req.params.id, req.user.organization_id);
            res.json(payroll);
        } catch (error) { next(error); }
    },

    async updateStatus(req, res, next) {
        try {
            const result = await payrollService.updateStatus(req.params.id, req.user.organization_id, req.body.status);
            res.json(result);
        } catch (error) { next(error); }
    }
};

module.exports = payrollController;
