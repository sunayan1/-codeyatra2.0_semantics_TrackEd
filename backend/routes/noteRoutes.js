const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { getNotesBySubject, createNote, createStudentNote } = require('../controllers/noteController');

router.use(authMiddleware);

router.get('/subject/:subjectId', getNotesBySubject);
router.post('/', requireRole('teacher'), createNote);
router.post('/:noteId/student-notes', requireRole('student'), createStudentNote);

module.exports = router;
