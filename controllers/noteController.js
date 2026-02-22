const { getAuthClient } = require('../config/dbConfig');

// Get notes for a specific subject
const getNotesBySubject = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subjectId } = req.params;
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('subject_id', subjectId);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching notes' });
    }
};

// Create a new note (Teacher only)
const createNote = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subject_id, title, content_url } = req.body;

        // Check if Teacher owns the subject
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', subject_id)
            .single();

        if (subjectError || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this subject' });
        }

        const { data, error } = await supabase
            .from('notes')
            .insert([{ subject_id, title, content_url }])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating note' });
    }
};

// Create a student note / inline comment (Student only)
const createStudentNote = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { noteId } = req.params;
        const { private_comment } = req.body;

        // Check if Student is enrolled in the subject of this note
        const { data: note, error: noteError } = await supabase
            .from('notes')
            .select('subject_id')
            .eq('id', noteId)
            .single();

        if (noteError || !note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('subject_id', note.subject_id)
            .eq('student_id', req.user.id)
            .single();

        if (enrollmentError || !enrollment) {
            return res.status(403).json({ success: false, error: 'Forbidden: You are not enrolled in this subject' });
        }

        const { data, error } = await supabase
            .from('student_notes')
            .insert([
                { note_id: noteId, student_id: req.user.id, private_comment }
            ])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating student note' });
    }
};

module.exports = { getNotesBySubject, createNote, createStudentNote };
