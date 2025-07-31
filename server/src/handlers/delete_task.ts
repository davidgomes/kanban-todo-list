
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq, gt, and, sql } from 'drizzle-orm';

export async function deleteTask(input: DeleteTaskInput): Promise<{ success: boolean }> {
  try {
    // First, get the task to be deleted to know its status and position
    const taskToDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (taskToDelete.length === 0) {
      throw new Error('Task not found');
    }

    const deletedTask = taskToDelete[0];

    // Delete the task
    await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Reorder remaining tasks in the same column by decrementing positions
    // of all tasks that had a higher position than the deleted task
    await db.update(tasksTable)
      .set({
        position: sql`${tasksTable.position} - 1`,
        updated_at: new Date()
      })
      .where(
        and(
          eq(tasksTable.status, deletedTask.status),
          gt(tasksTable.position, deletedTask.position)
        )
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}
