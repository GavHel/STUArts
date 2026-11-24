import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_ARTWORK_IMAGE_BYTES,
  artworkImagePath,
  isArtworkImagePath,
  mayReadArtworkImage,
  validateArtworkImage,
} from "../src/lib/artwork-image-validation.ts";

test("artwork image validation accepts supported image signatures", async () => {
  const images = [
    ["image/jpeg", [0xff, 0xd8, 0xff]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
  ];
  for (const [type, bytes] of images) {
    const result = await validateArtworkImage(new File([new Uint8Array(bytes)], "art", { type }));
    assert.equal(result.ok, true, type);
  }
});

test("artwork image validation enforces content type and five MiB limit", async () => {
  const image = new Uint8Array(MAX_ARTWORK_IMAGE_BYTES);
  image.set([0xff, 0xd8, 0xff]);
  assert.equal((await validateArtworkImage(new File([image], "art.jpg", { type: "image/jpeg" }))).ok, true);
  assert.equal((await validateArtworkImage(new File([image, "x"], "art.jpg", { type: "image/jpeg" }))).ok, false);
  assert.equal((await validateArtworkImage(new File([], "empty.jpg", { type: "image/jpeg" }))).ok, false);
  assert.equal((await validateArtworkImage(new File([image], "wrong.png", { type: "image/png" }))).ok, false);
  assert.equal((await validateArtworkImage(new File([image], "art.svg", { type: "image/svg+xml" }))).ok, false);
});

test("only published artwork of published artists is public", () => {
  const owner = { userId: "owner", isAdmin: false };
  const admin = { userId: "admin", isAdmin: true };
  const stranger = { userId: "stranger", isAdmin: false };
  assert.equal(mayReadArtworkImage(true, true, "owner", null), true);
  for (const [artworkPublished, artistPublished] of [[false, true], [true, false], [false, false]]) {
    assert.equal(mayReadArtworkImage(artworkPublished, artistPublished, "owner", null), false);
    assert.equal(mayReadArtworkImage(artworkPublished, artistPublished, "owner", stranger), false);
    assert.equal(mayReadArtworkImage(artworkPublished, artistPublished, "owner", owner), true);
    assert.equal(mayReadArtworkImage(artworkPublished, artistPublished, "owner", admin), true);
  }
});

test("uploaded image paths accept only generated UUID paths", () => {
  assert.equal(isArtworkImagePath(artworkImagePath("12345678-1234-4234-8234-123456789abc")), true);
  assert.equal(isArtworkImagePath("/api/artwork-images/../../private"), false);
  assert.equal(isArtworkImagePath("/api/artwork-images/not-a-uuid"), false);
});
