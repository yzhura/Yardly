"use server";

import { cookies } from "next/headers";
import {
  INVITE_ERROR_CODES,
  type InviteErrorCode,
} from "@/constants/team-invite";
import { ACTIVE_TENANT_COOKIE } from "@/lib/active-tenant-cookie";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";
import { INVITABLE_ROLES } from "@/lib/organization-roles";

export type InviteMemberResult =
  | { ok: true }
  | { ok: false; code: InviteErrorCode };

export async function inviteMemberAction(input: {
  email: string;
  role: string;
}): Promise<InviteMemberResult> {
  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    return { ok: false, code: INVITE_ERROR_CODES.NO_SESSION };
  }

  const cookieStore = await cookies();
  const tenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  if (!tenantId) {
    return { ok: false, code: INVITE_ERROR_CODES.NO_TENANT };
  }

  const email = input.email.trim();
  const role = input.role.trim();

  if (!email || !role) {
    return { ok: false, code: INVITE_ERROR_CODES.EMPTY };
  }

  if (!INVITABLE_ROLES.includes(role as (typeof INVITABLE_ROLES)[number])) {
    return { ok: false, code: INVITE_ERROR_CODES.BAD_ROLE };
  }

  const res = await fetch(`${getApiBaseUrl()}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tenantId, email, role }),
  });

  if (res.status === 403) {
    return { ok: false, code: INVITE_ERROR_CODES.FORBIDDEN };
  }
  if (res.status === 409) {
    return { ok: false, code: INVITE_ERROR_CODES.ALREADY_MEMBER };
  }
  if (res.status === 400) {
    return { ok: false, code: INVITE_ERROR_CODES.BAD_REQUEST };
  }
  if (!res.ok) {
    return { ok: false, code: INVITE_ERROR_CODES.FAILED };
  }

  return { ok: true };
}
