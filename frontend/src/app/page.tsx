"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import styles from "./page.module.css";

export default function HomePage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader} />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.landing}>
        <div className={styles.landingGlow} aria-hidden="true" />
        <div className={styles.landingContent}>
          <p className={styles.eyebrow}>Task Tracker</p>
          <h1>Your tasks, elevated.</h1>
          <p className={styles.subtitle}>
            Plan, track, and complete work with role-based access and real-time
            updates across your team.
          </p>
          <div className={styles.actions}>
            <Link href="/login" className={styles.primaryAction}>
              Sign in
            </Link>
            <Link href="/register" className={styles.secondaryAction}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardShell}>
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.eyebrow}>Task Tracker</p>
          <h1>Welcome back, {user?.name}</h1>
          <p className={styles.subtitle}>
            Signed in as {user?.email} ({user?.role})
          </p>
        </div>
        <button type="button" className={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </header>

      <TaskDashboard />
    </div>
  );
}
