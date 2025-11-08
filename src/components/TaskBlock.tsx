import { DragEvent } from "react";
import { motion } from "framer-motion";
import { Trash2, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TASK_DRAG_TYPE } from "@/lib/dragTypes";

interface TaskBlockProps {
  id: string;
  title: string;
  deadline: string;
  importance: number;
  size: number;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const TaskBlock = ({
  id,
  title,
  deadline,
  importance,
  size,
  onClick,
  onDelete,
}: TaskBlockProps) => {
  const baseSize = 60;
  const scaledSize = baseSize + (size * 15);
  
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

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(TASK_DRAG_TYPE, id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0 } }}
      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative cursor-pointer rounded-xl transition-all"
      onClick={onClick}
      style={{
        width: `${Math.min(scaledSize, 200)}px`,
        height: `${Math.min(scaledSize, 200)}px`,
        background: colorMap[gradientIndex],
        padding: `${padding}px`,
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex h-full flex-col justify-between text-foreground">
        <div>
          <h3 
            className="line-clamp-3 font-semibold"
            style={{ fontSize: `${titleFontSize}px` }}
          >
            {title}
          </h3>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1" style={{ fontSize: `${detailFontSize}px` }}>
            <Calendar style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
            <span>{format(new Date(deadline), "MMM d")}</span>
          </div>
          
          <div className="flex items-center gap-1" style={{ fontSize: `${detailFontSize}px` }}>
            <Star style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="fill-current" />
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
    </motion.div>
  );
};
