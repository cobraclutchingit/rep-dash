import { z } from 'zod';

import {
  idSchema,
  titleSchema,
  descriptionSchema,
  userRoleSchema,
  salesPositionSchema,
} from './common-validators';

// Event validator
export const calendarEventSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    eventType: z.enum([
      'TRAINING',
      'MEETING',
      'APPOINTMENT',
      'BLITZ',
      'CONTEST',
      'HOLIDAY',
      'OTHER',
    ]),
    isBlitz: z.boolean().default(false),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date',
    }),
    allDay: z.boolean().default(false),
    location: z.string().optional().nullable(),
    locationUrl: z.string().url().optional().nullable(),
    recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('NONE'),
    recurrenceEndDate: z.string().optional().nullable(),
    isPublic: z.boolean().default(true),
    visibleToRoles: z.array(userRoleSchema).default(['USER', 'ADMIN']),
    visibleToPositions: z.array(salesPositionSchema).optional().default([]),
    resources: z.array(idSchema).optional().default([]),
    attendees: z
      .array(
        z.object({
          userId: idSchema,
          isRequired: z.boolean().default(true),
        })
      )
      .optional()
      .default([]),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// Event attendee status update validator
export const eventAttendeeStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']),
});

// Event filter validator
export const calendarEventFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventType: z.string().optional(),
  isBlitz: z.boolean().optional(),
});
