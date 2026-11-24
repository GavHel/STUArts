"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "../admin/admin.module.css";

export function AccountAuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(`Account creation failed: ${signUpError.message}`);
          return;
        }
        if (data.session) {
          router.replace("/account");
          router.refresh();
          return;
        }
        setMessage("Check your email for a confirmation link, then sign in to your account.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(`Sign in failed: ${signInError.message}`);
        return;
      }
      router.replace("/account");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Account access is unavailable. Check the app configuration.",
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
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        <span>Password</span>
        <input
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.success} role="status">{message}</p>}
      <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
        {isSubmitting
          ? mode === "sign-up" ? "Creating account..." : "Signing in..."
          : mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
