"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type EmailOtpType,
  isEmailOtpType,
  parseImplicitHashParams,
  sanitizeAuthNext,
} from "@/lib/auth/callback-helpers";

/** Survives React Strict Mode remount + history.replaceState clearing the hash. */
const IMPLICIT_FRAGMENT_STORAGE_KEY = "yardly_auth_callback_implicit_v1";

function parseStoredFragment(raw: string): Record<string, string> {
  try {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  } catch {
    return {};
  }
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Підтвердження входу…");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hash;
      if (
        h.length > 1 &&
        (h.includes("access_token") || h.includes("refresh_token"))
      ) {
        sessionStorage.setItem(IMPLICIT_FRAGMENT_STORAGE_KEY, h.slice(1));
      }
    }

    const run = async () => {
      const next = sanitizeAuthNext(searchParams.get("next"));

      if (searchParams.get("error")) {
        sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
        router.replace("/auth/auth-code-error");
        return;
      }

      const supabase = createClient();

      let hashParams = parseImplicitHashParams();
      if (!hashParams.access_token || !hashParams.refresh_token) {
        const stored = sessionStorage.getItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
        if (stored) {
          hashParams = parseStoredFragment(stored);
        }
      }

      const hasImplicit = !!(
        hashParams.access_token && hashParams.refresh_token
      );
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const hasTokenHash = !!(token_hash && type && isEmailOtpType(type));
      const code = searchParams.get("code");
      const hasCode = !!code;

      /**
       * Strict Mode runs this effect twice. The first pass clears the hash and sets cookies;
       * the second sees an empty URL and would wrongly go to auth-code-error. If we already
       * have a session and nothing left to exchange, send the user home.
       */
      if (!hasImplicit && !hasTokenHash && !hasCode) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
          router.replace(next);
          return;
        }
      }

      if (hasImplicit) {
        setStatus("Збереження сесії…");
        const { error } = await supabase.auth.setSession({
          access_token: hashParams.access_token!,
          refresh_token: hashParams.refresh_token!,
        });
        sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
        if (error) {
          console.error("[auth/callback] setSession:", error.message);
          router.replace("/auth/auth-code-error");
          return;
        }
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        router.replace(next);
        return;
      }

      if (hasTokenHash) {
        setStatus("Підтвердження запрошення…");
        const {
          data: { session: existing },
        } = await supabase.auth.getSession();
        if (existing) {
          sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
          router.replace(next);
          return;
        }
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token_hash!,
          type: type as EmailOtpType,
        });
        if (error) {
          console.error("[auth/callback] verifyOtp:", error.message);
          router.replace("/auth/auth-code-error");
          return;
        }
        sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
        router.replace(next);
        return;
      }

      if (hasCode) {
        setStatus("Обмін коду сесії…");
        const {
          data: { session: existing },
        } = await supabase.auth.getSession();
        if (existing) {
          sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
          router.replace(next);
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error(
            "[auth/callback] exchangeCodeForSession:",
            error.message,
          );
          router.replace("/auth/auth-code-error");
          return;
        }
        sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
        router.replace(next);
        return;
      }

      sessionStorage.removeItem(IMPLICIT_FRAGMENT_STORAGE_KEY);
      router.replace("/auth/auth-code-error");
    };

    void run();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{status}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <p className="text-sm text-muted-foreground">Завантаження…</p>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
