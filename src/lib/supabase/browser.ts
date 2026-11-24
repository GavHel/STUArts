"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabasePublicConfig } from "./config";

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabasePublicConfig();
  return createBrowserClient<Database>(url, key);
}
