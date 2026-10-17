import api, { authHeaders } from './api';
export const getPublicReviews = (params) => api.get('/reviews', { params });
export const getReviews = (productId, params) => api.get(`/products/${productId}/reviews`, { params });
export const getTopReview = (productId) => api.get(`/products/${productId}/reviews/top`);
export const getReviewSummary = (productId) => api.get(`/products/${productId}/reviews/summary`);
const buildReviewForm = (data, image) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  if (image) form.append('image', image);
  return form;
};
const uploadConfig = (headers = {}) => ({ headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
export const submitReview = (productId, data, image) => api.post(`/products/${productId}/reviews`, buildReviewForm(data, image), uploadConfig());
export const getAdminReviews = (params) => api.get('/admin/reviews', { params, headers: authHeaders() });
export const createReview = (productId, data, image) => api.post(`/admin/products/${productId}/reviews`, buildReviewForm(data, image), uploadConfig(authHeaders()));
export const updateReview = (id, data, image) => api.patch(`/admin/reviews/${id}`, buildReviewForm(data, image), uploadConfig(authHeaders()));
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`, { headers: authHeaders() });
export const getReviewImageUrl = (imageUrl) => imageUrl ? new URL(imageUrl, new URL(api.defaults.baseURL, window.location.origin).origin).toString() : '';
