const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { getSubjects, createSubject, enrollStudent, getEnrolledStudents, unenrollStudent, getAllStudentsForTeacher, getAvailableSubjects, enrollSelf } = require('../controllers/subjectController');

router.use(authMiddleware);

router.get('/', getSubjects);
router.post('/', requireRole('teacher'), createSubject);

// Get all students across all subjects (Teacher only)
router.get('/students/all', requireRole('teacher'), getAllStudentsForTeacher);

// Student self-enrollment
router.get('/available', requireRole('student'), getAvailableSubjects);
router.post('/enroll-self', requireRole('student'), enrollSelf);

// Enrollment management (Teacher only)
router.post('/enroll', requireRole('teacher'), enrollStudent);
router.get('/:subjectId/students', requireRole('teacher'), getEnrolledStudents);
router.delete('/enroll/:enrollmentId', requireRole('teacher'), unenrollStudent);


module.exports = router;
