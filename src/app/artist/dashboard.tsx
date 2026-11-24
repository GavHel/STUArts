"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Artist, Artwork, CommissionRequest } from "@/lib/supabase/database.types";
import { ArtworkImageUpload, artworkRequestBody, imageFileError, useArtworkImage } from "../artwork-image-upload";
import styles from "../admin/admin.module.css";

type ArtistProfile = Pick<
  Artist,
  | "id"
  | "slug"
  | "display_name"
  | "university"
  | "program"
  | "location"
  | "bio"
  | "profile_image_url"
  | "graduation_year"
  | "is_published"
>;

type ArtistRequest = Pick<
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
  | "requester_name"
  | "requester_email"
  | "estimated_total_cad"
  | "estimated_studio_time"
  | "request_status"
  | "artist_response"
  | "artist_responded_at"
  | "created_at"
  | "updated_at"
>;

type ArtistDashboardData = {
  email: string | null;
  artist: ArtistProfile;
  artworks: Artwork[];
  requests: ArtistRequest[];
};

type ProfileForm = {
  display_name: string;
  university: string;
  program: string;
  location: string;
  bio: string;
  profile_image_url: string;
  graduation_year: string;
};

type ArtworkForm = {
  id: string;
  title: string;
  medium: string;
  description: string;
  image_url: string;
  image_alt: string;
  year: string;
  price_cad: string;
};

const blankArtwork: ArtworkForm = {
  id: "",
  title: "",
  medium: "",
  description: "",
  image_url: "",
  image_alt: "",
  year: "",
  price_cad: "",
};

function isArtistDashboardData(value: unknown): value is ArtistDashboardData {
  return (
    typeof value === "object" &&
    value !== null &&
    "artist" in value &&
    typeof value.artist === "object" &&
    value.artist !== null &&
    "artworks" in value &&
    Array.isArray(value.artworks) &&
    "requests" in value &&
    Array.isArray(value.requests)
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

export function ArtistDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ArtistDashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [artwork, setArtwork] = useState<ArtworkForm>(blankArtwork);
  const image = useArtworkImage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/artist/dashboard", { cache: "no-store" });
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
            : "Artist workspace data could not be loaded.";
        throw new Error(detail);
      }
      if (!isArtistDashboardData(result)) {
        throw new Error("The artist workspace returned unexpected data.");
      }
      setData(result);
      setProfile({
        display_name: result.artist.display_name,
        university: result.artist.university ?? "",
        program: result.artist.program ?? "",
        location: result.artist.location ?? "",
        bio: result.artist.bio ?? "",
        profile_image_url: result.artist.profile_image_url ?? "",
        graduation_year: result.artist.graduation_year?.toString() ?? "",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Artist workspace data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await sendJson("/api/artist/profile", "PATCH", {
        ...profile,
        graduation_year: profile.graduation_year ? Number(profile.graduation_year) : null,
      });
      setMessage("Profile saved.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profile could not be saved.");
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
        "/api/artist/artworks",
        artwork.id ? "PATCH" : "POST",
        {
          ...artwork,
          year: artwork.year ? Number(artwork.year) : null,
          price_cad: artwork.price_cad ? Number(artwork.price_cad) : null,
        },
        image.file,
      );
      setArtwork(blankArtwork);
      image.resetFile();
      setMessage("Artwork saved. New work is saved as a draft for admin review.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Artwork could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await sendJson("/api/artist/requests", "PATCH", {
        id: values.get("id"),
        request_status: values.get("request_status"),
        artist_response: values.get("artist_response"),
      });
      setMessage("Commission response saved.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Commission response could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

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
    return <p className={styles.notice}>Loading artist workspace...</p>;
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.workspaceTop}>
        <div>
          <p className={styles.eyebrow}>ARTIST WORKSPACE</p>
          <h1>{data?.artist.display_name ?? "Artist workspace"}</h1>
          <p>{data?.email ?? "Artist account access"}</p>
        </div>
        <button className={styles.signOutButton} onClick={signOut} type="button">
          Sign out
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.success} role="status">{message}</p>}
      {data && (
        <p className={styles.notice}>
          <a href="#commission-requests">View commission requests ({data.requests.length}) ↓</a>
        </p>
      )}
      {!data && error.includes("not linked") ? (
        <p className={styles.notice}>
          Your artist profile must be linked by a STUArts admin. Return to{" "}
          <a href="/account">your account</a> after it has been linked.
        </p>
      ) : null}

      {data && profile ? (
        <>
          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2>Your profile</h2>
              <span className={styles.status}>
                {data.artist.is_published ? "Published" : "Awaiting publication"}
              </span>
            </div>
            {!data.artist.is_published ? (
              <p className={styles.notice}>An admin will publish your profile when it is ready.</p>
            ) : null}
            <form className={styles.editor} onSubmit={saveProfile}>
              <label>
                Display name
                <input
                  maxLength={120}
                  onChange={(event) => setProfile({ ...profile, display_name: event.target.value })}
                  required
                  value={profile.display_name}
                />
              </label>
              <label>
                University
                <input
                  maxLength={160}
                  onChange={(event) => setProfile({ ...profile, university: event.target.value })}
                  value={profile.university}
                />
              </label>
              <label>
                Program
                <input
                  maxLength={120}
                  onChange={(event) => setProfile({ ...profile, program: event.target.value })}
                  value={profile.program}
                />
              </label>
              <label>
                Location
                <input
                  maxLength={120}
                  onChange={(event) => setProfile({ ...profile, location: event.target.value })}
                  value={profile.location}
                />
              </label>
              <label>
                Graduation year
                <input
                  max="2200"
                  min="2000"
                  onChange={(event) => setProfile({ ...profile, graduation_year: event.target.value })}
                  type="number"
                  value={profile.graduation_year}
                />
              </label>
              <label>
                Profile image URL
                <input
                  maxLength={2048}
                  onChange={(event) => setProfile({ ...profile, profile_image_url: event.target.value })}
                  type="url"
                  value={profile.profile_image_url}
                />
              </label>
              <label>
                Artist bio
                <textarea
                  maxLength={3000}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  value={profile.bio}
                />
              </label>
              <button className={styles.primaryButton} disabled={isSaving} type="submit">
                Save profile
              </button>
            </form>
          </section>

          <section className={styles.sectionGrid}>
            <div className={styles.panel}>
              <h2>{artwork.id ? "Edit artwork" : "Add artwork"}</h2>
              <form className={styles.editor} onSubmit={saveArtwork}>
                <label>
                  Title
                  <input
                    maxLength={160}
                    onChange={(event) => setArtwork({ ...artwork, title: event.target.value })}
                    required
                    value={artwork.title}
                  />
                </label>
                <label>
                  Medium
                  <input
                    maxLength={80}
                    onChange={(event) => setArtwork({ ...artwork, medium: event.target.value })}
                    required
                    value={artwork.medium}
                  />
                </label>
                <label>
                  Year
                  <input
                    max="2200"
                    min="1800"
                    onChange={(event) => setArtwork({ ...artwork, year: event.target.value })}
                    type="number"
                    value={artwork.year}
                  />
                </label>
                <label>
                  Price (CAD, optional)
                  <input
                    min="0"
                    onChange={(event) => setArtwork({ ...artwork, price_cad: event.target.value })}
                    type="number"
                    value={artwork.price_cad}
                  />
                </label>
                <label>
                  Image URL
                  <input
                    maxLength={2048}
                    onChange={(event) => setArtwork({ ...artwork, image_url: event.target.value })}
                    required={!image.file}
                    type="text"
                    value={artwork.image_url}
                  />
                </label>
                <ArtworkImageUpload
                  disabled={isSaving}
                  file={image.file}
                  inputKey={image.inputKey}
                  onChange={image.setFile}
                />
                <label>
                  Image description
                  <input
                    maxLength={300}
                    onChange={(event) => setArtwork({ ...artwork, image_alt: event.target.value })}
                    required
                    value={artwork.image_alt}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    maxLength={2000}
                    onChange={(event) => setArtwork({ ...artwork, description: event.target.value })}
                    value={artwork.description}
                  />
                </label>
                <div className={styles.formActions}>
                  <button className={styles.primaryButton} disabled={isSaving} type="submit">
                    {artwork.id ? "Save artwork" : "Add as draft"}
                  </button>
                  {artwork.id ? (
                    <button
                      className={styles.secondaryButton}
                      disabled={isSaving}
                      onClick={() => {
                        setArtwork(blankArtwork);
                        image.resetFile();
                      }}
                      type="button"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
            <div className={styles.records}>
              <h2>Your artwork ({data.artworks.length})</h2>
              {data.artworks.length === 0 ? <p className={styles.notice}>No artwork yet.</p> : null}
              {data.artworks.map((item) => (
                <article className={styles.record} key={item.id}>
                  <div className={styles.recordHeader}>
                    <strong>{item.title}</strong>
                    <span className={styles.status}>{item.is_published ? "Published" : "Draft"}</span>
                  </div>
                  <p>{item.medium}</p>
                  <button
                    className={styles.secondaryButton}
                    disabled={isSaving}
                    onClick={() => {
                      image.resetFile();
                      setArtwork({
                        id: item.id,
                        title: item.title,
                        medium: item.medium,
                        description: item.description ?? "",
                        image_url: item.image_url,
                        image_alt: item.image_alt,
                        year: item.year?.toString() ?? "",
                        price_cad: item.price_cad?.toString() ?? "",
                      });
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.requestList} aria-label="Commission requests" id="commission-requests">
            <div className={styles.sectionHeader}>
              <h2>Commission requests ({data.requests.length})</h2>
            </div>
            {data.requests.length === 0 ? (
              <p className={styles.notice}>No commission requests for your profile yet.</p>
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
                    <span className={styles.status}>{request.request_status.replaceAll("_", " ")}</span>
                  </div>
                  <div className={styles.requestMeta}>
                    <span>Estimate: ${request.estimated_total_cad} CAD</span>
                    <span>Timeline: {request.estimated_studio_time}</span>
                    <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                  {request.project_brief ? <p>{request.project_brief}</p> : null}
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
                      Response for the customer
                      <textarea
                        defaultValue={request.artist_response ?? ""}
                        maxLength={2000}
                        name="artist_response"
                      />
                    </label>
                    <button className={styles.primaryButton} disabled={isSaving} type="submit">
                      Save response
                    </button>
                  </form>
                </article>
              ))
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
