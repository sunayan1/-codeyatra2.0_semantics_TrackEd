-- ============================================================
-- TrackEd – Full Schema (Supabase / PostgreSQL)
-- ============================================================

-- Users table extending Supabase Auth
-- College admin uploads users with id, role, name, email, default passcode, faculty
CREATE TABLE users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT CHECK (role IN ('teacher', 'student')) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    faculty TEXT,                  -- e.g. "Computer Science", defines subject taught
    semester INTEGER,              -- current semester of the student
    default_passcode TEXT          -- default password set by college on upload
);

-- Subjects Table
-- teacher_id assigns a subject to a teacher
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    faculty TEXT,                  -- faculty/department this subject belongs to
    semester INTEGER,              -- semester number
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Enrollments Table (student ↔ subject)
CREATE TABLE enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(student_id, subject_id)
);

-- Notes Table (chapter order via `position`)
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_url TEXT,              -- Supabase Storage public URL of the PDF
    position INTEGER DEFAULT 0,   -- ordering: chapter 1, 2, 3 …
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Notes (private comments on a note — goes to bookshelf, shareable)
CREATE TABLE student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    private_comment TEXT,
    shared BOOLEAN DEFAULT FALSE,     -- whether the student chose to share
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_marks NUMERIC DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions Table (student submits, teacher grades)
CREATE TABLE submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status TEXT CHECK (status IN ('submitted', 'graded')) DEFAULT 'submitted',
    marks NUMERIC CHECK (marks >= 0),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Attendance Table (teacher marks, student views own)
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late')) NOT NULL,
    marked_by UUID REFERENCES users(id),
    UNIQUE(subject_id, student_id, date)
);

-- Quizzes Table (auto-generated from notes via AI)
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL,
    passing_percent INTEGER DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Quiz Attempts Table
CREATE TABLE student_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, quiz_id)
);