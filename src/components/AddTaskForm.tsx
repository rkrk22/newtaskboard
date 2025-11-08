import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TablesInsert } from "@/integrations/supabase/types";

type NewTaskInput = Pick<TablesInsert<"tasks">, "title" | "deadline" | "importance" | "status">;

interface AddTaskFormProps {
  onAdd: (task: NewTaskInput) => void;
}
export const AddTaskForm = ({
  onAdd
}: AddTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [importance, setImportance] = useState(5);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    onAdd({
      title,
      deadline: format(date, "yyyy-MM-dd"),
      importance,
      status: "todo"
    });
    setTitle("");
    setDate(new Date());
    setImportance(5);
    toast.success("Task added successfully!");
  };
  return <Card className="mb-8 border-2 border-border bg-card p-6 shadow-none">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input id="title" placeholder="Enter task name..." value={title} onChange={e => setTitle(e.target.value)} className="border-2 bg-transparent" autoComplete="off" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-2 bg-transparent",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="importance">
              Importance: {importance}/10
            </Label>
            <input
              id="importance"
              type="range"
              min="1"
              max="10"
              value={importance}
              onChange={e => setImportance(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </form>
    </Card>;
};
