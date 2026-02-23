// Minimal API stub — uses localStorage for hackathon demo persistence.
// Allows data to flow between Teacher and Student dashboards without a real backend.

const BASE_URL = "http://localhost:5000/api";

const isBackendOnline = true; // Toggle this if you have a real backend running

const getToken = () => localStorage.getItem('tracked_token');

const request = async (method, endpoint, body) => {
    if (isBackendOnline) {
        try {
            const headers = { "Content-Type": "application/json" };
            const token = getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            return { data: json };
        } catch (error) {
            // For auth endpoints, don't fall back to localStorage — propagate the error
            if (endpoint.startsWith("/auth")) {
                throw error;
            }
            console.warn(`Backend request failed: ${endpoint}. Falling back to localStorage.`);
        }
    }

    // fallback to localStorage for Demo
    const storageKey = `smartcampus_${endpoint.split('/')[1]}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || "[]");

    if (method === "GET") {
        return { data };
    }

    if (method === "POST") {
        const newItem = {
            id: Date.now(),
            ...body,
            createdAt: new Date().toISOString()
        };
        // Specific ID handling for existing code consistency
        if (endpoint === "/tasks") newItem.task_id = newItem.id;
        if (endpoint === "/files") newItem.file_id = newItem.id;
        if (endpoint === "/calendar") newItem.event_id = newItem.id;
        if (endpoint === "/notes") newItem.id = Date.now();
        if (endpoint === "/assignments") newItem.id = Date.now();
        if (endpoint === "/submissions") newItem.id = Date.now();

        data = [newItem, ...data];
        localStorage.setItem(storageKey, JSON.stringify(data));
        return { data: newItem };
    }

    if (method === "PATCH" || method === "PUT") {
        const id = parseInt(endpoint.split('/').pop());
        const index = data.findIndex(item => (item.id === id || item.task_id === id || item.event_id === id));
        if (index !== -1) {
            data[index] = { ...data[index], ...body };
            // Special case for task toggle
            if (endpoint.includes("toggle")) {
                data[index].status = data[index].status === "completed" ? "pending" : "completed";
            }
            localStorage.setItem(storageKey, JSON.stringify(data));
            return { data: data[index] };
        }
    }

    if (method === "DELETE") {
        const id = parseInt(endpoint.split('/').pop());
        data = data.filter(item => (item.id !== id && item.task_id !== id && item.event_id !== id));
        localStorage.setItem(storageKey, JSON.stringify(data));
        return { success: true };
    }

    return { data: [] };
};

export const tasksAPI = {
    getAll: () => request("GET", "/tasks"),
    create: (body) => request("POST", "/tasks", body),
    toggle: (id) => request("PATCH", `/tasks/${id}/toggle`),
    update: (id, body) => request("PUT", `/tasks/${id}`, body),
    delete: (id) => request("DELETE", `/tasks/${id}`),
};

export const filesAPI = {
    getAll: () => request("GET", "/files"),
    upload: (body) => request("POST", "/files", body),
    delete: (id) => request("DELETE", `/files/${id}`),
};

export const trashAPI = {
    getAll: () => request("GET", "/trash"),
    restore: (id) => request("POST", `/trash/${id}/restore`),
    deletePermanently: (id) => request("DELETE", `/trash/${id}`),
};

export const calendarAPI = {
    getAll: () => request("GET", "/calendar"),
    create: (body) => request("POST", "/calendar", body),
    update: (id, body) => request("PUT", `/calendar/${id}`, body),
    delete: (id) => request("DELETE", `/calendar/${id}`),
};

export const notesAPI = {
    getAll: () => request("GET", "/notes"),
    create: (body) => request("POST", "/notes", body),
    delete: (id) => request("DELETE", `/notes/${id}`),
    uploadWithQuiz: async (formData) => {
        const token = getToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}/notes/upload`, {
            method: 'POST',
            headers,
            body: formData,  // FormData — browser sets Content-Type with boundary automatically
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return { data: json };
    },
    getStudentNotes: (noteId) => request("GET", `/notes/${noteId}/student-notes`),
    createStudentNote: (noteId, body) => request("POST", `/notes/${noteId}/student-notes`, body),
    toggleShareStudentNote: async (studentNoteId) => {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}/notes/student-notes/${studentNoteId}/share`, {
            method: 'PATCH',
            headers,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return { data: json };
    },
    getBookshelf: () => request("GET", "/notes/bookshelf"),
};

export const assignmentsAPI = {
    getAll: () => request("GET", "/assignments"),
    create: (body) => request("POST", "/assignments", body),
    delete: (id) => request("DELETE", `/assignments/${id}`),
    submit: async (assignmentId, formData) => {
        const token = getToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}/assignments/${assignmentId}/submissions`, {
            method: 'POST',
            headers,
            body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return { data: json };
    },
};

export const submissionsAPI = {
    getAll: () => request("GET", "/assignments/submissions"),
    getTeacher: () => request("GET", "/assignments/submissions/teacher"),
    grade: (submissionId, body) => request("PUT", `/assignments/submissions/${submissionId}/grade`, body),
};

export const subjectsAPI = {
    getAll: () => request("GET", "/subjects"),
    create: (body) => request("POST", "/subjects", body),
    enrollStudent: (body) => request("POST", "/subjects/enroll", body),
    enrollAllBySubject: (body) => request("POST", "/subjects/enroll/all", body),
    getStudents: (subjectId) => request("GET", `/subjects/${subjectId}/students`),
    unenrollStudent: (enrollmentId) => request("DELETE", `/subjects/enroll/${enrollmentId}`),
};

export const authAPI = {
    login: (body) => request("POST", "/auth/login", body),
    register: (body) => request("POST", "/auth/register", body),
    bulkRegister: (body) => request("POST", "/auth/bulk-register", body),
    getProfile: () => request("GET", "/auth/profile"),
};

export const quizAPI = {
    generate: (body) => request("POST", "/quizzes/generate", body),
    getAll: () => request("GET", "/quizzes"),
    getByNote: (noteId) => request("GET", `/quizzes/note/${noteId}`),
    submitAttempt: (quizId, answers) => request("POST", `/quizzes/${quizId}/attempt`, { answers }),
    getMyAttempts: () => request("GET", "/quizzes/my-attempts"),
    getAttempts: (quizId) => request("GET", `/quizzes/${quizId}/attempts`),
    delete: (id) => request("DELETE", `/quizzes/${id}`),
};

export const attendanceAPI = {
    mark: (body) => request("POST", "/attendance", body),
    getByDate: (subjectId, date) => request("GET", `/attendance/subject/${subjectId}/date/${date}`),
    getSummary: (subjectId) => request("GET", `/attendance/subject/${subjectId}`),
    getMy: () => request("GET", "/attendance/my"),
    getPerformance: (subjectId) => request("GET", `/attendance/performance/${subjectId}`),
};
