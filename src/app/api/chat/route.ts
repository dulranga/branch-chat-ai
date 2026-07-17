import { streamText } from "ai";
import { headers } from "next/headers";
import {
  appendMessage,
  decryptApiKey,
  getActiveModel,
  getAncestorMessages,
  getNode,
  getNodeMessages,
  getLatestUserModel,
} from "@/data-access";
import { getSystemModelInstance, getUserModelInstance } from "@/lib/llm";
import { getProviderOptions } from "@/lib/provider-options";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, id: nodeId, modelConfigId, reasoningLevel } =
    (await req.json()) as {
      messages: { id: string; role: string; content: string }[];
      id?: string;
      modelConfigId?: string | null;
      reasoningLevel?: string | null;
    };

  if (!nodeId || !messages || messages.length === 0) {
    return new Response("Missing nodeId or messages", { status: 400 });
  }

  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== "user") {
    return new Response("Last message must be from user", { status: 400 });
  }

  const existingMsgs = await getNodeMessages(nodeId);
  const isFirstInNode = existingMsgs.length === 0;

  const resolvedModelConfigId = modelConfigId ?? null;
  const resolvedReasoningLevel = reasoningLevel ?? null;

  const userMsg = await appendMessage(
    nodeId,
    lastMsg.content,
    "user",
    undefined,
    resolvedModelConfigId,
    resolvedReasoningLevel,
  );

  let resolvedModel = getSystemModelInstance();
  let activeModelConfigId: string | null = null;
  let activeProvider: string | null = null;

  if (resolvedModelConfigId) {
    try {
      const apiKey = await decryptApiKey(resolvedModelConfigId);
      const activeModel = await getActiveModel();
      if (activeModel && activeModel.id === resolvedModelConfigId) {
        activeModelConfigId = activeModel.id;
        activeProvider = activeModel.provider;
        resolvedModel = await getUserModelInstance(
          activeModel.provider,
          activeModel.model,
          apiKey,
        );
      }
    } catch {
      const latest = await getLatestUserModel();
      if (latest) {
        try {
          const apiKey = await decryptApiKey(latest.id);
          activeModelConfigId = latest.id;
          activeProvider = latest.provider;
          resolvedModel = await getUserModelInstance(
            latest.provider,
            latest.model,
            apiKey,
          );
        } catch {
          // fall through to system model
        }
      }
    }
  } else {
    const activeModel = await getActiveModel();
    if (activeModel) {
      try {
        const apiKey = await decryptApiKey(activeModel.id);
        activeModelConfigId = activeModel.id;
        activeProvider = activeModel.provider;
        resolvedModel = await getUserModelInstance(
          activeModel.provider,
          activeModel.model,
          apiKey,
        );
      } catch {
        // fall through to system model
      }
    }
  }

  let contextMsgs: Awaited<ReturnType<typeof getNodeMessages>> = [];
  if (isFirstInNode) {
    contextMsgs = await getAncestorMessages(nodeId);
  }

  const aiMessages = [
    ...contextMsgs.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    ...(await getNodeMessages(nodeId)).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const providerOpts = activeProvider
    ? getProviderOptions(resolvedReasoningLevel, activeProvider)
    : undefined;

  const result = streamText({
    model: resolvedModel,
    messages: aiMessages,
    ...(providerOpts ? { providerOptions: providerOpts } : {}),
    async onFinish({ text }) {
      await appendMessage(
        nodeId,
        text,
        "assistant",
        userMsg.id,
        activeModelConfigId,
        resolvedReasoningLevel,
      );
    },
  });

  return result.toTextStreamResponse();
}
