// routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const { generateQuizFromNote } = require('../controllers/quizController.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js'); // adjust to your actual auth middleware path

// POST /api/quiz/generate/:noteId
router.post('/generate/:noteId', authMiddleware, generateQuizFromNote);

module.exports = router;