const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const {
    getTeacherSubjects,
    getStudentsBySubject,
    saveAttendance,
    getAttendanceBySubjectDate,
    getMyAttendance,
} = require('../controllers/attendanceController');

// All routes require authentication
router.use(authMiddleware);

// Teacher routes
router.get('/subjects', requireRole('teacher'), getTeacherSubjects);                         // GET /api/attendance/subjects
router.get('/subjects/:subjectId/students', requireRole('teacher'), getStudentsBySubject);   // GET /api/attendance/subjects/:subjectId/students
router.get('/subjects/:subjectId', requireRole('teacher'), getAttendanceBySubjectDate);      // GET /api/attendance/subjects/:subjectId?date=YYYY-MM-DD
router.post('/', requireRole('teacher'), saveAttendance);                                    // POST /api/attendance

// Student route
router.get('/my', requireRole('student'), getMyAttendance);                                  // GET /api/attendance/my

module.exports = router;
