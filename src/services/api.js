// Minimal API stub — uses localStorage for hackathon demo persistence.
// Allows data to flow between Teacher and Student dashboards without a real backend.

const BASE_URL = "http://localhost:5000/api";

const isBackendOnline = false; // Toggle this if you have a real backend running

const request = async (method, endpoint, body) => {
    if (isBackendOnline) {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return { data: await res.json() };
        } catch (error) {
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
};

export const assignmentsAPI = {
    getAll: () => request("GET", "/assignments"),
    create: (body) => request("POST", "/assignments", body),
    delete: (id) => request("DELETE", `/assignments/${id}`),
};

export const submissionsAPI = {
    getAll: () => request("GET", "/submissions"),
    submit: (body) => request("POST", "/submissions", body),
};

export const authAPI = {
    login: (body) => request("POST", "/auth/login", body),
};
