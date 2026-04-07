const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', roleGuard('superadmin', 'admin'), userController.getAll);
router.get('/:id', roleGuard('superadmin', 'admin'), userController.getById);
router.post('/', roleGuard('superadmin', 'admin'), userController.create);
router.put('/:id', roleGuard('superadmin', 'admin'), userController.update);
router.patch('/:id/toggle-active', roleGuard('superadmin', 'admin'), userController.toggleActive);
router.delete('/:id', roleGuard('superadmin', 'admin'), userController.remove);

module.exports = router;
