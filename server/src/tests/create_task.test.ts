
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  status: 'todo'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.status).toEqual('todo');
    expect(result.position).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields and apply defaults', async () => {
    // Use type assertion to test the runtime behavior with minimal input
    const minimalInput = {
      title: 'Minimal Task'
    } as CreateTaskInput;

    const result = await createTask(minimalInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('todo'); // Should use default
    expect(result.position).toEqual(0);
  });

  it('should create a task with null description when not provided', async () => {
    const inputWithoutDescription: CreateTaskInput = {
      title: 'Task without description',
      status: 'in_progress'
    };

    const result = await createTask(inputWithoutDescription);

    expect(result.title).toEqual('Task without description');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('in_progress');
    expect(result.position).toEqual(0);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].status).toEqual('todo');
    expect(tasks[0].position).toEqual(0);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should assign correct position when multiple tasks exist in same status', async () => {
    // Create first task
    const firstTask = await createTask({
      title: 'First Task',
      status: 'todo'
    });
    expect(firstTask.position).toEqual(0);

    // Create second task in same status
    const secondTask = await createTask({
      title: 'Second Task', 
      status: 'todo'
    });
    expect(secondTask.position).toEqual(1);

    // Create third task in same status
    const thirdTask = await createTask({
      title: 'Third Task',
      status: 'todo'
    });
    expect(thirdTask.position).toEqual(2);
  });

  it('should assign position 0 for first task in different status', async () => {
    // Create task in 'todo' status
    const todoTask = await createTask({
      title: 'Todo Task',
      status: 'todo'
    });
    expect(todoTask.position).toEqual(0);

    // Create first task in 'in_progress' status
    const inProgressTask = await createTask({
      title: 'In Progress Task',
      status: 'in_progress'
    });
    expect(inProgressTask.position).toEqual(0);

    // Create first task in 'done' status
    const doneTask = await createTask({
      title: 'Done Task',
      status: 'done'
    });
    expect(doneTask.position).toEqual(0);
  });

  it('should handle positions correctly across different statuses', async () => {
    // Create multiple tasks in different statuses
    await createTask({ title: 'Todo 1', status: 'todo' });
    await createTask({ title: 'Todo 2', status: 'todo' });
    
    const inProgressTask = await createTask({ 
      title: 'InProgress 1', 
      status: 'in_progress' 
    });
    
    const thirdTodoTask = await createTask({ 
      title: 'Todo 3', 
      status: 'todo' 
    });

    // First in_progress task should have position 0
    expect(inProgressTask.position).toEqual(0);
    
    // Third todo task should have position 2
    expect(thirdTodoTask.position).toEqual(2);
  });
});
