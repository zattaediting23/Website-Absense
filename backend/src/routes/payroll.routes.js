const router = require('express').Router();
const ctrl = require('../controllers/payroll.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(roleGuard('superadmin', 'admin'));
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.post('/generate', ctrl.generate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
