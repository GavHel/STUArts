import assert from "node:assert/strict";
import test from "node:test";
import { createWallArtwork, exportWallUsdz } from "../src/lib/wall-artwork-model.ts";

test("wall models preserve the image aspect ratio and export a textured USDZ without floor-only anchoring", async () => {
  class TestImage {
    naturalWidth = 400;
    naturalHeight = 200;
    width = 400;
    height = 200;
  }
  globalThis.HTMLImageElement = TestImage;
  globalThis.document = {
    createElement() {
      return {
        getContext: () => ({ drawImage() {}, translate() {}, scale() {} }),
        toBlob: (callback) => callback(new Blob(["test texture"], { type: "image/png" })),
      };
    },
  };
  const model = createWallArtwork(new TestImage(), 24);
  try {
    const geometry = model.scene.children[0].geometry;
    assert.ok(Math.abs(geometry.parameters.width - 0.6096) < 0.00001);
    assert.ok(Math.abs(geometry.parameters.height - 0.3048) < 0.00001);
    const usdz = new Uint8Array(await exportWallUsdz(model.scene));
    const text = Buffer.from(usdz).toString("latin1");
    assert.equal(text.slice(0, 2), "PK");
    assert.match(text, /geometries\/Geometry_/);
    assert.match(text, /textures\/Texture_/);
    assert.doesNotMatch(text, /preliminary:planeAnchoring:alignment/);
  } finally {
    model.dispose();
    delete globalThis.HTMLImageElement;
    delete globalThis.document;
  }
});
