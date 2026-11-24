"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "../admin.module.css";

export function AdminSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Sign in failed. Check your email and password.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Admin sign-in is unavailable. Check the app configuration.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        <span>Email</span>
        <input
          autoComplete="username"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        <span>Password</span>
        <input
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
