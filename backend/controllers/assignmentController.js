const { getAuthClient } = require('../config/dbConfig');

// Get all assignments for a subject
const getAssignmentsBySubject = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subjectId } = req.params;
        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('subject_id', subjectId);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching assignments' });
    }
};

// Create a new assignment (Teacher only)
const createAssignment = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subject_id, title, description, due_date } = req.body;

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
            .from('assignments')
            .insert([{ subject_id, title, description, due_date }])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating assignment' });
    }
};

// Submit assignment (Student only)
const submitAssignment = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { assignmentId } = req.params;
        const { file_url } = req.body;

        // Verify deadline
        const { data: assignment, error: assignmentError } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();

        if (assignmentError || !assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }

        if (new Date(assignment.due_date) < new Date()) {
            return res.status(400).json({ success: false, error: 'Deadline has passed' });
        }

        const { data, error } = await supabase
            .from('submissions')
            .insert([
                { assignment_id: assignmentId, student_id: req.user.id, file_url, status: 'submitted' }
            ])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error submitting assignment' });
    }
};

// Grade assignment (Teacher only) - marks out of 15
const gradeSubmission = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { submissionId } = req.params;
        const { marks, feedback } = req.body;

        if (marks === undefined || marks === null) {
            return res.status(400).json({ success: false, error: 'Marks are required' });
        }

        if (typeof marks !== 'number' || marks < 0 || marks > 15) {
            return res.status(400).json({ success: false, error: 'Marks must be a number between 0 and 15' });
        }

        const { data, error } = await supabase
            .from('submissions')
            .update({ marks, feedback, status: 'graded' })
            .eq('id', submissionId)
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error grading submission' });
    }
};

// Get ALL assignments for the current user
const getAllAssignments = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { role, id } = req.user;

        if (role === 'teacher') {
            const { data: subjects, error: subjectError } = await supabase
                .from('subjects')
                .select('id, title')
                .eq('teacher_id', id);

            if (subjectError) throw subjectError;
            if (!subjects || subjects.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = subjects.map(s => s.id);
            const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.title]));

            const { data, error } = await supabase
                .from('assignments')
                .select('*')
                .in('subject_id', subjectIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const enriched = (data || []).map(a => ({ ...a, subject: subjectMap[a.subject_id] || '' }));
            return res.json({ success: true, data: enriched });
        } else {
            // Student: get enrolled subjects, then assignments
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('subject_id, subjects ( id, title )')
                .eq('student_id', id);

            if (enrollError) throw enrollError;
            if (!enrollments || enrollments.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = enrollments.map(e => e.subject_id);
            const subjectMap = Object.fromEntries(enrollments.map(e => [e.subject_id, e.subjects?.title || '']));

            const { data, error } = await supabase
                .from('assignments')
                .select('*')
                .in('subject_id', subjectIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const enriched = (data || []).map(a => ({ ...a, subject: subjectMap[a.subject_id] || '' }));
            return res.json({ success: true, data: enriched });
        }
    } catch (error) {
        console.error('getAllAssignments error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching assignments' });
    }
};

// Delete assignment (Teacher only)
const deleteAssignment = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { id: assignmentId } = req.params;

        const { data: assignment, error: asnErr } = await supabase
            .from('assignments')
            .select('subject_id')
            .eq('id', assignmentId)
            .single();

        if (asnErr || !assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }

        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', assignment.subject_id)
            .single();

        if (subErr || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('deleteAssignment error:', error);
        res.status(500).json({ success: false, error: 'Server error deleting assignment' });
    }
};

// Get submissions for the current student
const getMySubmissions = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('student_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getMySubmissions error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching submissions' });
    }
};

// Get all submissions for a teacher's assignments
const getAllSubmissionsForTeacher = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);

        const { data: subjects } = await supabase
            .from('subjects')
            .select('id')
            .eq('teacher_id', req.user.id);

        if (!subjects || subjects.length === 0) return res.json({ success: true, data: [] });

        const subjectIds = subjects.map(s => s.id);

        const { data: assignments } = await supabase
            .from('assignments')
            .select('id')
            .in('subject_id', subjectIds);

        if (!assignments || assignments.length === 0) return res.json({ success: true, data: [] });

        const assignmentIds = assignments.map(a => a.id);

        const { data, error } = await supabase
            .from('submissions')
            .select('*, users!submissions_student_id_fkey ( email, full_name )')
            .in('assignment_id', assignmentIds)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        const enriched = (data || []).map(s => ({
            ...s,
            studentEmail: s.users?.email || '',
            studentName: s.users?.full_name || ''
        }));
        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('getAllSubmissionsForTeacher error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching submissions' });
    }
};

module.exports = {
    getAssignmentsBySubject,
    createAssignment,
    submitAssignment,
    gradeSubmission,
    getAllAssignments,
    deleteAssignment,
    getMySubmissions,
    getAllSubmissionsForTeacher
};
