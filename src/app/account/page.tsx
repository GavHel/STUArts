import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import pageStyles from "../experience.module.css";
import { AccountDashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "My Account | STUArts",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main className={pageStyles.page}>
      <SiteHeader active="account" />
      <div className={pageStyles.content}>
        <AccountDashboard />
      </div>
      <SiteFooter />
    </main>
  );
}
