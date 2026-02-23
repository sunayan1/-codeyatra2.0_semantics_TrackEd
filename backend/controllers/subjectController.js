const { getAuthClient, supabaseAdmin } = require('../config/dbConfig');

// Get all subjects (For teacher: their subjects. For student: enrolled subjects)
const getSubjects = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { role, id } = req.user;

        if (role === 'teacher') {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('teacher_id', id)
                .order('semester', { ascending: true });

            if (error) throw error;
            return res.json({ success: true, data });
        } else {
            // Student - join via enrollments, include faculty & semester
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    subject_id,
                    subjects ( id, title, description, faculty, semester, teacher_id,
                               users!subjects_teacher_id_fkey ( full_name, email ) )
                `)
                .eq('student_id', id);

            if (error) throw error;
            const subjects = data.map(curr => {
                const s = curr.subjects;
                return {
                    ...s,
                    teacher_name: s.users?.full_name || null,
                    teacher_email: s.users?.email || null,
                    users: undefined
                };
            });
            return res.json({ success: true, data: subjects });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching subjects' });
    }
};

// Create a new subject (Teacher only)
const createSubject = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { title, description, faculty, semester } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const insertData = { title, description: description || null, teacher_id: req.user.id };
        if (faculty) insertData.faculty = faculty;
        if (semester) insertData.semester = parseInt(semester, 10);

        const { data, error } = await supabase
            .from('subjects')
            .insert([insertData])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating subject' });
    }
};

// Enroll a student into a subject (Teacher only)
const enrollStudent = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subject_id, student_email } = req.body;

        if (!subject_id || !student_email) {
            return res.status(400).json({ success: false, error: 'subject_id and student_email are required' });
        }

        // Verify the subject belongs to this teacher
        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('id')
            .eq('id', subject_id)
            .eq('teacher_id', req.user.id)
            .single();

        if (subErr || !subject) {
            return res.status(403).json({ success: false, error: 'Subject not found or you do not own it' });
        }

        // Look up the student by email
        const { data: student, error: studentErr } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('email', student_email)
            .eq('role', 'student')
            .single();

        if (studentErr || !student) {
            return res.status(404).json({ success: false, error: 'No student found with that email' });
        }

        // Create the enrollment
        const { data, error } = await supabase
            .from('enrollments')
            .insert([{ student_id: student.id, subject_id }])
            .select();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ success: false, error: 'Student is already enrolled in this subject' });
            }
            throw error;
        }

        res.status(201).json({ success: true, data: { ...data[0], student } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error enrolling student' });
    }
};

// Get enrolled students for a subject (Teacher only)
const getEnrolledStudents = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subjectId } = req.params;

        // Verify the subject belongs to this teacher
        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('id')
            .eq('id', subjectId)
            .eq('teacher_id', req.user.id)
            .single();

        if (subErr || !subject) {
            return res.status(403).json({ success: false, error: 'Subject not found or you do not own it' });
        }

        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .select(`
                id,
                student_id,
                users ( id, email, full_name )
            `)
            .eq('subject_id', subjectId);

        if (error) throw error;

        const students = data.map(e => ({ enrollment_id: e.id, ...e.users }));
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching enrolled students' });
    }
};

// Unenroll a student from a subject (Teacher only)
const unenrollStudent = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { enrollmentId } = req.params;

        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('id', enrollmentId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error removing enrollment' });
    }
};

// Enroll all students matching a subject's faculty into that subject
const enrollAllBySubject = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { subject_id } = req.body;

        if (!subject_id) {
            return res.status(400).json({ success: false, error: 'subject_id is required' });
        }

        // Get the subject and verify ownership
        const { data: subject, error: subErr } = await supabase
            .from('subjects')
            .select('id, title, faculty, semester')
            .eq('id', subject_id)
            .eq('teacher_id', req.user.id)
            .single();

        if (subErr || !subject) {
            return res.status(403).json({ success: false, error: 'Subject not found or you do not own it' });
        }

        // Find all students matching the subject's faculty and semester
        // Use admin client to bypass RLS – teachers can't read the users table directly
        let studentsQuery = supabaseAdmin
            .from('users')
            .select('id, email, full_name')
            .eq('role', 'student');

        if (subject.faculty) {
            studentsQuery = studentsQuery.eq('faculty', subject.faculty);
        }
        if (subject.semester) {
            studentsQuery = studentsQuery.eq('semester', subject.semester);
        }

        const { data: students, error: stuErr } = await studentsQuery;
        if (stuErr) throw stuErr;
        if (!students || students.length === 0) {
            return res.status(404).json({ success: false, error: 'No students found matching this faculty and semester' });
        }

        // Build enrollment rows
        const rows = students.map(st => ({ student_id: st.id, subject_id: subject.id }));

        // Upsert to skip duplicates (use admin to bypass RLS)
        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .upsert(rows, { onConflict: 'student_id,subject_id', ignoreDuplicates: true })
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: {
                enrolled: data?.length || 0,
                subject: subject.title,
                studentsMatched: students.length
            }
        });
    } catch (error) {
        console.error('enrollAllBySubject error:', error);
        res.status(500).json({ success: false, error: 'Server error during enrollment' });
    }
};

// Get teacher dashboard stats (dynamic counts)
const getDashboardStats = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Get teacher's subjects
        const { data: subjects } = await supabaseAdmin
            .from('subjects')
            .select('id')
            .eq('teacher_id', teacherId);
        const subjectIds = (subjects || []).map(s => s.id);

        if (subjectIds.length === 0) {
            return res.json({ success: true, data: { students: 0, assignments: 0, subjects: 0, lowAttendance: 0 } });
        }

        // Count unique enrolled students across all subjects
        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('student_id')
            .in('subject_id', subjectIds);
        const uniqueStudents = new Set((enrollments || []).map(e => e.student_id));

        // Count total assignments
        const { data: assignments } = await supabaseAdmin
            .from('assignments')
            .select('id')
            .in('subject_id', subjectIds);

        // Count students with low attendance (<75%) across any subject
        const { data: attendance } = await supabaseAdmin
            .from('attendance')
            .select('student_id, status')
            .in('subject_id', subjectIds);

        const attByStudent = {};
        (attendance || []).forEach(a => {
            if (!attByStudent[a.student_id]) attByStudent[a.student_id] = { total: 0, present: 0 };
            attByStudent[a.student_id].total++;
            if (a.status === 'present') attByStudent[a.student_id].present++;
        });
        const lowAttendance = Object.values(attByStudent).filter(
            s => s.total > 0 && Math.round((s.present / s.total) * 100) < 75
        ).length;

        res.json({
            success: true,
            data: {
                students: uniqueStudents.size,
                assignments: (assignments || []).length,
                subjects: subjectIds.length,
                lowAttendance
            }
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching stats' });
    }
};

module.exports = { getSubjects, createSubject, enrollStudent, getEnrolledStudents, unenrollStudent, enrollAllBySubject, getDashboardStats };
