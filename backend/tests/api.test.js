import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { Admin } from '../src/models/admin.model.js';
import { Category } from '../src/models/category.model.js';
import { Product } from '../src/models/product.model.js';
import { Review } from '../src/models/review.model.js';
import { Order } from '../src/models/order.model.js';
import { env } from '../src/config/env.js';

const adminCredentials = { email: 'admin@example.com', password: 'StrongPassword123' };
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
let token;
const createCategory = () => Category.create({ name: 'Mountain Bikes', slug: 'mountain-bikes' });
const createProduct = async (category, overrides = {}) => Product.create({ name: 'Trail Pro 29', slug: `trail-pro-${Math.random().toString(16).slice(2, 8)}`, description: 'A dependable mountain bicycle for daily trail use.', brand: 'Quetta', category: category._id, bicycleType: 'Mountain', price: 50000, stockQuantity: 5, sku: `SKU-${Math.random().toString(16).slice(2, 8)}`, sizes: ['M'], colors: ['Black'], ...overrides });

beforeAll(async () => { await connectDatabase(process.env.MONGODB_URI); });
beforeEach(async () => { await mongoose.connection.db.dropDatabase(); await Admin.create({ name: 'Store Admin', ...adminCredentials }); const response = await request(app).post('/api/auth/login').send(adminCredentials); token = response.body.data.token; });
afterAll(async () => { await disconnectDatabase(); await globalThis.mongoServer.stop(); });

describe('platform basics and authentication', () => {
  it('reports health and has a live isolated database connection', async () => { const response = await request(app).get('/api/health'); expect(response.status).toBe(200); expect(response.body.data.status).toBe('ok'); expect(mongoose.connection.readyState).toBe(1); });
  it('surfaces a database connection failure and can reconnect to the isolated database', async () => { await disconnectDatabase(); await expect(connectDatabase('mongodb://127.0.0.1:1/unreachable', { serverSelectionTimeoutMS: 100 })).rejects.toThrow(); await connectDatabase(process.env.MONGODB_URI); expect(mongoose.connection.readyState).toBe(1); });
  it('rejects invalid credentials and blocks anonymous admin calls', async () => { const invalid = await request(app).post('/api/auth/login').send({ email: adminCredentials.email, password: 'wrong' }); const denied = await request(app).get('/api/admin/products'); expect(invalid.status).toBe(401); expect(invalid.body.message).toBe('Invalid email or password'); expect(denied.status).toBe(401); });
  it('validates requests and returns centralized missing-route errors', async () => { const invalid = await request(app).post('/api/admin/products').set(authHeader(token)).send({ name: 'x' }); const missing = await request(app).get('/api/nope'); expect(invalid.status).toBe(422); expect(missing.status).toBe(404); });
});

describe('catalogue and review management', () => {
  it('creates, lists, updates, and deletes products with uploaded JPEG and PNG images', async () => {
    const category = await createCategory();
    const payload = { name: 'City Rider', slug: 'city-rider', description: 'Comfortable commuter bicycle with durable parts.', brand: 'Quetta', category: category.id, bicycleType: 'City', price: 45000, stockQuantity: 7, sku: 'CITY-001', sizes: ['M'], colors: ['Yellow'] };
    const created = await request(app).post('/api/admin/products').set(authHeader(token)).send(payload);
    const listed = await request(app).get('/api/products?sort=price_asc');
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07]);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lV8AAAAASUVORK5CYII=', 'base64');
    const imageUpdate = await request(app).patch(`/api/admin/products/${created.body.data.product._id}`).set(authHeader(token)).field('images', '[]').attach('productImages', jpg, { filename: 'frame.jpg', contentType: 'image/jpeg' }).attach('productImages', png, { filename: 'detail.png', contentType: 'image/png' });
    const imagePaths = imageUpdate.body.data.product.images;
    expect(created.status).toBe(201);
    expect(listed.body.data.products).toHaveLength(1);
    expect(imageUpdate.status).toBe(200);
    expect(imagePaths).toHaveLength(2);
    expect(imagePaths[0]).toMatch(/^\/uploads\/products\/.+\.jpg$/);
    expect(imagePaths[1]).toMatch(/^\/uploads\/products\/.+\.png$/);
    expect((await request(app).get(imagePaths[0])).status).toBe(200);
    expect((await request(app).get(imagePaths[1])).status).toBe(200);
    const changed = await request(app).patch(`/api/admin/products/${created.body.data.product._id}`).set(authHeader(token)).send({ salePrice: 40000 });
    expect(changed.body.data.product.salePrice).toBe(40000);
    const removed = await request(app).delete(`/api/admin/products/${created.body.data.product._id}`).set(authHeader(token));
    expect(removed.status).toBe(200);
    expect((await request(app).get(imagePaths[0])).status).toBe(404);
  });
  it('publishes reviews, moderates customer submissions, and stores JPG photos without counting demo reviews', async () => {
    const category = await createCategory();
    const product = await createProduct(category);
    await Review.create({ product: product._id, displayName: 'Real Buyer', rating: 4, title: 'Good bike', text: 'Solid bicycle for regular riding.', status: 'published' });
    await Review.create({ product: product._id, displayName: 'Demo Rider', rating: 1, title: '[DEMO] Sample', text: 'Demo only, not customer feedback.', status: 'published', isDemo: true });
    const adminReview = await request(app).post(`/api/admin/products/${product.id}/reviews`).set(authHeader(token)).send({ displayName: 'Happy Rider', rating: 5, title: 'Excellent', text: 'Very smooth and enjoyable ride.', status: 'published' });
    const summary = await request(app).get(`/api/products/${product.id}/reviews/summary`);
    const top = await request(app).get(`/api/products/${product.id}/reviews/top`);
    expect(adminReview.status).toBe(201);
    expect(summary.body.data.total).toBe(2);
    expect(summary.body.data.averageRating).toBe(4.5);
    expect(top.body.data.review.rating).toBe(5);

    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07]);
    const submitted = await request(app).post(`/api/products/${product.id}/reviews`).field('displayName', 'Rider One').field('rating', '5').field('title', 'Great bicycle').field('text', 'Comfortable and reliable ride.').attach('image', jpg, { filename: 'bike.jpg', contentType: 'image/jpeg' });
    expect(submitted.status).toBe(201);
    expect(submitted.body.data.review.status).toBe('hidden');
    expect(submitted.body.data.review.verifiedPurchase).toBe(false);
    expect(submitted.body.data.review.imageUrl).toMatch(/^\/uploads\/reviews\/.+\.jpg$/);
    expect((await request(app).get('/api/reviews')).body.data.reviews).toHaveLength(2);
    const reviewId = submitted.body.data.review._id;
    const published = await request(app).patch(`/api/admin/reviews/${reviewId}`).set(authHeader(token)).field('status', 'published').attach('image', jpg, { filename: 'admin-bike.jpg', contentType: 'image/jpeg' });
    const publicReviews = await request(app).get('/api/reviews');
    expect(published.status).toBe(200);
    expect(publicReviews.body.data.reviews).toHaveLength(3);
    expect(publicReviews.body.data.reviews[0].product.name).toBe(product.name);
    expect(publicReviews.body.data.reviews[0].imageUrl).toMatch(/^\/uploads\/reviews\/.+\.jpg$/);
    const invalidImage = await request(app).post(`/api/products/${product.id}/reviews`).field('displayName', 'Rider Two').field('rating', '4').field('title', 'Another review').field('text', 'This is a second test review.').attach('image', Buffer.from('not a jpeg'), { filename: 'bike.png', contentType: 'image/png' });
    expect(invalidImage.status).toBe(422);
    await request(app).delete(`/api/admin/reviews/${reviewId}`).set(authHeader(token));
  });
});

describe('cart, checkout, and order authorization', () => {
  it('calculates a cart server-side and rejects excessive stock', async () => { const category = await createCategory(); const product = await createProduct(category, { price: 1000, stockQuantity: 2 }); const added = await request(app).post('/api/cart/items').send({ productId: product.id, quantity: 2, selectedOptions: { size: 'M', color: 'Black' } }); const invalid = await request(app).post('/api/cart/items').send({ productId: product.id, quantity: 3 }); expect(added.status).toBe(201); expect(added.body.data.cart.total).toBe(2000); expect(added.body.data.cartToken).toMatch(/^[a-f0-9]{64}$/); expect(invalid.status).toBe(422); });
  it('creates orders with COD advances and returns bank transfer details when selected', async () => { const category = await createCategory(); const product = await createProduct(category, { price: 3000, stockQuantity: 3 }); const payload = { customer: { name: 'Ali Khan', whatsapp: '+923001234567', address: 'House 1, Main Road, Quetta' }, items: [{ productId: product.id, quantity: 2, selectedOptions: { size: 'M', color: 'Black' } }], customerNotes: 'Please call first.' }; const created = await request(app).post('/api/orders').set('Idempotency-Key', 'abcdefghijklmno123').send(payload); const denied = await request(app).get(`/api/orders/${created.body.data.order.orderNumber}`); const allowed = await request(app).get(`/api/orders/${created.body.data.order.orderNumber}`).set('X-Order-Access-Token', created.body.data.orderAccessToken); expect(created.status).toBe(201); expect(created.body.data.order.subtotal).toBe(6000); expect(created.body.data.order.grandTotal).toBe(6250); expect(created.body.data.order.advancePaymentAmount).toBe(1200); expect(created.body.data.order.cashOnDeliveryAmount).toBe(5050); expect(created.body.data.order.advancePaymentStatus).toBe('pending'); expect(created.body.data.whatsappUrl).toContain('https://wa.me/923001234567?text='); expect(decodeURIComponent(created.body.data.whatsappUrl)).toContain('COD advance required (20% of bicycle subtotal): PKR 1,200'); expect(decodeURIComponent(created.body.data.whatsappUrl)).not.toContain('proof'); expect(denied.status).toBe(401); expect(allowed.status).toBe(200); expect(allowed.body.data.order.advancePaymentAmount).toBe(1200); const storedOrder = await Order.findOne({ orderNumber: created.body.data.order.orderNumber }); const markedAdvance = await request(app).patch(`/api/admin/orders/${storedOrder.id}/advance-payment-status`).set(authHeader(token)).send({ advancePaymentStatus: 'paid' }); expect(markedAdvance.status).toBe(200); expect(markedAdvance.body.data.order.advancePaymentStatus).toBe('paid'); const instructions = await request(app).get('/api/payments/instructions'); expect(instructions.body.data.bankTransfer).toContainEqual(expect.objectContaining({ method: 'EasyPaisa', accountTitle: 'Test Payment Account', accountNumber: '03000000000' })); const transfer = await request(app).post('/api/orders').send({ ...payload, paymentMethod: 'bank_transfer', items: [{ productId: product.id, quantity: 1 }] }); expect(transfer.status).toBe(201); expect(transfer.body.data.order.advancePaymentAmount).toBe(0); expect(transfer.body.data.order.cashOnDeliveryAmount).toBe(0); expect(transfer.body.data.paymentInstructions).toEqual(instructions.body.data.bankTransfer); expect(decodeURIComponent(transfer.body.data.whatsappUrl)).not.toContain('proof'); const transferOrder = await request(app).get(`/api/orders/${transfer.body.data.order.orderNumber}`).set('X-Order-Access-Token', transfer.body.data.orderAccessToken); expect(transferOrder.body.data.paymentInstructions).toEqual(instructions.body.data.bankTransfer); });
  it('rejects invalid order state changes', async () => { const category = await createCategory(); const product = await createProduct(category); const order = await Order.create({ orderNumber: 'QB-2026-STATE01', accessTokenHash: 'a'.repeat(64), customer: { name: 'Test', whatsapp: '923001234567', address: 'A sufficiently descriptive test address' }, items: [{ product: product._id, name: product.name, sku: product.sku, quantity: 1, unitPrice: product.price, lineTotal: product.price, selectedOptions: {} }], subtotal: product.price, deliveryCharge: 0, grandTotal: product.price }); const response = await request(app).patch(`/api/admin/orders/${order.id}/status`).set(authHeader(token)).send({ status: 'shipped' }); expect(response.status).toBe(422); });
});
