export interface Chat {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
}

export interface Node {
  id: string;
  userId: string;
  chatId: string;
  parentId: string | null;
  title: string | null;
  path: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  nodeId: string;
  role: "user" | "assistant" | "system";
  content: string;
  order: number;
  replyTo: string | null;
  createdAt: Date;
}
