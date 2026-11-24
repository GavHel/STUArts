import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublishedArtist } from "@/lib/catalog";
import { CommissionBuilder } from "./commission-builder";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Commission Request Builder | STUArts",
  description:
    "Create a personalized artwork commission request with a Calgary student artist.",
};

type CommissionPageProps = {
  searchParams: Promise<{ artist?: string | string[] }>;
};

export default function CommissionPage({ searchParams }: CommissionPageProps) {
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
            Share a little about what you have in mind. We&apos;ll make the
            details clear, so you can focus on making something meaningful
            together.
          </p>
        </section>
        <p className={styles.note}>
          An account is optional. <Link href="/account/sign-up">Create one</Link> or{" "}
          <Link href="/account/sign-in">sign in</Link> before submitting to track
          your request.
        </p>
        <Suspense fallback={<p className={styles.note} role="status">Loading commission builder...</p>}>
          <SelectedArtist searchParams={searchParams} />
        </Suspense>
      </div>
      <SiteFooter />
    </main>
  );
}

async function SelectedArtist({ searchParams }: CommissionPageProps) {
  const { artist: slug } = await searchParams;
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return (
      <section className={styles.formCard}>
        <h2>Choose an artist first</h2>
        <p className={styles.reviewLead}>Visit an artist&apos;s profile to start a request with them.</p>
        <Link className={styles.action} href="/">Browse artists →</Link>
      </section>
    );
  }

  const result = await getPublishedArtist(slug);
  if (result.status === "unavailable") {
    return <p className={styles.emptyResults} role="status">The artist catalog is temporarily unavailable. Please try again later.</p>;
  }
  if (!result.artist) {
    return (
      <section className={styles.formCard}>
        <h2>Artist not found</h2>
        <p className={styles.reviewLead}>This artist is not currently available for requests.</p>
        <Link className={styles.action} href="/">Browse artists →</Link>
      </section>
    );
  }

  return <CommissionBuilder artistSlug={result.artist.slug} artistName={result.artist.display_name} />;
}
