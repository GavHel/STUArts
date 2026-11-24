"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type GalleryArtwork = {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  profileHref: string;
};

export function ArtistArtworkGallery({ artworks }: { artworks: GalleryArtwork[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const wheelTargetIndexRef = useRef(0);
  const wheelDeltaRef = useRef(0);
  const wheelSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToArtwork = useCallback((index: number) => {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    const cardLeft =
      card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    wheelTargetIndexRef.current = index;
    wheelDeltaRef.current = 0;
    track.scrollTo({
      left: cardLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    setActiveIndex(index);
  }, []);

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.children) as HTMLElement[];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const [index, card] of cards.entries()) {
      const cardLeft =
        card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      const distance = Math.abs(cardLeft - track.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }
    setActiveIndex(nearestIndex);
    if (wheelSyncTimeoutRef.current) clearTimeout(wheelSyncTimeoutRef.current);
    wheelSyncTimeoutRef.current = setTimeout(() => {
      wheelTargetIndexRef.current = nearestIndex;
    }, 120);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function handleWheel(event: WheelEvent) {
      if (!track || event.ctrlKey || (event.deltaX === 0 && event.deltaY === 0)) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const normalizedDelta =
        delta * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? track.clientHeight : 1);
      event.preventDefault();
      wheelDeltaRef.current += normalizedDelta;
      if (Math.abs(wheelDeltaRef.current) < 80) return;

      const direction = Math.sign(wheelDeltaRef.current);
      wheelDeltaRef.current = 0;
      scrollToArtwork(
        Math.max(0, Math.min(artworks.length - 1, wheelTargetIndexRef.current + direction)),
      );
    }

    track.addEventListener("wheel", handleWheel, { passive: false });
    track.addEventListener("scroll", syncActiveIndex, { passive: true });
    return () => {
      track.removeEventListener("wheel", handleWheel);
      track.removeEventListener("scroll", syncActiveIndex);
      if (wheelSyncTimeoutRef.current) clearTimeout(wheelSyncTimeoutRef.current);
    };
  }, [artworks.length, scrollToArtwork, syncActiveIndex]);

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryControls}>
        <p className={styles.galleryHint}>SCROLL OVER THE ARTWORKS TO EXPLORE</p>
        <div className={styles.galleryButtons}>
          <button
            aria-label="Previous artwork"
            className={styles.galleryButton}
            disabled={activeIndex === 0}
            onClick={() => scrollToArtwork(Math.max(0, activeIndex - 1))}
            type="button"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 12H4M10 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            aria-label="Next artwork"
            className={styles.galleryButton}
            disabled={activeIndex === artworks.length - 1}
            onClick={() => scrollToArtwork(Math.min(artworks.length - 1, activeIndex + 1))}
            type="button"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div
        aria-label="Community artwork. Use the scroll wheel, arrow keys, or controls to browse."
        className={styles.artworkTrack}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollToArtwork(Math.min(artworks.length - 1, activeIndex + 1));
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollToArtwork(Math.max(0, activeIndex - 1));
          } else if (event.key === "Home") {
            event.preventDefault();
            scrollToArtwork(0);
          } else if (event.key === "End") {
            event.preventDefault();
            scrollToArtwork(artworks.length - 1);
          }
        }}
        ref={trackRef}
        role="region"
        tabIndex={0}
      >
        {artworks.map((artwork, index) => (
          <article
            aria-label={`${index + 1} of ${artworks.length}: ${artwork.title}`}
            className={styles.artworkCard}
            key={artwork.id}
            role="group"
          >
            <Link className={styles.artworkImage} href={artwork.profileHref} aria-label={`View the artist for ${artwork.title}`}>
              <Image
                alt={artwork.alt}
                fill
                sizes="(max-width: 540px) calc(100vw - 40px), (max-width: 760px) 55vw, 350px"
                src={artwork.image}
                unoptimized
              />
              <span className={styles.artworkNumber}>0{index + 1}</span>
              <span className={styles.artworkArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
            <div className={styles.artworkCaption}>
              <h3>{artwork.title}</h3>
              <span>{artwork.category}</span>
            </div>
          </article>
        ))}
      </div>
      <div className={styles.galleryPagination} aria-label="Choose artwork">
        {artworks.map((artwork, index) => (
          <button
            aria-label={`Show artwork ${index + 1}: ${artwork.title}`}
            aria-current={activeIndex === index ? "true" : undefined}
            className={`${styles.galleryDot} ${activeIndex === index ? styles.galleryDotActive : ""}`}
            key={artwork.id}
            onClick={() => scrollToArtwork(index)}
            type="button"
          />
        ))}
        <span aria-live="polite" className={styles.galleryCount}>
          {String(activeIndex + 1).padStart(2, "0")} / {String(artworks.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
