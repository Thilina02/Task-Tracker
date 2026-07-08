"use client";

import type { TaskListFilters, TaskStatus } from "@/types/task.types";
import styles from "./TaskFilters.module.css";

interface TaskFiltersProps {
  filters: TaskListFilters;
  isAdmin: boolean;
  onChange: (filters: TaskListFilters) => void;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export function TaskFilters({ filters, isAdmin, onChange }: TaskFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.field}>
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              page: 1,
              status: (event.target.value as TaskStatus) || undefined,
            })
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isAdmin ? (
        <div className={styles.field}>
          <label htmlFor="owner-filter">Owner ID</label>
          <input
            id="owner-filter"
            value={filters.ownerId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                page: 1,
                ownerId: event.target.value || undefined,
              })
            }
            placeholder="Filter by owner user ID"
          />
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="limit-filter">Page size</label>
        <select
          id="limit-filter"
          value={filters.limit ?? 10}
          onChange={(event) =>
            onChange({
              ...filters,
              page: 1,
              limit: Number(event.target.value),
            })
          }
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
