
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should fetch all tasks from database', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      {
        title: 'Task 1',
        description: 'First task',
        status: 'todo',
        position: 0
      },
      {
        title: 'Task 2',
        description: 'Second task',
        status: 'in_progress',
        position: 1
      },
      {
        title: 'Task 3',
        description: null,
        status: 'done',
        position: 0
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].description).toEqual('First task');
    expect(result[0].status).toEqual('todo');
    expect(result[0].position).toEqual(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Task 2');
    expect(result[1].status).toEqual('in_progress');
    expect(result[2].title).toEqual('Task 3');
    expect(result[2].description).toBeNull();
    expect(result[2].status).toEqual('done');
  });

  it('should return tasks ordered by status and position', async () => {
    // Create tasks in mixed order
    await db.insert(tasksTable).values([
      {
        title: 'Done Task 2',
        status: 'done',
        position: 1
      },
      {
        title: 'Todo Task 1',
        status: 'todo',
        position: 0
      },
      {
        title: 'In Progress Task',
        status: 'in_progress',
        position: 0
      },
      {
        title: 'Done Task 1',
        status: 'done',
        position: 0
      },
      {
        title: 'Todo Task 2',
        status: 'todo',
        position: 1
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(5);
    
    // Should be ordered by status (todo, in_progress, done) then by position
    expect(result[0].title).toEqual('Todo Task 1');
    expect(result[0].status).toEqual('todo');
    expect(result[0].position).toEqual(0);

    expect(result[1].title).toEqual('Todo Task 2');
    expect(result[1].status).toEqual('todo');
    expect(result[1].position).toEqual(1);

    expect(result[2].title).toEqual('In Progress Task');
    expect(result[2].status).toEqual('in_progress');
    expect(result[2].position).toEqual(0);

    expect(result[3].title).toEqual('Done Task 1');
    expect(result[3].status).toEqual('done');
    expect(result[3].position).toEqual(0);

    expect(result[4].title).toEqual('Done Task 2');
    expect(result[4].status).toEqual('done');
    expect(result[4].position).toEqual(1);
  });
});
