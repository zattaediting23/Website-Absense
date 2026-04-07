const userService = require('../services/user.service');

const userController = {
    async getAll(req, res, next) {
        try {
            const result = await userService.getAll(req.user.organization_id, req.query);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getById(req, res, next) {
        try {
            const user = await userService.getById(req.params.id, req.user.organization_id);
            res.json(user);
        } catch (error) { next(error); }
    },

    async create(req, res, next) {
        try {
            const { email, password, full_name } = req.body;
            if (!email || !password || !full_name) {
                return res.status(400).json({ error: 'Email, password, dan nama wajib diisi' });
            }
            const user = await userService.create({ ...req.body, organization_id: req.user.organization_id });
            res.status(201).json(user);
        } catch (error) { next(error); }
    },

    async update(req, res, next) {
        try {
            const user = await userService.update(req.params.id, req.user.organization_id, req.body);
            res.json(user);
        } catch (error) { next(error); }
    },

    async toggleActive(req, res, next) {
        try {
            const user = await userService.toggleActive(req.params.id, req.user.organization_id);
            res.json(user);
        } catch (error) { next(error); }
    },

    async remove(req, res, next) {
        try {
            await userService.remove(req.params.id, req.user.organization_id);
            res.json({ message: 'User berhasil dihapus' });
        } catch (error) { next(error); }
    }
};

module.exports = userController;
