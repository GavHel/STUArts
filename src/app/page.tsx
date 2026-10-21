import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { ArtistArtworkGallery } from "./artist-artwork-gallery";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.site}>
      <SiteHeader active="artists" />

      <section className={styles.profile} id="about">
        <div className={styles.profileImageWrap}>
          <Image
            className={styles.profileImage}
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85"
            alt="Portrait of student artist Maya Linnea Chen"
            fill
            priority
            sizes="(max-width: 540px) calc(100vw - 40px), (max-width: 760px) 40vw, 370px"
          />
          <span className={styles.imageNote}>MADE WITH FEELING</span>
        </div>

        <div className={styles.profileCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.statusDot} />
            STUDENT ARTIST <span className={styles.eyebrowDivider}>/</span>{" "}
            UNIVERSITY OF CALGARY
          </div>
          <h1>
            Maya Linnea
            <br />
            <em>Chen</em>
          </h1>
          <p className={styles.profileIntro}>
            Making little worlds out of the things we almost overlook.
          </p>
          <p className={styles.profileBio}>
            I&apos;m a multidisciplinary artist exploring memory, belonging,
            and the quiet poetry of everyday life. Working between painting,
            ceramics, and whatever the day asks for.
          </p>
          <div className={styles.profileMeta}>
            <span>✳ &nbsp; BFA, Studio Art</span>
            <span>⌖ &nbsp; Calgary, Alberta</span>
            <span>◷ &nbsp; Class of 2026</span>
          </div>
          <div className={styles.profileActions}>
            <Link className={styles.primaryButton} href="/commission">
              Start a conversation <span aria-hidden="true">↗</span>
            </Link>
            <a className={styles.textLink} href="#work">
              Explore my work <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className={styles.profileIndex} aria-hidden="true">
          ARTIST INDEX <span>014</span>
        </div>
      </section>

      <section className={styles.workSection} id="work">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>A FEW THINGS I&apos;VE MADE</p>
            <h2>
              Selected <em>work</em>
            </h2>
          </div>
          <Link className={styles.textLink} href="/discover">
            View full portfolio <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <ArtistArtworkGallery />
      </section>

      <section className={styles.membership} id="membership">
        <div className={styles.membershipIntro}>
          <p className={styles.eyebrow}>BETTER, TOGETHER</p>
          <h2>
            Art happens
            <br />
            <em>in community.</em>
          </h2>
          <p>
            The best part of making things is finding the people who get it.
            Here are a few of the spaces I call home.
          </p>
        </div>
        <div className={styles.membershipList}>
          <div className={styles.membershipItem}>
            <span className={styles.membershipMark}>✳</span>
            <div>
              <h3>Emerging Artists Collective</h3>
              <p>Member since 2023 · Calgary, AB</p>
            </div>
            <span className={styles.membershipArrow} aria-hidden="true">
              ↗
            </span>
          </div>
          <div className={styles.membershipItem}>
            <span className={styles.membershipMark}>◈</span>
            <div>
              <h3>University of Calgary Art Society</h3>
              <p>Studio representative · 2024—25</p>
            </div>
            <span className={styles.membershipArrow} aria-hidden="true">
              ↗
            </span>
          </div>
          <div className={styles.membershipItem}>
            <span className={styles.membershipMark}>✴</span>
            <div>
              <h3>Open Studio Sundays</h3>
              <p>Co-host · Every first Sunday</p>
            </div>
            <span className={styles.membershipArrow} aria-hidden="true">
              ↗
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
