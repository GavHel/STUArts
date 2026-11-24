import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublishedCatalog } from "@/lib/catalog";
import { ArtistArtworkGallery } from "./artist-artwork-gallery";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.site}>
      <SiteHeader active="artists" />
      <section className={styles.directoryIntro}>
        <p className={styles.eyebrow}>MEET THE PEOPLE BEHIND THE ART</p>
        <h1>Discover artists, <em>and their stories.</em></h1>
        <p>
          Meet emerging artists in our community, explore their work, and find
          someone to bring your next idea to life.
        </p>
        <Link className={styles.primaryButton} href="/discover">
          Explore artwork <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <Suspense fallback={<p className={styles.directoryNotice} role="status">Loading artists...</p>}>
        <ArtistDirectory />
      </Suspense>
      <SiteFooter />
    </main>
  );
}

async function ArtistDirectory() {
  await connection();
  const catalog = await getPublishedCatalog();
  if (catalog.status === "unavailable") {
    return (
      <p className={styles.directoryNotice} role="status">
        The artist catalog is temporarily unavailable. Please try again later.
      </p>
    );
  }
  if (!catalog.artists.length) {
    return (
      <p className={styles.directoryNotice} role="status">
        No artists have published a profile yet. Check back soon.
      </p>
    );
  }

  const artistsById = new Map(catalog.artists.map((artist) => [artist.id, artist]));
  const works = catalog.artworks.flatMap((artwork) => {
    const artist = artistsById.get(artwork.artist_id);
    return artist ? [{
      id: artwork.id,
      title: artwork.title,
      category: [artwork.medium, artist.display_name].filter(Boolean).join(" · "),
      image: artwork.image_url,
      alt: artwork.image_alt,
      profileHref: `/artists/${artist.slug}`,
    }] : [];
  });

  return (
    <>
      <section className={styles.directory} aria-labelledby="artists-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>CREATIVE PEOPLE, REAL STORIES</p>
            <h2 id="artists-heading">Meet our <em>artists</em></h2>
          </div>
          <span className={styles.directoryCount}>
            {catalog.artists.length} {catalog.artists.length === 1 ? "artist" : "artists"}
          </span>
        </div>
        <div className={styles.artistGrid}>
          {catalog.artists.map((artist) => {
            const artwork = catalog.artworks.find((item) => item.artist_id === artist.id);
            const image = artist.profile_image_url || artwork?.image_url;
            return (
              <article className={styles.artistCard} key={artist.id}>
                <Link className={styles.artistImage} href={`/artists/${artist.slug}`} aria-label={`View ${artist.display_name}'s profile`}>
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 540px) 100vw, (max-width: 760px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : <span aria-hidden="true">STUArts</span>}
                </Link>
                <div className={styles.artistDetails}>
                  <h3><Link href={`/artists/${artist.slug}`}>{artist.display_name}</Link></h3>
                  <p>{[artist.program, artist.university, artist.location].filter(Boolean).join(" · ") || "STUArts artist"}</p>
                  <Link className={styles.textLink} href={`/artists/${artist.slug}`}>
                    Meet the artist <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {works.length ? (
        <section className={styles.workSection} id="work">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>MADE BY OUR COMMUNITY</p>
              <h2>Selected <em>work</em></h2>
            </div>
            <Link className={styles.textLink} href="/discover">
              Explore all artwork <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ArtistArtworkGallery artworks={works} />
        </section>
      ) : null}
    </>
  );
}
