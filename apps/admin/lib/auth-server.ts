import { redirect } from "next/navigation";
import type { AuthMeResponse } from "@/lib/types/auth";
import { getApiBaseUrl } from "@/lib/api-url";
import { createClient } from "@/lib/supabase/server";

/** Bearer token for Nest API calls from Server Actions / Route Handlers. */
export async function getServerAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Loads profile + memberships or redirects: /login if no Supabase user,
 * /auth/backend-unavailable if user exists but Nest /auth/me fails.
 */
export async function requireAuthMe(): Promise<AuthMeResponse> {
  const me = await fetchAuthMe();
  if (me) {
    return me;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  redirect("/auth/backend-unavailable");
}

export async function fetchAuthMe(): Promise<AuthMeResponse | null> {
  const supabase = await createClient();
  // getUser() validates the JWT; getSession() alone can be empty in some RSC timings.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<AuthMeResponse>;
}
