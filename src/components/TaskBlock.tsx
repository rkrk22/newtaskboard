import { DragEvent } from "react";
import { Trash2, Calendar, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TASK_DRAG_TYPE } from "@/lib/dragTypes";
import { cn } from "@/lib/utils";

interface TaskBlockProps {
  id: string;
  title: string;
  deadline: string;
  importance: number;
  size: number;
  status: "todo" | "done";
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const TaskBlock = ({
  id,
  title,
  deadline,
  importance,
  size,
  status,
  onClick,
  onDelete,
}: TaskBlockProps) => {
  const baseSize = 60;
  const scaledSize = baseSize + size * 15;
  const clampedSize = Math.min(scaledSize, 200);
  const cardHeight =
    importance === 1 || importance === 2
      ? Math.min(clampedSize + 40, 240)
      : clampedSize;
  
  // Dynamic font sizes based on card size
  const titleFontSize = Math.max(10, Math.min(scaledSize / 8, 16));
  const detailFontSize = Math.max(8, Math.min(scaledSize / 12, 12));
  const iconSize = Math.max(10, Math.min(scaledSize / 15, 14));
  const padding = Math.max(8, Math.min(scaledSize / 10, 16));
  
  const colorMap = [
    "hsl(var(--task-color-1))",
    "hsl(var(--task-color-2))",
    "hsl(var(--task-color-3))",
    "hsl(var(--task-color-4))",
    "hsl(var(--task-color-5))",
    "hsl(var(--task-color-6))",
  ];
  const gradientIndex = Math.min(
    colorMap.length - 1,
    Math.floor(((importance - 1) / 9) * colorMap.length)
  );
  const isDone = status === "done";
  const isHighPriorityNine = !isDone && importance === 9;
  const cardBackground = isDone
    ? "#d6c9bd"
    : isHighPriorityNine
      ? "#a4c9cb"
      : colorMap[gradientIndex];
  const textColor = isDone ? "#6b5c51" : "#4a3f35";

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(TASK_DRAG_TYPE, id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative cursor-pointer rounded-xl transition-all hover:scale-[1.03]"
      onClick={onClick}
      style={{
        width: `${clampedSize}px`,
        height: `${cardHeight}px`,
        background: cardBackground,
        padding: `${padding}px`,
      }}
    >
      <div
        className="flex h-full flex-col justify-between"
        style={{ color: textColor }}
      >
        <div>
          <h3 
            className={cn(
              "line-clamp-3 font-semibold transition-colors",
              isDone && "line-through opacity-80"
            )}
            style={{ fontSize: `${titleFontSize}px` }}
          >
            {title}
          </h3>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1" style={{ fontSize: `${detailFontSize}px` }}>
            <Calendar
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                color: textColor,
              }}
            />
            <span>{format(new Date(deadline), "MMM d")}</span>
          </div>
          
          <div className="flex items-center gap-1" style={{ fontSize: `${detailFontSize}px` }}>
            <Star
              className="fill-current"
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                color: textColor,
              }}
            />
            <span>{importance}/10</span>
          </div>
        </div>
      </div>
      
      <Button
        size="icon"
        variant="destructive"
        className="absolute -right-2 -top-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ 
          width: `${Math.max(24, scaledSize / 8)}px`, 
          height: `${Math.max(24, scaledSize / 8)}px` 
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <Trash2 style={{ width: `${Math.max(12, scaledSize / 16)}px`, height: `${Math.max(12, scaledSize / 16)}px` }} />
      </Button>

      {isDone && (
        <div
          className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
          aria-label="Task completed"
        >
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  );
};
