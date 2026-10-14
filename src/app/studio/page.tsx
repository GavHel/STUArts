import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { SimulatorControls } from "./simulator-controls";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Visual Spatial Simulator | StartUArts",
  description: "Preview how original art could look and feel in your space.",
};

export default function StudioPage() {
  return (
    <main className={styles.page}>
      <SiteHeader active="studio" />
      <div className={styles.content}>
        <section className={styles.studioIntro}>
          <div>
            <div className={styles.crumb}>
              <Link href="/discover">Discover</Link>
              <span>/</span>
              <span>Visual studio</span>
            </div>
            <p className={styles.eyebrow}>SEE IT IN YOUR SPACE</p>
            <h1 className={styles.title}>
              Visual spatial <em>simulator</em>
            </h1>
            <p className={styles.lead}>
              Try a piece on your wall, explore a few finishes, and find the
              scale that feels right for your space.
            </p>
          </div>
          <span className={styles.studioStatus}>
            <span aria-hidden="true">●</span> PREVIEW MODE
          </span>
        </section>

        <SimulatorControls />
      </div>
      <SiteFooter />
    </main>
  );
}
