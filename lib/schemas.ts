import { z } from "zod";

export const routineSchema = z.enum(["morning", "evening"]);

export const timeHmSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Use HH:mm (24h)");

export const createChildSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateChildSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  morningStart: timeHmSchema.nullable().optional(),
  morningEnd: timeHmSchema.nullable().optional(),
  eveningStart: timeHmSchema.nullable().optional(),
  eveningEnd: timeHmSchema.nullable().optional(),
});

export const reorderChildrenSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const createTaskSchema = z.object({
  childId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  routine: routineSchema,
});

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  routine: routineSchema.optional(),
  active: z.boolean().optional(),
});

export const reorderTasksSchema = z.object({
  childId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const updateProfileSchema = z.object({
  timezone: z.string().trim().min(1).max(64).optional(),
  morningStart: timeHmSchema.optional(),
  morningEnd: timeHmSchema.optional(),
  eveningStart: timeHmSchema.optional(),
  eveningEnd: timeHmSchema.optional(),
});
