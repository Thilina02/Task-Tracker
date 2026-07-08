export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskOwner {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: TaskOwner;
}

export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: TaskPagination;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface TaskListFilters {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  ownerId?: string;
}

export type TaskSocketEvent = "task:created" | "task:updated" | "task:deleted";

export interface TaskSocketPayload {
  task: Task;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};
