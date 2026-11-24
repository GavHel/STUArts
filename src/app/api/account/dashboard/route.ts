import { requireUser } from "@/lib/supabase/access";
import { isAdminEmail } from "@/lib/supabase/admin";

export async function GET() {
  const access = await requireUser();
  if (!access.ok) {
    return Response.json({ error: access.message }, { status: access.status });
  }

  const [requests, artist] = await Promise.all([
    access.database
      .from("commission_requests")
      .select(
        "id, artist_slug, medium, placement, project_brief, width, height, units, scale_guide, requested_delivery_date, estimated_total_cad, estimated_studio_time, request_status, artist_response, artist_responded_at, created_at, updated_at",
      )
      .eq("customer_user_id", access.userId)
      .order("created_at", { ascending: false })
      .limit(100),
    access.database
      .from("artists")
      .select("slug, display_name")
      .eq("owner_user_id", access.userId)
      .maybeSingle(),
  ]);
  const error = requests.error ?? artist.error;
  if (error) {
    console.error("Unable to load account dashboard.", error);
    return Response.json(
      { error: "We could not load your account. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      email: access.email,
      is_admin: isAdminEmail(access.email),
      requests: requests.data,
      artist: artist.data,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
