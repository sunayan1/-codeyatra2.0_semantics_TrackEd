const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { getSubjects, createSubject } = require('../controllers/subjectController');

router.use(authMiddleware);

router.get('/', getSubjects);
router.post('/', requireRole('teacher'), createSubject);

module.exports = router;
