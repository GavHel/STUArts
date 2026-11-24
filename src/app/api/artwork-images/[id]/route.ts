import {
  ARTWORK_IMAGE_BUCKET,
  ARTWORK_IMAGE_TYPES,
  artworkImagePath,
  isArtworkImagePath,
  mayReadArtworkImage,
} from "@/lib/artwork-image-validation";
import { requireUser } from "@/lib/supabase/access";
import { createServiceRoleClient, isAdminEmail } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = artworkImagePath(id);
  if (!isArtworkImagePath(url)) {
    return new Response("Not found", { status: 404 });
  }
  const database = createServiceRoleClient();
  if (!database) {
    return new Response("Artwork storage is not configured.", { status: 503 });
  }

  const { data: artwork, error: artworkError } = await database
    .from("artworks")
    .select("artist_id, is_published")
    .eq("image_url", url)
    .maybeSingle();
  if (artworkError) {
    console.error("Unable to verify artwork image access.", artworkError);
    return new Response("Artwork image is unavailable.", { status: 503 });
  }
  if (!artwork) return new Response("Not found", { status: 404 });

  const { data: artist, error: artistError } = await database
    .from("artists")
    .select("is_published, owner_user_id")
    .eq("id", artwork.artist_id)
    .maybeSingle();
  if (artistError) {
    console.error("Unable to verify artwork image artist.", artistError);
    return new Response("Artwork image is unavailable.", { status: 503 });
  }
  if (!artist) return new Response("Not found", { status: 404 });

  if (!mayReadArtworkImage(artwork.is_published, artist.is_published, artist.owner_user_id, null)) {
    const user = await requireUser();
    if (!user.ok) {
      return user.status === 503
        ? new Response("Artwork image is unavailable.", { status: 503 })
        : new Response("Not found", { status: 404 });
    }
    if (!mayReadArtworkImage(artwork.is_published, artist.is_published, artist.owner_user_id, {
      userId: user.userId,
      isAdmin: isAdminEmail(user.email),
    })) {
      return new Response("Not found", { status: 404 });
    }
  }

  const { data, error } = await database.storage.from(ARTWORK_IMAGE_BUCKET).download(id);
  if (error || !data) {
    console.error("Unable to download artwork image.", error);
    return new Response("Artwork image is unavailable.", { status: 503 });
  }
  if (!ARTWORK_IMAGE_TYPES.some((type) => type === data.type)) {
    console.error("Artwork image has an unexpected content type.");
    return new Response("Artwork image is unavailable.", { status: 503 });
  }
  return new Response(data, {
    headers: {
      "Content-Type": data.type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
