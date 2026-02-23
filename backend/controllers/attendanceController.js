const { getAuthClient, supabaseAdmin } = require('../config/dbConfig');

// Mark attendance for a subject (Teacher only)
// Expects: { subject_id, date, records: [{ student_id, status }] }
const markAttendance = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subject_id, date, records } = req.body;

        if (!subject_id || !date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, error: 'subject_id, date, and records array are required' });
        }

        // Verify teacher owns the subject
        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', subject_id)
            .single();

        if (subErr || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this subject' });
        }

        // Upsert attendance records
        const rows = records.map(r => ({
            subject_id,
            student_id: r.student_id,
            date,
            status: r.status,
            marked_by: req.user.id
        }));

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .upsert(rows, { onConflict: 'subject_id,student_id,date' })
            .select();

        if (error) {
            console.error('Attendance upsert error:', error);
            return res.status(500).json({ success: false, error: 'Failed to save attendance' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('markAttendance error:', error);
        res.status(500).json({ success: false, error: 'Server error marking attendance' });
    }
};

// Get attendance for a subject on a specific date (Teacher view)
const getAttendanceByDate = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subjectId, date } = req.params;

        const { data, error } = await supabase
            .from('attendance')
            .select('*, users!attendance_student_id_fkey(full_name, email)')
            .eq('subject_id', subjectId)
            .eq('date', date);

        if (error) throw error;

        const enriched = (data || []).map(a => ({
            ...a,
            student_name: a.users?.full_name || '',
            student_email: a.users?.email || ''
        }));

        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('getAttendanceByDate error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching attendance' });
    }
};

// Get attendance summary for a subject (Teacher view – all dates)
const getAttendanceSummary = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subjectId } = req.params;

        const { data, error } = await supabase
            .from('attendance')
            .select('*, users!attendance_student_id_fkey(full_name, email)')
            .eq('subject_id', subjectId)
            .order('date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getAttendanceSummary error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching attendance summary' });
    }
};

// Get student's own attendance across all enrolled subjects
const getMyAttendance = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);

        const { data, error } = await supabase
            .from('attendance')
            .select('*, subjects(title)')
            .eq('student_id', req.user.id)
            .order('date', { ascending: false });

        if (error) throw error;

        // Compute per-subject summary
        const bySubject = {};
        (data || []).forEach(a => {
            const sid = a.subject_id;
            if (!bySubject[sid]) {
                bySubject[sid] = {
                    subject_id: sid,
                    subject_title: a.subjects?.title || '',
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0
                };
            }
            bySubject[sid].total++;
            if (a.status === 'present') bySubject[sid].present++;
            else if (a.status === 'absent') bySubject[sid].absent++;
            else if (a.status === 'late') bySubject[sid].late++;
        });

        const summary = Object.values(bySubject).map(s => ({
            ...s,
            percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        }));

        res.json({ success: true, data: { records: data || [], summary } });
    } catch (error) {
        console.error('getMyAttendance error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching your attendance' });
    }
};

// Get performance metrics for a student in a subject (Teacher view)
const getStudentPerformance = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subjectId } = req.params;

        // Verify teacher owns subject
        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', subjectId)
            .single();

        if (subErr || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        // Get enrolled students (use admin to bypass RLS)
        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('student_id, users(id, full_name, email)')
            .eq('subject_id', subjectId);

        if (!enrollments?.length) return res.json({ success: true, data: [] });

        const studentIds = enrollments.map(e => e.student_id);

        // Attendance
        const { data: attendance } = await supabaseAdmin
            .from('attendance')
            .select('student_id, status')
            .eq('subject_id', subjectId)
            .in('student_id', studentIds);

        // Assignments & submissions
        const { data: assignments } = await supabaseAdmin
            .from('assignments')
            .select('id')
            .eq('subject_id', subjectId);
        const assignmentIds = (assignments || []).map(a => a.id);

        let submissions = [];
        if (assignmentIds.length > 0) {
            const { data: subs } = await supabaseAdmin
                .from('submissions')
                .select('student_id, marks, status')
                .in('assignment_id', assignmentIds)
                .in('student_id', studentIds);
            submissions = subs || [];
        }

        // Quiz attempts
        const { data: quizzes } = await supabaseAdmin
            .from('quizzes')
            .select('id')
            .eq('subject_id', subjectId);
        const quizIds = (quizzes || []).map(q => q.id);

        let quizAttempts = [];
        if (quizIds.length > 0) {
            const { data: attempts } = await supabaseAdmin
                .from('student_quiz_attempts')
                .select('student_id, score, total, passed')
                .in('quiz_id', quizIds)
                .in('student_id', studentIds);
            quizAttempts = attempts || [];
        }

        // Build per-student metrics
        const metrics = enrollments.map(e => {
            const sid = e.student_id;
            const student = e.users;

            // Attendance
            const att = (attendance || []).filter(a => a.student_id === sid);
            const attTotal = att.length;
            const attPresent = att.filter(a => a.status === 'present').length;
            const attPercent = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

            // Submissions
            const subs = submissions.filter(s => s.student_id === sid);
            const gradedSubs = subs.filter(s => s.status === 'graded');
            const avgMarks = gradedSubs.length > 0
                ? Math.round(gradedSubs.reduce((sum, s) => sum + Number(s.marks || 0), 0) / gradedSubs.length)
                : null;

            // Quiz
            const qa = quizAttempts.filter(a => a.student_id === sid);
            const quizPassed = qa.filter(a => a.passed).length;
            const quizTotal = qa.length;

            return {
                student_id: sid,
                full_name: student?.full_name || '',
                email: student?.email || '',
                attendance: { total: attTotal, present: attPresent, percentage: attPercent },
                assignments: { submitted: subs.length, graded: gradedSubs.length, avgMarks },
                quizzes: { attempted: quizTotal, passed: quizPassed }
            };
        });

        res.json({ success: true, data: metrics });
    } catch (error) {
        console.error('getStudentPerformance error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching performance' });
    }
};

module.exports = {
    markAttendance,
    getAttendanceByDate,
    getAttendanceSummary,
    getMyAttendance,
    getStudentPerformance
};
