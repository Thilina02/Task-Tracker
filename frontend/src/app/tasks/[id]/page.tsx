"use client";



import Link from "next/link";

import { useCallback, useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import { TaskEditModal } from "@/components/tasks/TaskEditModal";

import { getApiErrorMessage } from "@/lib/api/client";

import { deleteTask, fetchTaskById, updateTask } from "@/lib/api/tasks.api";

import type { Task, UpdateTaskPayload } from "@/types/task.types";

import { TASK_STATUS_LABELS } from "@/types/task.types";

import dashboardStyles from "@/app/page.module.css";

import styles from "./page.module.css";



function formatDate(value: string | null) {

  if (!value) {

    return "No due date";

  }



  return new Intl.DateTimeFormat(undefined, {

    dateStyle: "full",

    timeStyle: "short",

  }).format(new Date(value));

}



function canManageTask(task: Task, userId: string, isAdmin: boolean) {

  return isAdmin || task.ownerId === userId;

}



export default function TaskDetailPage() {

  const params = useParams<{ id: string }>();

  const router = useRouter();

  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [task, setTask] = useState<Task | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);



  const isAdmin = user?.role === "ADMIN";



  const loadTask = useCallback(async () => {

    setIsLoading(true);

    setError("");



    try {

      const result = await fetchTaskById(params.id);

      setTask(result);

    } catch (loadError) {

      setError(getApiErrorMessage(loadError));

    } finally {

      setIsLoading(false);

    }

  }, [params.id]);



  useEffect(() => {

    if (authLoading) {

      return;

    }



    if (!isAuthenticated) {

      router.replace("/login");

      return;

    }



    loadTask();

  }, [authLoading, isAuthenticated, loadTask, router]);



  const handleUpdateTask = async (taskId: string, payload: UpdateTaskPayload) => {

    setIsUpdating(true);

    setError("");



    try {

      const updated = await updateTask(taskId, payload);

      setTask(updated);

    } catch (updateError) {

      const message = getApiErrorMessage(updateError);

      setError(message);

      throw new Error(message);

    } finally {

      setIsUpdating(false);

    }

  };



  const handleDeleteTask = async () => {

    if (!task) {

      return;

    }



    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {

      return;

    }



    setIsDeleting(true);

    setError("");



    try {

      await deleteTask(task.id);

      router.push("/");

    } catch (deleteError) {

      setError(getApiErrorMessage(deleteError));

    } finally {

      setIsDeleting(false);

    }

  };



  if (authLoading || isLoading) {

    return (

      <div className={dashboardStyles.loadingScreen}>

        <div className={dashboardStyles.loader} />

        <p>Loading task details...</p>

      </div>

    );

  }



  if (error && !task) {

    return (

      <div className={dashboardStyles.dashboardShell}>

        <div className={styles.detailCard}>

          <p className={styles.errorText}>{error}</p>

          <Link href="/" className={styles.backLink}>

            Back to dashboard

          </Link>

        </div>

      </div>

    );

  }



  if (!task || !user) {

    return null;

  }



  const canManage = canManageTask(task, user.id, isAdmin);



  return (

    <div className={dashboardStyles.dashboardShell}>

      <div className={styles.detailCard}>

        <Link href="/" className={styles.backLink}>

          ← Back to dashboard

        </Link>



        <div className={styles.detailHeader}>

          <div>

            <p className={dashboardStyles.eyebrow}>Task Details</p>

            <h1>{task.title}</h1>

          </div>

          <span className={`${styles.statusBadge} ${styles[task.status]}`}>

            {TASK_STATUS_LABELS[task.status]}

          </span>

        </div>



        <p className={styles.detailDescription}>

          {task.description || "No description provided."}

        </p>



        <dl className={styles.detailMeta}>

          <div>

            <dt>Due date</dt>

            <dd>{formatDate(task.dueDate)}</dd>

          </div>

          <div>

            <dt>Owner</dt>

            <dd>

              {task.owner.name} ({task.owner.email})

            </dd>

          </div>

          <div>

            <dt>Created</dt>

            <dd>{formatDate(task.createdAt)}</dd>

          </div>

          <div>

            <dt>Last updated</dt>

            <dd>{formatDate(task.updatedAt)}</dd>

          </div>

        </dl>



        {error ? <p className={styles.errorText}>{error}</p> : null}



        {canManage ? (

          <div className={styles.actions}>

            <button type="button" onClick={() => setIsEditing(true)}>

              Edit Task

            </button>

            <button

              type="button"

              className={styles.deleteButton}

              onClick={handleDeleteTask}

              disabled={isDeleting}

            >

              {isDeleting ? "Deleting..." : "Delete Task"}

            </button>

          </div>

        ) : (

          <p className={styles.accessNote}>

            You can view this task but do not have permission to modify it.

          </p>

        )}

      </div>



      <TaskEditModal

        task={task}

        isOpen={isEditing}

        isSubmitting={isUpdating}

        onClose={() => setIsEditing(false)}

        onSubmit={handleUpdateTask}

      />

    </div>

  );

}


