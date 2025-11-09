import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskBlock } from "./TaskBlock";
import { TaskSidebar } from "./TaskSidebar";
import { EditTaskDialog } from "./EditTaskDialog";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  TASK_STATUS_CHANGE_EVENT,
  type TaskStatusChangeDetail,
} from "@/lib/events";

type Task = Tables<"tasks">;
type NewTaskInput = Pick<TablesInsert<"tasks">, "title" | "deadline" | "importance" | "status">;

export const TaskMap = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conflictDialog, setConflictDialog] = useState<{
    newTask: NewTaskInput;
    conflicts: Task[];
  } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStatusChange = (event: Event) => {
      const { id, status } = (event as CustomEvent<TaskStatusChangeDetail>).detail;
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, status } : task))
      );
    };

    window.addEventListener(
      TASK_STATUS_CHANGE_EVENT,
      handleStatusChange as EventListener
    );

    return () => {
      window.removeEventListener(
        TASK_STATUS_CHANGE_EVENT,
        handleStatusChange as EventListener
      );
    };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tasks");
      console.error(error);
      return;
    }

    setTasks(data || []);
  };

  const calculateSize = (deadline: string, importance: number): number => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysToDeadline = Math.max(
      1,
      Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    // Enhanced formula: base importance multiplied by urgency factor
    const urgencyFactor = Math.min(10, 30 / daysToDeadline);
    return (importance / 10) * urgencyFactor;
  };

  const handleAddTask = async (task: NewTaskInput) => {
    const normalizedTask: NewTaskInput = {
      ...task,
      status: task.status ?? "todo",
    };

    // Check if there's already a task with the same importance
    const conflictingTasks = tasks.filter((t) => t.importance === normalizedTask.importance);
    
    if (conflictingTasks.length > 0) {
      setConflictDialog({ newTask: normalizedTask, conflicts: conflictingTasks });
      return;
    }

    await insertTask(normalizedTask);
  };
  const insertTask = async (task: NewTaskInput) => {
    const now = new Date().toISOString();
    const optimisticId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optimisticTask: Task = {
      id: optimisticId,
      title: task.title,
      deadline: task.deadline,
      importance: task.importance,
      status: task.status ?? "todo",
      created_at: now,
      updated_at: now,
    };

    // Show the sticker immediately while we wait for Supabase to confirm creation.
    setTasks((prev) => [optimisticTask, ...prev]);

    const payload: TablesInsert<"tasks"> = {
      title: task.title,
      deadline: task.deadline,
      importance: task.importance,
      status: task.status ?? "todo",
    };

    const { error } = await supabase.from("tasks").insert(payload);

    if (error) {
      // Revert the optimistic update if something went wrong.
      setTasks((prev) => prev.filter((task) => task.id !== optimisticId));
      toast.error("Failed to add task");
      console.error(error);
      return;
    }

    await fetchTasks(); // ← подтянуть свежий список задач
    toast.success("Task added");
  };

  const handleResolveConflict = async (makePriority: boolean) => {
    if (!conflictDialog) return;

    const dialogData = conflictDialog;
    setConflictDialog(null); // close dialog immediately

    const { newTask, conflicts } = dialogData;
    
    if (makePriority) {
      // Новая задача важнее - сдвигаем все конфликтующие задачи вниз (уменьшаем приоритет)
      for (const conflict of conflicts) {
        await supabase
          .from("tasks")
          .update({ importance: Math.max(1, conflict.importance - 1) })
          .eq("id", conflict.id);
      }
      // Добавляем новую задачу с исходным приоритетом
      await insertTask(newTask);
    } else {
      // Новая задача менее важная - понижаем её приоритет
      const adjustedTask = {
        ...newTask,
        importance: Math.max(1, newTask.importance - 1),
      };
      await insertTask(adjustedTask);
    }
    
  };

  const handleDeleteTask = async (id: string) => {
    const taskIndex = tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) return;

    const taskToRestore = tasks[taskIndex];
    setTasks((prev) => prev.filter((task) => task.id !== id));

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      setTasks((prev) => {
        const next = [...prev];
        next.splice(taskIndex, 0, taskToRestore);
        return next;
      });
      toast.error("Failed to delete task");
      console.error(error);
    } else {
      toast.success("Task deleted");
    }
  };

  const handleUpdateTask = async (
    id: string,
    updates: Pick<Task, "title" | "deadline" | "importance">
  ) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    // If importance changed, check for conflicts
    if (currentTask.importance !== updates.importance) {
      const conflictingTasks = tasks.filter(
        (t) => t.id !== id && t.importance === updates.importance
      );
      
      if (conflictingTasks.length > 0) {
        // Shift all tasks with importance >= new importance up by 1
        const tasksToUpdate = tasks
          .filter((t) => t.id !== id && t.importance >= updates.importance)
          .map((t) => ({
            id: t.id,
            importance: Math.min(10, t.importance + 1)
          }));
        
        for (const task of tasksToUpdate) {
          await supabase
            .from("tasks")
            .update({ importance: task.importance })
            .eq("id", task.id);
        }
      }
    }

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update task");
      console.error(error);
    } else {
      toast.success("Task updated");
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full gap-6 p-6">
        <TaskSidebar onAdd={handleAddTask} />
        
        <main className="flex-1 bg-background">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold text-foreground">Task Map</h1>
              <p className="text-muted-foreground">
                Visualize your tasks by priority and deadline
              </p>
            </div>

            <div className="flex flex-wrap gap-6 rounded-2xl border-2 border-border bg-muted/20 p-8">
              {tasks.length === 0 ? (
                <div className="flex w-full items-center justify-center py-20">
                  <p className="text-lg text-muted-foreground">
                    No tasks yet. Add your first task using the sidebar!
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskBlock
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    deadline={task.deadline}
                  importance={task.importance}
                  status={task.status}
                  size={calculateSize(task.deadline, task.importance)}
                  onClick={() => setEditingTask(task)}
                  onDelete={handleDeleteTask}
                />
                ))
              )}
            </div>
          </div>
        </main>
      </div>


      <Dialog open={!!conflictDialog} onOpenChange={() => setConflictDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Priority Conflict Detected</DialogTitle>
            <DialogDescription>
              Your new task has the same priority as existing tasks. Which one is more important?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="font-semibold mb-1">New task:</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{conflictDialog?.newTask.title}</p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="font-semibold mb-1">Conflicts with:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {conflictDialog?.conflicts.map((task) => (
                  <p key={task.id} className="text-sm text-muted-foreground line-clamp-1">
                    • {task.title}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleResolveConflict(true)}
                className="flex-1"
              >
                <ArrowUp className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">More important</span>
              </Button>
              <Button
                onClick={() => handleResolveConflict(false)}
                variant="outline"
                className="flex-1"
              >
                <ArrowDown className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Less important</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditTaskDialog
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdate={handleUpdateTask}
      />
    </SidebarProvider>
  );
};
