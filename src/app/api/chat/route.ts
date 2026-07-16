import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { headers } from "next/headers";
import {
  appendMessage,
  generateTitle,
  getAncestorMessages,
  getNode,
  getNodeMessages,
} from "@/data-access";
import { auth } from "@/lib/auth";

const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, id: nodeId } = (await req.json()) as {
    messages: { id: string; role: string; content: string }[];
    id?: string;
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

  const userMsg = await appendMessage(nodeId, lastMsg.content, "user");

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
    model: ollama.chat("gemma4:12b"),
    messages: aiMessages,
    async onFinish({ text }) {
      await appendMessage(nodeId, text, "assistant", userMsg.id);
      await generateTitle(nodeId);
    },
  });

  return result.toTextStreamResponse();
}
