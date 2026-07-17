import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { updateModelApiKey } from "@/data-access";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { apiKey } = (await req.json()) as { apiKey: string };

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing required field: apiKey" },
      { status: 400 },
    );
  }

  try {
    await updateModelApiKey(id, apiKey);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
