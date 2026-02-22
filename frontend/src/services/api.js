// API Service — connects to the real Express/Supabase backend.
// All authenticated requests include the JWT token from localStorage.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Helper ─────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("tracked_token");

const request = async (method, endpoint, body) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const json = await res.json();

        if (!res.ok) {
            const errorMsg = json?.error || `HTTP ${res.status}`;
            console.error(`API ${method} ${endpoint} failed:`, errorMsg);
            throw new Error(errorMsg);
        }

        return json; // { success, data } or { success }
    } catch (error) {
        console.error(`API request error [${method} ${endpoint}]:`, error);
        throw error;
    }
};

// ─── Auth ────────────────────────────────────────────────────────

export const authAPI = {
    login: (body) => request("POST", "/auth/login", body),
    register: (body) => request("POST", "/auth/register", body),
    getProfile: () => request("GET", "/auth/profile"),
};

// ─── Subjects ────────────────────────────────────────────────────

export const subjectsAPI = {
    getAll: () => request("GET", "/subjects"),
    create: (body) => request("POST", "/subjects", body),
    enrollStudent: (body) => request("POST", "/subjects/enroll", body),
    getStudents: (subjectId) => request("GET", `/subjects/${subjectId}/students`),
    unenrollStudent: (enrollmentId) => request("DELETE", `/subjects/enroll/${enrollmentId}`),
};

// ─── Notes ───────────────────────────────────────────────────────

export const notesAPI = {
    getAll: () => request("GET", "/notes"),
    getBySubject: (subjectId) => request("GET", `/notes/subject/${subjectId}`),
    create: (body) => request("POST", "/notes", body),
    delete: (id) => request("DELETE", `/notes/${id}`),
};

// ─── Assignments ─────────────────────────────────────────────────

export const assignmentsAPI = {
    getAll: () => request("GET", "/assignments"),
    getBySubject: (subjectId) => request("GET", `/assignments/subject/${subjectId}`),
    create: (body) => request("POST", "/assignments", body),
    delete: (id) => request("DELETE", `/assignments/${id}`),
};

// ─── Files ───────────────────────────────────────────────
export const filesAPI = {
    getAll: () => request("GET", "/files"),
    upload: (body) => request("POST", "/files", body),
};

// ─── Calendar ───────────────────────────────────────────
export const calendarAPI = {
    getAll: () => request("GET", "/calendar"),
    create: (body) => request("POST", "/calendar", body),
};

// ─── Tasks ──────────────────────────────────────────────
export const tasksAPI = {
    getAll: () => request("GET", "/tasks"),
    create: (body) => request("POST", "/tasks", body),
    delete: (id) => request("DELETE", `/tasks/${id}`),
};

// ─── Trash ──────────────────────────────────────────────
export const trashAPI = {
    getAll: () => request("GET", "/trash"),
    restore: (id) => request("PUT", `/trash/${id}/restore`),
    delete: (id) => request("DELETE", `/trash/${id}`),
};

// ─── Submissions ─────────────────────────────────────────────────

export const submissionsAPI = {
    getMine: () => request("GET", "/assignments/submissions"),
    getTeacher: () => request("GET", "/assignments/submissions/teacher"),
    submit: (assignmentId, body) =>
        request("POST", `/assignments/${assignmentId}/submissions`, body),
    grade: (submissionId, body) =>
        request("PUT", `/assignments/submissions/${submissionId}/grade`, body),
};

// ─── Health ──────────────────────────────────────────────────────

export const healthAPI = {
    check: () => request("GET", "/health"),
};


