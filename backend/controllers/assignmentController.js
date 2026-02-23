const { getAuthClient, supabaseAdmin } = require('../config/dbConfig');

/**
 * Extracts a reference URL that was embedded into the description field
 * when the teacher provided a content_url during assignment creation.
 * Pattern stored: "...\n\nReference Material: <url>"
 */
const extractRefUrl = (description) => {
    if (!description) return null;
    const match = description.match(/Reference Material:\s*(https?:\/\/\S+)/);
    return match ? match[1] : null;
};

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

        // Extract content_url from description if it exists
        const enriched = (data || []).map(a => {
            let content_url = null;
            let description = a.description;
            if (description && description.includes('Reference Material: ')) {
                const parts = description.split('Reference Material: ');
                description = parts[0].trim();
                content_url = parts[1].trim();
            }
            return { ...a, description, content_url };
        });

        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('getAssignmentsBySubject error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching assignments' });
    }
};

// Create a new assignment (Teacher only)
const createAssignment = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subject_id, title, description, due_date, content_url } = req.body;

        // Check if Teacher owns the subject
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', subject_id)
            .single();

        if (subjectError || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this subject' });
        }

        // Append reference link to description if content_url is provided
        // This ensures compatibility even if the DB schema doesn't have a content_url column for assignments
        let updatedDescription = description;
        if (content_url) {
            // Ensure there's a separator if description already exists
            updatedDescription = `${description ? description + '\n\n' : ''}Reference Material: ${content_url}`;
        }

        const { data, error } = await supabase
            .from('assignments')
            .insert([{ subject_id, title, description: updatedDescription, due_date }])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });

    } catch (error) {
        console.error('createAssignment error:', error);
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
        console.error('submitAssignment error:', error);
        res.status(500).json({ success: false, error: 'Server error submitting assignment' });
    }
};

// Grade assignment (Teacher only) - marks out of 15
const gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { marks, feedback } = req.body;

        if (marks === undefined || marks === null) {
            return res.status(400).json({ success: false, error: 'Marks are required' });
        }

        if (typeof marks !== 'number' || marks < 0 || marks > 15) {
            return res.status(400).json({ success: false, error: 'Marks must be a number between 0 and 15' });
        }

        const { data, error } = await supabaseAdmin
            .from('submissions')
            .update({ marks, feedback, status: 'graded' })
            .eq('id', submissionId)
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('gradeSubmission error:', error);
        res.status(500).json({ success: false, error: 'Server error grading submission' });
    }
};

// Get ALL assignments for the current user
const getAllAssignments = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { role, id } = req.user;

        if (role === 'teacher') {
            const { data: subjects, error: subjectError } = await supabaseAdmin
                .from('subjects')
                .select('id, title')
                .eq('teacher_id', id);

            if (subjectError) throw subjectError;
            if (!subjects || subjects.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = subjects.map(s => s.id);
            const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.title]));

            const { data, error } = await supabaseAdmin
                .from('assignments')
                .select('*')
                .in('subject_id', subjectIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const enriched = (data || []).map(a => {
                let content_url = null;
                let description = a.description;
                if (description && description.includes('Reference Material: ')) {
                    const parts = description.split('Reference Material: ');
                    description = parts[0].trim();
                    content_url = parts[1].trim();
                }
                return { ...a, subject: subjectMap[a.subject_id] || '', description, content_url };
            });
            return res.json({ success: true, data: enriched });
        } else {
            // Student: get enrolled subjects, then assignments
            // Using supabaseAdmin here to bypass RLS cache issues with 'enrollments' table
            const { data: enrollments, error: enrollError } = await supabaseAdmin
                .from('enrollments')
                .select('subject_id')
                .eq('student_id', id);

            if (enrollError) {
                console.error('Student enrollments fetch error:', enrollError);
                throw enrollError;
            }
            if (!enrollments || enrollments.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = enrollments.map(e => e.subject_id);

            // Get subject titles separately to avoid join cache issues
            const { data: subjects, error: subError } = await supabaseAdmin
                .from('subjects')
                .select('id, title')
                .in('id', subjectIds);

            const subjectMap = Object.fromEntries((subjects || []).map(s => [s.id, s.title]));

            const { data, error } = await supabaseAdmin
                .from('assignments')
                .select('*')
                .in('subject_id', subjectIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const enriched = (data || []).map(a => {
                let content_url = null;
                let description = a.description;
                if (description && description.includes('Reference Material: ')) {
                    const parts = description.split('Reference Material: ');
                    description = parts[0].trim();
                    content_url = parts[1].trim();
                }
                return { ...a, subject: subjectMap[a.subject_id] || '', description, content_url };
            });
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
        const { data, error } = await supabaseAdmin
            .from('submissions')
            .select('*')
            .eq('student_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        // Fetch assignment titles separately
        const assignmentIds = [...new Set((data || []).map(s => s.assignment_id))];
        const { data: asgns } = await supabaseAdmin
            .from('assignments')
            .select('id, title')
            .in('id', assignmentIds);

        const asgnMap = Object.fromEntries((asgns || []).map(a => [a.id, a.title]));

        const enriched = (data || []).map(s => ({
            ...s,
            assignment_title: asgnMap[s.assignment_id] || 'Unknown Assignment'
        }));
        res.json({ success: true, data: enriched });

    } catch (error) {
        console.error('getMySubmissions error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching submissions' });
    }
};


// Get all submissions for a teacher's assignments
const getAllSubmissionsForTeacher = async (req, res) => {
    try {
        const { data: subjects } = await supabaseAdmin
            .from('subjects')
            .select('id')
            .eq('teacher_id', req.user.id);

        if (!subjects || subjects.length === 0) return res.json({ success: true, data: [] });

        const subjectIds = subjects.map(s => s.id);

        const { data: assignments } = await supabaseAdmin
            .from('assignments')
            .select('id')
            .in('subject_id', subjectIds);

        if (!assignments || assignments.length === 0) return res.json({ success: true, data: [] });

        const assignmentIds = assignments.map(a => a.id);

        // Fetch submissions without the problematic join strings
        const { data: submissions, error } = await supabaseAdmin
            .from('submissions')
            .select('*')
            .in('assignment_id', assignmentIds)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        // Fetch student details separately
        const studentIds = [...new Set((submissions || []).map(s => s.student_id))];
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name')
            .in('id', studentIds);

        const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));

        const enriched = (submissions || []).map(s => ({
            ...s,
            studentEmail: userMap[s.student_id]?.email || '',
            studentName: userMap[s.student_id]?.full_name || ''
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
