import { UserRole, SalesPosition } from '@prisma/client';
import { z } from 'zod';

// ID validator
export const idSchema = z.string().uuid({
  message: 'Invalid ID format. Must be a valid UUID',
});

// Pagination validator
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// Common sort validators
export const sortDirectionSchema = z.enum(['asc', 'desc']).default('desc');
export const sortFieldSchema = z.string();

export const sortSchema = z.object({
  field: sortFieldSchema,
  direction: sortDirectionSchema,
});

// Date range validator
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Search validator
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
});

// Enum validators based on prisma enums
export const userRoleSchema = z.enum(Object.keys(UserRole) as [string, ...string[]]);

export const salesPositionSchema = z.enum(Object.keys(SalesPosition) as [string, ...string[]]);

// Email validator
export const emailSchema = z.string().email('Invalid email address').max(255, 'Email is too long');

// Password validator
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Phone number validator
export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format')
  .optional()
  .nullable();

// URL validator
export const urlSchema = z.string().url('Invalid URL format').max(2048, 'URL is too long');

// Generic text field validators
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long');

export const titleSchema = z
  .string()
  .min(2, 'Title must be at least 2 characters')
  .max(255, 'Title is too long');

export const descriptionSchema = z
  .string()
  .min(2, 'Description must be at least 2 characters')
  .max(2000, 'Description is too long')
  .optional()
  .nullable();

// Combined filter schema for common use
export const filterSchema = z.object({
  search: z.string().optional(),
  ...paginationSchema.shape,
  sortBy: z.string().optional(),
  sortDir: sortDirectionSchema.optional(),
  ...dateRangeSchema.partial().shape,
});
