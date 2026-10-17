import api, { authHeaders } from './api';
export const getDashboard = () => api.get('/admin/dashboard', { headers: authHeaders() });
