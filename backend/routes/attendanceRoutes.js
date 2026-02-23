const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const {
    markAttendance,
    getAttendanceByDate,
    getAttendanceSummary,
    getMyAttendance,
    getStudentPerformance
} = require('../controllers/attendanceController');

router.use(authMiddleware);

// Teacher: mark attendance
router.post('/', requireRole('teacher'), markAttendance);

// Teacher: get attendance for subject on date
router.get('/subject/:subjectId/date/:date', requireRole('teacher'), getAttendanceByDate);

// Teacher: get full attendance summary for subject
router.get('/subject/:subjectId', requireRole('teacher'), getAttendanceSummary);

// Teacher: get performance metrics for all enrolled students in a subject
router.get('/performance/:subjectId', requireRole('teacher'), getStudentPerformance);

// Student: get own attendance
router.get('/my', requireRole('student'), getMyAttendance);

module.exports = router;
