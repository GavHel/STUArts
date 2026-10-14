import Image from "next/image";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Visual Spatial Simulator | StartUArts",
  description: "Preview how original art could look and feel in your space.",
};

const colorways = [
  { name: "Warm white", color: "#f4eee5" },
  { name: "Terracotta", color: "#a7543e" },
  { name: "Sage", color: "#89937b" },
  { name: "Ink", color: "#343d42" },
];

export default function StudioPage() {
  return (
    <main className={styles.page}>
      <SiteHeader active="studio" />
      <div className={styles.content}>
        <section className={styles.studioIntro}>
          <div>
            <div className={styles.crumb}>
              <a href="/discover">Discover</a>
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

        <div className={styles.simulator}>
          <section className={styles.simStage} aria-label="Artwork room preview">
            <div className={styles.simStageTop}>
              <span>ROOM PREVIEW</span>
              <span>DRAG TO REPOSITION · SCROLL TO RESIZE</span>
            </div>
            <div className={styles.room}>
              <div
                className={styles.simArtwork}
                role="img"
                aria-label="Abstract landscape painting displayed on a living room wall"
              >
                <Image
                  src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=85"
                  alt=""
                  fill
                  sizes="(max-width: 650px) 58vw, 315px"
                />
              </div>
            </div>
          </section>

          <aside className={styles.simPanel}>
            <p className={styles.eyebrow}>YOUR CANVAS</p>
            <h2>The space between</h2>
            <p>Original mixed media · Maya Linnea Chen</p>

            <div className={styles.simControl}>
              <span className={styles.controlLabel}>
                <span>Artwork size</span>
                <span>18 × 24 in</span>
              </span>
              <input
                className={styles.range}
                type="range"
                min="1"
                max="5"
                defaultValue="3"
                aria-label="Adjust artwork size"
              />
              <span className={styles.summaryLine}>
                <span>Wall coverage</span>
                <strong>32% width</strong>
              </span>
            </div>

            <div className={styles.simControl}>
              <span className={styles.controlLabel}>Frame finish</span>
              <div className={styles.swatches} role="group" aria-label="Frame finish">
                {colorways.map((colorway, index) => (
                  <button
                    className={`${styles.swatch} ${index === 0 ? styles.swatchActive : ""}`}
                    key={colorway.name}
                    type="button"
                    style={{ backgroundColor: colorway.color }}
                    aria-label={colorway.name}
                    aria-pressed={index === 0}
                  />
                ))}
              </div>
            </div>

            <div className={styles.simControl}>
              <span className={styles.controlLabel}>Wall color</span>
              <div className={styles.swatches} role="group" aria-label="Wall color">
                {["#e7d9ca", "#f0e8dc", "#c9d0c3", "#b9c6cb"].map(
                  (color, index) => (
                    <button
                      className={`${styles.swatch} ${index === 0 ? styles.swatchActive : ""}`}
                      key={color}
                      type="button"
                      style={{ backgroundColor: color }}
                      aria-label={`Wall color ${index + 1}`}
                      aria-pressed={index === 0}
                    />
                  ),
                )}
              </div>
            </div>

            <div className={styles.simControl}>
              <span className={styles.controlLabel}>
                <span>Hanging height</span>
                <span>Eye level</span>
              </span>
              <input
                className={styles.range}
                type="range"
                min="1"
                max="5"
                defaultValue="3"
                aria-label="Adjust hanging height"
              />
            </div>

            <button className={styles.action} type="button">
              Ask about this artwork <span aria-hidden="true">↗</span>
            </button>
            <p className={styles.note}>
              Preview is an approximation. Actual colors and scale may vary
              slightly in your space.
            </p>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
