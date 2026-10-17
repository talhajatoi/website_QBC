import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (admin) => jwt.sign(
  { sub: admin.id, role: admin.role },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN, issuer: 'quetta-bicycles-api', audience: 'quetta-bicycles-admin' },
);
