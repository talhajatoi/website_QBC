import mongoose from 'mongoose';
import { ZodError } from 'zod';
import multer from 'multer';
import { env } from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

export const errorHandler = (error, req, res, next) => {
  let status = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors = error.errors || [];
  if (error instanceof ZodError) { status = 422; message = 'Validation failed'; errors = error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })); }
  if (error instanceof multer.MulterError) { status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 422; message = error.code === 'LIMIT_FILE_SIZE' ? (error.field === 'productImages' ? 'Each product image must be 50 MB or smaller' : 'Review image must be 5 MB or smaller') : 'Invalid image upload'; }
  if (error instanceof mongoose.Error.CastError) { status = 400; message = 'Invalid resource identifier'; }
  if (error?.code === 11000) { status = 409; message = 'A record with this value already exists'; errors = Object.keys(error.keyPattern || {}).map((path) => ({ path, message: 'Must be unique' })); }
  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') { status = 401; message = 'Invalid or expired authentication token'; }
  if (status >= 500 && env.NODE_ENV === 'production') message = 'Internal server error';
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message, ...(errors.length ? { errors } : {}) });
};
