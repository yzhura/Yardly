import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/auth-server";

export async function POST(req: Request) {
  const token = await getServerAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof (body as { mimeType?: unknown }).mimeType !== "string") {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await fetch(`${getApiBaseUrl()}/users/me/avatar/signed-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mimeType: (body as { mimeType: string }).mimeType }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Не вдалося підготувати завантаження" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
