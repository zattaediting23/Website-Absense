const router = require('express').Router();
const ctrl = require('../controllers/overtime.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/my', ctrl.getMyOvertime);
router.post('/', ctrl.create);
router.get('/', roleGuard('superadmin', 'admin'), ctrl.getAll);
router.patch('/:id/status', roleGuard('superadmin', 'admin'), ctrl.updateStatus);

module.exports = router;
