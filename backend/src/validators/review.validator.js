import { z } from 'zod';
import { pagination } from './common.js';
const formBoolean = z.preprocess((value) => value === true || value === 'true', z.boolean());
const baseReviewFields = { displayName: z.string().trim().min(2).max(80), rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().min(2).max(160), text: z.string().trim().min(5).max(3000) };
export const reviewCreateSchema = z.object({ ...baseReviewFields, verifiedPurchase: formBoolean.optional().default(false), status: z.enum(['published', 'hidden']).default('hidden') });
export const customerReviewCreateSchema = z.object(baseReviewFields);
export const reviewUpdateSchema = reviewCreateSchema.partial().extend({ helpfulCount: z.coerce.number().int().min(0).optional(), removeImage: formBoolean.optional() });
export const reviewQuerySchema = pagination.extend({ status: z.enum(['published', 'hidden']).optional(), sort: z.enum(['newest', 'rating']).default('newest') });
export const publicReviewQuerySchema = pagination.extend({ sort: z.enum(['newest', 'rating']).default('newest') });
