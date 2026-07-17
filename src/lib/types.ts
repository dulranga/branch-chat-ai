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
  modelConfigId: string | null;
  reasoningLevel: string | null;
  createdAt: Date;
}

export interface UserModel {
  id: string;
  userId: string;
  provider: string;
  model: string;
  name: string;
  createdAt: Date;
}

export interface ModelProviderConfig {
  package: string;
  constructor: string;
  models: string[];
  baseURL?: string;
}

export interface CommandContext {
  onFork: (messageId: string) => void;
}

export interface Command {
  trigger: string;
  label: string;
  description: string;
  execute: (context: CommandContext) => void;
}
