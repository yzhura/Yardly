import { cookies } from "next/headers";

/** HttpOnly cookie storing the active organization (tenant) id for the admin session. */
export const ACTIVE_TENANT_COOKIE = "yardly_tenant_id";

const activeTenantCookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export async function setActiveTenantCookie(tenantId: string) {
  const store = await cookies();
  store.set(ACTIVE_TENANT_COOKIE, tenantId, activeTenantCookieOptions);
}

export async function clearActiveTenantCookie() {
  const store = await cookies();
  store.delete(ACTIVE_TENANT_COOKIE);
}
