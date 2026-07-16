"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatArea } from "@/components/chat-area";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MobileTabBar, TreePanel } from "@/components/tree-panel";
import {
  createChat,
  deleteChat,
  deleteNode,
  editLastMessage,
  forkNode,
  getAncestorMessages,
  getChatRootNode,
  getChatTree,
  getNode,
  getNodeMessages,
  getUserChats,
  mergeNode,
} from "@/data-access";
import { useSession } from "@/lib/auth-client";
import type { Chat, Message, Node } from "@/lib/types";

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [treeNodes, setTreeNodes] = useState<Node[]>([]);
  const [mobileTab, setMobileTab] = useState<"chat" | "tree">("chat");
  const [loading, setLoading] = useState(true);

  /** Load messages for a node, including ancestor context. */
  const loadFullMessages = useCallback(async (nodeId: string) => {
    const [nodeMsgs, ancestorMsgs] = await Promise.all([
      getNodeMessages(nodeId),
      getAncestorMessages(nodeId),
    ]);
    setMessages([...ancestorMsgs, ...nodeMsgs] as unknown as Message[]);
  }, []);

  /** Load only the current node's own messages (after AI response / edit). */
  const loadOwnMessages = useCallback(async (nodeId: string) => {
    const msgs = await getNodeMessages(nodeId);
    setMessages(msgs as unknown as Message[]);
  }, []);

  /** Load a chat's tree and messages. */
  const loadChat = useCallback(
    async (chat: Chat) => {
      setSelectedChat(chat);
      const root = await getChatRootNode(chat.id);
      setCurrentNode(root as unknown as Node | null);
      if (root) {
        await loadFullMessages(root.id);
        const tree = await getChatTree(chat.id);
        setTreeNodes(tree as unknown as Node[]);
      } else {
        setMessages([]);
        setTreeNodes([]);
      }
    },
    [loadFullMessages],
  );

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      setLoading(false);
      return;
    }

    async function init() {
      const userChats = await getUserChats();
      setChats(userChats as unknown as Chat[]);
      setLoading(false);
    }
    init();
  }, [session, isPending]);

  async function handleCreateChat() {
    const { chat, node } = await createChat();
    const chatObj = chat as unknown as Chat;
    setChats((prev) => [chatObj, ...prev]);
    setCurrentNode(node as unknown as Node);
    await loadChat(chatObj);
  }

  async function handleSelectChat(chat: Chat) {
    await loadChat(chat);
  }

  async function handleDeleteChat(chatId: string) {
    await deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setCurrentNode(null);
      setMessages([]);
      setTreeNodes([]);
    }
  }

  async function handleRenameChat(chatId: string, title: string) {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title } : c)),
    );
  }

  async function handleSendMessage(content: string) {
    if (!currentNode) return;

    const userMsgId = `temp-${Date.now()}`;
    const assistantMsgId = `streaming-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        nodeId: currentNode.id,
        role: "user",
        content,
        order: prev.length,
        replyTo: null,
        createdAt: new Date(),
      },
      {
        id: assistantMsgId,
        nodeId: currentNode.id,
        role: "assistant",
        content: "",
        order: prev.length + 1,
        replyTo: userMsgId,
        createdAt: new Date(),
      },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content }],
        id: currentNode.id,
      }),
    });

    if (res.ok && selectedChat) {
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let accumulated = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m,
              ),
            );
          }
        } finally {
          reader.releaseLock();
        }
      }

      const updatedNode = await getNode(currentNode.id);
      if (updatedNode) setCurrentNode(updatedNode as unknown as Node);
      await loadOwnMessages(currentNode.id);
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
      const userChats = await getUserChats();
      setChats(userChats as unknown as Chat[]);
    }
  }

  async function handleFork(_messageId: string) {
    if (!currentNode) return;

    const child = await forkNode(currentNode.id);
    setCurrentNode(child as unknown as Node);
    setMessages([]);
    await loadFullMessages(child.id);
    if (selectedChat) {
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
    }
  }

  async function handleEditMessage(_messageId: string, newContent: string) {
    if (!currentNode) return;

    await editLastMessage(currentNode.id, newContent);
    await loadFullMessages(currentNode.id);
  }

  async function handleDeleteNode(nodeId: string) {
    const wasRoot =
      currentNode?.id === nodeId && currentNode?.parentId === null;
    await deleteNode(nodeId);

    if (wasRoot) {
      setSelectedChat(null);
      setCurrentNode(null);
      setMessages([]);
      setTreeNodes([]);
      const userChats = await getUserChats();
      setChats(userChats as unknown as Chat[]);
    } else if (selectedChat) {
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
    }
  }

  async function handleMergeNode(nodeId: string) {
    await mergeNode(nodeId);
    if (selectedChat) {
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
    }
  }

  async function handleSelectNode(node: Node) {
    setCurrentNode(node);
    await loadFullMessages(node.id);
    if (selectedChat) {
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
    }
  }

  if (isPending) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Branching Chat</h1>
          <p className="text-muted-foreground">
            Tree-structured AI conversations for learning
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex-1 flex h-full">
        <Sidebar
          chats={chats}
          selectedChat={selectedChat}
          onCreateChat={handleCreateChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop: resizable panels */}
          <div className="hidden md:flex flex-1">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              <ResizablePanel defaultSize={70} minSize={40}>
                <ChatArea
                  node={currentNode}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onFork={handleFork}
                  onEditMessage={handleEditMessage}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full relative">
                  {treeNodes.length > 0 ? (
                    <TreePanel
                      nodes={treeNodes}
                      currentNode={currentNode}
                      onSelectNode={handleSelectNode}
                      onDeleteNode={handleDeleteNode}
                      onMergeNode={handleMergeNode}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No nodes yet
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile: tab bar + conditional panels */}
          <div className="flex flex-col flex-1 md:hidden">
            <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
            {mobileTab === "chat" && (
              <ChatArea
                node={currentNode}
                messages={messages}
                onSendMessage={handleSendMessage}
                onFork={handleFork}
                onEditMessage={handleEditMessage}
              />
            )}
            {mobileTab === "tree" && (
              <div className="h-full relative flex-1">
                {treeNodes.length > 0 && (
                  <TreePanel
                    nodes={treeNodes}
                    currentNode={currentNode}
                    onSelectNode={handleSelectNode}
                    onDeleteNode={handleDeleteNode}
                    onMergeNode={handleMergeNode}
                    isMobileTree
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
