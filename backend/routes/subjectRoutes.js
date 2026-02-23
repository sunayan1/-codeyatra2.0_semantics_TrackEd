const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { getSubjects, createSubject, enrollStudent, getEnrolledStudents, unenrollStudent, enrollAllBySubject } = require('../controllers/subjectController');

router.use(authMiddleware);

router.get('/', getSubjects);
router.post('/', requireRole('teacher'), createSubject);

// Enrollment management (Teacher only)
router.post('/enroll', requireRole('teacher'), enrollStudent);
router.post('/enroll/all', requireRole('teacher'), enrollAllBySubject);
router.get('/:subjectId/students', requireRole('teacher'), getEnrolledStudents);
router.delete('/enroll/:enrollmentId', requireRole('teacher'), unenrollStudent);

module.exports = router;
