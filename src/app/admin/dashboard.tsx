"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Artist, Artwork, CommissionRequest } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ArtworkImageUpload, artworkRequestBody, imageFileError, useArtworkImage } from "../artwork-image-upload";
import { CommissionNotifications } from "../commission-notifications";
import styles from "./admin.module.css";

type DashboardData = {
  email: string;
  requests: CommissionRequest[];
  artists: Artist[];
  artworks: Artwork[];
  accounts: { id: string; email: string }[];
};

type ArtistForm = {
  id: string;
  slug: string;
  display_name: string;
  university: string;
  program: string;
  location: string;
  bio: string;
  profile_image_url: string;
  graduation_year: string;
  owner_email: string;
  clear_owner_link: boolean;
  is_published: boolean;
};

type ArtworkForm = {
  id: string;
  artist_id: string;
  title: string;
  medium: string;
  description: string;
  image_url: string;
  image_alt: string;
  year: string;
  price_cad: string;
  is_published: boolean;
};

const blankArtist: ArtistForm = {
  id: "",
  slug: "",
  display_name: "",
  university: "",
  program: "",
  location: "",
  bio: "",
  profile_image_url: "",
  graduation_year: "",
  owner_email: "",
  clear_owner_link: false,
  is_published: false,
};

const blankArtwork: ArtworkForm = {
  id: "",
  artist_id: "",
  title: "",
  medium: "",
  description: "",
  image_url: "",
  image_alt: "",
  year: "",
  price_cad: "",
  is_published: false,
};

const tabs = ["Requests", "Artists", "Artwork"] as const;
type Tab = (typeof tabs)[number];

function isDashboardData(value: unknown): value is DashboardData {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    "requests" in value &&
    Array.isArray(value.requests) &&
    "artists" in value &&
    Array.isArray(value.artists) &&
    "artworks" in value &&
    Array.isArray(value.artworks) &&
    "accounts" in value &&
    Array.isArray(value.accounts) &&
    value.accounts.every(
      (account) =>
        typeof account === "object" &&
        account !== null &&
        "id" in account &&
        typeof account.id === "string" &&
        "email" in account &&
        typeof account.email === "string",
    )
  );
}

async function sendJson(url: string, method: "POST" | "PATCH", body: object, file: File | null = null) {
  const response = await fetch(url, {
    method,
    ...artworkRequestBody(body, file),
    cache: "no-store",
  });
  const result: unknown = await response.json();
  if (
    !response.ok ||
    typeof result !== "object" ||
    result === null ||
    ("error" in result && typeof result.error === "string")
  ) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "The change could not be saved.";
    throw new Error(message);
  }
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>("Requests");
  const [artistForm, setArtistForm] = useState<ArtistForm>(blankArtist);
  const [artworkForm, setArtworkForm] = useState<ArtworkForm>(blankArtwork);
  const image = useArtworkImage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const result: unknown = await response.json();
      if (response.status === 401) {
        router.replace("/admin/sign-in");
        return;
      }
      if (!response.ok) {
        const detail =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Dashboard data could not be loaded.";
        throw new Error(detail);
      }
      if (!isDashboardData(result)) {
        throw new Error("The dashboard returned data in an unexpected format.");
      }
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dashboard data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function saveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await sendJson("/api/admin/requests", "PATCH", {
        id: values.get("id"),
        request_status: values.get("request_status"),
        admin_notes: values.get("admin_notes"),
      });
      setMessage("Commission request updated.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await sendJson(
        "/api/admin/artists",
        artistForm.id ? "PATCH" : "POST",
        {
          ...artistForm,
          graduation_year: artistForm.graduation_year
            ? Number(artistForm.graduation_year)
            : null,
        },
      );
      setArtistForm(blankArtist);
      setMessage("Artist profile saved.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Artist profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || imageFileError(image.file)) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await sendJson(
        "/api/admin/artworks",
        artworkForm.id ? "PATCH" : "POST",
        {
          ...artworkForm,
          year: artworkForm.year ? Number(artworkForm.year) : null,
          price_cad: artworkForm.price_cad ? Number(artworkForm.price_cad) : null,
        },
        image.file,
      );
      setArtworkForm(blankArtwork);
      image.resetFile();
      setMessage("Artwork saved.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Artwork could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/admin/sign-in");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign out failed.");
    }
  }

  if (isLoading && !data) {
    return <p className={styles.notice}>Loading admin workspace...</p>;
  }

  const editingArtist = data?.artists.find((artist) => artist.id === artistForm.id);
  const linkedAccount = data?.accounts.find((account) => account.id === editingArtist?.owner_user_id);

  return (
    <section className={styles.workspace}>
      <div className={styles.workspaceTop}>
        <div>
          <p className={styles.eyebrow}>STUARTS TEAM</p>
          <h1>Admin workspace</h1>
          <p>{data?.email ?? "Administrator access required"}</p>
        </div>
        {data && (
          <button className={styles.signOutButton} onClick={signOut} type="button">
            Sign out
          </button>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.success} role="status">{message}</p>}

      {data && (
        <>
          <CommissionNotifications audience="admin" inboxHref="#commission-inbox" onOpenInbox={() => setTab("Requests")} />
          <div className={styles.tabs} id="commission-inbox" role="tablist" aria-label="Admin sections">
            {tabs.map((item) => (
              <button
                aria-pressed={tab === item}
                className={`${styles.tabButton} ${tab === item ? styles.tabActive : ""}`}
                disabled={isSaving}
                key={item}
                onClick={() => {
                  if (tab === "Artwork" && item !== "Artwork") image.resetFile();
                  setTab(item);
                  setError("");
                  setMessage("");
                }}
                type="button"
              >
                {item}
                {item === "Requests" ? ` (${data.requests.length})` : ""}
              </button>
            ))}
          </div>

          {tab === "Requests" && (
            <section className={styles.requestList} aria-label="Commission inbox">
              <div className={styles.sectionHeader}>
                <h2>Commission inbox</h2>
                <span className={styles.status}>Most recent 200 requests</span>
              </div>
              {data.requests.length === 0 ? (
                <p className={styles.notice}>No commission requests have arrived yet.</p>
              ) : (
                data.requests.map((request) => (
                  <article className={styles.requestCard} key={request.id}>
                    <div className={styles.requestHeader}>
                      <div>
                        <strong>{request.requester_name}</strong>
                        <p>
                          <a href={`mailto:${request.requester_email}`}>{request.requester_email}</a>
                          {" · "}{request.medium} · {request.placement}
                        </p>
                      </div>
                      <span className={styles.status}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.requestMeta}>
                      <span>
                        Artist: {data.artists.find((artist) => artist.slug === request.artist_slug)?.display_name ?? request.artist_slug}
                      </span>
                      <span>
                        Size: {request.width && request.height
                          ? `${request.width} × ${request.height} ${request.units}`
                          : request.scale_guide}
                      </span>
                      <span>Estimate: ${request.estimated_total_cad} CAD</span>
                      <span>Timeline: {request.estimated_studio_time}</span>
                      <span>Requested by: {request.requester_email}</span>
                    </div>
                    {request.project_brief && <p>{request.project_brief}</p>}
                    {request.artist_response && (
                      <p>
                        <strong>Artist response:</strong> {request.artist_response}
                      </p>
                    )}
                    {request.inspiration_url && (
                      <p>
                        Inspiration:{" "}
                        <a href={request.inspiration_url} rel="noreferrer" target="_blank">
                          Open reference
                        </a>
                      </p>
                    )}
                    <form className={styles.requestEditor} onSubmit={saveRequest}>
                      <input name="id" type="hidden" value={request.id} />
                      <label>
                        Status
                        <select defaultValue={request.request_status} name="request_status">
                          <option value="new">New</option>
                          <option value="in_review">In review</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>
                      <label>
                        Private admin notes
                        <textarea
                          defaultValue={request.admin_notes ?? ""}
                          maxLength={2000}
                          name="admin_notes"
                        />
                      </label>
                      <button className={styles.primaryButton} disabled={isSaving} type="submit">
                        Save
                      </button>
                    </form>
                  </article>
                ))
              )}
            </section>
          )}

          {tab === "Artists" && (
            <section className={styles.sectionGrid}>
              <div className={styles.panel}>
                <h2>{artistForm.id ? "Edit artist" : "Add artist"}</h2>
                <form className={styles.editor} onSubmit={saveArtist}>
                  <label>
                    Name
                    <input
                      maxLength={120}
                      onChange={(event) => setArtistForm({ ...artistForm, display_name: event.target.value })}
                      required
                      value={artistForm.display_name}
                    />
                  </label>
                  <label>
                    Profile slug
                    <input
                      maxLength={80}
                      onChange={(event) => setArtistForm({ ...artistForm, slug: event.target.value.toLowerCase() })}
                      placeholder="maya-linnea-chen"
                      required
                      value={artistForm.slug}
                    />
                  </label>
                  <label>
                    University
                    <input
                      maxLength={160}
                      onChange={(event) => setArtistForm({ ...artistForm, university: event.target.value })}
                      value={artistForm.university}
                    />
                  </label>
                  <label>
                    Program
                    <input
                      maxLength={120}
                      onChange={(event) => setArtistForm({ ...artistForm, program: event.target.value })}
                      value={artistForm.program}
                    />
                  </label>
                  <label>
                    Location
                    <input
                      maxLength={120}
                      onChange={(event) => setArtistForm({ ...artistForm, location: event.target.value })}
                      value={artistForm.location}
                    />
                  </label>
                  <label>
                    Graduation year
                    <input
                      max="2200"
                      min="2000"
                      onChange={(event) => setArtistForm({ ...artistForm, graduation_year: event.target.value })}
                      type="number"
                      value={artistForm.graduation_year}
                    />
                  </label>
                  <label>
                    Artist account
                    <select
                      onChange={(event) => setArtistForm({
                        ...artistForm,
                        owner_email: event.target.value,
                        clear_owner_link: false,
                      })}
                      value={artistForm.owner_email}
                    >
                      <option value="">
                        {artistForm.clear_owner_link
                          ? "Remove account link when saved"
                          : editingArtist?.owner_user_id
                            ? "Keep current account link"
                            : "No account linked"}
                      </option>
                      {data.accounts.map((account) => (
                        <option key={account.id} value={account.email}>
                          {account.email}
                        </option>
                      ))}
                    </select>
                    <small>
                      {editingArtist?.owner_user_id
                        ? `Currently linked: ${linkedAccount?.email ?? "account email unavailable"}. `
                        : ""}
                      {data.accounts.length === 0
                        ? "No accounts found. The artist must sign up before you can link one."
                        : "Choose the artist's existing account email."}
                    </small>
                  </label>
                  {artistForm.id && (
                    <label className={styles.checkRow}>
                      <input
                        checked={artistForm.clear_owner_link}
                        onChange={(event) => setArtistForm({
                          ...artistForm,
                          owner_email: "",
                          clear_owner_link: event.target.checked,
                        })}
                        type="checkbox"
                      />
                      Remove linked account
                    </label>
                  )}
                  <label>
                    Profile image URL
                    <input
                      maxLength={2048}
                      onChange={(event) => setArtistForm({ ...artistForm, profile_image_url: event.target.value })}
                      type="url"
                      value={artistForm.profile_image_url}
                    />
                  </label>
                  <label>
                    Artist bio
                    <textarea
                      maxLength={3000}
                      onChange={(event) => setArtistForm({ ...artistForm, bio: event.target.value })}
                      value={artistForm.bio}
                    />
                  </label>
                  <label className={styles.checkRow}>
                    <input
                      checked={artistForm.is_published}
                      onChange={(event) => setArtistForm({ ...artistForm, is_published: event.target.checked })}
                      type="checkbox"
                    />
                    Publish profile
                  </label>
                  <div className={styles.formActions}>
                    <button className={styles.primaryButton} disabled={isSaving} type="submit">
                      {artistForm.id ? "Save artist" : "Add artist"}
                    </button>
                    {artistForm.id && (
                      <button
                        className={styles.secondaryButton}
                        onClick={() => setArtistForm(blankArtist)}
                        type="button"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
              <div className={styles.records}>
                <h2>Artist profiles ({data.artists.length})</h2>
                {data.artists.length === 0 && <p className={styles.notice}>No profiles yet.</p>}
                {data.artists.map((artist) => (
                  <article className={styles.record} key={artist.id}>
                    <div className={styles.recordHeader}>
                      <strong>{artist.display_name}</strong>
                      <span className={styles.status}>
                        {artist.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p>
                      /{artist.slug} · {artist.university || "University not set"} ·{" "}
                      {artist.owner_user_id ? "Account linked" : "No artist account"}
                    </p>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setArtistForm({
                        id: artist.id,
                        slug: artist.slug,
                        display_name: artist.display_name,
                        university: artist.university ?? "",
                        program: artist.program ?? "",
                        location: artist.location ?? "",
                        bio: artist.bio ?? "",
                        profile_image_url: artist.profile_image_url ?? "",
                        graduation_year: artist.graduation_year?.toString() ?? "",
                        owner_email: "",
                        clear_owner_link: false,
                        is_published: artist.is_published,
                      })}
                      type="button"
                    >
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "Artwork" && (
            <section className={styles.sectionGrid}>
              <div className={styles.panel}>
                <h2>{artworkForm.id ? "Edit artwork" : "Add artwork"}</h2>
                {data.artists.length === 0 ? (
                  <p className={styles.notice}>Add an artist profile before adding artwork.</p>
                ) : (
                  <form className={styles.editor} onSubmit={saveArtwork}>
                    <label>
                      Artist
                      <select
                        onChange={(event) => setArtworkForm({ ...artworkForm, artist_id: event.target.value })}
                        required
                        value={artworkForm.artist_id}
                      >
                        <option value="">Choose an artist</option>
                        {data.artists.map((artist) => (
                          <option key={artist.id} value={artist.id}>{artist.display_name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Artwork title
                      <input
                        maxLength={160}
                        onChange={(event) => setArtworkForm({ ...artworkForm, title: event.target.value })}
                        required
                        value={artworkForm.title}
                      />
                    </label>
                    <label>
                      Medium
                      <input
                        maxLength={80}
                        onChange={(event) => setArtworkForm({ ...artworkForm, medium: event.target.value })}
                        required
                        value={artworkForm.medium}
                      />
                    </label>
                    <label>
                      Year
                      <input
                        max="2200"
                        min="1800"
                        onChange={(event) => setArtworkForm({ ...artworkForm, year: event.target.value })}
                        type="number"
                        value={artworkForm.year}
                      />
                    </label>
                    <label>
                      Price (CAD, optional)
                      <input
                        min="0"
                        onChange={(event) => setArtworkForm({ ...artworkForm, price_cad: event.target.value })}
                        type="number"
                        value={artworkForm.price_cad}
                      />
                    </label>
                    <label>
                      Artwork image URL
                      <input
                        maxLength={2048}
                        onChange={(event) => setArtworkForm({ ...artworkForm, image_url: event.target.value })}
                        required={!image.file}
                        type="text"
                        value={artworkForm.image_url}
                      />
                    </label>
                    <ArtworkImageUpload
                      disabled={isSaving}
                      file={image.file}
                      inputKey={image.inputKey}
                      onChange={image.setFile}
                    />
                    <label>
                      Image description (alt text)
                      <input
                        maxLength={300}
                        onChange={(event) => setArtworkForm({ ...artworkForm, image_alt: event.target.value })}
                        required
                        value={artworkForm.image_alt}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        maxLength={2000}
                        onChange={(event) => setArtworkForm({ ...artworkForm, description: event.target.value })}
                        value={artworkForm.description}
                      />
                    </label>
                    <label className={styles.checkRow}>
                      <input
                        checked={artworkForm.is_published}
                        onChange={(event) => setArtworkForm({ ...artworkForm, is_published: event.target.checked })}
                        type="checkbox"
                      />
                      Publish artwork
                    </label>
                    <div className={styles.formActions}>
                      <button className={styles.primaryButton} disabled={isSaving} type="submit">
                        {artworkForm.id ? "Save artwork" : "Add artwork"}
                      </button>
                      {artworkForm.id && (
                        <button
                          className={styles.secondaryButton}
                          disabled={isSaving}
                          onClick={() => {
                            setArtworkForm(blankArtwork);
                            image.resetFile();
                          }}
                          type="button"
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
              <div className={styles.records}>
                <h2>Artwork ({data.artworks.length})</h2>
                {data.artworks.length === 0 && <p className={styles.notice}>No artwork yet.</p>}
                {data.artworks.map((artwork) => {
                  const artist = data.artists.find((item) => item.id === artwork.artist_id);
                  return (
                    <article className={styles.record} key={artwork.id}>
                      <div className={styles.recordHeader}>
                        <strong>{artwork.title}</strong>
                        <span className={styles.status}>
                          {artwork.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p>{artist?.display_name ?? "Unknown artist"} · {artwork.medium}</p>
                      <button
                        className={styles.secondaryButton}
                        disabled={isSaving}
                        onClick={() => {
                          image.resetFile();
                          setArtworkForm({
                            id: artwork.id,
                            artist_id: artwork.artist_id,
                            title: artwork.title,
                            medium: artwork.medium,
                            description: artwork.description ?? "",
                            image_url: artwork.image_url,
                            image_alt: artwork.image_alt,
                            year: artwork.year?.toString() ?? "",
                            price_cad: artwork.price_cad?.toString() ?? "",
                            is_published: artwork.is_published,
                          });
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
