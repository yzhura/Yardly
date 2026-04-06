"use client";

import { useEffect } from "react";
import { hashLooksLikeAuthSession } from "@/lib/auth/callback-helpers";

/**
 * If Supabase returns tokens in the URL hash but the user landed on the wrong path
 * (e.g. after a server redirect), send them to /auth/callback so the client can setSession.
 */
export function AuthHashRescue() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length > 1 && hashLooksLikeAuthSession(hash)) {
      window.location.replace(
        `/auth/callback${window.location.search}${hash}`,
      );
    }
  }, []);

  return null;
}
