const { getAuthClient, supabaseAdmin } = require('../config/dbConfig');

// Get all subjects belonging to the logged-in teacher
const getTeacherSubjects = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { data, error } = await supabase
            .from('subjects')
            .select('id, title')
            .eq('teacher_id', req.user.id)
            .order('title', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getTeacherSubjects error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching subjects' });
    }
};

// Get students enrolled in a specific subject (teacher must own it)
const getStudentsBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        // Verify teacher owns this subject
        const { data: subject, error: subErr } = await supabaseAdmin
            .from('subjects')
            .select('teacher_id')
            .eq('id', subjectId)
            .single();

        if (subErr || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this subject' });
        }

        // Fetch enrolled students (Admin access often needed to see user profiles)
        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .select('student_id, users!enrollments_student_id_fkey ( id, full_name, email )')
            .eq('subject_id', subjectId);

        if (error) throw error;

        const students = (data || []).map(e => ({
            id: e.users?.id,
            full_name: e.users?.full_name || 'Unknown',
            email: e.users?.email || '',
        }));

        res.json({ success: true, data: students });
    } catch (error) {
        console.error('getStudentsBySubject error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching students' });
    }
};

// Save (upsert) attendance records for an entire class on a given date
const saveAttendance = async (req, res) => {
    try {
        const { subject_id, date, records } = req.body;

        if (!subject_id || !date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, error: 'subject_id, date, and records[] are required' });
        }

        // Verify teacher owns the subject
        const { data: subject, error: subErr } = await supabaseAdmin
            .from('subjects')
            .select('teacher_id')
            .eq('id', subject_id)
            .single();

        if (subErr || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this subject' });
        }

        const rows = records.map(r => ({
            subject_id,
            student_id: r.student_id,
            date,
            status: r.status,
        }));

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .upsert(rows, { onConflict: 'subject_id,student_id,date' })
            .select();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('saveAttendance error:', error);
        res.status(500).json({ success: false, error: 'Server error saving attendance' });
    }
};

// Get attendance records for a specific subject + date
const getAttendanceBySubjectDate = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, error: 'date query param is required' });
        }

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .select('student_id, status')
            .eq('subject_id', subjectId)
            .eq('date', date);

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getAttendanceBySubjectDate error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching attendance' });
    }
};

// Get attendance summary for a student across all their enrolled subjects
const getMyAttendance = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);

        const { data, error } = await supabase
            .from('attendance')
            .select('subject_id, date, status, subjects!attendance_subject_id_fkey ( title )')
            .eq('student_id', req.user.id)
            .order('date', { ascending: false });

        if (error) throw error;

        const enriched = (data || []).map(r => ({
            subject_id: r.subject_id,
            subject: r.subjects?.title || '',
            date: r.date,
            status: r.status,
        }));

        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('getMyAttendance error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching attendance' });
    }
};

module.exports = {
    getTeacherSubjects,
    getStudentsBySubject,
    saveAttendance,
    getAttendanceBySubjectDate,
    getMyAttendance,
};
