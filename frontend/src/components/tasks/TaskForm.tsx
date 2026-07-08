"use client";

import { FormEvent, useState } from "react";
import type { CreateTaskPayload, TaskStatus } from "@/types/task.types";
import styles from "./TaskForm.module.css";

interface TaskFormProps {
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  isSubmitting?: boolean;
}

const STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function TaskForm({ onSubmit, isSubmitting = false }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      setTitle("");
      setDescription("");
      setStatus("TODO");
      setDueDate("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create task",
      );
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Create Task</h2>
      <div className={styles.field}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          disabled={isSubmitting}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add details..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            disabled={isSubmitting}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Task"}
      </button>
    </form>
  );
}
