const { supabaseAdmin } = require('../config/dbConfig');

// ── helpers ────────────────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1)
        .filter(l => l.trim())
        .map(line => {
            const vals = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
            return obj;
        });
}

// ── 1. Bulk upload users ───────────────────────────────────────────
// Expected CSV columns: full_name, email, role, faculty, default_passcode
// Role must be 'teacher' or 'student'
const bulkUploadUsers = async (req, res) => {
    try {
        const csvText = req.body?.csv;
        if (!csvText) {
            return res.status(400).json({ success: false, error: 'CSV text is required in the "csv" field' });
        }

        const rows = parseCSV(csvText);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, error: 'CSV has no data rows' });
        }

        const results = { created: [], errors: [] };

        for (const row of rows) {
            const { full_name, email, role, faculty, default_passcode } = row;

            if (!email || !full_name || !role) {
                results.errors.push({ email: email || '(blank)', error: 'Missing required field (full_name, email, or role)' });
                continue;
            }

            if (!['teacher', 'student'].includes(role)) {
                results.errors.push({ email, error: `Invalid role "${role}" — must be teacher or student` });
                continue;
            }

            const password = default_passcode || 'TrackEd@2026';

            try {
                // 1a  Create in Supabase Auth
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true   // auto-confirm so they can log in right away
                });

                if (authError) {
                    results.errors.push({ email, error: authError.message });
                    continue;
                }

                // 1b  Insert into public.users
                const profileData = {
                    id: authData.user.id,
                    email,
                    full_name,
                    role,
                    faculty: faculty || null,
                    default_passcode: password
                };

                const { error: profileErr } = await supabaseAdmin
                    .from('users')
                    .insert([profileData]);

                if (profileErr) {
                    results.errors.push({ email, error: 'Auth user created but profile insert failed: ' + profileErr.message });
                    continue;
                }

                results.created.push({ id: authData.user.id, email, full_name, role, faculty: faculty || null });
            } catch (err) {
                results.errors.push({ email, error: err.message });
            }
        }

        res.json({
            success: true,
            summary: { total: rows.length, created: results.created.length, failed: results.errors.length },
            data: results
        });
    } catch (error) {
        console.error('bulkUploadUsers error:', error);
        res.status(500).json({ success: false, error: 'Server error during bulk user upload' });
    }
};

// ── 2. Bulk upload subjects ────────────────────────────────────────
// Expected CSV columns: title, description, faculty, semester, teacher_email
// teacher_email is matched against users table to get teacher_id
const bulkUploadSubjects = async (req, res) => {
    try {
        const csvText = req.body?.csv;
        if (!csvText) {
            return res.status(400).json({ success: false, error: 'CSV text is required in the "csv" field' });
        }

        const rows = parseCSV(csvText);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, error: 'CSV has no data rows' });
        }

        const results = { created: [], errors: [] };

        // Pre-fetch all teachers so we can resolve teacher_email → teacher_id
        const { data: allTeachers } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('role', 'teacher');

        const teacherMap = {};
        (allTeachers || []).forEach(t => { teacherMap[t.email.toLowerCase()] = t.id; });

        for (const row of rows) {
            const { title, description, faculty, semester, teacher_email } = row;

            if (!title) {
                results.errors.push({ title: '(blank)', error: 'Title is required' });
                continue;
            }

            let teacher_id = null;
            if (teacher_email) {
                teacher_id = teacherMap[teacher_email.toLowerCase()] || null;
                if (!teacher_id) {
                    results.errors.push({ title, error: `Teacher "${teacher_email}" not found` });
                    continue;
                }
            }

            const insertData = { title, description: description || null, teacher_id };
            if (faculty) insertData.faculty = faculty;
            if (semester) insertData.semester = parseInt(semester, 10) || null;

            const { data, error } = await supabaseAdmin
                .from('subjects')
                .insert([insertData])
                .select();

            if (error) {
                results.errors.push({ title, error: error.message });
            } else {
                results.created.push(data[0]);
            }
        }

        res.json({
            success: true,
            summary: { total: rows.length, created: results.created.length, failed: results.errors.length },
            data: results
        });
    } catch (error) {
        console.error('bulkUploadSubjects error:', error);
        res.status(500).json({ success: false, error: 'Server error during bulk subject upload' });
    }
};

// ── 3. Bulk enroll students ────────────────────────────────────────
// Expected CSV columns: student_email, subject_title
// OR:  student_email, subject_id
const bulkEnrollStudents = async (req, res) => {
    try {
        const csvText = req.body?.csv;
        if (!csvText) {
            return res.status(400).json({ success: false, error: 'CSV text is required in the "csv" field' });
        }

        const rows = parseCSV(csvText);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, error: 'CSV has no data rows' });
        }

        const results = { created: [], errors: [] };

        // Pre-fetch students & subjects for quick lookups
        const { data: allStudents } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('role', 'student');

        const studentMap = {};
        (allStudents || []).forEach(s => { studentMap[s.email.toLowerCase()] = s.id; });

        const { data: allSubjects } = await supabaseAdmin
            .from('subjects')
            .select('id, title');

        const subjectByTitle = {};
        (allSubjects || []).forEach(s => { subjectByTitle[s.title.toLowerCase()] = s.id; });

        for (const row of rows) {
            const { student_email, subject_title, subject_id } = row;

            if (!student_email) {
                results.errors.push({ student_email: '(blank)', error: 'student_email is required' });
                continue;
            }

            const sid = studentMap[student_email.toLowerCase()];
            if (!sid) {
                results.errors.push({ student_email, error: 'Student not found' });
                continue;
            }

            let subId = subject_id || null;
            if (!subId && subject_title) {
                subId = subjectByTitle[subject_title.toLowerCase()] || null;
            }
            if (!subId) {
                results.errors.push({ student_email, error: 'Subject not found or not specified' });
                continue;
            }

            const { data, error } = await supabaseAdmin
                .from('enrollments')
                .insert([{ student_id: sid, subject_id: subId }])
                .select();

            if (error) {
                if (error.code === '23505') {
                    results.errors.push({ student_email, subject: subject_title || subId, error: 'Already enrolled' });
                } else {
                    results.errors.push({ student_email, error: error.message });
                }
            } else {
                results.created.push({ student_email, subject_id: subId });
            }
        }

        res.json({
            success: true,
            summary: { total: rows.length, created: results.created.length, failed: results.errors.length },
            data: results
        });
    } catch (error) {
        console.error('bulkEnrollStudents error:', error);
        res.status(500).json({ success: false, error: 'Server error during bulk enrollment' });
    }
};

module.exports = { bulkUploadUsers, bulkUploadSubjects, bulkEnrollStudents };
