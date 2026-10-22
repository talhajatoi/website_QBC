import { Router } from 'express';
import { dashboardSummary } from '../controllers/admin.controller.js';
import { updateBusinessSettings } from '../controllers/business-settings.controller.js';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/category.controller.js';
import { adminOrder, adminOrders, updateAdvancePaymentStatus, updateNotes, updateOrderStatus, updatePaymentStatus } from '../controllers/order.controller.js';
import { createProduct, deleteProduct, listAdminProducts, updateProduct, updateStock } from '../controllers/product.controller.js';
import { adminReviews, createReview, deleteReview, updateReview } from '../controllers/review.controller.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { ApiError } from '../utils/ApiError.js';
import { removeUploadedFile, removeUploadedFiles, uploadCategoryImage, uploadProductImages, uploadReviewImage } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { advancePaymentStatusSchema, orderQuerySchema, notesSchema, orderStatusSchema, paymentStatusSchema } from '../validators/order.validator.js';
import { productCreateSchema, productQuerySchema, productUpdateSchema, stockSchema } from '../validators/product.validator.js';
import { reviewCreateSchema, reviewQuerySchema, reviewUpdateSchema } from '../validators/review.validator.js';
import { z } from 'zod';
import { slug } from '../validators/common.js';
import { businessSettingsSchema } from '../validators/business-settings.validator.js';
const router = Router();
const categoryImagePath = z.string().regex(/^\/uploads\/categories\/[a-f0-9-]+\.(?:jpg|png|webp)$/i);
const categorySchema = z.object({ name: z.string().trim().min(2).max(100), slug, description: z.string().trim().max(1000).optional(), imageUrl: z.union([z.literal(''), z.string().url().max(2048), categoryImagePath]).optional(), isActive: z.boolean().optional() });
const parseCategoryForm = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  if (req.body.isActive !== undefined) req.body.isActive = req.body.isActive === 'true';
  if (req.file?.publicUrl) req.body.imageUrl = req.file.publicUrl;
  next();
};
const validateCategoryForm = (schema) => {
  const validateBody = validate(schema);
  return (req, res, next) => validateBody(req, res, (error) => {
    if (error && req.file) return removeUploadedFile(req.file).then(() => next(error), next);
    next(error);
  });
};
const validateReviewBody = (schema) => { const validateBody = validate(schema); return (req, res, next) => validateBody(req, res, (error) => { if (error && req.file) return removeUploadedFile(req.file).then(() => next(error), next); next(error); }); };
const parseProductForm = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  try {
    for (const key of ['images', 'sizes', 'colors', 'specifications']) {
      if (req.body[key] !== undefined) req.body[key] = JSON.parse(req.body[key]);
    }
    if (req.body.salePrice === 'null') req.body.salePrice = null;
    for (const key of ['isAvailable', 'isFeatured']) {
      if (req.body[key] !== undefined) req.body[key] = req.body[key] === 'true';
    }
    return next();
  } catch {
    return removeUploadedFiles(req.files).then(() => next(new ApiError(422, 'Invalid product form data')), next);
  }
};
const validateProductForm = (schema) => {
  const validateBody = validate(schema);
  return (req, res, next) => validateBody(req, res, (error) => {
    if (error && req.files?.length) return removeUploadedFiles(req.files).then(() => next(error), next);
    next(error);
  });
};
router.use(requireAuth, requireAdmin);
router.get('/dashboard', dashboardSummary);
router.patch('/business', validate(businessSettingsSchema), updateBusinessSettings);
router.get('/products', validate(productQuerySchema, 'query'), listAdminProducts);
router.post('/products', ...uploadProductImages, parseProductForm, validateProductForm(productCreateSchema), createProduct);
router.patch('/products/:id', ...uploadProductImages, parseProductForm, validateProductForm(productUpdateSchema), updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', validate(stockSchema), updateStock);
router.get('/categories', listCategories);
router.post('/categories', uploadCategoryImage, parseCategoryForm, validateCategoryForm(categorySchema), createCategory);
router.patch('/categories/:id', uploadCategoryImage, parseCategoryForm, validateCategoryForm(categorySchema.partial()), updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/reviews', validate(reviewQuerySchema, 'query'), adminReviews);
router.post('/products/:productId/reviews', ...uploadReviewImage, validateReviewBody(reviewCreateSchema), createReview);
router.patch('/reviews/:reviewId', ...uploadReviewImage, validateReviewBody(reviewUpdateSchema), updateReview);
router.delete('/reviews/:reviewId', deleteReview);
router.get('/orders', validate(orderQuerySchema, 'query'), adminOrders);
router.get('/orders/:id', adminOrder);
router.patch('/orders/:id/status', validate(orderStatusSchema), updateOrderStatus);
router.patch('/orders/:id/payment-status', validate(paymentStatusSchema), updatePaymentStatus);
router.patch('/orders/:id/advance-payment-status', validate(advancePaymentStatusSchema), updateAdvancePaymentStatus);
router.patch('/orders/:id/notes', validate(notesSchema), updateNotes);
export default router;
