// controllers/quizController.js
const { getAuthClient } = require('../config/dbConfig');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); // or use native fetch if Node 18+

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/quiz/generate/:noteId
 * Student must be enrolled in the subject that owns this note.
 * Body: { pdfText: string }  — frontend sends extracted text
 */
const generateQuizFromNote = async (req, res) => {
    try {
        const supabase = getAuthClient(req.token);
        const { noteId } = req.params;
        const { pdfText } = req.body;

        if (!pdfText || pdfText.trim().length < 50) {
            return res.status(400).json({ success: false, error: 'PDF text is too short or missing.' });
        }

        // Verify student is enrolled in the subject of this note
        const { data: note, error: noteError } = await supabase
            .from('notes')
            .select('subject_id')
            .eq('id', noteId)
            .single();

        if (noteError || !note) {
            return res.status(404).json({ success: false, error: 'Note not found.' });
        }

        const { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('subject_id', note.subject_id)
            .eq('student_id', req.user.id)
            .single();

        if (enrollError || !enrollment) {
            return res.status(403).json({ success: false, error: 'Forbidden: You are not enrolled in this subject.' });
        }

        // Generate questions via Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are an expert teacher. Based on the study notes below, generate exactly 5 multiple-choice questions to test a student's understanding.

Rules:
- Each question must have exactly 4 options labeled A), B), C), D)
- Only one option is correct
- Questions should test comprehension, not just recall
- Return ONLY a valid JSON array, no markdown, no extra text

Format:
[
  {
    "question": "Question text here?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A) option1"
  }
]

Study Notes:
${pdfText.slice(0, 12000)}`; // cap to avoid token overflow

        const result = await model.generateContent(prompt);
        const raw = result.response.text()
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        let questions;
        try {
            questions = JSON.parse(raw);
        } catch (e) {
            console.error('JSON parse error:', raw);
            return res.status(500).json({ success: false, error: 'Failed to parse questions from AI. Please try again.' });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(500).json({ success: false, error: 'AI returned invalid question format.' });
        }

        return res.json({ success: true, data: questions });
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
};

module.exports = { generateQuizFromNote };