const departmentService = require('../services/department.service');

const departmentController = {
    async getAll(req, res, next) {
        try {
            const departments = await departmentService.getAll(req.user.organization_id);
            res.json(departments);
        } catch (error) { next(error); }
    },

    async getById(req, res, next) {
        try {
            const dept = await departmentService.getById(req.params.id, req.user.organization_id);
            res.json(dept);
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            if (!req.body.name) {
                return res.status(400).json({ error: 'Nama departemen wajib diisi' });
            }
            const dept = await departmentService.create({ ...req.body, organization_id: req.user.organization_id });
            res.status(201).json(dept);
        } catch (error) { next(error); }
    },

    async update(req, res, next) {
        try {
            const dept = await departmentService.update(req.params.id, req.user.organization_id, req.body);
            res.json(dept);
        } catch (error) { next(error); }
    },

    async remove(req, res, next) {
        try {
            await departmentService.remove(req.params.id, req.user.organization_id);
            res.json({ message: 'Departemen berhasil dihapus' });
        } catch (error) { next(error); }
    }
};

module.exports = departmentController;
