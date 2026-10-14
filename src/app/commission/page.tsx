import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CommissionBuilder } from "./commission-builder";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Commission Request Builder | StartUArts",
  description:
    "Create a personalized artwork commission request with a Calgary student artist.",
};

export default function CommissionPage() {
  return (
    <main className={styles.page}>
      <SiteHeader active="commission" />
      <div className={styles.content}>
        <section className={styles.commissionIntro}>
          <div className={styles.crumb}>
            <Link href="/">Artists</Link>
            <span>/</span>
            <span>Commission request</span>
          </div>
          <p className={styles.eyebrow}>MADE FOR YOU, MADE TO LAST</p>
          <h1 className={styles.title}>
            Commission <em>Request Builder</em>
          </h1>
          <p className={styles.lead}>
            Tell Maya a little about what you have in mind. We&apos;ll make the
            details clear, so you can focus on making something meaningful
            together.
          </p>
        </section>
        <CommissionBuilder />
      </div>
      <SiteFooter />
    </main>
  );
}
