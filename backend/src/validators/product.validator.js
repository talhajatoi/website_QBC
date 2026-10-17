import { z } from 'zod';
import { objectId, pagination, slug, stringArray } from './common.js';
const productImage = z.union([
  z.string().url().max(2048),
  z.string().regex(/^\/uploads\/products\/[a-f\d-]+\.(?:jpg|png)$/i, 'Invalid uploaded product image'),
]);
const fields = {
  name: z.string().trim().min(2).max(200), slug, description: z.string().trim().min(10).max(10000), brand: z.string().trim().min(1).max(100), category: objectId,
  bicycleType: z.string().trim().max(100).optional(), price: z.coerce.number().finite().min(0), salePrice: z.coerce.number().finite().min(0).nullable().optional(), stockQuantity: z.coerce.number().int().min(0), sku: z.string().trim().min(1).max(100).transform((v) => v.toUpperCase()),
  images: z.array(productImage).max(12).default([]), specifications: z.record(z.string().max(80), z.string().trim().max(500)).default({}), sizes: stringArray, colors: stringArray, isAvailable: z.boolean().optional(), isFeatured: z.boolean().optional(),
};
export const productCreateSchema = z.object(fields).superRefine((data, ctx) => { if (data.salePrice != null && data.salePrice > data.price) ctx.addIssue({ code: 'custom', path: ['salePrice'], message: 'Sale price cannot exceed price' }); });
export const productUpdateSchema = z.object(fields).partial().superRefine((data, ctx) => { if (data.salePrice != null && data.price != null && data.salePrice > data.price) ctx.addIssue({ code: 'custom', path: ['salePrice'], message: 'Sale price cannot exceed price' }); });
export const productQuerySchema = pagination.extend({ category: z.string().max(100).optional(), brand: z.string().max(100).optional(), bicycleType: z.string().max(100).optional(), available: z.enum(['true', 'false']).optional(), minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(), sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'popularity']).default('newest') });
export const stockSchema = z.object({ stockQuantity: z.coerce.number().int().min(0) });
