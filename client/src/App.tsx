
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { KanbanBoard } from '@/components/KanbanBoard';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Task, CreateTaskInput, TaskStatus } from '../../server/src/schema';

function App() {
  // Explicit typing with Task interface
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // useCallback to memoize function used in useEffect
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (taskData: CreateTaskInput) => {
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(taskData);
      // Update tasks list with explicit typing in setState callback
      setTasks((prev: Task[]) => [...prev, newTask]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskMove = async (taskId: number, newStatus: TaskStatus, newPosition: number) => {
    // Optimistically update the UI
    setTasks((prev: Task[]) => 
      prev.map((task: Task) => 
        task.id === taskId 
          ? { ...task, status: newStatus, position: newPosition, updated_at: new Date() }
          : task
      )
    );

    try {
      await trpc.updateTaskStatus.mutate({
        id: taskId,
        status: newStatus,
        position: newPosition
      });
      // Reload tasks to get the correct positions after server reordering
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert optimistic update on error
      await loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 Kanban Board
            </h1>
            <p className="text-gray-600">
              Organize your tasks with drag and drop functionality
            </p>
            {/* Note about stub implementation */}
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-sm text-yellow-800">
              ⚠️ Backend handlers are currently stub implementations. The app demonstrates the UI and API integration patterns.
            </div>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskDelete={handleDeleteTask}
        />

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateTask={handleCreateTask}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
