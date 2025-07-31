
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskStatusInput, type CreateTaskInput, type TaskStatus } from '../schema';
import { updateTaskStatus } from '../handlers/update_task_status';
import { eq, and, asc } from 'drizzle-orm';

// Helper function to create a task for testing
const createTestTask = async (title: string, status: TaskStatus = 'todo', position: number = 0) => {
  const result = await db.insert(tasksTable)
    .values({
      title,
      description: `Description for ${title}`,
      status,
      position
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to get all tasks in a specific status, ordered by position
const getTasksByStatus = async (status: TaskStatus) => {
  return await db.select()
    .from(tasksTable)
    .where(eq(tasksTable.status, status))
    .orderBy(asc(tasksTable.position))
    .execute();
};

describe('updateTaskStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task status and position', async () => {
    const task = await createTestTask('Test Task', 'todo', 0);

    const input: UpdateTaskStatusInput = {
      id: task.id,
      status: 'in_progress',
      position: 0
    };

    const result = await updateTaskStatus(input);

    expect(result.id).toEqual(task.id);
    expect(result.status).toEqual('in_progress');
    expect(result.position).toEqual(0);
    expect(result.title).toEqual('Test Task');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > task.updated_at).toBe(true);
  });

  it('should handle moving task to different status column', async () => {
    // Create tasks in different columns
    const todoTask1 = await createTestTask('Todo 1', 'todo', 0);
    const todoTask2 = await createTestTask('Todo 2', 'todo', 1);
    const progressTask1 = await createTestTask('Progress 1', 'in_progress', 0);

    // Move todoTask1 to in_progress at position 0
    const input: UpdateTaskStatusInput = {
      id: todoTask1.id,
      status: 'in_progress',
      position: 0
    };

    await updateTaskStatus(input);

    // Check that todo column was reordered (todoTask2 should move to position 0)
    const todoTasks = await getTasksByStatus('todo');
    expect(todoTasks).toHaveLength(1);
    expect(todoTasks[0].id).toEqual(todoTask2.id);
    expect(todoTasks[0].position).toEqual(0);

    // Check that in_progress column was reordered (progressTask1 should move to position 1)
    const progressTasks = await getTasksByStatus('in_progress');
    expect(progressTasks).toHaveLength(2);
    expect(progressTasks[0].id).toEqual(todoTask1.id);
    expect(progressTasks[0].position).toEqual(0);
    expect(progressTasks[1].id).toEqual(progressTask1.id);
    expect(progressTasks[1].position).toEqual(1);
  });

  it('should handle reordering within same status column', async () => {
    // Create multiple tasks in todo column
    const task1 = await createTestTask('Task 1', 'todo', 0);
    const task2 = await createTestTask('Task 2', 'todo', 1);
    const task3 = await createTestTask('Task 3', 'todo', 2);

    // Move task1 to position 1 (between task2 and task3)
    const input: UpdateTaskStatusInput = {
      id: task1.id,
      status: 'todo',
      position: 1
    };

    await updateTaskStatus(input);

    // Check final order: task2 (pos 0), task1 (pos 1), task3 (pos 2)
    const todoTasks = await getTasksByStatus('todo');
    expect(todoTasks).toHaveLength(3);
    expect(todoTasks[0].id).toEqual(task2.id);
    expect(todoTasks[0].position).toEqual(0);
    expect(todoTasks[1].id).toEqual(task1.id);
    expect(todoTasks[1].position).toEqual(1);
    expect(todoTasks[2].id).toEqual(task3.id);
    expect(todoTasks[2].position).toEqual(2);
  });

  it('should handle moving task down within same column', async () => {
    // Create multiple tasks in todo column
    const task1 = await createTestTask('Task 1', 'todo', 0);
    const task2 = await createTestTask('Task 2', 'todo', 1);
    const task3 = await createTestTask('Task 3', 'todo', 2);

    // Move task1 to position 2 (to the end)
    const input: UpdateTaskStatusInput = {
      id: task1.id,
      status: 'todo',
      position: 2
    };

    await updateTaskStatus(input);

    // Check final order: task2 (pos 0), task3 (pos 1), task1 (pos 2)
    const todoTasks = await getTasksByStatus('todo');
    expect(todoTasks).toHaveLength(3);
    expect(todoTasks[0].id).toEqual(task2.id);
    expect(todoTasks[0].position).toEqual(0);
    expect(todoTasks[1].id).toEqual(task3.id);
    expect(todoTasks[1].position).toEqual(1);
    expect(todoTasks[2].id).toEqual(task1.id);
    expect(todoTasks[2].position).toEqual(2);
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateTaskStatusInput = {
      id: 999,
      status: 'done',
      position: 0
    };

    expect(updateTaskStatus(input)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should handle moving task to empty column', async () => {
    const task = await createTestTask('Test Task', 'todo', 0);

    const input: UpdateTaskStatusInput = {
      id: task.id,
      status: 'done',
      position: 0
    };

    const result = await updateTaskStatus(input);

    expect(result.status).toEqual('done');
    expect(result.position).toEqual(0);

    // Verify no tasks left in todo
    const todoTasks = await getTasksByStatus('todo');
    expect(todoTasks).toHaveLength(0);

    // Verify task exists in done
    const doneTasks = await getTasksByStatus('done');
    expect(doneTasks).toHaveLength(1);
    expect(doneTasks[0].id).toEqual(task.id);
  });

  it('should preserve task content when updating status', async () => {
    const task = await createTestTask('Important Task', 'todo', 0);

    const input: UpdateTaskStatusInput = {
      id: task.id,
      status: 'done',
      position: 0
    };

    const result = await updateTaskStatus(input);

    expect(result.title).toEqual('Important Task');
    expect(result.description).toEqual('Description for Important Task');
    expect(result.created_at).toEqual(task.created_at);
  });
});
