import api, { authHeaders } from './api';

export const getBusinessSettings = () => api.get('/business');
export const updateBusinessSettings = (settings) =>
  api.patch('/admin/business', settings, { headers: authHeaders() });
