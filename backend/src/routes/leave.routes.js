const router = require('express').Router();
const ctrl = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/my', ctrl.getMyLeaves);
router.get('/', roleGuard('superadmin', 'admin'), ctrl.getAll);
router.post('/', ctrl.create);
router.patch('/:id/status', roleGuard('superadmin', 'admin'), ctrl.updateStatus);

module.exports = router;
