const { getAuthClient, supabaseAdmin } = require('../config/dbConfig');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// Generate quiz from note PDF (fetches PDF from stored content_url)
const generateQuiz = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { note_id, num_questions = 20 } = req.body;

        if (!note_id) {
            return res.status(400).json({ success: false, error: 'note_id is required' });
        }

        // Get the note to find subject_id and content_url
        const { data: note, error: noteError } = await supabase
            .from('notes')
            .select('id, subject_id, title, content_url')
            .eq('id', note_id)
            .single();

        if (noteError || !note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        if (!note.content_url) {
            return res.status(400).json({ success: false, error: 'Note has no PDF file attached' });
        }

        // Verify teacher owns the subject
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', note.subject_id)
            .single();

        if (subjectError || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this subject' });
        }

        // Download the PDF from the stored content_url
        const pdfResponse = await fetch(note.content_url);
        if (!pdfResponse.ok) {
            return res.status(500).json({ success: false, error: 'Failed to download PDF from storage' });
        }
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

        // Send PDF to Python AI service via native FormData
        const fd = new globalThis.FormData();
        fd.append('pdf', new Blob([pdfBuffer], { type: 'application/pdf' }), `${note.title}.pdf`);
        fd.append('num_questions', String(num_questions));

        const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-quiz`, {
            method: 'POST',
            body: fd,
        });

        const aiData = await aiResponse.json();

        if (!aiResponse.ok || !aiData.success) {
            return res.status(500).json({
                success: false,
                error: aiData.error || 'AI quiz generation failed'
            });
        }

        // Store quiz in Supabase
        const { data: quiz, error: quizError } = await supabaseAdmin
            .from('quizzes')
            .insert([{
                subject_id: note.subject_id,
                note_id: note.id,
                created_by: req.user.id,
                title: `Quiz: ${note.title}`,
                questions: aiData.questions,
                passing_percent: 70
            }])
            .select()
            .single();

        if (quizError) {
            console.error('Quiz insert error:', quizError);
            return res.status(500).json({ success: false, error: 'Failed to save quiz' });
        }

        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        console.error('generateQuiz error:', error);
        res.status(500).json({ success: false, error: 'Server error generating quiz' });
    }
};

// Get quizzes for a note
const getQuizByNote = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { noteId } = req.params;

        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('note_id', noteId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getQuizByNote error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching quiz' });
    }
};

// Get all quizzes for subjects the user is involved in
const getAllQuizzes = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { role, id } = req.user;

        let subjectIds = [];

        if (role === 'teacher') {
            const { data: subjects, error } = await supabase
                .from('subjects')
                .select('id')
                .eq('teacher_id', id);
            if (error) throw error;
            subjectIds = (subjects || []).map(s => s.id);
        } else {
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select('subject_id')
                .eq('student_id', id);
            if (error) throw error;
            subjectIds = (enrollments || []).map(e => e.subject_id);
        }

        if (subjectIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('*, notes(title), subjects(title)')
            .in('subject_id', subjectIds)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: quizzes || [] });
    } catch (error) {
        console.error('getAllQuizzes error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching quizzes' });
    }
};

// Submit quiz attempt (Student only)
const submitQuizAttempt = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { quizId } = req.params;
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, error: 'answers array is required' });
        }

        // Get the quiz to check answers
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();

        if (quizError || !quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        // Verify student is enrolled in the subject
        const { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('subject_id', quiz.subject_id)
            .eq('student_id', req.user.id)
            .single();

        if (enrollError || !enrollment) {
            return res.status(403).json({ success: false, error: 'You are not enrolled in this subject' });
        }

        // Calculate score
        const questions = quiz.questions;
        let score = 0;
        const total = questions.length;

        for (let i = 0; i < questions.length; i++) {
            if (answers[i] && answers[i] === questions[i].answer) {
                score++;
            }
        }

        // Determine if passed (>= passing_percent, default 70%)
        const passingPercent = quiz.passing_percent || 70;
        const scorePercent = total > 0 ? (score / total) * 100 : 0;
        const passed = scorePercent >= passingPercent;

        // Store attempt (upsert — student can retake)
        const { data: attempt, error: attemptError } = await supabaseAdmin
            .from('student_quiz_attempts')
            .upsert({
                student_id: req.user.id,
                quiz_id: quizId,
                answers,
                score,
                total,
                passed,
                submitted_at: new Date().toISOString()
            }, { onConflict: 'student_id,quiz_id' })
            .select()
            .single();

        if (attemptError) {
            console.error('Attempt insert error:', attemptError);
            return res.status(500).json({ success: false, error: 'Failed to save attempt' });
        }

        res.json({ success: true, data: { ...attempt, total, passed, scorePercent: Math.round(scorePercent) } });
    } catch (error) {
        console.error('submitQuizAttempt error:', error);
        res.status(500).json({ success: false, error: 'Server error submitting quiz' });
    }
};

// Get student's quiz attempts
const getMyAttempts = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);

        const { data, error } = await supabase
            .from('student_quiz_attempts')
            .select('*, quizzes(title, subject_id, subjects(title))')
            .eq('student_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getMyAttempts error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching attempts' });
    }
};

// Get all attempts for a quiz (Teacher view)
const getQuizAttempts = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { quizId } = req.params;

        const { data, error } = await supabase
            .from('student_quiz_attempts')
            .select('*, users(full_name, email)')
            .eq('quiz_id', quizId)
            .order('score', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('getQuizAttempts error:', error);
        res.status(500).json({ success: false, error: 'Server error fetching attempts' });
    }
};

// Delete a quiz (Teacher only)
const deleteQuiz = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { id: quizId } = req.params;

        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('subject_id')
            .eq('id', quizId)
            .single();

        if (quizError || !quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('teacher_id')
            .eq('id', quiz.subject_id)
            .single();

        if (subjectError || !subject || subject.teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const { error } = await supabaseAdmin.from('quizzes').delete().eq('id', quizId);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('deleteQuiz error:', error);
        res.status(500).json({ success: false, error: 'Server error deleting quiz' });
    }
};

module.exports = {
    generateQuiz,
    getQuizByNote,
    getAllQuizzes,
    submitQuizAttempt,
    getMyAttempts,
    getQuizAttempts,
    deleteQuiz
};
