const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const {
    getAssignmentsBySubject,
    createAssignment,
    submitAssignment,
    gradeSubmission,
    getAllAssignments,
    deleteAssignment,
    getMySubmissions,
    getAllSubmissionsForTeacher
} = require('../controllers/assignmentController');

router.use(authMiddleware);

router.get('/', getAllAssignments);
router.get('/subject/:subjectId', getAssignmentsBySubject);
router.post('/', requireRole('teacher'), createAssignment);
router.delete('/:id', requireRole('teacher'), deleteAssignment);
router.post('/:assignmentId/submissions', requireRole('student'), submitAssignment);
router.put('/submissions/:submissionId/grade', requireRole('teacher'), gradeSubmission);

// Submission routes
router.get('/submissions', getMySubmissions);
router.get('/submissions/teacher', requireRole('teacher'), getAllSubmissionsForTeacher);

module.exports = router;
