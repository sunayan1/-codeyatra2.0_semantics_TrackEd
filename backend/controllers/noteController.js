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

// Get ALL notes for the current user (teacher: their subjects' notes, student: enrolled subjects' notes)
const getAllNotes = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { role, id } = req.user;

        if (role === 'teacher') {
            // Get all subjects owned by this teacher, then all notes for those subjects
            const { data: subjects, error: subjectError } = await supabase
                .from('subjects')
                .select('id, title')
                .eq('teacher_id', id);

            if (subjectError) throw subjectError;
            if (!subjects || subjects.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = subjects.map(s => s.id);
            const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.title]));

            const { data: notes, error } = await supabase
                .from('notes')
                .select('*')
                .in('subject_id', subjectIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const enriched = (notes || []).map(n => ({ ...n, subject: subjectMap[n.subject_id] || '' }));
            return res.json({ success: true, data: enriched });
        } else {
            // Student — get enrolled subjects, then notes for those subjects
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('subject_id, subjects!enrollments_subject_id_fkey ( id, title )')

                .eq('student_id', id);

            if (enrollError) throw enrollError;
            if (!enrollments || enrollments.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = enrollments.map(e => e.subject_id);
            const subjectMap = Object.fromEntries(enrollments.map(e => [e.subject_id, e.subjects?.title || '']));

            const { data: notes, error } = await supabase
                .from('notes')
                .select('*')
                .in('subject_id', subjectIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const enriched = (notes || []).map(n => ({ ...n, subject: subjectMap[n.subject_id] || '' }));
            return res.json({ success: true, data: enriched });
        }
    } catch (error) {
        console.error('getAllNotes error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching notes' });
    }
};

// Delete a note (Teacher only — must own the subject)
const deleteNote = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { id: noteId } = req.params;

        const { data: note, error: noteError } = await supabase
            .from('notes')
            .select('subject_id')
            .eq('id', noteId)
            .single();

        if (noteError || !note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', note.subject_id)
            .single();

        if (subjectError || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const { error } = await supabase.from('notes').delete().eq('id', noteId);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('deleteNote error:', error);
        res.status(500).json({ success: false, error: 'Server error deleting note' });
    }
};

module.exports = { getNotesBySubject, createNote, createStudentNote, getAllNotes, deleteNote };
