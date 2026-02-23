const express = require('express');
const router = express.Router();
const { bulkUploadUsers, bulkUploadSubjects, bulkEnrollStudents } = require('../controllers/adminController');

// Simple secret-key guard — the college hits these endpoints with
//   Authorization: Bearer <ADMIN_SECRET>
// where ADMIN_SECRET is set in .env.  No user login required.
const adminAuth = (req, res, next) => {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
        return res.status(500).json({ success: false, error: 'ADMIN_SECRET not configured on server' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (token !== secret) {
        return res.status(401).json({ success: false, error: 'Invalid admin secret' });
    }
    next();
};

router.use(adminAuth);

// POST /api/admin/upload-users       body: { csv: "full_name,email,role,faculty,default_passcode\n..." }
router.post('/upload-users', bulkUploadUsers);

// POST /api/admin/upload-subjects    body: { csv: "title,description,faculty,semester,teacher_email\n..." }
router.post('/upload-subjects', bulkUploadSubjects);

// POST /api/admin/enroll-students    body: { csv: "student_email,subject_title\n..." }
router.post('/enroll-students', bulkEnrollStudents);

module.exports = router;
