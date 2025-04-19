import { z } from "zod";
import { 
  idSchema, 
  nameSchema, 
  descriptionSchema, 
  salesPositionSchema 
} from "./common-validators";

// Leaderboard validator
export const leaderboardSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  type: z.enum([
    "APPOINTMENT_SETTERS",
    "CLOSERS",
    "REFERRALS",
    "OVERALL"
  ]),
  period: z.enum([
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "YEARLY",
    "ALL_TIME"
  ]),
  forPositions: z.array(salesPositionSchema).default([]),
  isActive: z.boolean().default(true),
});

// Leaderboard entry validator
export const leaderboardEntrySchema = z.object({
  userId: idSchema,
  score: z.number(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  metrics: z.record(z.any()).optional(),
}).refine(data => new Date(data.periodStart) <= new Date(data.periodEnd), {
  message: "End date must be after start date",
  path: ["periodEnd"],
});

// Bulk leaderboard entries validator
export const bulkLeaderboardEntriesSchema = z.object({
  entries: z.array(leaderboardEntrySchema.omit({ periodStart: true, periodEnd: true })),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
}).refine(data => new Date(data.periodStart) <= new Date(data.periodEnd), {
  message: "End date must be after start date",
  path: ["periodEnd"],
});

// Leaderboard filter validator
export const leaderboardFilterSchema = z.object({
  type: z.enum([
    "ALL",
    "APPOINTMENT_SETTERS",
    "CLOSERS",
    "REFERRALS",
    "OVERALL"
  ]).default("ALL"),
  period: z.enum([
    "ALL",
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "YEARLY",
    "ALL_TIME"
  ]).default("ALL"),
  position: z.enum([
    "ALL",
    "JUNIOR_EC",
    "ENERGY_CONSULTANT",
    "ENERGY_SPECIALIST",
    "MANAGER"
  ]).default("ALL"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  searchTerm: z.string().optional(),
});