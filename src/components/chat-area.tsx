"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Message, Node } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";

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
  const [hasError, setHasError] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoResize() {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Please sign in to continue
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No conversation yet. Start a new one!
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const trimmed = input.trim();

    if (trimmed === "/branch") {
      onFork("");
      return;
    }

    setInput("");
    setIsStreaming(true);
    setHasError(false);
    try {
      await onSendMessage(trimmed);
    } catch {
      setHasError(true);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
      <div className="flex-1 overflow-y-auto">
        {node.title && (
          <div className="px-6 pt-4 pb-2 border-b border-border">
            <h2 className="text-lg font-semibold">{node.title}</h2>
          </div>
        )}

        <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
          {msgs.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Start a conversation by sending a message below.
            </p>
          )}

          {msgs.map((msg) => (
            <div key={msg.id} className="group">
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative rounded-lg px-4 py-2.5 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.role === "system"
                        ? "bg-muted/50 text-sm italic border border-border"
                        : "bg-muted"
                  }`}
                >
                  {editingId === msg.id ? (
                    <div className="space-y-2 min-w-[300px]">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 rounded border border-input bg-background text-foreground text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => saveEdit(msg.id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {msg.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="text-sm">
                          {msg.content ? (
                            <MarkdownContent content={msg.content} />
                          ) : msg.id.startsWith("streaming-") && isStreaming ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </span>
                          ) : null}
                        </div>
                      )}
                      <div
                        className={`flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "user" && msg.id === lastUserMsgId && (
                          <button
                            type="button"
                            onClick={() => startEdit(msg)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                            title="Edit message"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onFork(msg.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                          title="Branch out from this message"
                        >
                          Branch Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasError && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <span>Failed to send message</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHasError(false);
                    const lastUserMsg = [...msgs]
                      .reverse()
                      .find((m) => m.role === "user");
                    if (lastUserMsg) {
                      onSendMessage(lastUserMsg.content);
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-4"
      >
        <div className="flex gap-2 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (/branch to fork)"
            disabled={isStreaming}
            rows={1}
            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 resize-none min-h-[40px] max-h-[200px]"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
