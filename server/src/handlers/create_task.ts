
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task, createTaskInputSchema } from '../schema';
import { eq, max } from 'drizzle-orm';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Parse input to apply Zod defaults
    const parsedInput = createTaskInputSchema.parse(input);
    
    // Get the highest position for the target status column
    const maxPositionResult = await db.select({ 
      maxPosition: max(tasksTable.position) 
    })
      .from(tasksTable)
      .where(eq(tasksTable.status, parsedInput.status))
      .execute();

    // Calculate the next position (0 if no tasks exist in this status)
    const maxPosition = maxPositionResult[0].maxPosition;
    const nextPosition = maxPosition !== null ? maxPosition + 1 : 0;

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: parsedInput.title,
        description: parsedInput.description || null,
        status: parsedInput.status,
        position: nextPosition
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
