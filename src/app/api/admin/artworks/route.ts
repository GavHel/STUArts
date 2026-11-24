import { requireAdmin } from "@/lib/supabase/admin";
import {
  readBoolean,
  readOptionalInteger,
  readText,
} from "@/lib/admin/request-body";
import {
  readArtworkImageUrl,
  readArtworkSubmission,
  removeFailedUpload,
  uploadArtworkImage,
  verifyExistingImage,
} from "@/lib/admin/artwork-upload";

export async function POST(request: Request) {
  return saveArtwork(request, false);
}

export async function PATCH(request: Request) {
  return saveArtwork(request, true);
}

async function saveArtwork(request: Request, updating: boolean) {
  const access = await requireAdmin();
  if (!access.ok) {
    return Response.json({ error: access.message }, { status: access.status });
  }

  const parsed = await readArtworkSubmission(request);
  if (!parsed.ok) return parsed.response;
  const id = readText(parsed.value, "id", 64, updating);
  const artistId = readText(parsed.value, "artist_id", 64, true);
  const title = readText(parsed.value, "title", 160, true);
  const medium = readText(parsed.value, "medium", 80, true);
  const description = readText(parsed.value, "description", 2000);
  const imageUrl = parsed.image
    ? { ok: true as const, value: null }
    : readArtworkImageUrl(parsed.value);
  const imageAlt = readText(parsed.value, "image_alt", 300, true);
  const year = readOptionalInteger(parsed.value, "year", 1800, 2200);
  const price = readOptionalInteger(parsed.value, "price_cad", 0, 1_000_000);
  const isPublished = readBoolean(parsed.value, "is_published");

  if (!id.ok) return Response.json({ error: id.error }, { status: 400 });
  if (!artistId.ok) return Response.json({ error: artistId.error }, { status: 400 });
  if (!title.ok) return Response.json({ error: title.error }, { status: 400 });
  if (!medium.ok) return Response.json({ error: medium.error }, { status: 400 });
  if (!description.ok) return Response.json({ error: description.error }, { status: 400 });
  if (!imageUrl.ok) return Response.json({ error: imageUrl.error }, { status: 400 });
  if (!imageAlt.ok) return Response.json({ error: imageAlt.error }, { status: 400 });
  if (!year.ok) return Response.json({ error: year.error }, { status: 400 });
  if (!price.ok) return Response.json({ error: price.error }, { status: 400 });
  if (!isPublished.ok) return Response.json({ error: isPublished.error }, { status: 400 });
  if (!parsed.image && !imageUrl.value) {
    return Response.json({ error: "Upload an image or enter a valid image URL." }, { status: 400 });
  }
  if (updating && !/^[0-9a-f-]{36}$/i.test(id.value)) {
    return Response.json({ error: "Artwork ID is invalid." }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(artistId.value)) {
    return Response.json({ error: "Choose a valid artist." }, { status: 400 });
  }

  if (!parsed.image && imageUrl.value) {
    const invalid = await verifyExistingImage(access.database, imageUrl.value, updating ? id.value : "");
    if (invalid) return invalid;
  }

  let uploadedId: string | null = null;
  let finalImageUrl = imageUrl.value;
  if (parsed.image) {
    const uploaded = await uploadArtworkImage(access.database, parsed.image);
    if (!uploaded.ok) return uploaded.response;
    uploadedId = uploaded.id;
    finalImageUrl = uploaded.url;
  }
  if (!finalImageUrl) {
    return Response.json({ error: "An artwork image is required." }, { status: 400 });
  }

  const values = {
    artist_id: artistId.value,
    title: title.value,
    medium: medium.value,
    description: description.value || null,
    image_url: finalImageUrl,
    image_alt: imageAlt.value,
    year: year.value,
    price_cad: price.value,
    is_published: isPublished.value,
    updated_at: new Date().toISOString(),
  };
  try {
    const query = updating
      ? access.database.from("artworks").update(values).eq("id", id.value)
      : access.database.from("artworks").insert(values);
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data) {
      if (error) {
        console.error("Unable to save artwork.", error);
        return Response.json({ error: "We could not save this artwork." }, { status: 500 });
      }
      if (uploadedId) await removeFailedUpload(access.database, uploadedId);
      return Response.json({ error: "Artwork not found." }, { status: 404 });
    }
    return Response.json({ ok: true, id: data.id }, { status: updating ? 200 : 201 });
  } catch (error) {
    console.error("Unable to save artwork.", error);
    return Response.json({ error: "We could not save this artwork." }, { status: 500 });
  }
}
