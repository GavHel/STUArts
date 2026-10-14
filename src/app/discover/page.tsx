import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Discover Calgary Artists | StartUArts",
  description: "Explore original work and meet emerging artists in Calgary.",
};

const works = [
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
          <form className={styles.searchBar} action="/discover">
            <input
              aria-label="Search artists, artwork, and mediums"
              name="q"
              placeholder="Search artists, artwork, or a medium..."
            />
            <button type="submit">Find your art ↗</button>
          </form>
        </section>

        <section className={styles.matchStrip}>
          <div>
            <strong>Find your creative match in under 60 seconds.</strong>
            <p>A few thoughtful questions. One very personal shortlist.</p>
          </div>
          <a className={styles.action} href="#featured">
            Find my match <span aria-hidden="true">→</span>
          </a>
        </section>

        <section id="featured">
          <div className={styles.sectionTop}>
            <div>
              <p className={styles.eyebrow}>A GOOD PLACE TO START</p>
              <h2>Featured artist</h2>
            </div>
            <Link href="/">Meet the artist ↗</Link>
          </div>
          <article className={styles.featuredLayout}>
            <div className={styles.featuredImage}>
              <Image
                src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1100&q=85"
                alt="A calm mountain lake at first light"
                fill
                sizes="(max-width: 650px) 100vw, 60vw"
              />
              <span className={styles.featuredBadge}>FEATURED THIS WEEK</span>
            </div>
            <div className={styles.featuredCopy}>
              <p className={styles.eyebrow}>PAINTING · CERAMICS · MIXED MEDIA</p>
              <h3>Find your creative match in under 60 seconds.</h3>
              <p>
                A multidisciplinary artist exploring memory, belonging, and the
                quiet poetry of everyday life.
              </p>
              <div className={styles.artistLine}>
                <Image
                  className={styles.miniAvatar}
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  alt=""
                  width={26}
                  height={26}
                />
                Maya Linnea Chen <span>·</span> Calgary, AB
              </div>
              <Link className={styles.action} href="/">
                Explore Maya&apos;s profile <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        </section>

        <section>
          <div className={styles.sectionTop}>
            <div>
              <p className={styles.eyebrow}>A LITTLE OF EVERYTHING</p>
              <h2>Artworks to get lost in</h2>
            </div>
            <a href="#all-work">Browse all work ↗</a>
          </div>
          <div className={styles.workGrid} id="all-work">
            {works.map((work) => (
              <article className={styles.workCard} key={work.title}>
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
                  <p>
                    {work.medium} <span>·</span> {work.artist}
                  </p>
                  <Link href="/">Meet the artist ↗</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
