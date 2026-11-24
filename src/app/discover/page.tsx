import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublishedCatalog, type PublishedArtist, type PublishedArtwork } from "@/lib/catalog";
import { DiscoverGallery, type Artwork } from "./discover-gallery";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Discover Calgary Artists | STUArts",
  description: "Explore original work and meet emerging artists in Calgary.",
};

const demoWorks: Artwork[] = [
  {
    title: "A quieter kind of morning",
    artist: "Maya Linnea Chen",
    medium: "Oil on canvas",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=80",
    alt: "Mountain lake artwork",
  },
  {
    title: "Things we carry",
    artist: "Maya Linnea Chen",
    medium: "Mixed media",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=80",
    alt: "Expressive floral painting",
  },
  {
    title: "Soft forms, still life",
    artist: "Elliot James",
    medium: "Ceramics",
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80",
    alt: "A collection of handmade ceramic vessels",
  },
  {
    title: "After the rain",
    artist: "Nora Sinclair",
    medium: "Photography",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=80",
    alt: "Warm light over a landscape after rain",
  },
];

export default function DiscoverPage() {
  return (
    <main className={styles.page}>
      <SiteHeader active="discover" />
      <div className={styles.content}>
        <section className={styles.discoverIntro}>
          <p className={styles.eyebrow}>ART MADE HERE, BY PEOPLE YOU CAN MEET</p>
          <h1 className={styles.title}>
            Discover authentic human-made art
            <br />
            from Calgary&apos;s next generation of <em>creators.</em>
          </h1>
          <p className={styles.lead}>
            Meet the artists behind the work. Find something that feels like
            you, then bring it home.
          </p>
        </section>

        <section className={styles.matchStrip}>
          <div>
            <strong>Find the piece that feels like you.</strong>
            <p>Browse original work from Calgary&apos;s student artists.</p>
          </div>
          <a className={styles.action} href="#all-work">
            Browse artworks <span aria-hidden="true">→</span>
          </a>
        </section>

        <Suspense fallback={<p className={styles.note} role="status">Loading the artist catalog...</p>}>
          <CatalogSections />
        </Suspense>
      </div>
      <SiteFooter />
    </main>
  );
}

async function CatalogSections() {
  await connection();
  const catalog = await getPublishedCatalog();

  if (catalog.status === "unavailable") {
    return (
      <>
        <p className={styles.note} role="status">{catalog.message}</p>
        <FeaturedArtist
          artist={{
            id: "demo-artist",
            slug: "maya-linnea-chen",
            display_name: "Maya Linnea Chen",
            bio: "A multidisciplinary artist exploring memory, belonging, and the quiet poetry of everyday life.",
            location: "Calgary, AB",
            university: null,
            program: null,
            profile_image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
            graduation_year: null,
          }}
          artwork={demoWorks[0]}
          mediums="Painting · Ceramics · Mixed media"
          demo
        />
        <DiscoverGallery works={demoWorks} />
      </>
    );
  }

  const artistById = new Map(catalog.artists.map((artist) => [artist.id, artist]));
  const works = catalog.artworks.flatMap((artwork) => {
    const artist = artistById.get(artwork.artist_id);
    return artist ? [toGalleryArtwork(artwork, artist)] : [];
  });
  const featuredArtist = catalog.artists[0];
  if (!featuredArtist) {
    return (
      <p className={styles.emptyResults} id="all-work" role="status">
        No artists have published a profile yet. Check back soon.
      </p>
    );
  }

  const featuredArtwork = catalog.artworks.find(
    (artwork) => artwork.artist_id === featuredArtist.id,
  );
  const featuredMediums = [...new Set(
    catalog.artworks
      .filter((artwork) => artwork.artist_id === featuredArtist.id)
      .map((artwork) => artwork.medium),
  )].join(" · ");

  return (
    <>
      <FeaturedArtist
        artist={featuredArtist}
        artwork={featuredArtwork ? toGalleryArtwork(featuredArtwork, featuredArtist) : undefined}
        mediums={featuredMediums}
      />
      {works.length ? (
        <DiscoverGallery works={works} />
      ) : (
        <p className={styles.emptyResults} id="all-work" role="status">
          Published artworks will appear here as artists add them to their portfolios.
        </p>
      )}
    </>
  );
}

function toGalleryArtwork(artwork: PublishedArtwork, artist: PublishedArtist): Artwork {
  return {
    id: artwork.id,
    title: artwork.title,
    artist: artist.display_name,
    medium: artwork.medium,
    image: artwork.image_url,
    alt: artwork.image_alt,
    profileHref: `/artists/${artist.slug}`,
    description: artwork.description,
    year: artwork.year,
    priceCad: artwork.price_cad,
  };
}

function FeaturedArtist({
  artist,
  artwork,
  mediums,
  demo = false,
}: {
  artist: PublishedArtist;
  artwork?: Artwork;
  mediums: string;
  demo?: boolean;
}) {
  const image = artist.profile_image_url || artwork?.image;
  const artistHref = demo ? "/" : `/artists/${artist.slug}`;

  return (
    <section id="featured">
      <div className={styles.sectionTop}>
        <div>
          <p className={styles.eyebrow}>A GOOD PLACE TO START</p>
          <h2>Featured artist</h2>
        </div>
        {demo ? null : <Link href={artistHref}>Meet the artist ↗</Link>}
      </div>
      <article className={styles.featuredLayout}>
        <div className={styles.featuredImage}>
          {image ? (
            <Image
              src={image}
              alt={artist.profile_image_url ? `${artist.display_name} profile` : artwork?.alt ?? ""}
              fill
              sizes="(max-width: 650px) 100vw, 60vw"
              unoptimized
            />
          ) : null}
          <span className={styles.featuredBadge}>
            {demo ? "DEMO PORTFOLIO" : "FEATURED ARTIST"}
          </span>
        </div>
        <div className={styles.featuredCopy}>
          {mediums ? <p className={styles.eyebrow}>{mediums}</p> : null}
          <h3>{artwork?.title ?? artist.display_name}</h3>
          <p>{artist.bio || "Explore this artist's published portfolio and learn more about their work."}</p>
          <div className={styles.artistLine}>
            {artist.profile_image_url ? (
              <Image
                className={styles.miniAvatar}
                src={artist.profile_image_url}
                alt=""
                width={26}
                height={26}
                unoptimized
              />
            ) : null}
            {artist.display_name}
            {artist.location ? <><span>·</span> {artist.location}</> : null}
          </div>
          {demo ? null : (
            <Link className={styles.action} href={artistHref}>
              Explore {artist.display_name}&apos;s profile <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </article>
    </section>
  );
}
