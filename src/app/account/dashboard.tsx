"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Artist, CommissionRequest } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "../admin/admin.module.css";

type AccountRequest = Pick<
  CommissionRequest,
  | "id"
  | "artist_slug"
  | "medium"
  | "placement"
  | "project_brief"
  | "width"
  | "height"
  | "units"
  | "scale_guide"
  | "requested_delivery_date"
  | "estimated_total_cad"
  | "estimated_studio_time"
  | "request_status"
  | "artist_response"
  | "artist_responded_at"
  | "created_at"
  | "updated_at"
>;

type AccountDashboardData = {
  email: string | null;
  is_admin: boolean;
  requests: AccountRequest[];
  artist: Pick<Artist, "slug" | "display_name"> | null;
};

function isAccountDashboardData(value: unknown): value is AccountDashboardData {
  return (
    typeof value === "object" &&
    value !== null &&
    "is_admin" in value &&
    typeof value.is_admin === "boolean" &&
    "requests" in value &&
    Array.isArray(value.requests) &&
    "artist" in value &&
    (value.artist === null || typeof value.artist === "object")
  );
}

export function AccountDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AccountDashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    try {
      const response = await fetch("/api/account/dashboard", { cache: "no-store" });
      const result: unknown = await response.json();
      if (response.status === 401) {
        router.replace("/account/sign-in");
        return;
      }
      if (!response.ok) {
        const detail =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Your account could not be loaded.";
        throw new Error(detail);
      }
      if (!isAccountDashboardData(result)) {
        throw new Error("The account returned data in an unexpected format.");
      }
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your account could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAccount(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAccount]);

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/account/sign-in");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign out failed.");
    }
  }

  if (isLoading && !data) {
    return <p className={styles.notice}>Loading your account...</p>;
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.workspaceTop}>
        <div>
          <p className={styles.eyebrow}>STUARTS ACCOUNTS</p>
          <h1>My account</h1>
          <p>{data?.email ?? (data ? "Signed-in account" : "Account unavailable")}</p>
        </div>
        {data && (
          <button className={styles.signOutButton} onClick={signOut} type="button">
            Sign out
          </button>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {data?.is_admin && (
        <section className={`${styles.panel} ${styles.accountWorkspacePanel}`}>
          <h2>Admin workspace</h2>
          <Link className={`${styles.primaryButton} ${styles.accountArtistLink}`} href="/admin">
            Open admin workspace
          </Link>
        </section>
      )}

      {data?.artist ? (
        <section className={`${styles.panel} ${styles.accountWorkspacePanel}`}>
          <h2>Artist workspace</h2>
          <p>Your account is linked to {data.artist.display_name}.</p>
          <Link className={`${styles.primaryButton} ${styles.accountArtistLink}`} href="/artist">
            Open artist workspace
          </Link>
        </section>
      ) : data && !data.is_admin ? (
        <p className={styles.notice}>
          Artist? An admin must link your account email to your artist profile
          before the artist workspace appears here.
        </p>
      ) : null}

      {data && (
        <section className={styles.requestList} aria-label="My commission requests">
          <div className={styles.sectionHeader}>
            <h2>My commission requests</h2>
            <Link href="/commission">Start a request</Link>
          </div>
          <p className={styles.notice}>
            Only requests submitted while you were signed in appear here. Guest
            submissions are still available.
          </p>
          {data.requests.length ? (
            data.requests.map((request) => (
              <article className={styles.requestCard} key={request.id}>
                <div className={styles.requestHeader}>
                  <div>
                    <strong>{request.medium} commission</strong>
                    <p>{request.placement} · {request.artist_slug}</p>
                  </div>
                  <span className={styles.status}>
                    {request.request_status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className={styles.requestMeta}>
                  <span>Estimate: ${request.estimated_total_cad} CAD</span>
                  <span>Timeline: {request.estimated_studio_time}</span>
                  <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                {request.project_brief ? <p>{request.project_brief}</p> : null}
                {request.artist_response ? (
                  <div className={styles.notice}>
                    <strong>Artist response</strong>
                    <p>{request.artist_response}</p>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className={styles.notice}>No tracked requests yet.</p>
          )}
        </section>
      )}
    </section>
  );
}
