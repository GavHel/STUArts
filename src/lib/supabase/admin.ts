import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SupabaseConfigError } from "./config";
import { createSupabaseServerClient } from "./server";

type AdminAccess =
  | {
      ok: true;
      email: string;
      database: SupabaseClient<Database>;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      message: string;
    };

export function createServiceRoleClient() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isAdminEmail(email: string | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<AdminAccess> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        ok: false,
        status: 503,
        message: "Admin sign-in is not configured. Add the Supabase URL and public key.",
      };
    }
    throw error;
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = !error ? data?.claims : undefined;
  const email =
    claims && typeof claims.email === "string"
      ? claims.email.toLowerCase()
      : null;

  if (!email) {
    return { ok: false, status: 401, message: "Sign in to continue." };
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    return {
      ok: false,
      status: 503,
      message: "Admin access is not configured. Set ADMIN_EMAILS on the server.",
    };
  }
  if (!isAdminEmail(email)) {
    return { ok: false, status: 403, message: "This account is not an administrator." };
  }

  const database = createServiceRoleClient();
  if (!database) {
    return {
      ok: false,
      status: 503,
      message: "Admin data access is not configured on the server.",
    };
  }

  return { ok: true, email, database };
}
