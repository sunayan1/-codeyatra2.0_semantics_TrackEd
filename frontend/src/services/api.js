import { ALL_STUDENTS, STUDENT_PROGRESS } from '../data/progressData';

const BASE_URL = 'http://localhost:5000/api';

const isBackendOnline = false; // Toggle this if you have a real backend running

const request = async (method, endpoint, body) => {
  if (isBackendOnline) {
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await res.json();
      if (!res.ok) {
        console.warn(`Backend error ${res.status}:`, json.error || json.message);
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      return { data: json };
    } catch (error) {
      console.warn(`Backend request failed: ${endpoint}.`, error.message);
    }
  }

  // --- Demo Data Mocking ---
  if (!isBackendOnline) {
    // Attendance Subjects & Main Subjects List
    if ((endpoint === '/attendance/subjects' || endpoint === '/subjects') && method === 'GET') {
      return { data: [{ id: 'demo-subject-1', title: 'Data Structure' }] };
    }

    // Attendance Students
    if (endpoint.includes('/attendance/subjects/') && endpoint.includes('/students') && method === 'GET') {
      const demoStudents = ALL_STUDENTS.map((s, idx) => ({
        id: `student-${idx + 1}`,
        full_name: s.name,
        email: s.email
      }));
      return { data: demoStudents };
    }

    // Attendance Records
    if (endpoint.includes('/attendance/subjects/') && !endpoint.includes('/students') && method === 'GET') {
      return { data: [] }; // Default to no records so UI falls back to "present"
    }

    // Student Progress (Reports)
    if (endpoint === '/subjects/students/all' && method === 'GET') {
      const progressData = ALL_STUDENTS.map((s, idx) => {
        const stats = STUDENT_PROGRESS[s.email] || { attendance: 0, assignments: [] };
        return {
          id: `student-${idx + 1}`,
          full_name: s.name,
          email: s.email,
          attendance: stats.attendance,
          completedAssignments: stats.assignments.filter(a => a.status === 'submitted').length,
          totalAssignments: stats.assignments.length || 1, // Fallback to 1 if no assignment data
          assignments: stats.assignments.map(a => ({
            title: a.title,
            status: a.status,
            marks: a.grade === 'A+' ? 15 : a.grade === 'A' ? 14 : a.grade === 'A-' ? 13 : a.grade === 'B+' ? 12 : a.grade === 'B' ? 11 : a.grade === 'B-' ? 10 : a.grade === 'C+' ? 9 : 0
          }))
        };
      });
      return { data: progressData };
    }
  }

  // fallback to localStorage for Demo Persistence
  try {
    const storageKey = `smartcampus_${endpoint.split('/')[1]}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (method === 'GET') {
      return { data: Array.isArray(data) ? data : [] };
    }

    if (method === 'POST') {
      const newItem = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString(),
      };
      if (endpoint === '/tasks') newItem.task_id = newItem.id;
      if (endpoint === '/files') newItem.file_id = newItem.id;
      if (endpoint === '/calendar') newItem.event_id = newItem.id;

      const updatedData = [newItem, ...data];
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      return { data: newItem };
    }

    if (method === 'PATCH' || method === 'PUT') {
      const id = endpoint.split('/').pop();
      const index = data.findIndex(
        (item) => item.id == id || item.task_id == id || item.event_id == id || item.file_id == id
      );
      if (index !== -1) {
        data[index] = { ...data[index], ...body };
        if (endpoint.includes('toggle')) {
          data[index].status = data[index].status === 'completed' ? 'pending' : 'completed';
        }
        localStorage.setItem(storageKey, JSON.stringify(data));
        return { data: data[index] };
      }
    }

    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      const updatedData = data.filter(
        (item) => item.id != id && item.task_id != id && item.event_id != id && item.file_id != id
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      return { success: true };
    }

  } catch (e) {
    console.error("LocalStorage fallback error:", e);
  }

  return { data: [] };
};


export const tasksAPI = {
  getAll: () => request('GET', '/tasks'),
  create: (body) => request('POST', '/tasks', body),
  toggle: (id) => request('PATCH', `/tasks/${id}/toggle`),
  update: (id, body) => request('PUT', `/tasks/${id}`, body),
  delete: (id) => request('DELETE', `/tasks/${id}`),
};

export const filesAPI = {
  getAll: () => request('GET', '/files'),
  upload: (body) => request('POST', '/files', body),
  delete: (id) => request('DELETE', `/files/${id}`),
};

export const trashAPI = {
  getAll: () => request('GET', '/trash'),
  restore: (id) => request('POST', `/trash/${id}/restore`),
  deletePermanently: (id) => request('DELETE', `/trash/${id}`),
};

export const calendarAPI = {
  getAll: () => request('GET', '/calendar'),
  create: (body) => request('POST', '/calendar', body),
  update: (id, body) => request('PUT', `/calendar/${id}`, body),
  delete: (id) => request('DELETE', `/calendar/${id}`),
};

export const notesAPI = {
  getAll: () => request('GET', '/notes'),
  create: (body) => request('POST', '/notes', body),
  delete: (id) => request('DELETE', `/notes/${id}`),
};

export const assignmentsAPI = {
  getAll: () => request('GET', '/assignments'),
  create: (body) => request('POST', '/assignments', body),
  delete: (id) => request('DELETE', `/assignments/${id}`),
};

export const subjectsAPI = {
  getMine: () => request('GET', '/subjects'),
  getAvailable: () => request('GET', '/subjects/available'),
  create: (body) => request('POST', '/subjects', body),
  enroll: (body) => request('POST', '/subjects/enroll', body),
  enrollSelf: (body) => request('POST', '/subjects/enroll-self', body),
  getStudents: (subjectId) => request('GET', `/subjects/${subjectId}/students`),
  unenroll: (enrollmentId) => request('DELETE', `/subjects/enroll/${enrollmentId}`),
  getProgress: () => request('GET', '/subjects/students/all'),
};

export const submissionsAPI = {
  // Teacher: get all submissions for their own assignments
  getAll: () => request('GET', '/assignments/submissions/teacher'),
  // Student: get their own submissions
  getMySubmissions: () => request('GET', '/assignments/submissions'),
  submit: (assignmentId, body) => request('POST', `/assignments/${assignmentId}/submissions`, body),
  grade: (submissionId, body) => request('PUT', `/assignments/submissions/${submissionId}/grade`, body),
};





export const authAPI = {
  login: (body) => request('POST', '/auth/login', body),
};

export const attendanceAPI = {
  // Teacher: get their subjects
  getSubjects: () => request('GET', '/attendance/subjects'),
  // Teacher: get enrolled students for a subject
  getStudents: (subjectId) =>
    request('GET', `/attendance/subjects/${subjectId}/students`),
  // Teacher: get existing attendance records for subject + date
  getRecords: (subjectId, date) =>
    request('GET', `/attendance/subjects/${subjectId}?date=${date}`),
  // Teacher: save/upsert attendance for a class
  save: (body) => request('POST', '/attendance', body),
  // Student: view their own attendance history
  getMy: () => request('GET', '/attendance/my'),
};
