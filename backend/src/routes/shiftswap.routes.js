const router = require('express').Router();
const ctrl = require('../controllers/shiftswap.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/my', ctrl.getMySwaps);
router.post('/', ctrl.create);
router.patch('/:id/respond', ctrl.respondTarget);
router.get('/', roleGuard('superadmin', 'admin'), ctrl.getAll);
router.patch('/:id/approve', roleGuard('superadmin', 'admin'), ctrl.adminApprove);

module.exports = router;
