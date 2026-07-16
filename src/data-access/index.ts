"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats, messages, nodes } from "@/lib/schema";

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function createChat() {
  const session = await requireAuth();
  const chatId = uuidv4();
  const nodeId = uuidv4();

  await db.insert(chats).values({
    id: chatId,
    userId: session.user.id,
    title: null,
  });

  await db.insert(nodes).values({
    id: nodeId,
    userId: session.user.id,
    chatId,
    parentId: null,
    path: `/${nodeId}`,
    title: null,
  });

  return { chat: await getChat(chatId), node: (await getNode(nodeId))! };
}

export async function getUserChats() {
  const session = await requireAuth();
  return db
    .select()
    .from(chats)
    .where(eq(chats.userId, session.user.id))
    .orderBy(desc(chats.createdAt));
}

export async function getChat(chatId: string) {
  const result = await db.select().from(chats).where(eq(chats.id, chatId));
  return result[0] ?? null;
}

export async function getChatTree(chatId: string) {
  const session = await requireAuth();
  const chat = await getChat(chatId);
  if (!chat || chat.userId !== session.user.id) return [];

  return db.select().from(nodes).where(eq(nodes.chatId, chatId));
}

export async function getChatMessages(chatId: string, nodeId?: string) {
  const session = await requireAuth();
  const chat = await getChat(chatId);
  if (!chat || chat.userId !== session.user.id) return [];

  if (nodeId) {
    const [nodeMsgs, ancestorMsgs] = await Promise.all([
      getNodeMessages(nodeId),
      getAncestorMessages(nodeId),
    ]);
    return [...ancestorMsgs, ...nodeMsgs];
  }

  const root = await getChatRootNode(chatId);
  if (!root) return [];
  const [nodeMsgs, ancestorMsgs] = await Promise.all([
    getNodeMessages(root.id),
    getAncestorMessages(root.id),
  ]);
  return [...ancestorMsgs, ...nodeMsgs];
}

export async function getChatRootNode(chatId: string) {
  await requireAuth();
  const result = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.chatId, chatId), isNull(nodes.parentId)));
  return result[0] ?? null;
}

export async function deleteChat(chatId: string) {
  const session = await requireAuth();
  const chat = await getChat(chatId);
  if (!chat || chat.userId !== session.user.id) throw new Error("Unauthorized");

  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function forkNode(parentId: string) {
  const session = await requireAuth();
  const parent = await getNode(parentId);
  if (!parent) throw new Error("Parent node not found");
  if (parent.userId !== session.user.id) throw new Error("Unauthorized");

  const id = uuidv4();
  const path = `${parent.path}/${id}`;
  await db.insert(nodes).values({
    id,
    userId: session.user.id,
    chatId: parent.chatId,
    parentId,
    path,
    title: null,
  });
  return getNode(id);
}

export async function appendMessage(
  nodeId: string,
  content: string,
  role: "user" | "assistant" | "system" = "user",
  replyTo?: string,
) {
  const session = await requireAuth();
  const node = await getNode(nodeId);
  if (!node) throw new Error("Node not found");
  if (node.userId !== session.user.id) throw new Error("Unauthorized");

  const maxOrder = await db
    .select({ max: sql<number>`COALESCE(MAX(${messages.order}), -1)` })
    .from(messages)
    .where(eq(messages.nodeId, nodeId));

  const order = maxOrder[0].max + 1;
  const id = uuidv4();
  await db.insert(messages).values({
    id,
    nodeId,
    role,
    content,
    order,
    replyTo: replyTo ?? null,
  });

  return { id, order, content, role, nodeId };
}

export async function getNode(nodeId: string) {
  const result = await db.select().from(nodes).where(eq(nodes.id, nodeId));
  return result[0] ?? null;
}

export async function getNodeMessages(nodeId: string) {
  const session = await requireAuth();
  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) return [];

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.nodeId, nodeId))
    .orderBy(asc(messages.order), asc(messages.createdAt));

  const seen = new Map<number, (typeof result)[0]>();
  for (const msg of result) {
    const key = msg.order;
    const existing = seen.get(key);
    if (!existing || msg.createdAt > existing.createdAt) {
      seen.set(key, msg);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.order - b.order);
}

export async function getUserRootNode() {
  const session = await requireAuth();
  const result = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.userId, session.user.id), isNull(nodes.parentId)));
  return result[0] ?? null;
}

export async function getAncestorMessages(nodeId: string) {
  const session = await requireAuth();
  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) return [];

  const ancestorIds = node.path.split("/").filter(Boolean).slice(0, -1);
  if (ancestorIds.length === 0) return [];

  const ancestorMsgs: Awaited<ReturnType<typeof getNodeMessages>> = [];
  for (const aid of ancestorIds) {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.nodeId, aid))
      .orderBy(asc(messages.order), asc(messages.createdAt));

    const seen = new Map<number, (typeof msgs)[0]>();
    for (const msg of msgs) {
      const key = msg.order;
      const existing = seen.get(key);
      if (!existing || msg.createdAt > existing.createdAt) {
        seen.set(key, msg);
      }
    }
    ancestorMsgs.push(
      ...Array.from(seen.values()).sort((a, b) => a.order - b.order),
    );
  }
  return ancestorMsgs;
}

export async function editLastMessage(nodeId: string, newContent: string) {
  const session = await requireAuth();
  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) throw new Error("Unauthorized");

  const nodeMsgs = await db
    .select()
    .from(messages)
    .where(and(eq(messages.nodeId, nodeId), eq(messages.role, "user")))
    .orderBy(desc(messages.order), desc(messages.createdAt));

  if (nodeMsgs.length === 0) throw new Error("No user message to edit");

  const lastUserMsg = nodeMsgs[0];
  const targetOrder = lastUserMsg.order;
  const id = uuidv4();
  await db.insert(messages).values({
    id,
    nodeId,
    role: "user",
    content: newContent,
    order: targetOrder,
  });
  return { id, order: targetOrder, content: newContent, role: "user", nodeId };
}

export async function deleteNode(nodeId: string) {
  const session = await requireAuth();
  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) throw new Error("Unauthorized");

  if (!node.parentId) {
    await deleteChat(node.chatId);
    return;
  }

  const allDescendantIds = await collectDescendantIds(nodeId, session.user.id);
  const allIds = [nodeId, ...allDescendantIds];

  for (const id of allIds) {
    await db.delete(messages).where(eq(messages.nodeId, id));
  }
  for (const id of allIds) {
    await db.delete(nodes).where(eq(nodes.id, id));
  }
}

async function collectDescendantIds(
  nodeId: string,
  userId: string,
): Promise<string[]> {
  const allUserNodes = await db
    .select()
    .from(nodes)
    .where(eq(nodes.userId, userId));

  const children = allUserNodes.filter((n) => n.parentId === nodeId);
  const result: string[] = [];
  for (const child of children) {
    result.push(child.id);
    result.push(...(await collectDescendantIds(child.id, userId)));
  }
  return result;
}

export async function mergeNode(childNodeId: string) {
  const session = await requireAuth();
  const child = await getNode(childNodeId);
  if (!child || child.userId !== session.user.id)
    throw new Error("Unauthorized");
  if (!child.parentId) throw new Error("Root node cannot be merged");

  const childMsgs = await getNodeMessages(childNodeId);
  const conversationText = childMsgs
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const { text: summary } = await generateText({
    model: ollama.chat("gemma4:12b"),
    messages: [
      {
        role: "system",
        content:
          "Summarize the following conversation concisely in 2-3 sentences. Capture the key question and answer.",
      },
      { role: "user", content: conversationText },
    ],
  });

  const result = await appendMessage(
    child.parentId,
    `📝 Branch summary: ${summary}`,
    "system",
  );
  return result;
}

export async function getSubtree(nodeId: string) {
  const session = await requireAuth();
  const root = await getNode(nodeId);
  if (!root || root.userId !== session.user.id) return [];

  const allNodes = await db
    .select()
    .from(nodes)
    .where(eq(nodes.userId, session.user.id));

  const result: typeof allNodes = [];
  function collect(nodesList: typeof allNodes) {
    for (const n of nodesList) {
      if (!result.find((r) => r.id === n.id)) {
        result.push(n);
      }
      const children = allNodes.filter((c) => c.parentId === n.id);
      collect(children);
    }
  }
  collect([root]);
  return result;
}

export async function generateTitle(nodeId: string) {
  const session = await requireAuth();
  const node = await getNode(nodeId);
  if (!node || node.userId !== session.user.id) return null;

  const nodeMsgs = await getNodeMessages(nodeId);
  const userMsgs = nodeMsgs.filter((m) => m.role === "user");

  if (userMsgs.length < 3) return null;

  const messagesText = userMsgs
    .slice(0, 4)
    .map((m) => m.content)
    .join("\n");

  const { text: title } = await generateText({
    model: ollama.chat("gemma4:12b"),
    messages: [
      {
        role: "system",
        content:
          "Generate a very short title (max 6 words) for a conversation based on the user's messages. Return only the title, no quotes or punctuation.",
      },
      { role: "user", content: messagesText },
    ],
  });

  const cleanTitle = title.trim().slice(0, 80);
  await db.update(nodes).set({ title: cleanTitle }).where(eq(nodes.id, nodeId));
  await db
    .update(chats)
    .set({ title: cleanTitle })
    .where(eq(chats.id, node.chatId));
  return cleanTitle;
}
