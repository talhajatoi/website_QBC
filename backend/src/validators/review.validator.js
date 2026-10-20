import { z } from 'zod';
import { pagination } from './common.js';
const formBoolean = z.preprocess((value) => value === true || value === 'true', z.boolean());
const reviewDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid review date').transform((value) => new Date(`${value}T00:00:00.000Z`));
const baseReviewFields = { displayName: z.string().trim().min(2).max(80), rating: z.coerce.number().int().min(1).max(5), text: z.string().trim().min(5).max(3000) };
export const reviewCreateSchema = z.object({ ...baseReviewFields, reviewDate, verifiedPurchase: formBoolean.optional().default(false), status: z.enum(['published', 'hidden']).default('hidden') });
export const customerReviewCreateSchema = z.object(baseReviewFields);
export const reviewUpdateSchema = z.object({ ...baseReviewFields, reviewDate: reviewDate.optional(), verifiedPurchase: formBoolean.optional(), status: z.enum(['published', 'hidden']).optional(), helpfulCount: z.coerce.number().int().min(0).optional(), removeImage: formBoolean.optional() }).partial();
export const reviewQuerySchema = pagination.extend({ status: z.enum(['published', 'hidden']).optional(), sort: z.enum(['newest', 'rating']).default('newest') });
export const publicReviewQuerySchema = pagination.extend({ sort: z.enum(['newest', 'rating']).default('newest') });
