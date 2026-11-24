import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as validation from "../src/lib/artwork-image-validation.ts";

function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  const requireMock = (name) => {
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function("require", "module", "exports", javascript)(requireMock, loaded, loaded.exports);
  return loaded.exports;
}

const requestBody = loadModule("../src/lib/admin/request-body.ts");
const upload = loadModule("../src/lib/admin/artwork-upload.ts", {
  "server-only": {},
  "@/lib/artwork-image-validation": validation,
  "./request-body": requestBody,
});

test("artwork forms accept JSON and validate multipart images", async () => {
  const payload = { title: "Test", image_url: "" };
  const json = new Request("http://localhost/artwork", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const parsedJson = await upload.readArtworkSubmission(json);
  assert.equal(parsedJson.ok, true);
  assert.deepEqual(parsedJson.value, payload);
  assert.equal(parsedJson.image, null);

  const form = new FormData();
  form.append("data", JSON.stringify(payload));
  form.append("image", new File([new Uint8Array([0xff, 0xd8, 0xff])], "art.jpg", { type: "image/jpeg" }));
  const parsedForm = await upload.readArtworkSubmission(new Request("http://localhost/artwork", {
    method: "POST",
    body: form,
  }));
  assert.equal(parsedForm.ok, true);
  assert.deepEqual(parsedForm.value, payload);
  assert.equal(parsedForm.image.contentType, "image/jpeg");

  const invalid = new FormData();
  invalid.append("data", JSON.stringify(payload));
  invalid.append("image", new File(["not a JPEG"], "art.jpg", { type: "image/jpeg" }));
  const rejected = await upload.readArtworkSubmission(new Request("http://localhost/artwork", {
    method: "POST",
    body: invalid,
  }));
  assert.equal(rejected.ok, false);
  assert.equal(rejected.response.status, 400);
});

test("uploads refuse a public storage bucket", async () => {
  let uploaded = false;
  const database = {
    storage: {
      getBucket: async () => ({ data: { public: true }, error: null }),
      from: () => ({ upload: async () => { uploaded = true; return { error: null }; } }),
    },
  };
  const result = await upload.uploadArtworkImage(database, {
    bytes: new Uint8Array([0xff, 0xd8, 0xff]),
    contentType: "image/jpeg",
  });
  assert.equal(result.ok, false);
  assert.equal(result.response.status, 503);
  assert.equal(uploaded, false);
});

test("artist artwork form uploads and saves a private draft", async () => {
  let saved;
  let uploaded;
  const database = {
    storage: {
      getBucket: async () => ({ data: { public: false }, error: null }),
      from: () => ({
        upload: async (id, bytes, options) => {
          uploaded = { id, bytes, options };
          return { error: null };
        },
      }),
    },
    from: () => ({
      insert: (values) => {
        saved = values;
        return { select: () => ({ maybeSingle: async () => ({ data: { id: "artwork" }, error: null }) }) };
      },
    }),
  };
  const { POST } = loadModule("../src/app/api/artist/artworks/route.ts", {
    "@/lib/supabase/access": {
      requireArtist: async () => ({ ok: true, database, artist: { id: "artist" } }),
    },
    "@/lib/admin/request-body": requestBody,
    "@/lib/admin/artwork-upload": upload,
  });
  const form = new FormData();
  form.append("data", JSON.stringify({
    id: "",
    title: "Test painting",
    medium: "Painting",
    description: "",
    image_url: "",
    image_alt: "A test painting",
    year: null,
    price_cad: null,
  }));
  form.append("image", new File([new Uint8Array([0xff, 0xd8, 0xff])], "art.jpg", { type: "image/jpeg" }));
  const response = await POST(new Request("http://localhost/api/artist/artworks", {
    method: "POST",
    body: form,
  }));
  assert.equal(response.status, 201);
  assert.equal(saved.artist_id, "artist");
  assert.equal(saved.is_published, false);
  assert.equal(saved.image_url, validation.artworkImagePath(uploaded.id));
  assert.equal(uploaded.options.contentType, "image/jpeg");
});

function imageRoute(state) {
  const database = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: state[table], error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        download: async () => {
          state.downloads++;
          return { data: new Blob(["image"], { type: "image/jpeg" }), error: null };
        },
      }),
    },
  };
  return loadModule("../src/app/api/artwork-images/[id]/route.ts", {
    "@/lib/artwork-image-validation": validation,
    "@/lib/supabase/access": { requireUser: async () => state.user },
    "@/lib/supabase/admin": {
      createServiceRoleClient: () => database,
      isAdminEmail: (email) => email === "admin@example.com",
    },
  }).GET;
}

test("image route gates private drafts before downloading", async () => {
  const id = "12345678-1234-4234-8234-123456789abc";
  const state = {
    artworks: { artist_id: "artist", is_published: false },
    artists: { is_published: true, owner_user_id: "owner" },
    user: { ok: false, status: 401 },
    downloads: 0,
  };
  const get = imageRoute(state);
  const request = () => get(new Request(`http://localhost/api/artwork-images/${id}`), {
    params: Promise.resolve({ id }),
  });
  assert.equal((await request()).status, 404);
  state.user = { ok: true, userId: "other", email: "other@example.com" };
  assert.equal((await request()).status, 404);
  assert.equal(state.downloads, 0);

  state.user = { ok: true, userId: "owner", email: "owner@example.com" };
  const ownerResponse = await request();
  assert.equal(ownerResponse.status, 200);
  assert.equal(ownerResponse.headers.get("cache-control"), "private, no-store");
  state.user = { ok: true, userId: "admin", email: "admin@example.com" };
  assert.equal((await request()).status, 200);

  state.artworks.is_published = true;
  state.artists.is_published = false;
  state.user = { ok: false, status: 401 };
  assert.equal((await request()).status, 404);
  state.artists.is_published = true;
  assert.equal((await request()).status, 200);
  assert.equal(state.downloads, 3);
});
