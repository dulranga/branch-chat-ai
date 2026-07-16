"use client";

import { Pencil, GitBranch, RotateCcw, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Message as MessageType, Node } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent as MessageContentContainer,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Textarea } from "@/components/ui/textarea";

interface ChatAreaProps {
  node: Node | null;
  messages: MessageType[];
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();

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

  function startEdit(msg: MessageType) {
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
    <div className="flex h-full flex-col">
      {node.title && (
        <div className="shrink-0 border-b border-border px-6 pb-2 pt-4">
          <h2 className="text-lg font-semibold">{node.title}</h2>
        </div>
      )}

      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {msgs.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  Start a conversation by sending a message below.
                </p>
              )}

              {msgs.map((msg) => (
                <MessageScrollerItem
                  key={msg.id}
                  messageId={msg.id}
                  scrollAnchor={msg.role === "user"}
                >
                  {msg.role === "system" ? (
                    <Marker>
                      <MarkerContent className="text-xs italic opacity-70">
                        {msg.content}
                      </MarkerContent>
                    </Marker>
                  ) : (
                    <Message
                      align={msg.role === "user" ? "end" : "start"}
                    >
                      {msg.role === "assistant" && (
                        <MessageAvatar>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        </MessageAvatar>
                      )}
                      <MessageContentContainer>
                        {editingId === msg.id ? (
                          <div className="min-w-[300px] space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
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
                            <Bubble
                              variant={
                                msg.role === "user"
                                  ? "default"
                                  : "ghost"
                              }
                              align={
                                msg.role === "user" ? "end" : "start"
                              }
                            >
                              <BubbleContent>
                                {msg.role === "user" ? (
                                  <p className="whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                ) : msg.content ? (
                                  <MarkdownContent content={msg.content} />
                                ) : msg.id.startsWith("streaming-") && isStreaming ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: "0ms" }} />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: "150ms" }} />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: "300ms" }} />
                                  </span>
                                ) : null}
                              </BubbleContent>
                            </Bubble>
                            <MessageFooter>
                              {msg.role === "user" && msg.id === lastUserMsgId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5"
                                  onClick={() => startEdit(msg)}
                                  aria-label="Edit message"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5"
                                onClick={() => onFork(msg.id)}
                                aria-label="Branch out from this message"
                              >
                                <GitBranch className="h-3 w-3" />
                              </Button>
                            </MessageFooter>
                          </>
                        )}
                      </MessageContentContainer>
                    </Message>
                  )}
                </MessageScrollerItem>
              ))}

              {isStreaming && msgs.filter(m => m.role === "assistant" && !m.content).length === 0 && (
                <MessageScrollerItem>
                  <Marker role="status">
                    <MarkerIcon>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" />
                    </MarkerIcon>
                    <MarkerContent>Thinking...</MarkerContent>
                  </Marker>
                </MessageScrollerItem>
              )}

              {hasError && (
                <MessageScrollerItem>
                  <Message align="start">
                    <MessageContentContainer className="max-w-full items-center">
                      <Bubble variant="destructive" align="start" className="max-w-full">
                        <BubbleContent>
                          <div className="flex items-center gap-2">
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
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Retry
                            </Button>
                          </div>
                        </BubbleContent>
                      </Bubble>
                    </MessageContentContainer>
                  </Message>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border p-4"
      >
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
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
            className="min-h-[40px] max-h-[200px] resize-none"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="self-end"
          >
            <Send className="mr-1 h-4 w-4" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
