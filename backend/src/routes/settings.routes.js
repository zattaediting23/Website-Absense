const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/terminology', ctrl.getTerminology);
router.get('/organization', ctrl.getOrganization);
router.put('/organization', roleGuard('superadmin', 'admin'), ctrl.updateOrganization);

module.exports = router;
