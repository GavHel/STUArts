import Image from "next/image";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

const artworks = [
  {
    title: "A quieter kind of morning",
    category: "Oil on canvas · 2025",
    style: styles.artworkOne,
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85",
    alt: "Soft morning light falling across a mountain lake",
  },
  {
    title: "Things we carry",
    category: "Mixed media · 2024",
    style: styles.artworkTwo,
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85",
    alt: "Colorful contemporary painting in a gallery",
  },
  {
    title: "The space between",
    category: "Ceramics · 2024",
    style: styles.artworkThree,
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85",
    alt: "Handmade sculptural ceramic vessels",
  },
];

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
            <a className={styles.primaryButton} href="mailto:maya.chen@example.com">
              Start a conversation <span aria-hidden="true">↗</span>
            </a>
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
          <a className={styles.textLink} href="mailto:maya.chen@example.com">
            View full portfolio <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className={styles.artworkGrid}>
          {artworks.map((artwork, index) => (
            <article className={styles.artworkCard} key={artwork.title}>
              <div className={`${styles.artworkImage} ${artwork.style}`}>
                <Image
                  src={artwork.image}
                  alt={artwork.alt}
                  fill
                  sizes="(max-width: 540px) calc(100vw - 40px), (max-width: 760px) 30vw, 350px"
                />
                <span className={styles.artworkNumber}>0{index + 1}</span>
                <span className={styles.artworkArrow} aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className={styles.artworkCaption}>
                <h3>{artwork.title}</h3>
                <span>{artwork.category}</span>
              </div>
            </article>
          ))}
        </div>
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
