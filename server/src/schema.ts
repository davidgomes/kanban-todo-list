
import { z } from 'zod';

// Task status enum
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  position: z.number().int(), // For ordering tasks within columns
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  status: taskStatusSchema.default('todo')
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating task status and position (for drag and drop)
export const updateTaskStatusInputSchema = z.object({
  id: z.number(),
  status: taskStatusSchema,
  position: z.number().int().nonnegative()
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusInputSchema>;

// Input schema for updating task content
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;
