"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Message, Node } from "@/lib/types";

interface ChatAreaProps {
  node: Node | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onFork: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
}

export function ChatArea({
  node,
  messages,
  onSendMessage,
  onFork,
  onEditMessage,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Please sign in to continue
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        No conversation yet. Start a new one!
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const trimmed = input.trim();
    setInput("");

    if (trimmed === "/branch") {
      onFork("");
      return;
    }

    setIsStreaming(true);
    try {
      await onSendMessage(trimmed);
    } finally {
      setIsStreaming(false);
    }
  }

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditContent(msg.content);
  }

  async function saveEdit(msgId: string) {
    await onEditMessage(msgId, editContent);
    setEditingId(null);
    setEditContent("");
  }

  const msgs = messages;
  const lastUserMsgId =
    msgs.filter((m) => m.role === "user").at(-1)?.id ?? null;

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {node.title && (
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
            {node.title}
          </h2>
        )}
        {msgs.length === 0 && (
          <p className="text-zinc-400 text-center py-8">
            Start a conversation by sending a message below.
          </p>
        )}
        {msgs.map((msg) => (
          <div key={msg.id} className="group">
            <div
              className={`rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-blue-100 dark:bg-blue-900 ml-8"
                  : msg.role === "system"
                    ? "bg-amber-50 dark:bg-amber-900/30 text-sm italic border border-amber-200 dark:border-amber-700"
                    : "bg-zinc-100 dark:bg-zinc-800 mr-8"
              }`}
            >
              {editingId === msg.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(msg.id)}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 bg-zinc-300 dark:bg-zinc-600 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.role === "user" && msg.id === lastUserMsgId && (
                      <button
                        type="button"
                        onClick={() => startEdit(msg)}
                        className="text-xs text-zinc-400 hover:text-zinc-600"
                        title="Edit message"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onFork(msg.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                      title="Branch out from this message"
                    >
                      Branch Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 dark:border-zinc-700 p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message... (/branch to fork)"
            disabled={isStreaming}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
