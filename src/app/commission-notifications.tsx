"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./admin/admin.module.css";

type Audience = "admin" | "artist";
type Notification = { request_id: string; artist_slug: string; medium: string; created_at: string };
type NotificationData = { notifications: Notification[]; unreadCount: number };

function isNotificationData(value: unknown): value is NotificationData {
  if (typeof value !== "object" || value === null || !("unreadCount" in value) ||
      typeof value.unreadCount !== "number" || !("notifications" in value) ||
      !Array.isArray(value.notifications)) return false;
  return value.notifications.every((item: unknown) =>
    typeof item === "object" && item !== null &&
    "request_id" in item && typeof item.request_id === "string" &&
    "artist_slug" in item && typeof item.artist_slug === "string" &&
    "medium" in item && typeof item.medium === "string" &&
    "created_at" in item && typeof item.created_at === "string",
  );
}

export function CommissionNotifications({
  audience,
  inboxHref,
  onOpenInbox,
}: {
  audience: Audience;
  inboxHref: string;
  onOpenInbox?: () => void;
}) {
  const [data, setData] = useState<NotificationData | null>(null);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState<string | null>(null);
  const sequence = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const response = await fetch(`/api/commission-notifications?audience=${audience}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isNotificationData(result)) {
        throw new Error("Commission notifications could not be loaded.");
      }
      if (current === sequence.current) {
        setData(result);
        setError("");
      }
    } catch (caught) {
      if (current === sequence.current) {
        setError(caught instanceof Error ? caught.message : "Commission notifications could not be loaded.");
      }
    }
  }, [audience]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      sequence.current += 1;
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function markRead(requestId: string) {
    if (marking) return;
    setMarking(requestId);
    setError("");
    try {
      const response = await fetch("/api/commission-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, requestId }),
      });
      if (!response.ok) throw new Error("The notification could not be marked as read.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The notification could not be marked as read.");
    } finally {
      setMarking(null);
    }
  }

  return (
    <section className={styles.notificationPanel} aria-label={`${audience === "admin" ? "Admin" : "Artist"} commission notifications`}>
      <div className={styles.sectionHeader}>
        <h2>{audience === "admin" ? "Admin" : "Artist"} notifications</h2>
        <a href={inboxHref} onClick={onOpenInbox}>View requests →</a>
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {!data && !error ? <p className={styles.notice}>Loading notifications...</p> : null}
      {data ? (
        <>
          <p aria-live="polite">
            {data.unreadCount === 0 ? "No unread commission notifications." :
              `${data.unreadCount} unread commission ${data.unreadCount === 1 ? "notification" : "notifications"}.`}
          </p>
          {data.unreadCount > data.notifications.length ? <p>Showing the latest {data.notifications.length}.</p> : null}
          <ul className={styles.notificationList}>
            {data.notifications.map((notification) => (
              <li key={notification.request_id}>
                <span>
                  {notification.medium} request{audience === "admin" ? ` · ${notification.artist_slug}` : ""}
                  {" · "}{new Date(notification.created_at).toLocaleDateString()}
                </span>
                <button className={styles.secondaryButton} disabled={marking !== null} onClick={() => void markRead(notification.request_id)} type="button">
                  {marking === notification.request_id ? "Saving..." : "Mark read"}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
