"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChatArea } from "@/components/chat-area";
import { Sidebar } from "@/components/sidebar";
import { MobileTabBar, TreePanel } from "@/components/tree-panel";
import {
  createRootNode,
  deleteNode,
  editLastMessage,
  forkNode,
  getNodeMessages,
  getSubtree,
  getUserRootNode,
  mergeNode,
} from "@/data-access";
import { useSession } from "@/lib/auth-client";
import type { Message, Node } from "@/lib/types";

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const [, startTransition] = useTransition();
  const [rootNode, setRootNode] = useState<Node | null>(null);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [treeNodes, setTreeNodes] = useState<Node[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<"chat" | "tree">("chat");
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async (nodeId: string) => {
    const msgs = await getNodeMessages(nodeId);
    setMessages(msgs as unknown as Message[]);
  }, []);

  const loadSubtree = useCallback(async (nodeId: string) => {
    const nodes = await getSubtree(nodeId);
    setTreeNodes(nodes as unknown as Node[]);
  }, []);

  const loadTree = useCallback(
    async (nodeId: string) => {
      await Promise.all([loadMessages(nodeId), loadSubtree(nodeId)]);
    },
    [loadMessages, loadSubtree],
  );

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      setLoading(false);
      return;
    }

    async function init() {
      const root = await getUserRootNode();
      setRootNode(root as unknown as Node | null);
      if (root) {
        setCurrentNode(root as unknown as Node);
        await loadTree(root.id);
      }
      setLoading(false);
    }
    init();
  }, [session, isPending, loadTree]);

  async function handleNewChat() {
    const root = await createRootNode();
    setRootNode(root as unknown as Node);
    setCurrentNode(root as unknown as Node);
    setMessages([]);
    setTreeNodes([root as unknown as Node]);
  }

  async function handleSendMessage(content: string) {
    if (!currentNode) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        nodeId: currentNode.id,
        role: "user",
        content,
        order: prev.length,
        replyTo: null,
        createdAt: new Date(),
      },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: currentNode.id, message: content }),
    });

    if (res.ok) {
      await loadMessages(currentNode.id);
      await loadSubtree(currentNode.id);
    }
  }

  async function handleFork(_messageId: string) {
    if (!currentNode) return;

    startTransition(async () => {
      const child = await forkNode(currentNode.id);
      setCurrentNode(child as unknown as Node);
      setMessages([]);
      await loadSubtree(child.id);
    });
  }

  async function handleEditMessage(_messageId: string, newContent: string) {
    if (!currentNode) return;

    await editLastMessage(currentNode.id, newContent);
    await loadMessages(currentNode.id);
  }

  async function handleDeleteNode(nodeId: string) {
    await deleteNode(nodeId);

    if (nodeId === rootNode?.id) {
      setRootNode(null);
      setCurrentNode(null);
      setMessages([]);
      setTreeNodes([]);
    } else if (nodeId === currentNode?.id) {
      if (rootNode) await handleSelectNode(rootNode);
    } else {
      if (currentNode) await loadTree(currentNode.id);
    }
  }

  async function handleMergeNode(nodeId: string) {
    await mergeNode(nodeId);
    if (currentNode) await loadTree(currentNode.id);
  }

  async function handleSelectNode(node: Node) {
    setCurrentNode(node);
    await loadTree(node.id);
  }

  if (isPending) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Branching Chat</h1>
          <p className="text-zinc-500">
            Tree-structured AI conversations for learning
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full">
      <Sidebar
        rootNode={rootNode}
        currentNode={currentNode}
        onNewChat={handleNewChat}
        onSelectNode={handleSelectNode}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col md:ml-64">
        <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />

        <div className="flex-1 flex">
          <div
            className={`flex-1 flex flex-col ${
              mobileTab === "tree" ? "hidden md:flex" : "flex"
            }`}
          >
            <ChatArea
              node={currentNode}
              messages={messages}
              onSendMessage={handleSendMessage}
              onFork={handleFork}
              onEditMessage={handleEditMessage}
            />
          </div>

          <div
            className={`w-80 border-l border-zinc-200 dark:border-zinc-700 hidden md:block ${
              mobileTab === "tree" ? "md:block" : ""
            }`}
          >
            <div className="h-full relative">
              {treeNodes.length > 0 && (
                <TreePanel
                  nodes={treeNodes}
                  currentNode={currentNode}
                  onSelectNode={handleSelectNode}
                  onDeleteNode={handleDeleteNode}
                  onMergeNode={handleMergeNode}
                />
              )}
            </div>
          </div>

          {mobileTab === "tree" && (
            <div className="flex-1 md:hidden h-full relative">
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
  );
}
