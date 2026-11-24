import { requireArtist } from "@/lib/supabase/access";
import {
  readJsonObject,
  readOptionalInteger,
  readOptionalUrl,
  readText,
} from "@/lib/admin/request-body";

export async function PATCH(request: Request) {
  const access = await requireArtist();
  if (!access.ok) {
    return Response.json({ error: access.message }, { status: access.status });
  }

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;

  const displayName = readText(parsed.value, "display_name", 120, true);
  const university = readText(parsed.value, "university", 160);
  const program = readText(parsed.value, "program", 120);
  const location = readText(parsed.value, "location", 120);
  const bio = readText(parsed.value, "bio", 3000);
  const profileImage = readOptionalUrl(parsed.value, "profile_image_url");
  const graduationYear = readOptionalInteger(parsed.value, "graduation_year", 2000, 2200);

  if (!displayName.ok) return Response.json({ error: displayName.error }, { status: 400 });
  if (!university.ok) return Response.json({ error: university.error }, { status: 400 });
  if (!program.ok) return Response.json({ error: program.error }, { status: 400 });
  if (!location.ok) return Response.json({ error: location.error }, { status: 400 });
  if (!bio.ok) return Response.json({ error: bio.error }, { status: 400 });
  if (!profileImage.ok) return Response.json({ error: profileImage.error }, { status: 400 });
  if (!graduationYear.ok) return Response.json({ error: graduationYear.error }, { status: 400 });

  const { data, error } = await access.database
    .from("artists")
    .update({
      display_name: displayName.value,
      university: university.value || null,
      program: program.value || null,
      location: location.value || null,
      bio: bio.value || null,
      profile_image_url: profileImage.value,
      graduation_year: graduationYear.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", access.artist.id)
    .eq("owner_user_id", access.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to save artist profile.", error);
    return Response.json({ error: "We could not save your profile." }, { status: 500 });
  }
  if (!data) return Response.json({ error: "Artist profile not found." }, { status: 404 });
  return Response.json({ ok: true });
}
