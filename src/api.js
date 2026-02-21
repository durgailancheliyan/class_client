import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me')
};

export const courses = {
  list: () => api.get('/courses'),
  create: (data) => api.post('/courses', data)
};

export const students = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  patchMockScore: (id, mockInterviewScore) => api.patch(`/students/${id}/mock-score`, { mockInterviewScore }),
  delete: (id) => api.delete(`/students/${id}`)
};

export const sessions = {
  create: (course, batch) => api.post('/sessions', { course, batch }),
  list: () => api.get('/sessions'),
  getBySlug: (slug, location) => api.get(`/sessions/${slug}`, { params: location })
};

export const attendance = {
  mark: (slug, studentId, status, payload) =>
    api.post(`/attendance/mark/${slug}`, { studentId, status, ...payload })
};

export const reports = {
  daily: (date) => api.get('/reports/daily', { params: { date } }),
  analytics: (params) => api.get('/reports/analytics', { params }),
  exportData: (params) => api.get('/reports/export', { params }),
  studentsGrid: (params) => api.get('/reports/students-grid', { params })
};

export const excel = {
  importStudents: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/excel/import/students', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadStudentTemplate: () =>
    api.get('/excel/template/students', { responseType: 'blob' }),
  exportAttendance: (params) => api.get('/excel/export/attendance', { params, responseType: 'blob' })
};

export default api;
