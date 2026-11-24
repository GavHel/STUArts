import Link from "next/link";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  active?: "artists" | "discover" | "commission" | "studio" | "account";
};

const links = [
  { id: "artists", label: "Artists", href: "/" },
  { id: "discover", label: "Discover", href: "/discover" },
  { id: "commission", label: "Commission", href: "/commission" },
  { id: "studio", label: "AR Studio", href: "/studio" },
  { id: "account", label: "Account", href: "/account" },
] as const;

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-label="STUArts home">
        <span className={styles.wordmarkIcon} aria-hidden="true">
          s
        </span>
        <span>
          <strong>STUArts</strong>
          <small>CREATIVE COMMUNITY</small>
        </span>
      </Link>
      <nav className={styles.nav} aria-label="Main navigation">
        {links.map((link) => (
          <Link
            className={active === link.id ? styles.navActive : undefined}
            href={link.href}
            key={link.id}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <a className={styles.headerLink} href="mailto:hello@stuarts.edu">
        Join the community <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.footerWordmark} href="/">
        STUArts
      </Link>
      <p>A little more room for art, and the people who make it.</p>
      <a href="mailto:hello@stuarts.edu">Say hello ↗</a>
    </footer>
  );
}
