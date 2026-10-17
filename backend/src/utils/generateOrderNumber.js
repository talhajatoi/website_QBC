import crypto from 'node:crypto';

export const generateOrderNumber = () => `QB-${new Date().getFullYear()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
export const generateSecret = () => crypto.randomBytes(32).toString('hex');
export const hashSecret = (value) => crypto.createHash('sha256').update(value).digest('hex');
