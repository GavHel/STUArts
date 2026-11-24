import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublishedCatalog } from "@/lib/catalog";
import { WallPreview } from "./wall-preview";
import { SimulatorControls } from "./simulator-controls";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Visual Spatial Simulator | STUArts",
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

        <Suspense fallback={<p className={styles.note} role="status">Loading published artwork...</p>}>
          <PublishedWallPreview />
        </Suspense>
        <SimulatorControls />
      </div>
      <SiteFooter />
    </main>
  );
}

async function PublishedWallPreview() {
  await connection();
  const catalog = await getPublishedCatalog();
  if (catalog.status === "unavailable") {
    return <p className={styles.note} role="status">The artwork catalog is unavailable. Try again later.</p>;
  }
  const artists = new Map(catalog.artists.map((artist) => [artist.id, artist.display_name]));
  const artworks = catalog.artworks.flatMap((artwork) => {
    const artist = artists.get(artwork.artist_id);
    return artist ? [{ id: artwork.id, title: artwork.title, artist, image: artwork.image_url }] : [];
  });
  return <WallPreview artworks={artworks} />;
}
