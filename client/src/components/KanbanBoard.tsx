
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import type { Task, TaskStatus } from '../../../server/src/schema';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: number, newStatus: TaskStatus, newPosition: number) => Promise<void>;
  onTaskDelete: (taskId: number) => Promise<void>;
}

export function KanbanBoard({ tasks, onTaskMove, onTaskDelete }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns: { status: TaskStatus; title: string; emoji: string; bgColor: string }[] = [
    { status: 'todo', title: 'To Do', emoji: '📝', bgColor: 'bg-red-50 border-red-200' },
    { status: 'in_progress', title: 'In Progress', emoji: '⚡', bgColor: 'bg-yellow-50 border-yellow-200' },
    { status: 'done', title: 'Done', emoji: '✅', bgColor: 'bg-green-50 border-green-200' }
  ];

  // Group and sort tasks by status and position
  const getTasksForStatus = (status: TaskStatus): Task[] => {
    return tasks
      .filter((task: Task) => task.status === status)
      .sort((a: Task, b: Task) => a.position - b.position);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = async (newStatus: TaskStatus, dropIndex: number) => {
    if (!draggedTask) return;

    // Don't move if dropping in same position
    if (draggedTask.status === newStatus) {
      const currentTasks = getTasksForStatus(newStatus);
      const currentIndex = currentTasks.findIndex((t: Task) => t.id === draggedTask.id);
      if (currentIndex === dropIndex) {
        setDraggedTask(null);
        return;
      }
    }

    await onTaskMove(draggedTask.id, newStatus, dropIndex);
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = getTasksForStatus(column.status);
        
        return (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            emoji={column.emoji}
            bgColor={column.bgColor}
            tasks={columnTasks}
            draggedTask={draggedTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onTaskDelete={onTaskDelete}
          />
        );
      })}
    </div>
  );
}
