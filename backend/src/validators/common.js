import { z } from 'zod';
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
export const pagination = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase URL-friendly slug');
export const stringArray = z.array(z.string().trim().min(1).max(100)).max(30).default([]);
