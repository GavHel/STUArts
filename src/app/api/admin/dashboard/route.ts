import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) {
    return Response.json(
      { error: access.message },
      { status: access.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const [requests, artists, artworks] = await Promise.all([
    access.database
      .from("commission_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    access.database.from("artists").select("*").order("display_name"),
    access.database.from("artworks").select("*").order("created_at", { ascending: false }),
  ]);
  const failedQuery = requests.error ?? artists.error ?? artworks.error;
  if (failedQuery) {
    console.error("Unable to load admin dashboard data.", failedQuery);
    return Response.json(
      { error: "We could not load the dashboard. Check that the database migration has been run." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const accounts: { id: string; email: string }[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await access.database.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error("Unable to load admin account list.", error);
      return Response.json(
        { error: "We could not load account options for the artist editor." },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    accounts.push(
      ...data.users.flatMap((user) => (user.email ? [{ id: user.id, email: user.email }] : [])),
    );
    if (data.nextPage === null || data.nextPage <= page) break;
    page = data.nextPage;
  }
  accounts.sort((a, b) => a.email.localeCompare(b.email));

  return Response.json(
    {
      email: access.email,
      requests: requests.data,
      artists: artists.data,
      artworks: artworks.data,
      accounts,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
