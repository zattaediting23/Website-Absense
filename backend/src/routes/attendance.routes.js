const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.post('/clock-in', ctrl.clockIn);
router.post('/clock-out', ctrl.clockOut);
router.get('/today', ctrl.getToday);
router.get('/my-history', ctrl.getMyHistory);
router.get('/summary', roleGuard('superadmin', 'admin'), ctrl.getTodaySummary);
router.get('/all', roleGuard('superadmin', 'admin'), ctrl.getAllAttendance);

module.exports = router;
