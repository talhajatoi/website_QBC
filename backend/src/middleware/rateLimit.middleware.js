import { rateLimit } from 'express-rate-limit';

const jsonLimit = (message, windowMs, limit) => rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, handler: (req, res) => res.status(429).json({ success: false, message }) });
export const loginLimiter = jsonLimit('Too many login attempts. Please try again later.', 15 * 60 * 1000, 10);
export const publicWriteLimiter = jsonLimit('Too many requests. Please try again later.', 15 * 60 * 1000, 60);
