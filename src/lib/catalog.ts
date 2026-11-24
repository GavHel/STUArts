import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Artist, Artwork, Database } from "./supabase/database.types";
import { getSupabasePublicConfig, SupabaseConfigError } from "./supabase/config";

export type PublishedArtist = Pick<
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
>;

export type PublishedArtwork = Pick<
  Artwork,
  | "id"
  | "artist_id"
  | "title"
  | "medium"
  | "description"
  | "image_url"
  | "image_alt"
  | "year"
  | "price_cad"
>;

export type PublishedCatalog =
  | { status: "ready"; artists: PublishedArtist[]; artworks: PublishedArtwork[] }
  | { status: "unavailable"; message: string };

function createPublicClient() {
  const { url, key } = getSupabasePublicConfig();
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getPublishedCatalog(): Promise<PublishedCatalog> {
  let supabase;
  try {
    supabase = createPublicClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        status: "unavailable",
        message: "The live artist catalog is not configured yet.",
      };
    }
    throw error;
  }

  const [artists, artworks] = await Promise.all([
    supabase
      .from("artists")
      .select("id, slug, display_name, university, program, location, bio, profile_image_url, graduation_year")
      .eq("is_published", true)
      .order("display_name"),
    supabase
      .from("artworks")
      .select("id, artist_id, title, medium, description, image_url, image_alt, year, price_cad")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);
  const error = artists.error ?? artworks.error;
  if (error) {
    console.error("Unable to load the published artist catalog.", error);
    return {
      status: "unavailable",
      message: "The live catalog could not be loaded. Showing the demo portfolio instead.",
    };
  }

  return {
    status: "ready",
    artists: artists.data ?? [],
    artworks: artworks.data ?? [],
  };
}

export async function getPublishedArtist(slug: string) {
  let supabase;
  try {
    supabase = createPublicClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return { status: "unavailable" as const };
    }
    throw error;
  }

  const { data: artist, error } = await supabase
    .from("artists")
    .select("id, slug, display_name, university, program, location, bio, profile_image_url, graduation_year")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    console.error("Unable to load published artist profile.", error);
    return { status: "unavailable" as const };
  }
  if (!artist) return { status: "ready" as const, artist: null, artworks: [] };

  const { data: artworks, error: artworkError } = await supabase
    .from("artworks")
    .select("id, artist_id, title, medium, description, image_url, image_alt, year, price_cad")
    .eq("artist_id", artist.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (artworkError) {
    console.error("Unable to load published artist artwork.", artworkError);
    return { status: "unavailable" as const };
  }

  return { status: "ready" as const, artist, artworks };
}
