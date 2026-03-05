import { z } from "zod";

export const createCourseSchema = z.object({
  topic: z.string().trim().min(2, "Topic is required").max(200),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  goal: z.string().trim().min(2, "Learning goal is required").max(500),
  tone: z.enum(["professional", "casual", "technical"]),
  targetAudience: z.string().trim().max(300).optional(),
  prerequisites: z.string().trim().max(500).optional(),
  sectionCount: z.coerce.number().int().min(1).max(20).default(5),
  timeCommitment: z.string().trim().max(50).default("30 min/day"),
});

export const generateSectionSchema = z.object({
  sectionNumber: z.number().int().min(1),
});

export const submitAnswerSchema = z.object({
  answer: z.string().min(1, "Answer is required"),
});

export const reviewFlashcardSchema = z.object({
  isCorrect: z.boolean(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
