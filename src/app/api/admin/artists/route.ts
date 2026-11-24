import { requireAdmin } from "@/lib/supabase/admin";
import {
  readBoolean,
  readJsonObject,
  readOptionalInteger,
  readOptionalUrl,
  readText,
} from "@/lib/admin/request-body";

export async function POST(request: Request) {
  return saveArtist(request, false);
}

export async function PATCH(request: Request) {
  return saveArtist(request, true);
}

async function saveArtist(request: Request, updating: boolean) {
  const access = await requireAdmin();
  if (!access.ok) {
    return Response.json({ error: access.message }, { status: access.status });
  }

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const id = readText(parsed.value, "id", 64, updating);
  const slug = readText(parsed.value, "slug", 80, true);
  const displayName = readText(parsed.value, "display_name", 120, true);
  const university = readText(parsed.value, "university", 160);
  const program = readText(parsed.value, "program", 120);
  const location = readText(parsed.value, "location", 120);
  const bio = readText(parsed.value, "bio", 3000);
  const profileImage = readOptionalUrl(parsed.value, "profile_image_url");
  const graduationYear = readOptionalInteger(parsed.value, "graduation_year", 2000, 2200);
  const ownerEmail = readText(parsed.value, "owner_email", 320);
  const clearOwnerLink = readBoolean(parsed.value, "clear_owner_link");
  const isPublished = readBoolean(parsed.value, "is_published");

  if (!id.ok) return Response.json({ error: id.error }, { status: 400 });
  if (!slug.ok) return Response.json({ error: slug.error }, { status: 400 });
  if (!displayName.ok) return Response.json({ error: displayName.error }, { status: 400 });
  if (!university.ok) return Response.json({ error: university.error }, { status: 400 });
  if (!program.ok) return Response.json({ error: program.error }, { status: 400 });
  if (!location.ok) return Response.json({ error: location.error }, { status: 400 });
  if (!bio.ok) return Response.json({ error: bio.error }, { status: 400 });
  if (!profileImage.ok) return Response.json({ error: profileImage.error }, { status: 400 });
  if (!graduationYear.ok) return Response.json({ error: graduationYear.error }, { status: 400 });
  if (!ownerEmail.ok) return Response.json({ error: ownerEmail.error }, { status: 400 });
  if (!clearOwnerLink.ok) {
    return Response.json({ error: clearOwnerLink.error }, { status: 400 });
  }
  if (!isPublished.ok) return Response.json({ error: isPublished.error }, { status: 400 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.value)) {
    return Response.json(
      { error: "Slug must use lowercase letters, numbers, and single hyphens." },
      { status: 400 },
    );
  }
  if (updating && !/^[0-9a-f-]{36}$/i.test(id.value)) {
    return Response.json({ error: "Artist ID is invalid." }, { status: 400 });
  }
  if (ownerEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.value)) {
    return Response.json({ error: "Enter a valid artist account email." }, { status: 400 });
  }

  let ownerUserId: string | null | undefined;
  if (ownerEmail.value) {
    const email = ownerEmail.value.toLowerCase();
    let page = 1;
    let foundUser = false;
    while (true) {
      const { data, error } = await access.database.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) {
        console.error("Unable to find artist account by email.", error);
        return Response.json(
          { error: "We could not look up that account. Try again." },
          { status: 500 },
        );
      }

      const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
      if (user) {
        ownerUserId = user.id;
        foundUser = true;
        break;
      }
      if (data.nextPage === null || data.nextPage <= page) break;
      page = data.nextPage;
    }

    if (!foundUser) {
      return Response.json(
        { error: "No account was found with that email. Ask the artist to sign up first." },
        { status: 404 },
      );
    }
  } else if (clearOwnerLink.value) {
    ownerUserId = null;
  } else if (!updating) {
    ownerUserId = null;
  }

  const values = {
    slug: slug.value,
    display_name: displayName.value,
    university: university.value || null,
    program: program.value || null,
    location: location.value || null,
    bio: bio.value || null,
    profile_image_url: profileImage.value,
    graduation_year: graduationYear.value,
    is_published: isPublished.value,
    updated_at: new Date().toISOString(),
  };
  const query = updating
    ? access.database
        .from("artists")
        .update({
          ...values,
          ...(ownerUserId !== undefined ? { owner_user_id: ownerUserId } : {}),
        })
        .eq("id", id.value)
    : access.database.from("artists").insert({
        ...values,
        owner_user_id: ownerUserId ?? null,
      });
  const { data, error } = await query.select("id").maybeSingle();

  if (error) {
    console.error("Unable to save artist profile.", error);
    const message =
      error.code === "23505"
        ? "That artist slug or account is already linked."
        : error.code === "23503"
          ? "The linked artist account could not be found."
          : "We could not save this artist.";
    const status = error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
  if (!data) return Response.json({ error: "Artist not found." }, { status: 404 });
  return Response.json({ ok: true, id: data.id }, { status: updating ? 200 : 201 });
}
