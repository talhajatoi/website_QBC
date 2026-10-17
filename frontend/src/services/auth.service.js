import api, { authHeaders } from './api';
export const login = (credentials) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout', {}, { headers: authHeaders() });
export const getProfile = () => api.get('/auth/me', { headers: authHeaders() });
export const changePassword = (data) => api.patch('/auth/password', data, { headers: authHeaders() });
