import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getActiveModel, setActiveModel } from "@/data-access";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeModel = await getActiveModel();
  return NextResponse.json(activeModel);
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { modelConfigId } = (await req.json()) as {
    modelConfigId: string | null;
  };

  try {
    await setActiveModel(modelConfigId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
