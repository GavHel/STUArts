"use client";

import { createElement, useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "../experience.module.css";

type Artwork = { id: string; title: string; artist: string; image: string };
type Preview = { glb: string; usdz: string; title: string };

const subscribe = () => () => {};
const isAppleMobile = () => /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const serverAppleMobile = () => false;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The artwork image could not be loaded. Its image host may not allow AR previews."));
    image.src = url;
  });
}

export function WallPreview({ artworks }: { artworks: Artwork[] }) {
  const [selectedId, setSelectedId] = useState(artworks[0]?.id ?? "");
  const [width, setWidth] = useState(24);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const viewerRef = useRef<HTMLElement | null>(null);
  const generation = useRef(0);
  const appleMobile = useSyncExternalStore(subscribe, isAppleMobile, serverAppleMobile);
  const selected = artworks.find((artwork) => artwork.id === selectedId);

  useEffect(() => () => { generation.current += 1; }, []);

  useEffect(() => {
    if (!preview) return;
    return () => {
      URL.revokeObjectURL(preview.glb);
      URL.revokeObjectURL(preview.usdz);
    };
  }, [preview]);

  useEffect(() => {
    if (!preview || !viewerRef.current) return;
    const viewer = viewerRef.current;
    const onError = () => setError("The 3D preview could not be loaded. Please try preparing it again.");
    const onArStatus = (event: Event) => {
      if ((event as CustomEvent<{ status: string }>).detail.status === "failed") {
        setError("Unable to start wall AR. Check camera permissions and device support, then try again.");
      }
    };
    viewer.addEventListener("error", onError);
    viewer.addEventListener("ar-status", onArStatus);
    return () => {
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("ar-status", onArStatus);
    };
  }, [preview]);

  async function preparePreview() {
    if (!selected || preparing) return;
    setError("");
    setPreview(null);
    setPreparing(true);
    const currentGeneration = generation.current;
    try {
      const [image, { GLTFExporter }, { createWallArtwork, exportWallUsdz }] = await Promise.all([
        loadImage(selected.image),
        import("three/examples/jsm/exporters/GLTFExporter.js"),
        import("@/lib/wall-artwork-model"),
        import("@google/model-viewer"),
      ]);
      const model = createWallArtwork(image, width);
      try {
        const [glb, usdz] = await Promise.all([
          new GLTFExporter().parseAsync(model.scene, { binary: true }),
          exportWallUsdz(model.scene),
        ]);
        if (!(glb instanceof ArrayBuffer)) throw new Error("The 3D model could not be generated.");
        if (generation.current !== currentGeneration) return;
        setPreview({
          glb: URL.createObjectURL(new Blob([glb], { type: "model/gltf-binary" })),
          usdz: URL.createObjectURL(new Blob([usdz], { type: "model/vnd.usdz+zip" })),
          title: selected.title,
        });
      } finally {
        model.dispose();
      }
    } catch (cause) {
      console.error("Unable to prepare artwork AR preview.", cause);
      setError(cause instanceof Error ? cause.message : "Unable to prepare the AR preview. Please try again.");
    } finally {
      setPreparing(false);
    }
  }

  if (!artworks.length) {
    return <p className={styles.note}>Published artwork will appear here for wall previews.</p>;
  }

  return (
    <section className={styles.wallPreview} aria-labelledby="wall-preview-title">
      <div>
        <p className={styles.eyebrow}>CAMERA PREVIEW</p>
        <h2 id="wall-preview-title">View published art on your wall</h2>
        <p>Choose an artwork and an approximate width, then prepare the preview on your phone. The size is not the artwork&apos;s actual dimensions.</p>
        <label className={styles.wallLabel} htmlFor="wall-artwork">Artwork</label>
        <select id="wall-artwork" value={selectedId} disabled={preparing} onChange={(event) => { setSelectedId(event.target.value); setPreview(null); setError(""); }}>
          {artworks.map((artwork) => <option key={artwork.id} value={artwork.id}>{artwork.title} — {artwork.artist}</option>)}
        </select>
        <label className={styles.wallLabel} htmlFor="wall-width">Approximate width: {width} inches</label>
        <input id="wall-width" type="range" min="12" max="48" step="1" value={width} disabled={preparing} onChange={(event) => { setWidth(Number(event.target.value)); setPreview(null); setError(""); }} />
        <button className={styles.action} disabled={preparing} onClick={preparePreview} type="button">
          {preparing ? "Preparing preview..." : "Prepare wall preview"}
        </button>
        {error ? <p role="alert">{error}</p> : null}
        <p className={styles.note}>Use Safari on iPhone or a supported Android browser with ARCore. Allow camera access, point at a well-lit wall, and follow the device prompts. Pinch to resize. iPhone may also offer floor placement.</p>
      </div>
      {preview ? (
        <div className={styles.wallViewer}>
          {createElement("model-viewer", {
            ref: viewerRef,
            src: preview.glb,
            alt: `3D preview of ${preview.title}`,
            ar: true,
            "ar-modes": "webxr",
            "ar-placement": "wall",
            "camera-controls": true,
            class: styles.wallModel,
          }, createElement("button", { slot: "ar-button", className: styles.action, type: "button" }, "View on wall (Android)"))}
          {appleMobile ? <a className={`${styles.outlineAction} ${styles.wallQuickLook}`} href={preview.usdz} rel="ar" download="artwork.usdz" aria-label="View on wall (iPhone)">
            {/* Quick Look requires the image to be the link's only child. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.ico" alt="" width="1" height="1" />
          </a> : null}
          <p className={styles.note}>If the Android button is unavailable, this browser or device does not support WebXR wall AR.</p>
        </div>
      ) : null}
    </section>
  );
}
