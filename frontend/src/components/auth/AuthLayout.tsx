"use client";

import Link from "next/link";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className={styles.scene}>
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orbOne}`} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orbTwo}`} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orbThree}`} aria-hidden="true" />

      <div className={styles.wrapper}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <span />
            <span />
            <span />
          </div>
          <p className={styles.brandName}>Task Tracker</p>
          <p className={styles.brandTagline}>
            Organize work. Track progress. Ship faster.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGlow} aria-hidden="true" />
          <header className={styles.header}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>

          {children}

          <footer className={styles.footer}>
            <span>{footerText}</span>
            <Link href={footerLinkHref}>{footerLinkText}</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
