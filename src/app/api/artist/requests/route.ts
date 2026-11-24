import { requireArtist } from "@/lib/supabase/access";
import { readJsonObject, readText } from "@/lib/admin/request-body";

const artistStatuses = ["new", "in_review", "accepted", "declined", "completed"] as const;

export async function PATCH(request: Request) {
  const access = await requireArtist();
  if (!access.ok) {
    return Response.json({ error: access.message }, { status: access.status });
  }

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;

  const id = readText(parsed.value, "id", 64, true);
  const status = readText(parsed.value, "request_status", 32, true);
  const responseText = readText(parsed.value, "artist_response", 2000);
  if (!id.ok) return Response.json({ error: id.error }, { status: 400 });
  if (!status.ok) return Response.json({ error: status.error }, { status: 400 });
  if (!responseText.ok) return Response.json({ error: responseText.error }, { status: 400 });
  if (!/^[0-9a-f-]{36}$/i.test(id.value)) {
    return Response.json({ error: "Request ID is invalid." }, { status: 400 });
  }
  if (!artistStatuses.includes(status.value as (typeof artistStatuses)[number])) {
    return Response.json({ error: "Choose a valid request status." }, { status: 400 });
  }

  const { data, error } = await access.database
    .from("commission_requests")
    .update({
      request_status: status.value as (typeof artistStatuses)[number],
      artist_response: responseText.value || null,
      artist_responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id.value)
    .eq("artist_slug", access.artist.slug)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to respond to artist commission request.", error);
    return Response.json({ error: "We could not update this request." }, { status: 500 });
  }
  if (!data) return Response.json({ error: "Request not found." }, { status: 404 });
  return Response.json({ ok: true });
}
