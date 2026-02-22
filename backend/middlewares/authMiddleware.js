const { supabase } = require('../config/dbConfig');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Authorization header is missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token is missing' });
    }

    req.token = token; // Make token available for downstream RLS

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        // Fetch user role from the custom users table if needed, or from user metadata
        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (dbError) {
            // If no custom profile is found, proceed. The role might be in app_metadata
            req.user = { id: user.id, email: user.email, role: user.app_metadata?.role || 'student' };
        } else {
            req.user = { id: user.id, email: user.email, role: dbUser.role };
        }

        next();
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error during authentication' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ success: false, error: `Forbidden: Requires ${role} role` });
        }
        next();
    };
};

module.exports = { authMiddleware, requireRole };
