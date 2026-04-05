import type { AuthMeResponse } from "@/lib/types/auth";
import { getApiBaseUrl } from "@/lib/api-url";
import { createClient } from "@/lib/supabase/server";

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
