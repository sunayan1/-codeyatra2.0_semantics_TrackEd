const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const {
    generateQuiz,
    getQuizByNote,
    getAllQuizzes,
    submitQuizAttempt,
    getMyAttempts,
    getQuizAttempts,
    deleteQuiz
} = require('../controllers/quizController');

router.use(authMiddleware);

// Teacher: generate quiz from note content
router.post('/generate', requireRole('teacher'), generateQuiz);

// Get all quizzes for user's subjects
router.get('/', getAllQuizzes);

// Get quizzes for a specific note
router.get('/note/:noteId', getQuizByNote);

// Student: submit quiz attempt
router.post('/:quizId/attempt', requireRole('student'), submitQuizAttempt);

// Student: get my attempts
router.get('/my-attempts', requireRole('student'), getMyAttempts);

// Teacher: get all attempts for a quiz
router.get('/:quizId/attempts', requireRole('teacher'), getQuizAttempts);

// Teacher: delete a quiz
router.delete('/:id', requireRole('teacher'), deleteQuiz);

module.exports = router;
