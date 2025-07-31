
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq, asc } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task', async () => {
    // Create a test task
    const taskInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      status: 'todo'
    };

    const createdTask = await db.insert(tasksTable)
      .values({
        title: taskInput.title,
        description: taskInput.description,
        status: taskInput.status,
        position: 0
      })
      .returning()
      .execute();

    const deleteInput: DeleteTaskInput = {
      id: createdTask[0].id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task is deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask[0].id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should reorder remaining tasks in the same column', async () => {
    // Create multiple tasks in the same column
    const tasks = await Promise.all([
      db.insert(tasksTable)
        .values({
          title: 'Task 1',
          description: 'First task',
          status: 'todo',
          position: 0
        })
        .returning()
        .execute(),
      db.insert(tasksTable)
        .values({
          title: 'Task 2',
          description: 'Second task',
          status: 'todo',
          position: 1
        })
        .returning()
        .execute(),
      db.insert(tasksTable)
        .values({
          title: 'Task 3',
          description: 'Third task',
          status: 'todo',
          position: 2
        })
        .returning()
        .execute()
    ]);

    // Delete the middle task (position 1)
    const deleteInput: DeleteTaskInput = {
      id: tasks[1][0].id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Check remaining tasks have been reordered
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.status, 'todo'))
      .orderBy(asc(tasksTable.position))
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks[0].title).toBe('Task 1');
    expect(remainingTasks[0].position).toBe(0);
    expect(remainingTasks[1].title).toBe('Task 3');
    expect(remainingTasks[1].position).toBe(1); // Should be decremented from 2 to 1
  });

  it('should only reorder tasks in the same status column', async () => {
    // Create tasks in different columns
    const todoTasks = await Promise.all([
      db.insert(tasksTable)
        .values({
          title: 'Todo Task 1',
          status: 'todo',
          position: 0
        })
        .returning()
        .execute(),
      db.insert(tasksTable)
        .values({
          title: 'Todo Task 2',
          status: 'todo',
          position: 1
        })
        .returning()
        .execute()
    ]);

    const inProgressTasks = await db.insert(tasksTable)
      .values({
        title: 'In Progress Task',
        status: 'in_progress',
        position: 0
      })
      .returning()
      .execute();

    // Delete todo task at position 0
    const deleteInput: DeleteTaskInput = {
      id: todoTasks[0][0].id
    };

    await deleteTask(deleteInput);

    // Check that todo tasks were reordered
    const remainingTodoTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.status, 'todo'))
      .execute();

    expect(remainingTodoTasks).toHaveLength(1);
    expect(remainingTodoTasks[0].position).toBe(0); // Should be decremented from 1 to 0

    // Check that in_progress tasks are unaffected
    const inProgressTasksAfter = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.status, 'in_progress'))
      .execute();

    expect(inProgressTasksAfter).toHaveLength(1);
    expect(inProgressTasksAfter[0].position).toBe(0); // Should remain unchanged
  });

  it('should throw error when task does not exist', async () => {
    const deleteInput: DeleteTaskInput = {
      id: 999 // Non-existent task ID
    };

    await expect(deleteTask(deleteInput)).rejects.toThrow(/task not found/i);
  });

  it('should handle deleting the last task in a column', async () => {
    // Create a single task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Only Task',
        status: 'done',
        position: 0
      })
      .returning()
      .execute();

    const deleteInput: DeleteTaskInput = {
      id: task[0].id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify no tasks remain in the column
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.status, 'done'))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });
});
