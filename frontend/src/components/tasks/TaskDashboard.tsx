"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTaskSocket } from "@/hooks/useTaskSocket";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/lib/api/tasks.api";
import type {
  CreateTaskPayload,
  Task,
  TaskListFilters,
  TaskPagination,
  TaskSocketEvent,
  UpdateTaskPayload,
} from "@/types/task.types";
import { TaskEditModal } from "./TaskEditModal";
import { TaskFilters } from "./TaskFilters";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import styles from "./TaskDashboard.module.css";

function canViewTask(task: Task, userId: string, isAdmin: boolean) {
  return isAdmin || task.ownerId === userId;
}

export function TaskDashboard() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<TaskPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<TaskListFilters>({
    page: 1,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await fetchTasks(filters);
      setTasks(result.tasks);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSocketEvent = useCallback(
    (event: TaskSocketEvent, payload: { task: Task }) => {
      if (!user) {
        return;
      }

      const { task } = payload;
      const visible = canViewTask(task, user.id, isAdmin ?? false);

      if (event === "task:created") {
        if (!visible) {
          return;
        }

        setTasks((current) => {
          if (current.some((item) => item.id === task.id)) {
            return current;
          }

          if (filters.page === 1) {
            return [task, ...current].slice(0, filters.limit ?? 10);
          }

          return current;
        });
        return;
      }

      if (event === "task:updated") {
        setTasks((current) => {
          const exists = current.some((item) => item.id === task.id);

          if (!visible) {
            return exists
              ? current.filter((item) => item.id !== task.id)
              : current;
          }

          if (exists) {
            return current.map((item) => (item.id === task.id ? task : item));
          }

          if (filters.page === 1) {
            return [task, ...current].slice(0, filters.limit ?? 10);
          }

          return current;
        });
        return;
      }

      if (event === "task:deleted") {
        setTasks((current) => current.filter((item) => item.id !== task.id));
      }
    },
    [filters.limit, filters.page, isAdmin, user],
  );

  useTaskSocket({
    enabled: Boolean(user),
    onEvent: handleSocketEvent,
  });

  // ✅ early return now happens AFTER every hook has been called
  if (!user) {
    return null;
  }

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    setCreating(true);
    setError("");

    try {
      await createTask(payload);
      await loadTasks();
    } catch (createError) {
      const message = getApiErrorMessage(createError);
      setError(message);
      throw new Error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTask = async (taskId: string, payload: UpdateTaskPayload) => {
    setIsUpdating(true);
    setError("");

    try {
      await updateTask(taskId, payload);
      await loadTasks();
    } catch (updateError) {
      const message = getApiErrorMessage(updateError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingTaskId(task.id);
    setError("");

    try {
      await deleteTask(task.id);
      await loadTasks();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.grid}>
        <TaskForm onSubmit={handleCreateTask} isSubmitting={creating} />

        <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Your Tasks</h2>
              <p>
                {isAdmin
                  ? "Admin view: all tasks with owner filtering."
                  : "Manage your personal task list."}
              </p>
            </div>
            <span className={styles.liveBadge}>Live updates enabled</span>
          </div>

          <TaskFilters
            filters={filters}
            isAdmin={Boolean(isAdmin)}
            onChange={setFilters}
          />

          {error ? <p className={styles.error}>{error}</p> : null}

          {isLoading ? (
            <div className={styles.loading}>Loading tasks...</div>
          ) : (
            <TaskList
              tasks={tasks}
              isAdmin={Boolean(isAdmin)}
              currentUserId={user.id}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              deletingTaskId={deletingTaskId}
            />
          )}

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  page: Math.max(1, (current.page ?? 1) - 1),
                }))
              }
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
              tasks)
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  page: (current.page ?? 1) + 1,
                }))
              }
            >
              Next
            </button>
          </div>
        </section>
      </div>

      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        isSubmitting={isUpdating}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
      />
    </div>
  );
}