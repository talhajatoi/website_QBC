import api, { authHeaders } from './api';
const toCategoryFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'categoryImage' || value === undefined) return;
    formData.append(key, String(value));
  });
  if (data.categoryImage) formData.append('categoryImage', data.categoryImage);
  return formData;
};
const categoryUploadOptions = () => ({
  timeout: 120000,
  headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
});
export const getCategories = () => api.get('/categories');
export const getAdminCategories = () => api.get('/admin/categories', { headers: authHeaders() });
export const createCategory = (data) => data.categoryImage
  ? api.post('/admin/categories', toCategoryFormData(data), categoryUploadOptions())
  : api.post('/admin/categories', data, { headers: authHeaders() });
export const updateCategory = (id, data) => data.categoryImage
  ? api.patch(`/admin/categories/${id}`, toCategoryFormData(data), categoryUploadOptions())
  : api.patch(`/admin/categories/${id}`, data, { headers: authHeaders() });
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`, { headers: authHeaders() });
export const getCategoryImageUrl = (imageUrl) => imageUrl?.startsWith('/uploads/')
  ? new URL(imageUrl, new URL(api.defaults.baseURL, window.location.origin).origin).toString()
  : imageUrl;
