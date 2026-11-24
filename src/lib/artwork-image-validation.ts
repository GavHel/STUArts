export const MAX_ARTWORK_IMAGE_BYTES = 5 * 1024 * 1024;
export const ARTWORK_IMAGE_BUCKET = "stuarts-artwork-uploads";
export const ARTWORK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export async function validateArtworkImage(file: File) {
  if (file.size === 0 || file.size > MAX_ARTWORK_IMAGE_BYTES) {
    return { ok: false as const, error: "Choose an image no larger than 5 MB." };
  }
  if (!ARTWORK_IMAGE_TYPES.some((type) => type === file.type)) {
    return { ok: false as const, error: "Choose a JPEG, PNG, or WebP image." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const isWebp = bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (
    (file.type === "image/jpeg" && !isJpeg) ||
    (file.type === "image/png" && !isPng) ||
    (file.type === "image/webp" && !isWebp)
  ) {
    return { ok: false as const, error: "The image contents do not match its file type." };
  }
  return { ok: true as const, bytes, contentType: file.type };
}

export function artworkImagePath(id: string) {
  return `/api/artwork-images/${id}`;
}

export function isArtworkImagePath(value: string) {
  return /^\/api\/artwork-images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

export function mayReadArtworkImage(
  artworkPublished: boolean,
  artistPublished: boolean,
  ownerId: string | null,
  viewer: { userId: string; isAdmin: boolean } | null,
) {
  return (artworkPublished && artistPublished) ||
    (viewer !== null && (viewer.isAdmin || ownerId === viewer.userId));
}
