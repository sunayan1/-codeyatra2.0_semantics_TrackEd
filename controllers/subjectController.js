const { getAuthClient } = require('../config/dbConfig');

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
            // Student - join via enrollments
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
          subject_id,
          subjects ( id, title, description, teacher_id )
        `)
                .eq('student_id', id);

            if (error) throw error;
            const subjects = data.map(curr => curr.subjects);
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

module.exports = { getSubjects, createSubject };
