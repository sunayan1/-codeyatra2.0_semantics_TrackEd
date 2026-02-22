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

// Grade assignment (Teacher only)
const gradeSubmission = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { submissionId } = req.params;
        const { grade, feedback } = req.body;

        const { data, error } = await supabase
            .from('submissions')
            .update({ grade, feedback, status: 'graded' })
            .eq('id', submissionId)
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error grading submission' });
    }
};

module.exports = { getAssignmentsBySubject, createAssignment, submitAssignment, gradeSubmission };
