
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Clock, Calendar } from 'lucide-react';
import { EditTaskDialog } from './EditTaskDialog';
import type { Task } from '../../../server/src/schema';

interface TaskCardProps {
  task: Task;
  isDragged: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDelete: () => void;
}

export function TaskCard({
  task,
  isDragged,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDelete
}: TaskCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const badges = {
      todo: { label: 'To Do', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
      in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
      done: { label: 'Done', className: 'bg-green-100 text-green-700 hover:bg-green-200' }
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const badgeInfo = getStatusBadge(task.status);

  return (
    <>
      <Card
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        className={`cursor-move transition-all duration-200 hover:shadow-md ${
          isDragged ? 'opacity-50 rotate-2 scale-105' : ''
        } bg-white border-gray-200`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <h3 
                className="font-medium text-gray-900 flex-1 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => setIsEditDialogOpen(true)}
              >
                {task.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <Badge className={badgeInfo.className}>
              {badgeInfo.label}
            </Badge>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.created_at)}</span>
              {task.updated_at.getTime() !== task.created_at.getTime() && (
                <>
                  <Clock className="w-3 h-3 ml-1" />
                  <span>Updated {formatDate(task.updated_at)}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        task={task}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
