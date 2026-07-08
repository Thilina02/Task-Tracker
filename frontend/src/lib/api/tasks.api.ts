import { apiRequest } from './client';
import type {
  CreateTaskPayload,
  Task,
  TaskListFilters,
  TaskListResponse,
  UpdateTaskPayload,
} from '@/types/task.types';

export async function fetchTasks(
  filters: TaskListFilters = {},
): Promise<TaskListResponse> {
  return apiRequest<TaskListResponse>({
    url: '/api/tasks',
    method: 'GET',
    params: filters as Record<string, unknown>,
  });
}

export async function fetchTaskById(id: string): Promise<Task> {
  const result = await apiRequest<{ task: Task }>({
    url: `/api/tasks/${id}`,
    method: 'GET',
  });

  return result.task;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const result = await apiRequest<{ task: Task }>({
    url: '/api/tasks',
    method: 'POST',
    payload,
  });

  return result.task;
}

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const result = await apiRequest<{ task: Task }>({
    url: `/api/tasks/${id}`,
    method: 'PATCH',
    payload,
  });

  return result.task;
}

export async function deleteTask(id: string): Promise<Task> {
  const result = await apiRequest<{ task: Task }>({
    url: `/api/tasks/${id}`,
    method: 'DELETE',
  });

  return result.task;
}
