import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { createServiceRoleClient } from "./admin";
import { SupabaseConfigError } from "./config";
import { createSupabaseServerClient } from "./server";

type AccessFailure = {
  ok: false;
  status: 401 | 403 | 503;
  message: string;
};

type UserAccess =
  | AccessFailure
  | {
      ok: true;
      userId: string;
      email: string | null;
      database: SupabaseClient<Database>;
    };

export async function requireUser(): Promise<UserAccess> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        ok: false,
        status: 503,
        message: "Account sign-in is not configured.",
      };
    }
    throw error;
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = !error ? data?.claims : undefined;
  const userId = claims && typeof claims.sub === "string" ? claims.sub : null;
  if (!userId) {
    return { ok: false, status: 401, message: "Sign in to continue." };
  }

  const database = createServiceRoleClient();
  if (!database) {
    return {
      ok: false,
      status: 503,
      message: "Account data access is not configured.",
    };
  }

  return {
    ok: true,
    userId,
    email: claims && typeof claims.email === "string" ? claims.email : null,
    database,
  };
}

export async function requireArtist() {
  const access = await requireUser();
  if (!access.ok) return access;

  const { data: artist, error } = await access.database
    .from("artists")
    .select("id, slug, display_name")
    .eq("owner_user_id", access.userId)
    .maybeSingle();
  if (error) {
    console.error("Unable to resolve artist account.", error);
    return {
      ok: false as const,
      status: 503 as const,
      message: "Artist account access could not be verified.",
    };
  }
  if (!artist) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "This account is not linked to an artist profile yet.",
    };
  }

  return { ...access, artist };
}
