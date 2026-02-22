const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { getNotesBySubject, createNote, createStudentNote, getAllNotes, deleteNote } = require('../controllers/noteController');

router.use(authMiddleware);

router.get('/', getAllNotes);
router.get('/subject/:subjectId', getNotesBySubject);
router.post('/', requireRole('teacher'), createNote);
router.delete('/:id', requireRole('teacher'), deleteNote);
router.post('/:noteId/student-notes', requireRole('student'), createStudentNote);

module.exports = router;
