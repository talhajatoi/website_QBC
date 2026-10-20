process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-longer-than-thirty-two-characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FRONTEND_URL = 'https://store.example.com';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.WHATSAPP_BUSINESS_NUMBER = '923001234567';
process.env.DELIVERY_CHARGE_PKR = '250';
process.env.PAYMENT_EASYPAISA_ACCOUNT_TITLE = 'Test Payment Account';
process.env.PAYMENT_EASYPAISA_ACCOUNT_NUMBER = '03000000000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/placeholder';

const { MongoMemoryServer } = await import('mongodb-memory-server');
globalThis.mongoServer = await MongoMemoryServer.create();
process.env.MONGODB_URI = globalThis.mongoServer.getUri('quetta_bicycles_test');
