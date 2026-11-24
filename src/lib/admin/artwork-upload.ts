import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ARTWORK_IMAGE_BUCKET,
  MAX_ARTWORK_IMAGE_BYTES,
  artworkImagePath,
  isArtworkImagePath,
  validateArtworkImage,
} from "@/lib/artwork-image-validation";
import type { Database } from "@/lib/supabase/database.types";
import { readJsonObject, readOptionalUrl, readText } from "./request-body";

const MAX_FORM_BYTES = MAX_ARTWORK_IMAGE_BYTES + 64 * 1024;

export async function readArtworkSubmission(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    const parsed = await readJsonObject(request);
    return parsed.ok ? { ...parsed, image: null } : parsed;
  }

  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_FORM_BYTES) {
    return { ok: false as const, response: Response.json({ error: "Image must be no larger than 5 MB." }, { status: 413 }) };
  }
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false as const, response: Response.json({ error: "An artwork form is required." }, { status: 400 }) };
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_FORM_BYTES) {
        await reader.cancel();
        return { ok: false as const, response: Response.json({ error: "Image must be no larger than 5 MB." }, { status: 413 }) };
      }
      chunks.push(value);
    }
  } catch (error) {
    console.error("Unable to read artwork upload.", error);
    return { ok: false as const, response: Response.json({ error: "We could not read the artwork form." }, { status: 400 }) };
  } finally {
    reader.releaseLock();
  }

  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    return { ok: false as const, response: Response.json({ error: "The artwork form is invalid." }, { status: 400 }) };
  }
  const data = form.get("data");
  const image = form.get("image");
  if (typeof data !== "string" || !(image instanceof File)) {
    return { ok: false as const, response: Response.json({ error: "An artwork form and image are required." }, { status: 400 }) };
  }
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return { ok: false as const, response: Response.json({ error: "The artwork details are invalid." }, { status: 400 }) };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false as const, response: Response.json({ error: "The artwork details are invalid." }, { status: 400 }) };
  }
  const validatedImage = await validateArtworkImage(image);
  if (!validatedImage.ok) {
    return { ok: false as const, response: Response.json({ error: validatedImage.error }, { status: 400 }) };
  }
  return { ok: true as const, value: value as Record<string, unknown>, image: validatedImage };
}

export function readArtworkImageUrl(body: Record<string, unknown>) {
  const text = readText(body, "image_url", 2048);
  if (!text.ok) return text;
  if (isArtworkImagePath(text.value)) return { ok: true as const, value: text.value };
  return readOptionalUrl(body, "image_url");
}

export async function verifyExistingImage(
  database: SupabaseClient<Database>,
  imageUrl: string,
  artworkId: string,
  ownerArtistId?: string,
) {
  if (!isArtworkImagePath(imageUrl)) return null;
  if (!artworkId) return Response.json({ error: "Upload an image for this artwork." }, { status: 400 });
  let query = database.from("artworks").select("image_url").eq("id", artworkId);
  if (ownerArtistId) query = query.eq("artist_id", ownerArtistId);
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("Unable to verify artwork image.", error);
    return Response.json({ error: "We could not verify the current artwork image." }, { status: 500 });
  }
  if (!data || data.image_url !== imageUrl) {
    return Response.json({ error: "The current artwork image could not be verified." }, { status: 400 });
  }
  return null;
}

export async function uploadArtworkImage(
  database: SupabaseClient<Database>,
  image: { bytes: Uint8Array; contentType: string },
) {
  const { data: bucket, error: bucketError } = await database.storage.getBucket(ARTWORK_IMAGE_BUCKET);
  if (bucketError || !bucket || bucket.public) {
    console.error("Artwork storage is unavailable or not private.", bucketError);
    return { ok: false as const, response: Response.json({ error: "Private artwork storage is not configured. Run the artwork uploads migration." }, { status: 503 }) };
  }
  const id = crypto.randomUUID();
  const { error } = await database.storage.from(ARTWORK_IMAGE_BUCKET).upload(id, image.bytes, {
    contentType: image.contentType,
    upsert: false,
  });
  if (error) {
    console.error("Unable to upload artwork image.", error);
    return { ok: false as const, response: Response.json({ error: "Image upload failed. Check that artwork storage is configured." }, { status: 500 }) };
  }
  return { ok: true as const, id, url: artworkImagePath(id) };
}

export async function removeFailedUpload(database: SupabaseClient<Database>, id: string) {
  const { error } = await database.storage.from(ARTWORK_IMAGE_BUCKET).remove([id]);
  if (error) console.error("Unable to clean up failed artwork upload.", error);
}
