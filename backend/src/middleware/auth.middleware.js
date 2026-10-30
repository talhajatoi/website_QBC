import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');
  const payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'quetta-bicycles-api', audience: 'quetta-bicycles-admin' });
  const admin = await Admin.findById(payload.sub).select('+isActive');
  if (!admin || !admin.isActive) throw new ApiError(401, 'Authentication required');
  req.admin = admin;
  if (payload.exp - Math.floor(Date.now() / 1000) <= 5 * 60) {
    res.setHeader('X-Admin-Token', generateToken(admin));
  }
  next();
});
