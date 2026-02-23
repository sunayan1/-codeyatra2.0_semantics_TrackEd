const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { register, bulkRegister, login, getProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/bulk-register', bulkRegister);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
