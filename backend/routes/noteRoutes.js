const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const {
  getNotesBySubject,
  createNote,
  createStudentNote,
  getStudentNotes,
  getBookshelfNotes,
  toggleShareStudentNote,
  getAllNotes,
  deleteNote,
  uploadNote
} = require('../controllers/noteController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const pdfTypes = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
    const isPdfExt = file.originalname?.toLowerCase().endsWith('.pdf');

    if (pdfTypes.includes(file.mimetype) || isPdfExt) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are allowed'), false);
    }
  }
});

const handleUpload = (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: 'File too large. Max 50MB.' });
        }
        return res.status(400).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message || 'Upload failed' });
    }
    next();
  });
};

router.use(authMiddleware);

router.get('/', getAllNotes);
router.get('/subject/:subjectId', getNotesBySubject);
router.get('/bookshelf', requireRole('student'), getBookshelfNotes);
router.post('/', requireRole('teacher'), createNote);
router.post('/upload', requireRole('teacher'), handleUpload, uploadNote);
router.delete('/:id', requireRole('teacher'), deleteNote);
router.get('/:noteId/student-notes', requireRole('student'), getStudentNotes);
router.post('/:noteId/student-notes', requireRole('student'), createStudentNote);
router.patch('/student-notes/:studentNoteId/share', requireRole('student'), toggleShareStudentNote);

module.exports = router;