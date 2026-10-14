"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "../experience.module.css";

const frameFinishes = [
  { name: "Warm white", color: "#f4eee5" },
  { name: "Terracotta", color: "#a7543e" },
  { name: "Sage", color: "#89937b" },
  { name: "Ink", color: "#343d42" },
];

const wallColors = [
  { name: "Sand", color: "#e7d9ca" },
  { name: "Linen", color: "#f0e8dc" },
  { name: "Sage", color: "#c9d0c3" },
  { name: "Mist", color: "#b9c6cb" },
];

const scaleFactors = [0.72, 0.86, 1, 1.14, 1.28];

export function SimulatorControls() {
  const [size, setSize] = useState(3);
  const [height, setHeight] = useState(3);
  const [frame, setFrame] = useState(0);
  const [wall, setWall] = useState(0);
  const factor = scaleFactors[size - 1];

  return (
    <div className={styles.simulator}>
      <section className={styles.simStage} aria-label="Artwork room preview">
        <div className={styles.simStageTop}>
          <span>ROOM PREVIEW</span>
          <span>ADJUST SIZE, HEIGHT &amp; FINISH</span>
        </div>
        <div className={styles.room} style={{ "--wall-color": wallColors[wall].color } as CSSProperties}>
          <div
            className={styles.simArtwork}
            role="img"
            aria-label={`Abstract painting preview with ${frameFinishes[frame].name.toLowerCase()} frame`}
            style={{
              backgroundColor: frameFinishes[frame].color,
              marginTop: `${(height - 3) * 22}px`,
              transform: `scale(${factor})`,
            }}
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
          <label className={styles.controlLabel} htmlFor="artwork-size">
            <span>Artwork size</span>
            <span>{Math.round(18 * factor)} × {Math.round(24 * factor)} in</span>
          </label>
          <input
            className={styles.range}
            id="artwork-size"
            max="5"
            min="1"
            onChange={(event) => setSize(Number(event.target.value))}
            type="range"
            value={size}
          />
          <span className={styles.summaryLine}>
            <span>Wall coverage</span>
            <strong>{Math.round(32 * factor)}% width</strong>
          </span>
        </div>

        <div className={styles.simControl}>
          <span className={styles.controlLabel}>Frame finish</span>
          <div className={styles.swatches} role="group" aria-label="Frame finish">
            {frameFinishes.map((finish, index) => (
              <button
                aria-label={finish.name}
                aria-pressed={frame === index}
                className={`${styles.swatch} ${frame === index ? styles.swatchActive : ""}`}
                key={finish.name}
                onClick={() => setFrame(index)}
                style={{ backgroundColor: finish.color }}
                type="button"
              />
            ))}
          </div>
          <p className={styles.selectedOption}>{frameFinishes[frame].name}</p>
        </div>

        <div className={styles.simControl}>
          <span className={styles.controlLabel}>Wall color</span>
          <div className={styles.swatches} role="group" aria-label="Wall color">
            {wallColors.map((color, index) => (
              <button
                aria-label={color.name}
                aria-pressed={wall === index}
                className={`${styles.swatch} ${wall === index ? styles.swatchActive : ""}`}
                key={color.name}
                onClick={() => setWall(index)}
                style={{ backgroundColor: color.color }}
                type="button"
              />
            ))}
          </div>
          <p className={styles.selectedOption}>{wallColors[wall].name}</p>
        </div>

        <div className={styles.simControl}>
          <label className={styles.controlLabel} htmlFor="hanging-height">
            <span>Hanging height</span>
            <span>{["Low", "Relaxed", "Eye level", "High", "Gallery"][height - 1]}</span>
          </label>
          <input
            className={styles.range}
            id="hanging-height"
            max="5"
            min="1"
            onChange={(event) => setHeight(Number(event.target.value))}
            type="range"
            value={height}
          />
        </div>

        <Link className={styles.action} href="/commission">
          Ask about this artwork <span aria-hidden="true">↗</span>
        </Link>
        <p className={styles.note}>
          Preview is an approximation. Actual colors and scale may vary slightly
          in your space.
        </p>
      </aside>
    </div>
  );
}
