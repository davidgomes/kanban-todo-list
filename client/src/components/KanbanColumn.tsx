
import { useState } from 'react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../../../server/src/schema';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  emoji: string;
  bgColor: string;
  tasks: Task[];
  draggedTask: Task | null;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDrop: (status: TaskStatus, position: number) => Promise<void>;
  onTaskDelete: (taskId: number) => Promise<void>;
}

export function KanbanColumn({
  status,
  title,
  emoji,
  bgColor,
  tasks,
  draggedTask,
  onDragStart,
  onDragEnd,
  onDrop,
  onTaskDelete
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const dropIndex = dragOverIndex !== null ? dragOverIndex : tasks.length;
    await onDrop(status, dropIndex);
    setDragOverIndex(null);
  };

  const handleTaskDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate if we should insert before or after this task
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midY ? index : index + 1;
    setDragOverIndex(insertIndex);
  };

  return (
    <div
      className={`${bgColor} border-2 rounded-lg p-4 min-h-[500px] transition-colors ${
        isDragOver ? 'border-indigo-400 bg-indigo-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          {title}
        </h2>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task: Task, index: number) => (
          <div key={task.id}>
            {/* Drop indicator */}
            {dragOverIndex === index && draggedTask && (
              <div className="h-2 bg-indigo-300 rounded-full mb-2 opacity-50" />
            )}
            
            <TaskCard
              task={task}
              isDragged={draggedTask?.id === task.id}
              onDragStart={() => onDragStart(task)}
              onDragEnd={onDragEnd}
              onDragOver={(e: React.DragEvent) => handleTaskDragOver(e, index)}
              onDelete={() => onTaskDelete(task.id)}
            />
          </div>
        ))}
        
        {/* Drop indicator at the end */}
        {dragOverIndex === tasks.length && draggedTask && (
          <div className="h-2 bg-indigo-300 rounded-full opacity-50" />
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs">Drag tasks here or create new ones</p>
          </div>
        )}
      </div>
    </div>
  );
}
