import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { headers } from "next/headers";
import {
  appendMessage,
  getAncestorMessages,
  getNode,
  getNodeMessages,
} from "@/data-access";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { nodeId, message } = await req.json();
  if (!nodeId || !message) {
    return new Response("Missing nodeId or message", { status: 400 });
  }

  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  const existingMsgs = await getNodeMessages(nodeId);
  const isFirstInNode = existingMsgs.length === 0;

  const userMsg = await appendMessage(nodeId, message, "user");

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

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: aiMessages,
    async onFinish({ text }) {
      await appendMessage(nodeId, text, "assistant", userMsg.id);
    },
  });

  return result.toTextStreamResponse();
}
