const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { getAssignmentsBySubject, createAssignment, submitAssignment, gradeSubmission } = require('../controllers/assignmentController');

router.use(authMiddleware);

router.get('/subject/:subjectId', getAssignmentsBySubject);
router.post('/', requireRole('teacher'), createAssignment);
router.post('/:assignmentId/submissions', requireRole('student'), submitAssignment);
router.put('/submissions/:submissionId/grade', requireRole('teacher'), gradeSubmission);

module.exports = router;
