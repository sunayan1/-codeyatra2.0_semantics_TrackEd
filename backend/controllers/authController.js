const { supabase, supabaseAdmin, getAuthClient } = require('../config/dbConfig');

const register = async (req, res) => {
    try {
        const { email, password, full_name, role } = req.body;

        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ success: false, error: 'Email, password, full_name, and role are required' });
        }

        if (!['teacher', 'student'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Role must be either teacher or student' });
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            return res.status(400).json({ success: false, error: authError.message });
        }

        if (!authData.user) {
            return res.status(400).json({ success: false, error: 'Registration failed' });
        }

        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert([{ id: authData.user.id, email, full_name, role }]);

        if (profileError) {
            return res.status(500).json({ success: false, error: 'User created but profile setup failed: ' + profileError.message });
        }

        const token = authData.session?.access_token || null;

        res.status(201).json({
            success: true,
            data: { id: authData.user.id, email, full_name, role, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during registration' });
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
            .select('id, full_name, email, role')
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
            .select('id, full_name, email, role')
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

module.exports = { register, login, getProfile };
