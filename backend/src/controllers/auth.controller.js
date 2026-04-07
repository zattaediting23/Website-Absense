const authService = require('../services/auth.service');

const authController = {
    async register(req, res, next) {
        try {
            const { organizationName, sector, fullName, email, password } = req.body;
            if (!organizationName || !sector || !fullName || !email || !password) {
                return res.status(400).json({ error: 'Semua field wajib diisi' });
            }
            if (!['education', 'corporate', 'umkm', 'healthcare'].includes(sector)) {
                return res.status(400).json({ error: 'Sektor tidak valid' });
            }
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password minimal 6 karakter' });
            }
            const result = await authService.register({ organizationName, sector, fullName, email, password });
            res.status(201).json(result);
        } catch (error) { next(error); }
    },

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email dan password wajib diisi' });
            }
            const result = await authService.login(email, password);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getMe(req, res, next) {
        try {
            const user = await authService.getMe(req.user.id);
            res.json({ user });
        } catch (error) { next(error); }
    }
};

module.exports = authController;
