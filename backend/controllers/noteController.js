const { getAuthClient, supabaseAdmin } = require('../config/dbConfig');


// GET NOTES BY SUBJECT

const getNotesBySubject = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);
    const { subjectId } = req.params;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('subject_id', subjectId)
      .order('position', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching notes' });
  }
};


// CREATE SIMPLE NOTE 

const createNote = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);
    const { subject_id, title } = req.body;

    const { data: subject } = await supabase
      .from('subjects')
      .select('teacher_id')
      .eq('id', subject_id)
      .single();

    if (!subject || subject.teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([{ subject_id, title }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error creating note' });
  }
};


// UPLOAD PDF NOTE

const uploadNote = async (req, res) => {
  try {
    const { subject_id, title, position } = req.body;
    const file = req.file;

    if (!subject_id || !title || !file) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const { data: subject } = await supabaseAdmin
      .from('subjects')
      .select('teacher_id')
      .eq('id', subject_id)
      .single();

    if (!subject || subject.teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const filePath = `notes/${Date.now()}_${file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('notes')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype
      });

    if (uploadError) {
      return res.status(500).json({ success: false, error: 'Storage upload failed' });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('notes')
      .getPublicUrl(filePath);

    const content_url = urlData?.publicUrl || null;

    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert([{
        subject_id,
        title,
        file_path: filePath,
        content_url,
        position: position ? parseInt(position, 10) : 0
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });

  } catch (err) {
    console.error('uploadNote error:', err);
    res.status(500).json({ success: false, error: 'Error uploading note' });
  }
};

// DELETE NOTE

const deleteNote = async (req, res) => {
  try {
    const { id: noteId } = req.params;

    const { data: note } = await supabaseAdmin
      .from('notes')
      .select('subject_id, file_path')
      .eq('id', noteId)
      .single();

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const { data: subject } = await supabaseAdmin
      .from('subjects')
      .select('teacher_id')
      .eq('id', note.subject_id)
      .single();

    if (!subject || subject.teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (note.file_path) {
      await supabaseAdmin.storage
        .from('notes')
        .remove([note.file_path]);
    }

    await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', noteId);

    res.json({ success: true });

  } catch (err) {
    console.error('deleteNote error:', err);
    res.status(500).json({ success: false, error: 'Error deleting note' });
  }
};

// STUDENT PRIVATE NOTE
const createStudentNote = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);
    const { noteId } = req.params;
    const { private_comment } = req.body;

    const { data: note } = await supabase
      .from('notes')
      .select('subject_id')
      .eq('id', noteId)
      .single();

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('subject_id', note.subject_id)
      .eq('student_id', req.user.id)
      .single();

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Not enrolled' });
    }

    const { data, error } = await supabase
      .from('student_notes')
      .insert([{
        note_id: noteId,
        student_id: req.user.id,
        private_comment
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Error creating student note' });
  }
};

// GET ALL NOTES
const getAllNotes = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);
    const { role, id } = req.user;

    if (role === 'teacher') {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, title')
        .eq('teacher_id', id);

      if (!subjects?.length) return res.json({ success: true, data: [] });

      const subjectIds = subjects.map(s => s.id);
      const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.title]));

      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .in('subject_id', subjectIds)
        .order('position', { ascending: true });

      const enriched = (notes || []).map(n => ({
        ...n,
        subject: subjectMap[n.subject_id] || ''
      }));

      return res.json({ success: true, data: enriched });

    } else {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_id, subjects ( title )')
        .eq('student_id', id);

      if (!enrollments?.length) return res.json({ success: true, data: [] });

      const subjectIds = enrollments.map(e => e.subject_id);
      const subjectMap = Object.fromEntries(
        enrollments.map(e => [e.subject_id, e.subjects?.title || ''])
      );

      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .in('subject_id', subjectIds)
        .order('position', { ascending: true });

      const enriched = (notes || []).map(n => ({
        ...n,
        subject: subjectMap[n.subject_id] || ''
      }));

      return res.json({ success: true, data: enriched });
    }

  } catch (err) {
    console.error('getAllNotes error:', err);
    res.status(500).json({ success: false, error: 'Error fetching notes' });
  }
};

// GET STUDENT'S PRIVATE NOTES (comments) for a specific note
const getStudentNotes = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);
    const { noteId } = req.params;

    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('note_id', noteId)
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching student notes' });
  }
};

// GET ALL STUDENT NOTES (for bookshelf – own + shared by others)
const getBookshelfNotes = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);

    // Get own notes
    const { data: ownNotes, error: ownErr } = await supabase
      .from('student_notes')
      .select('*, notes(title, subject_id)')
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    if (ownErr) throw ownErr;

    // Get shared notes by others
    const { data: sharedNotes, error: sharedErr } = await supabase
      .from('student_notes')
      .select('*, notes(title, subject_id), users!student_notes_student_id_fkey(full_name)')
      .eq('shared', true)
      .neq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    if (sharedErr) throw sharedErr;

    res.json({
      success: true,
      data: {
        own: ownNotes || [],
        shared: (sharedNotes || []).map(n => ({
          ...n,
          shared_by: n.users?.full_name || 'Unknown'
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching bookshelf notes' });
  }
};

// TOGGLE SHARE on a student note
const toggleShareStudentNote = async (req, res) => {
  try {
    const supabase = getAuthClient(req.token);
    const { studentNoteId } = req.params;

    // Get current state
    const { data: existing, error: fetchErr } = await supabase
      .from('student_notes')
      .select('id, shared, student_id')
      .eq('id', studentNoteId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Student note not found' });
    }

    if (existing.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not your note' });
    }

    const { data, error } = await supabase
      .from('student_notes')
      .update({ shared: !existing.shared })
      .eq('id', studentNoteId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error toggling share' });
  }
};

module.exports = {
  getNotesBySubject,
  createNote,
  createStudentNote,
  getStudentNotes,
  getBookshelfNotes,
  toggleShareStudentNote,
  getAllNotes,
  deleteNote,
  uploadNote
};