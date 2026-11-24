import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import pageStyles from "../experience.module.css";
import { ArtistDashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "Artist Workspace | STUArts",
  robots: { index: false, follow: false },
};

export default function ArtistPage() {
  return (
    <main className={pageStyles.page}>
      <SiteHeader active="account" />
      <div className={pageStyles.content}>
        <ArtistDashboard />
      </div>
      <SiteFooter />
    </main>
  );
}
