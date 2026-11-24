import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", javascript)((name) => {
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }, loaded, loaded.exports);
  return loaded.exports;
}

const requestBody = loadModule("../src/lib/admin/request-body.ts");
const requests = [
  { id: "00000000-0000-4000-8000-000000000001", artist_slug: "artist-a", medium: "Painting", created_at: "2026-01-02T00:00:00Z" },
  { id: "00000000-0000-4000-8000-000000000002", artist_slug: "artist-b", medium: "Ceramics", created_at: "2026-01-01T00:00:00Z" },
];

function setup() {
  const receipts = new Set();
  const current = { userId: "artist-user", email: "artist@example.invalid", artistSlug: "artist-a" };
  const database = {
    rpc: async (_name, args) => {
      const unread = requests.filter((request) =>
        (args.target_audience === "admin" || request.artist_slug === args.target_artist_slug) &&
        !receipts.has(`${args.target_user}:${args.target_audience}:${request.id}`),
      );
      return {
        data: unread.slice(0, 20).map((request) => ({
          request_id: request.id, artist_slug: request.artist_slug, medium: request.medium,
          created_at: request.created_at, unread_count: unread.length,
        })),
        error: null,
      };
    },
    from: (table) => table === "commission_requests" ? {
      select: () => ({ eq: (_key, id) => ({ maybeSingle: async () => ({
        data: requests.find((request) => request.id === id) ?? null, error: null,
      }) }) }),
    } : {
      upsert: async (receipt) => {
        receipts.add(`${receipt.user_id}:${receipt.audience}:${receipt.request_id}`);
        return { error: null };
      },
    },
  };
  const access = {
    requireUser: async () => ({ ok: true, userId: current.userId, email: current.email, database }),
    requireArtist: async () => current.artistSlug
      ? { ok: true, userId: current.userId, email: current.email, artist: { slug: current.artistSlug }, database }
      : { ok: false, status: 403, message: "Not linked" },
  };
  const route = loadModule("../src/app/api/commission-notifications/route.ts", {
    "@/lib/admin/request-body": requestBody,
    "@/lib/supabase/access": access,
    "@/lib/supabase/admin": { isAdminEmail: (email) => email === "admin@example.invalid" },
  });
  const list = (audience) => route.GET(new Request(`http://localhost/api/commission-notifications?audience=${audience}`));
  const mark = (audience, requestId) => route.POST(new Request("http://localhost/api/commission-notifications", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience, requestId }),
  }));
  return { current, list, mark, receipts };
}

test("artists see only assigned requests and cannot mark another artist's request", async () => {
  const { list, mark, receipts } = setup();
  const result = await (await list("artist")).json();
  assert.equal(result.unreadCount, 1);
  assert.deepEqual(result.notifications.map((item) => item.request_id), [requests[0].id]);
  assert.equal((await mark("artist", requests[1].id)).status, 404);
  assert.equal(receipts.size, 0);
  assert.equal((await list("admin")).status, 403);
});

test("read receipts are independent by account and audience", async () => {
  const { current, list, mark } = setup();
  assert.equal((await mark("artist", requests[0].id)).status, 200);
  assert.equal((await (await list("artist")).json()).unreadCount, 0);
  current.userId = "another-user";
  assert.equal((await (await list("artist")).json()).unreadCount, 1);
  current.userId = "artist-user";
  current.email = "admin@example.invalid";
  assert.equal((await (await list("admin")).json()).unreadCount, 2);
  assert.equal((await mark("admin", requests[0].id)).status, 200);
  assert.equal((await (await list("admin")).json()).unreadCount, 1);
  assert.equal((await (await list("artist")).json()).unreadCount, 0);
});

test("invalid inputs and unlinked artists are rejected", async () => {
  const { current, list, mark } = setup();
  assert.equal((await list("customer")).status, 400);
  assert.equal((await mark("artist", "not-a-uuid")).status, 400);
  current.artistSlug = null;
  assert.equal((await list("artist")).status, 403);
});
