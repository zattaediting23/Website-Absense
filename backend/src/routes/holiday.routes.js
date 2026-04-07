const router = require('express').Router();
const ctrl = require('../controllers/holiday.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/check', ctrl.checkDate);
router.post('/', roleGuard('superadmin', 'admin'), ctrl.create);
router.post('/seed-national', roleGuard('superadmin', 'admin'), ctrl.seedNational);
router.put('/:id', roleGuard('superadmin', 'admin'), ctrl.update);
router.delete('/:id', roleGuard('superadmin', 'admin'), ctrl.remove);

module.exports = router;
