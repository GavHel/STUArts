import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublishedArtist } from "@/lib/catalog";
import { DiscoverGallery, type Artwork } from "@/app/discover/discover-gallery";
import experienceStyles from "@/app/experience.module.css";
import profileStyles from "@/app/page.module.css";

type ArtistPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Artist Profile | STUArts",
  description: "Meet a student artist and explore their published portfolio.",
};

export default function ArtistPage({ params }: ArtistPageProps) {
  return (
    <main className={experienceStyles.page}>
      <SiteHeader active="discover" />
      <Suspense fallback={<p className={experienceStyles.note} role="status">Loading artist profile...</p>}>
        <ArtistProfile params={params} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}

async function ArtistProfile({ params }: ArtistPageProps) {
  await connection();
  const { slug } = await params;
  const result = await getPublishedArtist(slug);

  if (result.status === "ready" && !result.artist) notFound();
  if (result.status === "unavailable") {
    return (
      <div className={experienceStyles.content}>
        <p className={experienceStyles.note} role="status">
          This artist profile is temporarily unavailable. Please try again later.
        </p>
        <Link className={experienceStyles.action} href="/discover">
          Back to discovery
        </Link>
      </div>
    );
  }

  const artist = result.artist;
  const commissionParams = new URLSearchParams({
    artist: artist.slug,
    artistName: artist.display_name,
  });
  const works: Artwork[] = result.artworks.map((artwork) => ({
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
  }));
  const introduction = [artist.program, artist.university].filter(Boolean).join(" · ");

  return (
    <div className={experienceStyles.content}>
      <section className={`${profileStyles.profile} ${experienceStyles.artistProfile}`}>
        <div className={profileStyles.profileImageWrap}>
          {artist.profile_image_url ? (
            <Image
              className={profileStyles.profileImage}
              src={artist.profile_image_url}
              alt={`${artist.display_name} profile`}
              fill
              sizes="(max-width: 700px) 90vw, 370px"
              unoptimized
            />
          ) : null}
          <span className={profileStyles.imageNote}>
            {artist.location || "STUArts artist"}
          </span>
        </div>
        <div className={profileStyles.profileCopy}>
          <p className={profileStyles.eyebrow}>
            <span className={profileStyles.statusDot} aria-hidden="true" />
            {artist.location || "Calgary"} <span className={profileStyles.eyebrowDivider}>·</span>
            Emerging artist
          </p>
          <h1>{artist.display_name}</h1>
          {introduction ? <p className={profileStyles.profileIntro}>{introduction}</p> : null}
          {artist.bio ? (
            <p className={profileStyles.profileBio}>{artist.bio}</p>
          ) : (
            <p className={profileStyles.profileBio}>
              Explore {artist.display_name}&apos;s published artwork and get in touch about a commission.
            </p>
          )}
          <div className={profileStyles.profileMeta}>
            {artist.location ? <span>{artist.location}</span> : null}
            {artist.graduation_year ? <span>Class of {artist.graduation_year}</span> : null}
          </div>
          <div className={profileStyles.profileActions}>
            <Link
              className={profileStyles.primaryButton}
              href={`/commission?${commissionParams.toString()}`}
            >
              Request a commission <span aria-hidden="true">→</span>
            </Link>
            <Link href="/discover">Discover more artists</Link>
          </div>
        </div>
      </section>

      {works.length ? (
        <DiscoverGallery works={works} />
      ) : (
        <p className={experienceStyles.emptyResults} role="status">
          {artist.display_name} hasn&apos;t published any artwork yet.
        </p>
      )}
    </div>
  );
}
