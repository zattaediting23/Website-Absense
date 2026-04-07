const attendanceService = require('../services/attendance.service');

const attendanceController = {
    async clockIn(req, res, next) {
        try {
            const { latitude, longitude, photo_url, device_info } = req.body;
            const record = await attendanceService.clockIn(req.user.id, { latitude, longitude, photo_url, device_info });
            res.json({ message: 'Clock in berhasil', record });
        } catch (error) { next(error); }
    },

    async clockOut(req, res, next) {
        try {
            const { latitude, longitude, photo_url, device_info } = req.body;
            const record = await attendanceService.clockOut(req.user.id, { latitude, longitude, photo_url, device_info });
            res.json({ message: 'Clock out berhasil', record });
        } catch (error) { next(error); }
    },

    async getToday(req, res, next) {
        try {
            const record = await attendanceService.getToday(req.user.id);
            res.json({ record });
        } catch (error) { next(error); }
    },

    async getMyHistory(req, res, next) {
        try {
            const result = await attendanceService.getMyHistory(req.user.id, req.query);
            res.json(result);
        } catch (error) { next(error); }
    },

    async getTodaySummary(req, res, next) {
        try {
            const summary = await attendanceService.getTodaySummary(req.user.organization_id);
            res.json(summary);
        } catch (error) { next(error); }
    },

    async getAllAttendance(req, res, next) {
        try {
            const result = await attendanceService.getAllAttendance(req.user.organization_id, req.query);
            res.json(result);
        } catch (error) { next(error); }
    }
};

module.exports = attendanceController;
