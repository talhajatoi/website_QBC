import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', timeout: 15000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.response.use((response) => response.data, (error) => {
  if (axios.isCancel(error)) return Promise.reject({ cancelled: true, message: 'Request cancelled', errors: [] });
  const status = error.response?.status;
  const errors = error.response?.data?.errors || [];
  const validation = errors.map((issue) => issue.message).filter(Boolean).join(' ');
  const message = validation || error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : status ? 'The request could not be completed.' : 'The store service is unavailable. Please check your connection and try again.');
  if (status === 401 && sessionStorage.getItem('qb_admin_token')) window.dispatchEvent(new Event('qb:auth-expired'));
  return Promise.reject({ status, message, errors, retryable: !status || status >= 500 });
});
export const authHeaders = () => { const token = sessionStorage.getItem('qb_admin_token'); return token ? { Authorization: `Bearer ${token}` } : {}; };
export const healthCheck = () => api.get('/health');
export default api;
