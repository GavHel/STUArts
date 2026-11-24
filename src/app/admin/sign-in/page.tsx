import Link from "next/link";
import type { Metadata } from "next";
import { AdminSignInForm } from "./sign-in-form";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Admin Sign In | STUArts",
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>STUArts</Link>
        <span>ADMIN ACCESS</span>
      </header>
      <section className={styles.signInCard}>
        <p className={styles.eyebrow}>TEAM WORKSPACE</p>
        <h1>Sign in</h1>
        <p>Use your administrator account to manage artist profiles, artwork, and commission requests.</p>
        <AdminSignInForm />
      </section>
    </main>
  );
}
