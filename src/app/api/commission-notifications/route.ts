import { readJsonObject, readText } from "@/lib/admin/request-body";
import { requireArtist, requireUser } from "@/lib/supabase/access";
import { isAdminEmail } from "@/lib/supabase/admin";

type Audience = "admin" | "artist";

function isAudience(value: string | null): value is Audience {
  return value === "admin" || value === "artist";
}

async function authorize(audience: Audience) {
  if (audience === "artist") {
    const access = await requireArtist();
    return access.ok ? { ...access, artistSlug: access.artist.slug } : access;
  }
  const access = await requireUser();
  if (!access.ok) return access;
  if (!isAdminEmail(access.email)) {
    return { ok: false as const, status: 403, message: "Administrator access required." };
  }
  return { ...access, artistSlug: null };
}

export async function GET(request: Request) {
  const audience = new URL(request.url).searchParams.get("audience");
  if (!isAudience(audience)) return Response.json({ error: "Choose an audience." }, { status: 400 });
  const access = await authorize(audience);
  if (!access.ok) return Response.json({ error: access.message }, { status: access.status });

  const { data, error } = await access.database.rpc("unread_commission_notifications", {
    target_user: access.userId,
    target_audience: audience,
    target_artist_slug: access.artistSlug,
  });
  if (error) {
    console.error("Unable to load commission notifications.", error);
    return Response.json({ error: "Notifications could not be loaded. Please try again later." }, { status: 503 });
  }
  return Response.json(
    { notifications: data, unreadCount: data[0]?.unread_count ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const audience = readText(parsed.value, "audience", 10, true);
  const id = readText(parsed.value, "requestId", 36, true);
  if (!audience.ok || !isAudience(audience.value)) {
    return Response.json({ error: "Choose an audience." }, { status: 400 });
  }
  if (!id.ok || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.value)) {
    return Response.json({ error: "Request ID is invalid." }, { status: 400 });
  }
  const access = await authorize(audience.value);
  if (!access.ok) return Response.json({ error: access.message }, { status: access.status });

  const { data: commission, error: requestError } = await access.database
    .from("commission_requests")
    .select("id, artist_slug")
    .eq("id", id.value)
    .maybeSingle();
  if (requestError) {
    console.error("Unable to verify notification request.", requestError);
    return Response.json({ error: "Notification could not be updated." }, { status: 503 });
  }
  if (!commission || (audience.value === "artist" && commission.artist_slug !== access.artistSlug)) {
    return Response.json({ error: "Notification not found." }, { status: 404 });
  }
  const { error } = await access.database.from("commission_notification_reads").upsert(
    { user_id: access.userId, request_id: commission.id, audience: audience.value },
    { onConflict: "user_id,audience,request_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("Unable to mark commission notification read.", error);
    return Response.json({ error: "Notification could not be updated." }, { status: 503 });
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
