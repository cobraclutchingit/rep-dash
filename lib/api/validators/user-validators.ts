import { z } from 'zod';

import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneNumberSchema,
  userRoleSchema,
  salesPositionSchema,
} from './common-validators';

// Registration validator
export const registerUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  position: salesPositionSchema,
  phoneNumber: phoneNumberSchema,
  fullName: z.string().optional(),
  bio: z.string().optional(),
  territory: z.string().optional(),
});

// User profile update validator
export const updateUserProfileSchema = z.object({
  name: nameSchema.optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phoneNumber: phoneNumberSchema,
  bio: z.string().optional().nullable(),
  territory: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
});

// Admin user update validator (more fields available)
export const adminUpdateUserSchema = updateUserProfileSchema.extend({
  role: userRoleSchema.optional(),
  position: salesPositionSchema.optional(),
  isActive: z.boolean().optional(),
  email: emailSchema.optional(),
});

// Password change validator
export const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Password reset request validator
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Password reset validator
export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Reset token verification validator
export const verifyResetTokenSchema = z.object({
  token: z.string(),
});
