import { requireArtist } from "@/lib/supabase/access";

export async function GET() {
  const access = await requireArtist();
  if (!access.ok) {
    return Response.json({ error: access.message }, { status: access.status });
  }

  const [artist, artworks, requests] = await Promise.all([
    access.database
      .from("artists")
      .select(
        "id, slug, display_name, university, program, location, bio, profile_image_url, graduation_year, is_published",
      )
      .eq("id", access.artist.id)
      .single(),
    access.database
      .from("artworks")
      .select("*")
      .eq("artist_id", access.artist.id)
      .order("created_at", { ascending: false }),
    access.database
      .from("commission_requests")
      .select(
        "id, artist_slug, medium, placement, project_brief, width, height, units, scale_guide, requested_delivery_date, requester_name, requester_email, estimated_total_cad, estimated_studio_time, request_status, artist_response, artist_responded_at, created_at, updated_at",
      )
      .eq("artist_slug", access.artist.slug)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const error = artist.error ?? artworks.error ?? requests.error;
  if (error) {
    console.error("Unable to load artist workspace.", error);
    return Response.json(
      { error: "We could not load your artist workspace. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { email: access.email, artist: artist.data, artworks: artworks.data, requests: requests.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
