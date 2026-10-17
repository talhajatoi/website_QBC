import { Admin } from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';

const publicAdmin = (admin) => ({ id: admin.id, name: admin.name, email: admin.email, role: admin.role, createdAt: admin.createdAt });
export const login = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ email: req.body.email }).select('+password +isActive');
  if (!admin || !admin.isActive || !(await admin.comparePassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ success: true, message: 'Login successful', data: { token: generateToken(admin), admin: publicAdmin(admin) } });
});
export const logout = (req, res) => res.json({ success: true, message: 'Logout successful. Discard the bearer token.' });
export const profile = (req, res) => res.json({ success: true, message: 'Profile retrieved successfully', data: { admin: publicAdmin(req.admin) } });
export const changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('+password');
  if (!(await admin.comparePassword(req.body.currentPassword))) throw new ApiError(401, 'Current password is incorrect');
  admin.password = req.body.newPassword; await admin.save();
  res.json({ success: true, message: 'Password changed successfully. Sign in again to obtain a new token.' });
});
