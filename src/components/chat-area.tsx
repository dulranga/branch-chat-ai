"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Message as MessageType, Node } from "@/lib/types";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, GitBranch, RotateCcw } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { data: session } = useSession();

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

  async function handleSubmit(message: PromptInputMessage) {
    const trimmed = message.text.trim();

    if (trimmed === "/branch") {
      onFork("");
      return;
    }

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

  const chatStatus = isStreaming ? "streaming" : hasError ? "error" : "ready";

  return (
    <div className="flex h-full flex-col overflow-hidden min-w-0">
      {node.title && (
        <div className="shrink-0 border-b border-border px-6 pb-2 pt-4">
          <h2 className="text-lg font-semibold">{node.title}</h2>
        </div>
      )}

      <Conversation className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto max-h-[90vh]">
        <ConversationContent>
          {msgs.length === 0 && (
            <ConversationEmptyState
              title="Start a conversation"
              description="Start a conversation by sending a message below."
            />
          )}

          {msgs.map((msg) => (
            <Message from={msg.role} key={msg.id}>
              {msg.role === "system" ? (
                <MessageContent>
                  <p className="text-xs italic opacity-70">{msg.content}</p>
                </MessageContent>
              ) : (
                <>
                  <MessageContent>
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
                    ) : msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content ? (
                      <MessageResponse>{msg.content}</MessageResponse>
                    ) : msg.id.startsWith("streaming-") && isStreaming ? (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50"
                          style={{ animationDelay: "300ms" }}
                        />
                      </span>
                    ) : null}
                  </MessageContent>
                  {editingId !== msg.id && (
                    <MessageActions>
                      {msg.role === "user" && msg.id === lastUserMsgId && (
                        <MessageAction
                          onClick={() => startEdit(msg)}
                          label="Edit message"
                        >
                          <Pencil className="h-3 w-3" />
                        </MessageAction>
                      )}
                      <MessageAction
                        onClick={() => onFork(msg.id)}
                        label="Branch out from this message"
                      >
                        <GitBranch className="h-3 w-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </>
              )}
            </Message>
          ))}

          {isStreaming &&
            msgs.filter((m) => m.role === "assistant" && !m.content).length ===
              0 && (
              <Message from="assistant">
                <MessageContent>
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </MessageContent>
              </Message>
            )}

          {hasError && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Failed to send message</span>
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
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border p-4"
      >
        <PromptInputTextarea
          placeholder="Type a message... (/branch to fork)"
          disabled={isStreaming}
        />
        <PromptInputSubmit status={chatStatus} disabled={isStreaming} />
      </PromptInput>
    </div>
  );
}
