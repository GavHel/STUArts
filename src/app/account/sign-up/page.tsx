import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import pageStyles from "../../experience.module.css";
import adminStyles from "../../admin/admin.module.css";
import { AccountAuthForm } from "../account-auth-form";

export const metadata: Metadata = {
  title: "Create an Account | STUArts",
  robots: { index: false, follow: false },
};

export default function AccountSignUpPage() {
  return (
    <main className={pageStyles.page}>
      <SiteHeader active="account" />
      <div className={pageStyles.content}>
        <section className={adminStyles.signInCard}>
          <p className={adminStyles.eyebrow}>STUARTS ACCOUNTS</p>
          <h1>Create an account</h1>
          <p>
            Customer accounts are optional and let you track requests submitted
            while signed in. Artists can sign up too; an admin must link an
            artist account to its profile.
          </p>
          <AccountAuthForm mode="sign-up" />
          <p>
            Already have an account? <Link href="/account/sign-in">Sign in</Link>
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
