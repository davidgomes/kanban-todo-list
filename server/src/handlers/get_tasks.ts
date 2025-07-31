
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { asc } from 'drizzle-orm';

export async function getTasks(): Promise<Task[]> {
  try {
    // Fetch all tasks ordered by status (todo, in_progress, done) and position for proper Kanban board display
    // The enum is defined as ['todo', 'in_progress', 'done'] so they will be ordered in that sequence
    const results = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.status), asc(tasksTable.position))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}
