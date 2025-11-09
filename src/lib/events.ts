export const TASK_STATUS_CHANGE_EVENT = "task-status-change";

export type TaskStatusChangeDetail = {
  id: string;
  status: "todo" | "done";
};

export const dispatchTaskStatusChange = (detail: TaskStatusChangeDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<TaskStatusChangeDetail>(TASK_STATUS_CHANGE_EVENT, {
      detail,
    })
  );
};
