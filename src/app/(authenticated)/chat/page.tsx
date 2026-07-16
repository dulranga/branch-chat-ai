"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatArea } from "@/components/chat-area";
import { Sidebar } from "@/components/sidebar";
import { MobileTabBar, TreePanel } from "@/components/tree-panel";
import {
  createChat,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      body: JSON.stringify({ nodeId: currentNode.id, message: content }),
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
        chats={chats}
        selectedChat={selectedChat}
        onCreateChat={handleCreateChat}
        onSelectChat={handleSelectChat}
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
