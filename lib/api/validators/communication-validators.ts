import { z } from "zod";
import { titleSchema, descriptionSchema, userRoleSchema, salesPositionSchema } from "./common-validators";

// Announcement validator
export const announcementSchema = z.object({
  title: titleSchema,
  content: z.string().min(2, "Content must be at least 2 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z.string().optional().nullable(),
  visibleToRoles: z.array(userRoleSchema).default([]),
  visibleToPositions: z.array(salesPositionSchema).default([]),
  publishDate: z.string().datetime().default(() => new Date().toISOString()),
  expiryDate: z.string().datetime().optional().nullable(),
  isPinned: z.boolean().default(false),
  isDraft: z.boolean().default(false),
});

// Important link validator
export const importantLinkSchema = z.object({
  title: titleSchema,
  url: z.string().url("Must be a valid URL"),
  description: descriptionSchema,
  category: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  order: z.number().int().nonnegative().default(0),
  visibleToRoles: z.array(userRoleSchema).default([]),
  visibleToPositions: z.array(salesPositionSchema).default([]),
  isActive: z.boolean().default(true),
});

// Contest validator
export const contestSchema = z.object({
  title: titleSchema,
  description: z.string().min(2, "Description must be at least 2 characters"),
  contestType: z.enum([
    "APPOINTMENTS",
    "SALES",
    "REFERRALS",
    "TEAM_CHALLENGE",
    "CUSTOM",
  ]),
  status: z.enum([
    "UPCOMING",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ]).default("UPCOMING"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  visibleToRoles: z.array(userRoleSchema).default([]),
  visibleToPositions: z.array(salesPositionSchema).default([]),
  prizes: z.any().optional(),
  rules: z.string().optional(),
  isDraft: z.boolean().default(false),
  imageUrl: z.string().url().optional().nullable(),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Contest participant validator
export const contestParticipantSchema = z.object({
  userId: z.string(),
  score: z.number().default(0),
  rank: z.number().int().positive().optional(),
  isWinner: z.boolean().default(false),
  prize: z.string().optional(),
});

// Communication filter validator
export const communicationFilterSchema = z.object({
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  contestType: z.enum([
    "APPOINTMENTS",
    "SALES",
    "REFERRALS",
    "TEAM_CHALLENGE",
    "CUSTOM",
  ]).optional(),
  contestStatus: z.enum([
    "UPCOMING",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ]).optional(),
  search: z.string().optional(),
});