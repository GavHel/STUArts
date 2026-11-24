import Link from "next/link";
import type { Metadata } from "next";
import { AdminDashboard } from "./dashboard";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin Dashboard | STUArts",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>STUArts</Link>
        <span>ADMIN WORKSPACE</span>
      </header>
      <AdminDashboard />
    </main>
  );
}
