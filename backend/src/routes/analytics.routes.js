const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(roleGuard('superadmin', 'admin'));
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/monthly-trend', ctrl.getMonthlyTrend);
router.get('/department-stats', ctrl.getDepartmentStats);
router.get('/weekly-trend', ctrl.getWeeklyTrend);
router.get('/top-performers', ctrl.getTopPerformers);
router.get('/status-distribution', ctrl.getStatusDistribution);

module.exports = router;
