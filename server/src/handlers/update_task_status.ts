
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskStatusInput, type Task } from '../schema';
import { eq, and, gte, gt, lt, sql } from 'drizzle-orm';

export async function updateTaskStatus(input: UpdateTaskStatusInput): Promise<Task> {
  try {
    // Get the current task to check its current status
    const currentTaskResult = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (currentTaskResult.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const currentTask = currentTaskResult[0];
    const oldStatus = currentTask.status;
    const oldPosition = currentTask.position;
    const newStatus = input.status;
    const newPosition = input.position;

    // If status is changing, we need to handle reordering in both columns
    if (oldStatus !== newStatus) {
      // First, shift tasks in the old column up to fill the gap
      await db.update(tasksTable)
        .set({ position: sql`${tasksTable.position} - 1` })
        .where(and(
          eq(tasksTable.status, oldStatus),
          gt(tasksTable.position, oldPosition)
        ))
        .execute();

      // Then, shift tasks in the new column down to make space
      await db.update(tasksTable)
        .set({ position: sql`${tasksTable.position} + 1` })
        .where(and(
          eq(tasksTable.status, newStatus),
          gte(tasksTable.position, newPosition)
        ))
        .execute();
    } else {
      // Same status, just reordering within the column
      if (newPosition > oldPosition) {
        // Moving down: shift tasks between old and new position up
        await db.update(tasksTable)
          .set({ position: sql`${tasksTable.position} - 1` })
          .where(and(
            eq(tasksTable.status, newStatus),
            gt(tasksTable.position, oldPosition),
            lt(tasksTable.position, newPosition + 1)
          ))
          .execute();
      } else if (newPosition < oldPosition) {
        // Moving up: shift tasks between new and old position down
        await db.update(tasksTable)
          .set({ position: sql`${tasksTable.position} + 1` })
          .where(and(
            eq(tasksTable.status, newStatus),
            gte(tasksTable.position, newPosition),
            lt(tasksTable.position, oldPosition)
          ))
          .execute();
      }
    }

    // Finally, update the target task with new status and position
    const result = await db.update(tasksTable)
      .set({
        status: newStatus,
        position: newPosition,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task status update failed:', error);
    throw error;
  }
}
