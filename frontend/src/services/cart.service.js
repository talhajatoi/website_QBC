import api from './api';
const key = 'qb_guest_cart_token';
const headers = () => { const token = localStorage.getItem(key); return token ? { 'X-Cart-Token': token } : {}; };
const capture = (response) => { if (response.data?.cartToken) localStorage.setItem(key, response.data.cartToken); return response; };
export const getCart = () => api.get('/cart', { headers: headers() });
export const addCartItem = (data) => api.post('/cart/items', data, { headers: headers() }).then(capture);
export const updateCartItem = (id, data) => api.patch(`/cart/items/${id}`, data, { headers: headers() });
export const removeCartItem = (id) => api.delete(`/cart/items/${id}`, { headers: headers() });
export const clearCart = () => api.delete('/cart', { headers: headers() });
