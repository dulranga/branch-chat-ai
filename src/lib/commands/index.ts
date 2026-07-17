import type { Command } from "@/lib/types";

const commands = new Map<string, Command>();

export function registerCommand(command: Command): void {
  commands.set(command.trigger, command);
}

registerCommand({
  trigger: "/branch",
  label: "Branch from current node",
  description: "Create a new branch from the current conversation node",
  execute: (context) => context.onFork(""),
});

export function getCommands(): Command[] {
  return Array.from(commands.values());
}

export function getCommand(trigger: string): Command | undefined {
  return commands.get(trigger);
}

export function resetCommands(): void {
  commands.clear();
}
