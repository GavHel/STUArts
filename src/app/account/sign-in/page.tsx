import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import pageStyles from "../../experience.module.css";
import adminStyles from "../../admin/admin.module.css";
import { AccountAuthForm } from "../account-auth-form";

export const metadata: Metadata = {
  title: "Account Sign In | STUArts",
  robots: { index: false, follow: false },
};

export default function AccountSignInPage() {
  return (
    <main className={pageStyles.page}>
      <SiteHeader active="account" />
      <div className={pageStyles.content}>
        <section className={adminStyles.signInCard}>
          <p className={adminStyles.eyebrow}>STUARTS ACCOUNTS</p>
          <h1>Sign in</h1>
          <p>Track commission requests or open your artist workspace.</p>
          <AccountAuthForm mode="sign-in" />
          <p>
            New to STUArts? <Link href="/account/sign-up">Create an account</Link>
          </p>
          <p>
            STUArts admin? <Link href="/admin/sign-in">Admin sign in</Link>
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
