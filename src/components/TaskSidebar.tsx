import { Plus } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarTrigger } from "@/components/ui/sidebar";
import { AddTaskForm } from "./AddTaskForm";
import type { TablesInsert } from "@/integrations/supabase/types";

type NewTaskInput = Pick<TablesInsert<"tasks">, "title" | "deadline" | "importance" | "status">;

interface TaskSidebarProps {
  onAdd: (task: NewTaskInput) => void;
}
export function TaskSidebar({
  onAdd
}: TaskSidebarProps) {
  return <Sidebar className="w-80 border-border !bg-transparent" collapsible="none">
      
      
      <SidebarContent>
        <SidebarGroup className="mx-0 px-[22px]">
          <SidebarGroupLabel>New Task</SidebarGroupLabel>
          <SidebarGroupContent>
            <AddTaskForm onAdd={onAdd} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}
