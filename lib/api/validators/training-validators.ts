import { z } from "zod";
import { idSchema, titleSchema, descriptionSchema, userRoleSchema, salesPositionSchema } from "./common-validators";

// Training module validator
export const trainingModuleSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(""),
  category: z.enum([
    "ONBOARDING",
    "TECHNOLOGY",
    "APPOINTMENT_SETTING",
    "SALES_PROCESS",
    "PRODUCT_KNOWLEDGE",
    "COMPLIANCE",
    "SALES_SKILLS",
    "LEADERSHIP",
    "CUSTOMER_SERVICE",
  ]),
  order: z.number().int().nonnegative().default(1),
  isRequired: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  visibleToRoles: z.array(userRoleSchema).default(["USER", "ADMIN"]),
  visibleToPositions: z.array(salesPositionSchema).optional().default([]),
  estimatedDuration: z.number().int().positive().optional(),
  prerequisites: z.array(idSchema).optional().default([]),
});

// Training section validator
export const trainingSectionSchema = z.object({
  moduleId: idSchema,
  title: titleSchema,
  content: z.string(),
  contentFormat: z.enum(["HTML", "MARKDOWN", "VIDEO", "PDF", "QUIZ"]),
  order: z.number().int().nonnegative().default(1),
  isOptional: z.boolean().default(false),
});

// Quiz question validator
export const quizQuestionSchema = z.object({
  sectionId: idSchema,
  question: z.string().min(2, "Question must be at least 2 characters"),
  questionType: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_ENDED"]).default("MULTIPLE_CHOICE"),
  explanation: z.string().optional(),
  points: z.number().int().positive().default(1),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
  })).min(1, "At least one option is required"),
});

// Quiz answer submission validator
export const quizAnswerSchema = z.object({
  questionId: idSchema,
  selectedOptions: z.array(idSchema).optional(),
  textAnswer: z.string().optional(),
});

// Training progress update validator
export const trainingProgressUpdateSchema = z.object({
  moduleId: idSchema,
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  currentSection: z.number().int().nonnegative().optional(),
  percentComplete: z.number().min(0).max(100).default(0),
});

// Training module filter validator
export const trainingModuleFilterSchema = z.object({
  category: z.string().optional(),
  status: z.enum(["all", "completed", "in-progress", "not-started"]).optional(),
  search: z.string().optional(),
});