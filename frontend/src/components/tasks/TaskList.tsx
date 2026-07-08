"use client";

import Link from "next/link";
import type { Task } from "@/types/task.types";
import { TASK_STATUS_LABELS } from "@/types/task.types";
import styles from "./TaskList.module.css";

interface TaskListProps {
  tasks: Task[];
  isAdmin: boolean;
  currentUserId: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  deletingTaskId?: string | null;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TaskList({
  tasks,
  isAdmin,
  currentUserId,
  onEdit,
  onDelete,
  deletingTaskId,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No tasks found for the current filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {tasks.map((task) => (
        <article key={task.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <Link href={`/tasks/${task.id}`} className={styles.titleLink}>
                <h3>{task.title}</h3>
              </Link>
              <p className={styles.description}>
                {task.description || "No description provided."}
              </p>
            </div>
            <span className={`${styles.status} ${styles[task.status]}`}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
          </div>

          <div className={styles.meta}>
            <span>Due: {formatDate(task.dueDate)}</span>
            {isAdmin ? (
              <span>
                Owner: {task.owner.name} ({task.owner.email})
              </span>
            ) : null}
          </div>

          <div className={styles.actions}>
            {isAdmin || task.ownerId === currentUserId ? (
              <>
                <button type="button" onClick={() => onEdit(task)}>
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => onDelete(task)}
                  disabled={deletingTaskId === task.id}
                >
                  {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
