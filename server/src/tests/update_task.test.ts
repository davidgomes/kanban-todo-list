
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a task directly in the database for testing
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description || null,
      status: input.status || 'todo',
      position: 0
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    // Create a test task first
    const createInput: CreateTaskInput = {
      title: 'Original Title',
      description: 'Original description',
      status: 'todo'
    };
    const createdTask = await createTestTask(createInput);

    // Update only the title
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.status).toEqual('todo'); // Should remain unchanged
    expect(result.position).toEqual(createdTask.position); // Should remain unchanged
    expect(result.created_at).toEqual(createdTask.created_at); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update task description only', async () => {
    // Create a test task first
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'Original description',
      status: 'in_progress'
    };
    const createdTask = await createTestTask(createInput);

    // Update only the description
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('in_progress'); // Should remain unchanged
    expect(result.position).toEqual(createdTask.position); // Should remain unchanged
    expect(result.created_at).toEqual(createdTask.created_at); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update both title and description', async () => {
    // Create a test task first
    const createInput: CreateTaskInput = {
      title: 'Original Title',
      description: 'Original description',
      status: 'done'
    };
    const createdTask = await createTestTask(createInput);

    // Update both title and description
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Title',
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('done'); // Should remain unchanged
    expect(result.position).toEqual(createdTask.position); // Should remain unchanged
    expect(result.created_at).toEqual(createdTask.created_at); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should set description to null', async () => {
    // Create a test task with description
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'Some description',
      status: 'todo'
    };
    const createdTask = await createTestTask(createInput);

    // Update description to null
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    // Verify description is null
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.status).toEqual('todo'); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should save changes to database', async () => {
    // Create a test task first
    const createInput: CreateTaskInput = {
      title: 'Database Test',
      description: 'Original content',
      status: 'todo'
    };
    const createdTask = await createTestTask(createInput);

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Database Test',
      description: 'Updated content'
    };

    await updateTask(updateInput);

    // Query database directly to verify changes
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Updated Database Test');
    expect(tasks[0].description).toEqual('Updated content');
    expect(tasks[0].status).toEqual('todo'); // Should remain unchanged
    expect(tasks[0].updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent Task'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });
});
