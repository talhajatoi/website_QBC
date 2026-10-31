import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { Admin } from '../src/models/admin.model.js';
import { Category } from '../src/models/category.model.js';
import { Product } from '../src/models/product.model.js';
import { Review } from '../src/models/review.model.js';
import { Order } from '../src/models/order.model.js';
import { BusinessSettings } from '../src/models/business-settings.model.js';
import { env } from '../src/config/env.js';

const adminCredentials = { email: 'admin@example.com', password: 'StrongPassword123' };
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
const testAdminId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
let token;
const createCategory = () => Category.create({ name: 'Mountain Bikes', slug: 'mountain-bikes' });
const createProduct = async (category, overrides = {}) => Product.create({ name: 'Trail Pro 29', slug: `trail-pro-${Math.random().toString(16).slice(2, 8)}`, description: 'A dependable mountain bicycle for daily trail use.', brand: 'Quetta', category: category._id, bicycleType: 'Mountain', price: 50000, stockQuantity: 5, sku: `SKU-${Math.random().toString(16).slice(2, 8)}`, sizes: ['M'], colors: ['Black'], ...overrides });

beforeAll(async () => { await connectDatabase(process.env.MONGODB_URI); });
beforeEach(async () => { await mongoose.connection.db.dropDatabase(); await Admin.create({ _id: testAdminId, name: 'Store Admin', ...adminCredentials }); if (!token) { const response = await request(app).post('/api/auth/login').send(adminCredentials); token = response.body.data.token; } });
afterAll(async () => { await disconnectDatabase(); await globalThis.mongoServer.stop(); });

describe('platform basics and authentication', () => {
  it('reports health and allows only configured frontend origins through CORS preflight', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(mongoose.connection.readyState).toBe(1);
    for (const origin of ['https://quettabikesclub.com', 'https://www.quettabikesclub.com', 'https://store.example.com']) {
      const preflight = await request(app).options('/api/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,content-type');
      expect(preflight.status).toBe(204);
      expect(preflight.headers['access-control-allow-origin']).toBe(origin);
      expect(preflight.headers['access-control-allow-methods']).toContain('POST');
      expect(preflight.headers['access-control-allow-headers'].toLowerCase()).toContain('authorization');
      expect(preflight.headers['access-control-allow-headers'].toLowerCase()).toContain('content-type');
      expect(preflight.headers['access-control-expose-headers'].toLowerCase()).toContain('x-admin-token');
    }
    const blockedPreflight = await request(app).options('/api/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');
    expect(blockedPreflight.headers['access-control-allow-origin']).toBeUndefined();

    const login = await request(app).post('/api/auth/login')
      .set('Origin', 'https://quettabikesclub.com')
      .send({ email: adminCredentials.email, password: 'wrong' });
    expect(login.status).toBe(401);
    expect(login.headers['access-control-allow-origin']).toBe('https://quettabikesclub.com');
    const localCorsResponse = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(localCorsResponse.status).toBe(200);
    expect(localCorsResponse.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
  it('surfaces a database connection failure and can reconnect to the isolated database', async () => { await disconnectDatabase(); await expect(connectDatabase('mongodb://127.0.0.1:1/unreachable', { serverSelectionTimeoutMS: 100 })).rejects.toThrow(); await connectDatabase(process.env.MONGODB_URI); expect(mongoose.connection.readyState).toBe(1); });
  it('rejects invalid credentials and blocks anonymous admin calls', async () => { const invalid = await request(app).post('/api/auth/login').send({ email: adminCredentials.email, password: 'wrong' }); const denied = await request(app).get('/api/admin/products'); expect(invalid.status).toBe(401); expect(invalid.body.message).toBe('Invalid email or password'); expect(denied.status).toBe(401); });
  it('renews an active administrator token shortly before expiration', async () => {
    const expiringToken = jwt.sign(
      { sub: testAdminId.toString(), role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: 120, issuer: 'quetta-bicycles-api', audience: 'quetta-bicycles-admin' },
    );
    const response = await request(app).get('/api/admin/products').set(authHeader(expiringToken));
    const renewedToken = response.headers['x-admin-token'];

    expect(response.status).toBe(200);
    expect(renewedToken).toBeTruthy();
    expect(jwt.verify(renewedToken, env.JWT_SECRET, {
      issuer: 'quetta-bicycles-api',
      audience: 'quetta-bicycles-admin',
    }).exp).toBeGreaterThan(jwt.verify(expiringToken, env.JWT_SECRET, {
      issuer: 'quetta-bicycles-api',
      audience: 'quetta-bicycles-admin',
    }).exp);
  });
  it('serves public store details and protects store-setting updates', async () => {
    const initial = await request(app).get('/api/business');
    expect(initial.status).toBe(200);
    expect(initial.body.data.business.whatsappNumber).toBe('923001234567');
    expect(initial.body.data.business).not.toHaveProperty('adminEmail');

    const settings = {
      storeName: 'Quetta Cycles',
      whatsappNumber: '+92 300 1234567',
      contactPhone: '081-123456',
      contactEmail: 'hello@example.com',
      address: 'Quetta, Pakistan',
      mapsUrl: 'https://maps.app.goo.gl/example-location',
      aboutMessage: 'A local bicycle shop serving riders across Quetta.',
      socialLinks: {
        facebook: 'https://facebook.com/example',
        instagram: '',
        tiktok: '',
        youtube: '',
      },
      paymentMethods: {
        cashOnDelivery: { enabled: false, name: 'Pay when delivered', description: 'Confirm on WhatsApp.' },
        bankTransfer: { enabled: true, name: 'Direct bank payment', description: 'Use the account details below.' },
        walletTransfer: { enabled: false, name: 'Mobile wallet', description: 'Wallet payments are paused.' },
      },
    };
    const denied = await request(app).patch('/api/admin/business').send(settings);
    expect(denied.status).toBe(401);

    const updated = await request(app).patch('/api/admin/business').set(authHeader(token)).send(settings);
    expect(updated.status).toBe(200);
    expect(updated.body.data.business).toMatchObject({
      ...settings,
      whatsappNumber: '923001234567',
    });
    expect((await request(app).get('/api/business')).body.data.business.storeName).toBe('Quetta Cycles');
    expect((await request(app).get('/api/business')).body.data.business.paymentMethods).toEqual(settings.paymentMethods);
    const invalidMapsLink = await request(app).patch('/api/admin/business')
      .set(authHeader(token))
      .send({ ...settings, mapsUrl: 'https://example.com/not-a-map' });
    expect(invalidMapsLink.status).toBe(422);
  });
  it('normalizes Pakistani local WhatsApp numbers to international format for checkout', async () => {
    const settings = {
      storeName: 'Quetta Cycles',
      whatsappNumber: '03128029807',
      contactPhone: '',
      contactEmail: '',
      address: '',
      socialLinks: {},
    };
    const updated = await request(app).patch('/api/admin/business').set(authHeader(token)).send(settings);
    expect(updated.status).toBe(200);
    expect(updated.body.data.business.whatsappNumber).toBe('923128029807');
  });
  it('updates administrator name and email only after password confirmation', async () => {
    const profile = { name: 'Store Manager', email: 'manager@example.com', currentPassword: adminCredentials.password };
    const rejected = await request(app).patch('/api/auth/me').set(authHeader(token)).send({ ...profile, currentPassword: 'wrong' });
    expect(rejected.status).toBe(401);
    const updated = await request(app).patch('/api/auth/me').set(authHeader(token)).send(profile);
    expect(updated.status).toBe(200);
    expect(updated.body.data.admin).toMatchObject({ name: profile.name, email: profile.email });
    expect(updated.body.data.admin).not.toHaveProperty('password');
  });
  it('validates requests and returns centralized missing-route errors', async () => { const invalid = await request(app).post('/api/admin/products').set(authHeader(token)).send({ name: 'x' }); const missing = await request(app).get('/api/nope'); expect(invalid.status).toBe(422); expect(missing.status).toBe(404); });
  it('provides authenticated dashboard sales, order-status, and review metrics', async () => {
    const category = await createCategory();
    const product = await createProduct(category);
    const orderData = {
      orderNumber: 'QB-2026-DASH001',
      accessTokenHash: 'b'.repeat(64),
      customer: { name: 'Test Buyer', whatsapp: '923001234567', address: 'A sufficiently descriptive test address' },
      items: [{ product: product._id, name: product.name, sku: product.sku, quantity: 1, unitPrice: 3000, lineTotal: 3000, selectedOptions: {} }],
      subtotal: 3000,
      deliveryCharge: 250,
      grandTotal: 3250,
    };
    await Order.create({ ...orderData, status: 'delivered' });
    await Order.create({ ...orderData, orderNumber: 'QB-2026-DASH002', accessTokenHash: 'c'.repeat(64), status: 'pending_confirmation' });
    await Order.create({ ...orderData, orderNumber: 'QB-2026-DASH003', accessTokenHash: 'd'.repeat(64), status: 'cancelled' });
    await Review.create({ product: product._id, displayName: 'Published Buyer', rating: 4, text: 'A great bicycle for daily rides.', status: 'published' });
    await Review.create({ product: product._id, displayName: 'Pending Buyer', rating: 2, text: 'This review is awaiting moderation.', status: 'hidden' });
    await Review.create({ product: product._id, displayName: 'Demo Buyer', rating: 5, text: 'Demo-only review content.', status: 'published', isDemo: true });

    const denied = await request(app).get('/api/admin/dashboard');
    const response = await request(app).get('/api/admin/dashboard').set(authHeader(token));
    expect(denied.status).toBe(401);
    expect(response.status).toBe(200);
    expect(response.body.data.products).toBe(1);
    expect(response.body.data.pendingOrders).toBe(1);
    expect(response.body.data.sales).toEqual({ deliveredRevenue: 3250, deliveredOrders: 1 });
    expect(response.body.data.ordersByStatus).toEqual({
      pending_confirmation: 1,
      advance_received: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 1,
      cancelled: 1,
      failed: 0,
    });
    expect(response.body.data.reviews).toEqual({ total: 2, pending: 1, published: 1, averageRating: 4 });
  });
});

describe('catalogue and review management', () => {
  it('lets an admin move a review to another bike and recalculates both product ratings', async () => {
    const category = await createCategory();
    const originalProduct = await createProduct(category, { name: 'Original Bike', slug: 'original-bike' });
    const destinationProduct = await createProduct(category, { name: 'Destination Bike', slug: 'destination-bike' });
    const created = await request(app).post(`/api/admin/products/${originalProduct.id}/reviews`)
      .set(authHeader(token))
      .send({ displayName: 'Test Rider', rating: 5, reviewDate: '2026-10-23', text: 'A useful bike review.', status: 'published' });
    const reviewId = created.body.data.review._id;

    const moved = await request(app).patch(`/api/admin/reviews/${reviewId}`)
      .set(authHeader(token))
      .field('productId', destinationProduct.id);

    expect(created.status).toBe(201);
    expect(moved.status).toBe(200);
    expect(String(moved.body.data.review.product)).toBe(destinationProduct.id);
    expect((await Product.findById(originalProduct.id)).reviewCount).toBe(0);
    expect((await Product.findById(destinationProduct.id)).reviewCount).toBe(1);
    expect((await Product.findById(destinationProduct.id)).averageRating).toBe(5);

    const invalidMove = await request(app).patch(`/api/admin/reviews/${reviewId}`)
      .set(authHeader(token))
      .field('productId', '000000000000000000000001');
    expect(invalidMove.status).toBe(422);
    expect(String((await Review.findById(reviewId)).product)).toBe(destinationProduct.id);
  });

  it('supports category image URLs and uploaded images, replacing and deleting uploaded files', async () => {
    const urlCategory = await request(app).post('/api/admin/categories')
      .set(authHeader(token))
      .send({ name: 'Road Bikes', slug: 'road-bikes', imageUrl: 'https://example.com/road-bikes.jpg' });
    expect(urlCategory.status).toBe(201);
    expect(urlCategory.body.data.category.imageUrl).toBe('https://example.com/road-bikes.jpg');

    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07]);
    const created = await request(app).post('/api/admin/categories')
      .set(authHeader(token))
      .field('name', 'City Bikes')
      .field('slug', 'city-bikes')
      .field('imageUrl', 'https://example.com/ignored.jpg')
      .attach('categoryImage', jpg, { filename: 'city.jpg', contentType: 'image/jpeg' });
    expect(created.status).toBe(201);
    const uploadedImage = created.body.data.category.imageUrl;
    expect(uploadedImage).toMatch(/^\/uploads\/categories\/.+\.jpg$/);
    expect((await request(app).get('/api/categories')).body.data.categories)
      .toEqual(expect.arrayContaining([expect.objectContaining({ slug: 'city-bikes', imageUrl: uploadedImage })]));
    expect((await request(app).get(uploadedImage)).status).toBe(200);

    const replaced = await request(app).patch(`/api/admin/categories/${created.body.data.category._id}`)
      .set(authHeader(token))
      .send({ imageUrl: 'https://example.com/new-city.jpg' });
    expect(replaced.body.data.category.imageUrl).toBe('https://example.com/new-city.jpg');
    expect((await request(app).get(uploadedImage)).status).toBe(404);

    const secondUpload = await request(app).patch(`/api/admin/categories/${created.body.data.category._id}`)
      .set(authHeader(token))
      .attach('categoryImage', jpg, { filename: 'city-replacement.jpg', contentType: 'image/jpeg' });
    const secondImage = secondUpload.body.data.category.imageUrl;
    const deleted = await request(app).delete(`/api/admin/categories/${created.body.data.category._id}`)
      .set(authHeader(token));
    expect(secondUpload.status).toBe(200);
    expect(deleted.status).toBe(200);
    expect((await request(app).get(secondImage)).status).toBe(404);

    const invalidUpload = await request(app).post('/api/admin/categories')
      .set(authHeader(token))
      .field('name', 'Invalid Image')
      .field('slug', 'invalid-image')
      .attach('categoryImage', Buffer.from('not an image'), { filename: 'invalid.jpg', contentType: 'image/jpeg' });
    expect(invalidUpload.status).toBe(422);
  });
  it('creates, lists, updates, and deletes products with uploaded JPEG and PNG images', async () => {
    const category = await createCategory();
    const payload = { name: 'City Rider', slug: 'city-rider', description: 'Comfortable commuter bicycle with durable parts.', brand: 'Quetta', category: category.id, bicycleType: 'City', price: 45000, stockQuantity: 7, sku: 'CITY-001', sizes: ['M'], colors: ['Yellow'], specifications: { Material: 'Aluminum' }, components: { Stem: 'Alloy', Wheels: '700c', 'Custom crankset': 'Shimano' } };
    const created = await request(app).post('/api/admin/products').set(authHeader(token)).send(payload);
    expect(created.body.data.product.components).toMatchObject(payload.components);
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
    const productImageResponse = await request(app).get(imagePaths[0]);
    expect(productImageResponse.status).toBe(200);
    expect(productImageResponse.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect((await request(app).get(imagePaths[1])).status).toBe(200);
    const detailOnlyUpdate = await request(app).patch(`/api/admin/products/${created.body.data.product._id}`)
      .set(authHeader(token))
      .field('description', 'Updated product description while keeping the saved images.')
      .field('price', '46000');
    expect(detailOnlyUpdate.status).toBe(200);
    expect(detailOnlyUpdate.body.data.product.images).toEqual(imagePaths);
    expect(detailOnlyUpdate.body.data.product.specifications).toMatchObject(payload.specifications);
    expect(detailOnlyUpdate.body.data.product.components).toMatchObject(payload.components);
    expect((await request(app).get(imagePaths[0])).status).toBe(200);
    const reordered = await request(app).patch(`/api/admin/products/${created.body.data.product._id}`)
      .set(authHeader(token))
      .field('images', JSON.stringify(imagePaths))
      .field('imageOrder', JSON.stringify([{ type: 'image', index: 1 }, { type: 'image', index: 0 }]));
    expect(reordered.status).toBe(200);
    expect(reordered.body.data.product.images).toEqual([imagePaths[1], imagePaths[0]]);
    const changed = await request(app).patch(`/api/admin/products/${created.body.data.product._id}`).set(authHeader(token)).send({ salePrice: 40000, condition: 'Used' });
    expect(changed.body.data.product.salePrice).toBe(40000);
    expect(changed.body.data.product.condition).toBe('Used');
    const removed = await request(app).delete(`/api/admin/products/${created.body.data.product._id}`).set(authHeader(token));
    expect(removed.status).toBe(200);
    expect((await request(app).get(imagePaths[0])).status).toBe(404);
  });
  it('publishes customer reviews immediately while allowing admin moderation and stores JPG photos without counting demo reviews', async () => {
    const category = await createCategory();
    const product = await createProduct(category);
    await Review.create({ product: product._id, displayName: 'Real Buyer', rating: 4, text: 'Solid bicycle for regular riding.', status: 'published' });
    await Review.create({ product: product._id, displayName: 'Demo Rider', rating: 1, text: 'Demo only, not customer feedback.', status: 'published', isDemo: true });
    const adminReview = await request(app).post(`/api/admin/products/${product.id}/reviews`).set(authHeader(token)).send({ displayName: 'Happy Rider', rating: 5, reviewDate: '2024-05-06', text: 'Very smooth and enjoyable ride.', status: 'published' });
    const invalidAdminDate = await request(app).post(`/api/admin/products/${product.id}/reviews`).set(authHeader(token)).send({ displayName: 'Happy Rider', rating: 5, reviewDate: '2024-02-31', text: 'Very smooth and enjoyable ride.', status: 'published' });
    const summary = await request(app).get(`/api/products/${product.id}/reviews/summary`);
    const top = await request(app).get(`/api/products/${product.id}/reviews/top`);
    expect(adminReview.status).toBe(201);
    expect(adminReview.body.data.review.reviewDate).toBe('2024-05-06T00:00:00.000Z');
    expect(Object.hasOwn(adminReview.body.data.review, 'title')).toBe(false);
    expect(invalidAdminDate.status).toBe(422);
    expect(summary.body.data.total).toBe(2);
    expect(summary.body.data.averageRating).toBe(4.5);
    expect(top.body.data.review.rating).toBe(5);

    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07]);
    const submitted = await request(app).post(`/api/products/${product.id}/reviews`).field('displayName', 'Rider One').field('rating', '5').field('title', 'Great bicycle').field('reviewDate', '2000-01-01').field('text', 'Comfortable and reliable ride.').attach('image', jpg, { filename: 'bike.jpg', contentType: 'image/jpeg' });
    expect(submitted.status).toBe(201);
    expect(submitted.body.data.review.status).toBe('published');
    expect(submitted.body.data.review.verifiedPurchase).toBe(false);
    expect(submitted.body.data.review.reviewDate.slice(0, 10)).not.toBe('2000-01-01');
    expect(Object.hasOwn(submitted.body.data.review, 'title')).toBe(false);
    expect(submitted.body.data.review.imageUrl).toMatch(/^\/uploads\/reviews\/.+\.jpg$/);
    const reviewImageResponse = await request(app).get(submitted.body.data.review.imageUrl);
    expect(reviewImageResponse.status).toBe(200);
    expect(reviewImageResponse.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect((await request(app).get('/api/reviews')).body.data.reviews).toHaveLength(3);
    const reviewId = submitted.body.data.review._id;
    const hidden = await request(app).patch(`/api/admin/reviews/${reviewId}`).set(authHeader(token)).send({ status: 'hidden' });
    expect(hidden.status).toBe(200);
    expect(hidden.body.data.review.status).toBe('hidden');
    expect((await request(app).get('/api/reviews')).body.data.reviews).toHaveLength(2);
    const published = await request(app).patch(`/api/admin/reviews/${reviewId}`).set(authHeader(token)).field('status', 'published').field('reviewDate', '2023-12-25').attach('image', jpg, { filename: 'admin-bike.jpg', contentType: 'image/jpeg' });
    const publicReviews = await request(app).get('/api/reviews');
    const publishedReview = publicReviews.body.data.reviews.find((review) => review._id === reviewId);
    expect(published.status).toBe(200);
    expect(published.body.data.review.reviewDate).toBe('2023-12-25T00:00:00.000Z');
    expect(publicReviews.body.data.reviews).toHaveLength(3);
    expect(publishedReview.product.name).toBe(product.name);
    expect(publishedReview.imageUrl).toMatch(/^\/uploads\/reviews\/.+\.jpg$/);
    const invalidImage = await request(app).post(`/api/products/${product.id}/reviews`).field('displayName', 'Rider Two').field('rating', '4').field('text', 'This is a second test review.').attach('image', Buffer.from('not a jpeg'), { filename: 'bike.png', contentType: 'image/png' });
    expect(invalidImage.status).toBe(422);
    await request(app).delete(`/api/admin/reviews/${reviewId}`).set(authHeader(token));
  });
});

describe('cart, checkout, and order authorization', () => {
  it('calculates a cart server-side and rejects excessive stock', async () => { const category = await createCategory(); const product = await createProduct(category, { price: 1000, stockQuantity: 2 }); const added = await request(app).post('/api/cart/items').send({ productId: product.id, quantity: 2, selectedOptions: { size: 'M', color: 'Black' } }); const invalid = await request(app).post('/api/cart/items').send({ productId: product.id, quantity: 3 }); expect(added.status).toBe(201); expect(added.body.data.cart.total).toBe(2000); expect(added.body.data.cartToken).toMatch(/^[a-f0-9]{64}$/); expect(invalid.status).toBe(422); });
  it('creates orders with COD advances and separate bank and wallet transfer instructions', async () => {
    const category = await createCategory();
    const product = await createProduct(category, { price: 3000, stockQuantity: 4 });
    const payload = {
      customer: { name: 'Ali Khan', whatsapp: '+923001234567', address: 'House 1, Main Road, Quetta' },
      items: [{ productId: product.id, quantity: 2, selectedOptions: { size: 'M', color: 'Black' } }],
      customerNotes: 'Please call first.',
    };
    const created = await request(app).post('/api/orders').set('Idempotency-Key', 'abcdefghijklmno123').send(payload);
    const denied = await request(app).get(`/api/orders/${created.body.data.order.orderNumber}`);
    const allowed = await request(app).get(`/api/orders/${created.body.data.order.orderNumber}`)
      .set('X-Order-Access-Token', created.body.data.orderAccessToken);

    expect(created.status).toBe(201);
    expect(created.body.data.order.subtotal).toBe(6000);
    expect(created.body.data.order.grandTotal).toBe(6250);
    expect(created.body.data.order.advancePaymentAmount).toBe(1200);
    expect(created.body.data.order.cashOnDeliveryAmount).toBe(5050);
    expect(created.body.data.order.advancePaymentStatus).toBe('pending');
    expect(created.body.data.whatsappUrl).toContain('https://wa.me/923001234567?text=');
    expect(decodeURIComponent(created.body.data.whatsappUrl))
      .toContain('Payment method: Cash on delivery (please confirm on WhatsApp)');
    expect(decodeURIComponent(created.body.data.whatsappUrl))
      .toContain('COD advance required (20% of bicycle subtotal): PKR 1,200');
    expect(decodeURIComponent(created.body.data.whatsappUrl)).not.toContain('proof');
    expect(denied.status).toBe(401);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.order.advancePaymentAmount).toBe(1200);

    const storedOrder = await Order.findOne({ orderNumber: created.body.data.order.orderNumber });
    const markedAdvance = await request(app).patch(`/api/admin/orders/${storedOrder.id}/advance-payment-status`)
      .set(authHeader(token)).send({ advancePaymentStatus: 'paid' });
    expect(markedAdvance.status).toBe(200);
    expect(markedAdvance.body.data.order.advancePaymentStatus).toBe('paid');
    expect(markedAdvance.body.data.order.status).toBe('advance_received');
    const advanceReceivedOrders = await request(app).get('/api/admin/orders?status=advance_received')
      .set(authHeader(token));
    expect(advanceReceivedOrders.status).toBe(200);
    expect(advanceReceivedOrders.body.data.orders.map((order) => order._id)).toContain(storedOrder.id);
    const revertedAdvance = await request(app).patch(`/api/admin/orders/${storedOrder.id}/advance-payment-status`)
      .set(authHeader(token)).send({ advancePaymentStatus: 'pending' });
    expect(revertedAdvance.body.data.order.status).toBe('pending_confirmation');
    const confirmedAdvance = await request(app).patch(`/api/admin/orders/${storedOrder.id}/advance-payment-status`)
      .set(authHeader(token)).send({ advancePaymentStatus: 'paid' });
    expect(confirmedAdvance.body.data.order.status).toBe('advance_received');

    const instructions = await request(app).get('/api/payments/instructions');
    expect(instructions.body.data.bankTransfer).toContainEqual(expect.objectContaining({
      method: 'Bank transfer', accountTitle: 'Test Bank Account', accountNumber: '1234567890',
    }));
    expect(instructions.body.data.walletTransfer).toContainEqual(expect.objectContaining({
      method: 'EasyPaisa', accountTitle: 'Test Payment Account', accountNumber: '03000000000',
    }));
    const bankTransfer = await request(app).post('/api/orders')
      .send({ ...payload, paymentMethod: 'bank_transfer', items: [{ productId: product.id, quantity: 1 }] });
    expect(bankTransfer.status).toBe(201);
    expect(bankTransfer.body.data.order.advancePaymentAmount).toBe(0);
    expect(bankTransfer.body.data.order.cashOnDeliveryAmount).toBe(0);
    expect(bankTransfer.body.data.paymentInstructions).toEqual(instructions.body.data.bankTransfer);
    expect(decodeURIComponent(bankTransfer.body.data.whatsappUrl)).not.toContain('proof');
    const bankTransferOrder = await request(app).get(`/api/orders/${bankTransfer.body.data.order.orderNumber}`)
      .set('X-Order-Access-Token', bankTransfer.body.data.orderAccessToken);
    expect(bankTransferOrder.body.data.paymentInstructions).toEqual(instructions.body.data.bankTransfer);
    const walletTransfer = await request(app).post('/api/orders')
      .send({ ...payload, paymentMethod: 'wallet_transfer', items: [{ productId: product.id, quantity: 1 }] });
    expect(walletTransfer.status).toBe(201);
    expect(walletTransfer.body.data.paymentInstructions).toEqual(instructions.body.data.walletTransfer);
    const walletTransferOrder = await request(app).get(`/api/orders/${walletTransfer.body.data.order.orderNumber}`)
      .set('X-Order-Access-Token', walletTransfer.body.data.orderAccessToken);
    expect(walletTransferOrder.body.data.paymentInstructions).toEqual(instructions.body.data.walletTransfer);
  });
  it('rejects disabled payment methods before reserving inventory', async () => {
    const category = await createCategory();
    const product = await createProduct(category);
    await BusinessSettings.create({
      key: 'default',
      storeName: 'Quetta Bikes',
      whatsappNumber: '923001234567',
      paymentMethods: {
        cashOnDelivery: { enabled: false, name: 'Pay later', description: '' },
        bankTransfer: { enabled: true, name: 'Bank transfer', description: '' },
        walletTransfer: { enabled: true, name: 'Wallet transfer', description: '' },
      },
    });
    const response = await request(app).post('/api/orders').send({
      customer: { name: 'Ali Khan', whatsapp: '+923001234567', address: 'House 1, Main Road, Quetta' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cash_on_delivery',
    });
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('This payment method is currently unavailable');
    expect((await Product.findById(product.id)).stockQuantity).toBe(5);
  });
  it('covers order validation, idempotency, admin operations, and stock restoration', async () => {
    const category = await createCategory();
    const product = await createProduct(category, { price: 2000, stockQuantity: 4 });
    const payload = {
      customer: { name: 'Ali Khan', whatsapp: '+923001234567', address: 'House 1, Main Road, Quetta' },
      items: [{ productId: product.id, quantity: 2, selectedOptions: { size: 'M', color: 'Black' } }],
    };
    const invalidKey = await request(app).post('/api/orders').set('Idempotency-Key', 'short-key').send(payload);
    const invalidOrder = await request(app).post('/api/orders').send({ ...payload, items: [{ productId: product.id, quantity: 0 }] });
    expect(invalidKey.status).toBe(422);
    expect(invalidOrder.status).toBe(422);
    expect((await Product.findById(product.id)).stockQuantity).toBe(4);

    const created = await request(app).post('/api/orders').set('Idempotency-Key', 'order-api-test-key-0001').send(payload);
    const duplicate = await request(app).post('/api/orders').set('Idempotency-Key', 'order-api-test-key-0001').send(payload);
    expect(created.status).toBe(201);
    expect(created.body.data.order.subtotal).toBe(4000);
    expect(duplicate.status).toBe(409);
    expect((await Product.findById(product.id)).stockQuantity).toBe(2);

    const storedOrder = await Order.findOne({ orderNumber: created.body.data.order.orderNumber });
    const deniedList = await request(app).get('/api/admin/orders');
    const listed = await request(app).get('/api/admin/orders?status=pending_confirmation').set(authHeader(token));
    const detail = await request(app).get(`/api/admin/orders/${storedOrder.id}`).set(authHeader(token));
    expect(deniedList.status).toBe(401);
    expect(listed.status).toBe(200);
    expect(listed.body.data.orders).toHaveLength(1);
    expect(listed.body.data.orders[0]).not.toHaveProperty('accessTokenHash');
    expect(detail.status).toBe(200);
    expect(detail.body.data.order.customer.name).toBe('Ali Khan');

    const notes = await request(app).patch(`/api/admin/orders/${storedOrder.id}/notes`).set(authHeader(token)).send({ internalNotes: 'Call before dispatch' });
    const payment = await request(app).patch(`/api/admin/orders/${storedOrder.id}/payment-status`).set(authHeader(token)).send({ paymentStatus: 'paid' });
    const advancePayment = await request(app).patch(`/api/admin/orders/${storedOrder.id}/advance-payment-status`).set(authHeader(token)).send({ advancePaymentStatus: 'paid' });
    const confirmed = await request(app).patch(`/api/admin/orders/${storedOrder.id}/status`).set(authHeader(token)).send({ status: 'confirmed' });
    const processing = await request(app).patch(`/api/admin/orders/${storedOrder.id}/status`).set(authHeader(token)).send({ status: 'processing' });
    const cancellations = await Promise.all([
      request(app).patch(`/api/admin/orders/${storedOrder.id}/status`).set(authHeader(token)).send({ status: 'cancelled' }),
      request(app).patch(`/api/admin/orders/${storedOrder.id}/status`).set(authHeader(token)).send({ status: 'cancelled' }),
    ]);
    expect(notes.body.data.order.internalNotes).toBe('Call before dispatch');
    expect(payment.body.data.order.paymentStatus).toBe('paid');
    expect(advancePayment.status).toBe(200);
    expect(confirmed.body.data.order.status).toBe('confirmed');
    expect(processing.body.data.order.status).toBe('processing');
    expect(cancellations.filter((response) => response.status === 200)).toHaveLength(1);
    expect(cancellations.filter((response) => response.status === 422)).toHaveLength(1);
    expect((await Order.findById(storedOrder.id)).status).toBe('cancelled');
    expect((await Product.findById(product.id)).stockQuantity).toBe(4);
    const filteredOrders = await request(app).get('/api/admin/orders?status=cancelled').set(authHeader(token));
    expect(filteredOrders.body.data.orders.map((order) => order._id)).toContain(storedOrder.id);
  });
  it('allows an admin to delete an unshipped order and restores its reserved stock', async () => {
    const category = await createCategory();
    const product = await createProduct(category, { stockQuantity: 5 });
    const created = await request(app).post('/api/orders').send({
      customer: { name: 'Ali Khan', whatsapp: '+923001234567', address: 'House 1, Main Road, Quetta' },
      items: [{ productId: product.id, quantity: 2, selectedOptions: { size: 'M', color: 'Black' } }],
    });
    const order = await Order.findOne({ orderNumber: created.body.data.order.orderNumber });
    expect((await Product.findById(product.id)).stockQuantity).toBe(3);

    const deleted = await request(app).delete(`/api/admin/orders/${order.id}`).set(authHeader(token));

    expect(deleted.status).toBe(200);
    expect((await Order.findById(order.id))).toBeNull();
    expect((await Product.findById(product.id)).stockQuantity).toBe(5);
    expect((await request(app).delete(`/api/admin/orders/${order.id}`).set(authHeader(token))).status).toBe(404);
  });
  it('rejects invalid order state changes', async () => { const category = await createCategory(); const product = await createProduct(category); const order = await Order.create({ orderNumber: 'QB-2026-STATE01', accessTokenHash: 'a'.repeat(64), customer: { name: 'Test', whatsapp: '923001234567', address: 'A sufficiently descriptive test address' }, items: [{ product: product._id, name: product.name, sku: product.sku, quantity: 1, unitPrice: product.price, lineTotal: product.price, selectedOptions: {} }], subtotal: product.price, deliveryCharge: 0, grandTotal: product.price }); const response = await request(app).patch(`/api/admin/orders/${order.id}/status`).set(authHeader(token)).send({ status: 'shipped' }); expect(response.status).toBe(422); });
});
