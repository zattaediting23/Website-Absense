const router = require('express').Router();
const ctrl = require('../controllers/announcement.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/active', ctrl.getActive);
router.post('/', roleGuard('superadmin', 'admin'), ctrl.create);
router.put('/:id', roleGuard('superadmin', 'admin'), ctrl.update);
router.delete('/:id', roleGuard('superadmin', 'admin'), ctrl.remove);

module.exports = router;
