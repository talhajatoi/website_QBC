import { ApiError } from '../utils/ApiError.js';
export const requireAdmin = (req, res, next) => req.admin?.role === 'admin' ? next() : next(new ApiError(403, 'Administrator access required'));
