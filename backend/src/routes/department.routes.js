const router = require('express').Router();
const ctrl = require('../controllers/department.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', roleGuard('superadmin', 'admin'), ctrl.create);
router.put('/:id', roleGuard('superadmin', 'admin'), ctrl.update);
router.delete('/:id', roleGuard('superadmin', 'admin'), ctrl.remove);

module.exports = router;
