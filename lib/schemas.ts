import { z } from "zod";
import { COLOR_THEME_IDS } from "@/lib/color-themes";
import { COMPLETED_TASK_ICON_IDS } from "@/lib/completed-task-icon-options";
import { DASHBOARD_FONT_IDS } from "@/lib/dashboard-font-options";
import { isValidIanaTimeZone, isValidTimeHm } from "@/lib/time-validation";

export const routineSchema = z.enum(["morning", "evening"]);

export const timeHmSchema = z
  .string()
  .trim()
  .refine(isValidTimeHm, "Use HH:mm (24h)");

export const createChildSchema = z.object({
  name: z.string().trim().min(1).max(120),
  emoji: z.string().trim().max(16).optional(),
});

export const updateChildSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  emoji: z.string().trim().max(16).nullable().optional(),
  completedTaskIcon: z.enum(COMPLETED_TASK_ICON_IDS).optional(),
  hiddenOnDashboard: z.boolean().optional(),
  morningStart: timeHmSchema.nullable().optional(),
  eveningStart: timeHmSchema.nullable().optional(),
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
  colorTheme: z.enum(COLOR_THEME_IDS).optional(),
  dashboardFont: z.enum(DASHBOARD_FONT_IDS).optional(),
  timezone: z
    .string()
    .trim()
    .max(64)
    .refine((value) => value === "" || isValidIanaTimeZone(value), {
      message: "Invalid timezone",
    })
    .optional(),
});
