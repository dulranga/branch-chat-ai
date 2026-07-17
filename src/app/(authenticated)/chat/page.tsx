"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatArea } from "@/components/chat-area";
import { Sidebar } from "@/components/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TreePanel } from "@/components/tree-panel";
import {
  createChat,
  deleteChat,
  deleteNode,
  editLastMessage,
  forkNode,
  generateTitle,
  getAncestorMessages,
  getBranchCounts,
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
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [treeNodes, setTreeNodes] = useState<Node[]>([]);
  const [mobileTab, setMobileTab] = useState<"chat" | "tree">("chat");
  const [loading, setLoading] = useState(true);

  const loadFullMessages = useCallback(async (nodeId: string) => {
    const [nodeMsgs, ancestorMsgs] = await Promise.all([
      getNodeMessages(nodeId),
      getAncestorMessages(nodeId),
    ]);
    setMessages([...ancestorMsgs, ...nodeMsgs] as unknown as Message[]);
  }, []);



  const loadOwnMessages = useCallback(async (nodeId: string) => {
    const msgs = await getNodeMessages(nodeId);
    setMessages(msgs as unknown as Message[]);
  }, []);

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
      const [userChats, counts] = await Promise.all([
        getUserChats(),
        getBranchCounts(),
      ]);
      setChats(userChats as unknown as Chat[]);
      setBranchCounts(counts);
      setLoading(false);
    }
    init();
  }, [session, isPending]);

  async function handleCreateChat() {
    const { chat, node } = await createChat();
    const chatObj = chat as unknown as Chat;
    setChats((prev) => [chatObj, ...prev]);
    setCurrentNode(node as unknown as Node);
    setBranchCounts((prev) => ({ ...prev, [chatObj.id]: 1 }));
    await loadChat(chatObj);
  }

  async function handleSelectChat(chat: Chat) {
    await loadChat(chat);
  }

  async function handleDeleteChat(chatId: string) {
    await deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setBranchCounts((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
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

  async function refreshBranchCounts() {
    const counts = await getBranchCounts();
    setBranchCounts(counts);
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
        modelConfigId: null,
        reasoningLevel: null,
        createdAt: new Date(),
      },
      {
        id: assistantMsgId,
        nodeId: currentNode.id,
        role: "assistant",
        content: "",
        order: prev.length + 1,
        replyTo: userMsgId,
        modelConfigId: null,
        reasoningLevel: null,
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

      const title = await generateTitle(currentNode.id);
      const updatedNode = await getNode(currentNode.id);
      if (updatedNode) {
        setCurrentNode({
          ...(updatedNode as unknown as Node),
          title: title ?? (updatedNode as unknown as Node).title,
        });
      }
      await loadOwnMessages(currentNode.id);
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
      const userChats = await getUserChats();
      setChats(userChats as unknown as Chat[]);
      await refreshBranchCounts();
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
      await refreshBranchCounts();
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
      await refreshBranchCounts();
    } else if (selectedChat) {
      const tree = await getChatTree(selectedChat.id);
      setTreeNodes(tree as unknown as Node[]);
      await refreshBranchCounts();
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
      <Sidebar
        chats={chats}
        branchCounts={branchCounts}
        selectedChat={selectedChat}
        onCreateChat={handleCreateChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="font-display text-sm font-semibold tracking-tight truncate">
            {currentNode?.title || (selectedChat ? "Untitled" : "Chat Branch Tracker")}
          </h1>
        </header>

        <div className="flex items-center border-b border-border md:hidden shrink-0">
          <Tabs
            value={mobileTab}
            onValueChange={(v) => setMobileTab(v as "chat" | "tree")}
            className="flex-1"
          >
            <TabsList className="w-full rounded-none border-b-0">
              <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
              <TabsTrigger value="tree" className="flex-1">Tree</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="hidden md:flex flex-1 min-h-0">
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

            <ResizablePanel defaultSize={30} minSize={20}>
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

        <div className="flex flex-col flex-1 md:hidden">
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
      </SidebarInset>
    </SidebarProvider>
  );
}
