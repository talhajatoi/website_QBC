import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');
  const payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'quetta-bicycles-api', audience: 'quetta-bicycles-admin' });
  const admin = await Admin.findById(payload.sub).select('+isActive');
  if (!admin || !admin.isActive) throw new ApiError(401, 'Authentication required');
  req.admin = admin;
  next();
});
