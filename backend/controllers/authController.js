const { supabase, supabaseAdmin, getAuthClient } = require('../config/dbConfig');

const register = async (req, res) => {
    try {
        const { email, password, full_name, role, faculty, semester, default_passcode } = req.body;

        if (!email || !full_name || !role) {
            return res.status(400).json({ success: false, error: 'Email, full_name, and role are required' });
        }

        if (!['teacher', 'student'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Role must be either teacher or student' });
        }

        const userPassword = password || default_passcode || 'TrackEd@123';

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: userPassword
        });

        if (authError) {
            return res.status(400).json({ success: false, error: authError.message });
        }

        if (!authData.user) {
            return res.status(400).json({ success: false, error: 'Registration failed' });
        }

        const profileData = {
            id: authData.user.id,
            email,
            full_name,
            role,
            faculty: faculty || null,
            semester: semester || null,
            default_passcode: default_passcode || userPassword
        };

        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert([profileData]);

        if (profileError) {
            return res.status(500).json({ success: false, error: 'User created but profile setup failed: ' + profileError.message });
        }

        const token = authData.session?.access_token || null;

        res.status(201).json({
            success: true,
            data: { id: authData.user.id, email, full_name, role, faculty: faculty || null, semester: semester || null, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
};

// Bulk upload users (college admin)
const bulkRegister = async (req, res) => {
    try {
        const { users } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, error: 'users array is required' });
        }

        const results = [];
        const errors = [];

        for (const u of users) {
            try {
                const pw = u.default_passcode || u.password || 'TrackEd@123';
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: u.email,
                    password: pw
                });

                if (authError) {
                    errors.push({ email: u.email, error: authError.message });
                    continue;
                }

                if (!authData.user) {
                    errors.push({ email: u.email, error: 'Registration failed' });
                    continue;
                }

                await supabaseAdmin
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: u.email,
                        full_name: u.full_name,
                        role: u.role,
                        faculty: u.faculty || null,
                        semester: u.semester || null,
                        default_passcode: pw
                    }]);

                results.push({ email: u.email, id: authData.user.id, success: true });
            } catch (err) {
                errors.push({ email: u.email, error: err.message });
            }
        }

        res.status(201).json({ success: true, data: { created: results, errors } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during bulk registration' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, full_name, email, role, faculty, semester')
            .eq('id', data.user.id)
            .single();

        res.json({
            success: true,
            data: {
                token: data.session.access_token,
                user: profile || { id: data.user.id, email: data.user.email }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
};

const getProfile = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, role, faculty, semester')
            .eq('id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({ success: false, error: 'User profile not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching profile' });
    }
};

module.exports = { register, bulkRegister, login, getProfile };
