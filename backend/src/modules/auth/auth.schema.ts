import { z } from 'zod';

export const registerSchema = z.object({
  userType: z.enum(['MSME', 'CITIZEN']).default('MSME'),
  tenantName: z.string().max(100).optional(),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
  userType: z.enum(['MSME', 'CITIZEN']).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

