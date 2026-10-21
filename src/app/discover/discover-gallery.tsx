"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "../experience.module.css";

export type Artwork = {
  title: string;
  artist: string;
  medium: string;
  image: string;
  alt: string;
  profileHref?: string;
};

type DiscoverGalleryProps = {
  works: Artwork[];
};

const categories = ["All work", "Painting", "Ceramics", "Photography", "Mixed media"];

export function DiscoverGallery({ works }: DiscoverGalleryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All work");

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return works.filter((work) => {
      const matchesCategory =
        category === "All work" ||
        (category === "Painting"
          ? /paint|oil|acrylic|watercolor/i.test(work.medium)
          : work.medium.toLocaleLowerCase().includes(category.toLocaleLowerCase()));
      const matchesQuery =
        !normalizedQuery ||
        `${work.title} ${work.artist} ${work.medium}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, works]);

  return (
    <section>
      <div className={styles.sectionTop}>
        <div>
          <p className={styles.eyebrow}>A LITTLE OF EVERYTHING</p>
          <h2>Artworks to get lost in</h2>
        </div>
        <span className={styles.resultCount} aria-live="polite">
          {filteredWorks.length} {filteredWorks.length === 1 ? "artwork" : "artworks"}
        </span>
      </div>

      <form className={styles.searchBar} role="search" onSubmit={(event) => event.preventDefault()}>
        <input
          aria-label="Search artists, artwork, and mediums"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search artists, artwork, or a medium..."
          type="search"
          value={query}
        />
        {query && (
          <button
            aria-label="Clear search"
            className={styles.clearSearch}
            onClick={() => setQuery("")}
            type="button"
          >
            Clear
          </button>
        )}
      </form>

      <div aria-label="Filter artwork by medium" className={styles.filterRow}>
        {categories.map((item) => (
          <button
            aria-pressed={category === item}
            className={`${styles.filterChip} ${category === item ? styles.filterActive : ""}`}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {filteredWorks.length ? (
        <div className={styles.workGrid} id="all-work">
          {filteredWorks.map((work) => (
            <article className={styles.workCard} key={`${work.artist}-${work.title}`}>
              <div className={styles.workImage}>
                <Image
                  src={work.image}
                  alt={work.alt}
                  fill
                  sizes="(max-width: 650px) 45vw, (max-width: 900px) 45vw, 25vw"
                />
              </div>
              <div className={styles.workInfo}>
                <h3>{work.title}</h3>
                <p>{work.medium} <span>·</span> {work.artist}</p>
                {work.profileHref ? (
                  <Link href={work.profileHref}>Meet the artist ↗</Link>
                ) : (
                  <span className={styles.profilePending}>Artist profile coming soon</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyResults} role="status">
          No artworks match those filters. Try another search or choose “All work”.
        </p>
      )}
    </section>
  );
}
