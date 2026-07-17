import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createUserModel, getUserModels } from "@/data-access";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const models = await getUserModels();
  return NextResponse.json(models);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, model, name, apiKey } = (await req.json()) as {
    provider: string;
    model: string;
    name: string;
    apiKey: string;
  };

  if (!provider || !model || !apiKey) {
    return NextResponse.json(
      { error: "Missing required fields: provider, model, apiKey" },
      { status: 400 },
    );
  }

  const result = await createUserModel(
    provider,
    model,
    name || `${provider} ${model}`,
    apiKey,
  );
  return NextResponse.json(result, { status: 201 });
}
