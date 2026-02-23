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
                .eq('teacher_id', id);

            if (error) throw error;
            return res.json({ success: true, data });
        } else {
            // Student: get enrolled subjects
            // Using supabaseAdmin to avoid join issues (PGRST205)
            const { data: enrollments, error: enrollError } = await supabaseAdmin
                .from('enrollments')
                .select('subject_id')
                .eq('student_id', id);

            if (enrollError) throw enrollError;
            if (!enrollments || enrollments.length === 0) return res.json({ success: true, data: [] });

            const subjectIds = enrollments.map(e => e.subject_id);
            const { data: subjects, error: subError } = await supabaseAdmin
                .from('subjects')
                .select('*')
                .in('id', subjectIds);

            if (subError) throw subError;
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
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, error: 'Title and description are required' });
        }

        const { data, error } = await supabase
            .from('subjects')
            .insert([
                { title, description, teacher_id: req.user.id }
            ])
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
        const { subject_id, student_email } = req.body;
        console.log(`[Enrollment] Starting for subject: ${subject_id}, email: ${student_email}`);

        if (!subject_id || !student_email) {
            return res.status(400).json({ success: false, error: 'subject_id and student_email are required' });
        }

        if (!req.user || !req.user.id) {
            console.error('[Enrollment] Missing req.user.id');
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        // 1. Verify the subject belongs to this teacher
        console.log(`[Enrollment] Verifying subject ownership for teacher: ${req.user.id}`);
        const { data: subject, error: subErr } = await supabaseAdmin
            .from('subjects')
            .select('id')
            .eq('id', subject_id)
            .eq('teacher_id', req.user.id)
            .single();

        if (subErr || !subject) {
            console.error(`[Enrollment] Subject verification failed:`, subErr || 'Subject not found');
            return res.status(403).json({ success: false, error: 'Subject not found or you do not own it' });
        }

        // 2. Look up the student by email
        console.log(`[Enrollment] Looking up student: ${student_email}`);
        const { data: student, error: studentErr } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name')
            .eq('email', student_email.trim().toLowerCase())
            .eq('role', 'student')
            .single();

        if (studentErr || !student) {
            console.log(`[Enrollment] Student lookup failed for ${student_email}:`, studentErr);
            return res.status(404).json({ success: false, error: 'No student found with that email. Make sure the student has created an account.' });
        }

        // 3. Create the enrollment
        console.log(`[Enrollment] Inserting enrollment for student ${student.id} into subject ${subject_id}`);
        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .insert([{ student_id: student.id, subject_id }])
            .select();

        if (error) {
            console.error(`[Enrollment] Insert failed:`, error);
            if (error.code === '23505') {
                return res.status(409).json({ success: false, error: 'Student is already enrolled in this subject' });
            }
            throw error;
        }

        console.log(`[Enrollment] Successfully enrolled ${student_email}`);
        res.status(201).json({
            success: true,
            data: {
                enrollment_id: data[0].id,
                student
            }
        });
    } catch (error) {
        console.error('[Enrollment] Unexpected error:', error);
        res.status(500).json({ success: false, error: 'Critical server error during enrollment. Please check backend logs.' });
    }
};


// Get enrolled students for a subject (Teacher only)
const getEnrolledStudents = async (req, res) => {
    try {
        const { subjectId } = req.params;

        // Verify the subject belongs to this teacher
        const { data: subject, error: subErr } = await supabaseAdmin
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
                student_id
            `)
            .eq('subject_id', subjectId);

        if (error) throw error;

        // Fetch student details separately
        const studentIds = data.map(e => e.student_id);
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name')
            .in('id', studentIds);

        const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));

        const students = data.map(e => ({
            enrollment_id: e.id,
            ...(userMap[e.student_id] || { id: e.student_id, full_name: 'Unknown', email: '' })
        }));
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('getEnrolledStudents error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching enrolled students' });
    }
};

// Unenroll a student from a subject (Teacher only)
const unenrollStudent = async (req, res) => {
    try {
        const { enrollmentId } = req.params;

        const { error } = await supabaseAdmin
            .from('enrollments')
            .delete()
            .eq('id', enrollmentId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('unenrollStudent error:', error);
        res.status(500).json({ success: false, error: 'Server error removing enrollment' });
    }
};

// Get all unique students across all subjects for a teacher with aggregated stats
const getAllStudentsForTeacher = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // 1. Get all subjects for this teacher
        const { data: mySubjects, error: subErr } = await supabaseAdmin
            .from('subjects')
            .select('id, title')
            .eq('teacher_id', teacherId);

        if (subErr) throw subErr;
        const subjectIds = mySubjects.map(s => s.id);

        if (subjectIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 2. Get unique students enrolled in these subjects
        // Include subject_id so we can count assignments per student later
        const { data: enrolls, error: enrollErr } = await supabaseAdmin
            .from('enrollments')
            .select('student_id, subject_id')
            .in('subject_id', subjectIds);

        if (enrollErr) throw enrollErr;

        const studentIdsUnique = [...new Set((enrolls || []).map(e => e.student_id))];
        if (studentIdsUnique.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Fetch student user profiles separately
        const { data: userData, error: userErr } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email')
            .in('id', studentIdsUnique);

        if (userErr) throw userErr;

        // Dedup students and prepare record structure
        const studentMap = {};
        userData.forEach(u => {
            studentMap[u.id] = {
                ...u,
                subjects: [],
                attendance: 0,
                assignments: [],
                totalAssignments: 0,
                completedAssignments: 0
            };
        });

        const studentIds = Object.keys(studentMap);

        if (studentIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 3. Fetch stats for these students (Attendance & Submissions)
        const [attendanceRes, submissionsRes, totalAssignmentsRes] = await Promise.all([
            supabaseAdmin.from('attendance').select('student_id, status').in('subject_id', subjectIds).in('student_id', studentIds),
            supabaseAdmin.from('submissions').select('assignment_id, student_id, marks, feedback').in('student_id', studentIds),
            supabaseAdmin.from('assignments').select('id, title, subject_id').in('subject_id', subjectIds)
        ]);

        if (attendanceRes.error) console.error("Attendance fetch error:", attendanceRes.error);
        if (submissionsRes.error) console.error("Submissions fetch error:", submissionsRes.error);
        if (totalAssignmentsRes.error) console.error("Assignments fetch error:", totalAssignmentsRes.error);

        // Process Attendance
        attendanceRes.data?.forEach(att => {
            if (studentMap[att.student_id]) {
                if (!studentMap[att.student_id].attCount) studentMap[att.student_id].attCount = 0;
                if (!studentMap[att.student_id].presentCount) studentMap[att.student_id].presentCount = 0;

                studentMap[att.student_id].attCount++;
                if (att.status === 'present' || att.status === 'late') {
                    studentMap[att.student_id].presentCount++;
                }
            }
        });

        // Calculate Attendance %
        Object.values(studentMap).forEach(s => {
            s.attendance = s.attCount ? Math.round((s.presentCount / s.attCount) * 100) : 100;
            delete s.attCount;
            delete s.presentCount;
        });

        // Process Assignments & Submissions
        const assignmentsBySubject = {};
        totalAssignmentsRes.data?.forEach(a => {
            if (!assignmentsBySubject[a.subject_id]) assignmentsBySubject[a.subject_id] = [];
            assignmentsBySubject[a.subject_id].push(a);
        });

        // We need to know which students are in which subjects to count their expected assignments
        enrolls?.forEach(e => {
            if (studentMap[e.student_id]) {
                const asgns = assignmentsBySubject[e.subject_id] || [];
                studentMap[e.student_id].totalAssignments += asgns.length;
                // Track assignments for detail view
                asgns.forEach(a => {
                    studentMap[e.student_id].assignments.push({
                        id: a.id,
                        title: a.title,
                        status: 'pending',
                        marks: null,
                        feedback: null
                    });
                });
            }
        });

        // Mark submitted assignments
        submissionsRes.data?.forEach(sub => {
            if (studentMap[sub.student_id]) {
                // Find index to avoid multiple calls or just use find
                const asgn = studentMap[sub.student_id].assignments.find(a => a.id === sub.assignment_id);
                if (asgn) {
                    asgn.status = 'submitted';
                    asgn.marks = sub.marks;
                    asgn.feedback = sub.feedback;
                    studentMap[sub.student_id].completedAssignments++;
                }
            }
        });

        res.json({ success: true, data: Object.values(studentMap) });
    } catch (error) {
        console.error('getAllStudentsForTeacher error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching student progress' });
    }
};

// Get all subjects NOT yet enrolled in by the current student
const getAvailableSubjects = async (req, res) => {
    try {
        const studentId = req.user.id;

        const { data: enrollments, error: enrollError } = await supabaseAdmin
            .from('enrollments')
            .select('subject_id')
            .eq('student_id', studentId);

        if (enrollError) throw enrollError;

        const enrolledIds = (enrollments || []).map(e => e.subject_id);

        const { data: allSubjects, error: subError } = await supabaseAdmin
            .from('subjects')
            .select('id, title, description, teacher_id')
            .order('title', { ascending: true });

        if (subError) throw subError;

        const available = (allSubjects || []).filter(s => !enrolledIds.includes(s.id));
        return res.json({ success: true, data: available });
    } catch (error) {
        console.error('getAvailableSubjects error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching available subjects' });
    }
};

// Self-enroll current student into a subject (Student only)
const enrollSelf = async (req, res) => {
    try {
        const { subject_id } = req.body;
        const studentId = req.user.id;

        if (!subject_id) {
            return res.status(400).json({ success: false, error: 'subject_id is required' });
        }

        const { data: subject, error: subError } = await supabaseAdmin
            .from('subjects')
            .select('id, title')
            .eq('id', subject_id)
            .single();

        if (subError || !subject) {
            return res.status(404).json({ success: false, error: 'Subject not found' });
        }

        const { data: existing } = await supabaseAdmin
            .from('enrollments')
            .select('id')
            .eq('subject_id', subject_id)
            .eq('student_id', studentId)
            .single();

        if (existing) {
            return res.status(409).json({ success: false, error: 'Already enrolled in this subject' });
        }

        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .insert([{ subject_id, student_id: studentId }])
            .select();

        if (error) throw error;
        return res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('enrollSelf error:', error);
        res.status(500).json({ success: false, error: 'Server error enrolling in subject' });
    }
};

module.exports = { getSubjects, createSubject, enrollStudent, getEnrolledStudents, unenrollStudent, getAllStudentsForTeacher, getAvailableSubjects, enrollSelf };

