const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(roleGuard('superadmin', 'admin'));
router.get('/daily', ctrl.getDailyReport);
router.get('/monthly', ctrl.getMonthlyReport);
router.get('/summary', ctrl.getSummary);
router.get('/user/:userId', ctrl.getUserReport);

module.exports = router;
