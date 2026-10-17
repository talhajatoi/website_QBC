import api, { authHeaders } from './api';
export const getCategories = () => api.get('/categories');
export const getAdminCategories = () => api.get('/admin/categories', { headers: authHeaders() });
export const createCategory = (data) => api.post('/admin/categories', data, { headers: authHeaders() });
export const updateCategory = (id, data) => api.patch(`/admin/categories/${id}`, data, { headers: authHeaders() });
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`, { headers: authHeaders() });
