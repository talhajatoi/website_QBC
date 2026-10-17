import api, { authHeaders } from './api';
const toProductFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'productImages') return;
    if (value !== undefined) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });
  (data.productImages || []).forEach((image) => formData.append('productImages', image));
  return formData;
};
const productUploadOptions = () => ({ timeout: 120000, headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
export const getProducts = (params) => api.get('/products', { params });
export const getFeaturedProducts = () => api.get('/products/featured');
export const searchProducts = (q) => api.get('/products/search', { params: { q } });
export const getProduct = (slug) => api.get(`/products/${slug}`);
export const getCategoryProducts = (slug, params) => api.get(`/products/categories/${slug}`, { params });
export const getAdminProducts = (params) => api.get('/admin/products', { params, headers: authHeaders() });
export const createProduct = (data) => api.post('/admin/products', toProductFormData(data), productUploadOptions());
export const updateProduct = (id, data) => api.patch(`/admin/products/${id}`, toProductFormData(data), productUploadOptions());
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`, { headers: authHeaders() });
export const updateStock = (id, stockQuantity) => api.patch(`/admin/products/${id}/stock`, { stockQuantity }, { headers: authHeaders() });
export const getProductImageUrl = (imageUrl) => imageUrl?.startsWith('/uploads/')
  ? new URL(imageUrl, new URL(api.defaults.baseURL, window.location.origin).origin).toString()
  : imageUrl;
