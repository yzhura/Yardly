import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

type RouteParams = {
  params: Promise<{ tenantId: string; membershipId: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, membershipId } = await params;
  const body = await req.text();
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/members/${membershipId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to update member role" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, membershipId } = await params;
  const res = await fetch(
    `${getApiBaseUrl()}/tenants/${tenantId}/members/${membershipId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to remove member" },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
