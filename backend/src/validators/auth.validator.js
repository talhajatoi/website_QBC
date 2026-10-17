import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(1).max(200) });
export const passwordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(12).max(200).regex(/[a-z]/, 'Must include a lowercase letter').regex(/[A-Z]/, 'Must include an uppercase letter').regex(/\d/, 'Must include a number') });
