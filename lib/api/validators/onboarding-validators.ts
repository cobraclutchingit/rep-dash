import { z } from 'zod';

import { idSchema, nameSchema, descriptionSchema, salesPositionSchema } from './common-validators';

// Onboarding track validator
export const onboardingTrackSchema = z.object({
  name: nameSchema,
  description: z.string().min(5, 'Description must be at least 5 characters'),
  forPositions: z.array(salesPositionSchema).default([]),
  isActive: z.boolean().default(true),
});

// Onboarding step validator
export const onboardingStepSchema = z.object({
  trackId: idSchema,
  title: nameSchema,
  description: descriptionSchema.default(''),
  instructions: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  estimatedDuration: z.number().int().positive().optional(),
  isRequired: z.boolean().default(true),
  resourceIds: z.array(idSchema).optional().default([]),
});

// Onboarding progress validator
export const onboardingProgressSchema = z.object({
  stepId: idSchema,
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).default('NOT_STARTED'),
  notes: z.string().optional(),
});

// Onboarding resource validator
export const onboardingResourceSchema = z.object({
  title: nameSchema,
  description: descriptionSchema,
  type: z.enum([
    'LINK',
    'VIDEO',
    'PDF',
    'DOCUMENT',
    'PRESENTATION',
    'SPREADSHEET',
    'IMAGE',
    'AUDIO',
  ]),
  url: z.string().url('Must be a valid URL'),
  isExternal: z.boolean().default(false),
});

// Onboarding filter validator
export const onboardingFilterSchema = z.object({
  position: z
    .enum(['ALL', 'JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER'])
    .optional(),
  status: z.enum(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  search: z.string().optional(),
});
