"use client";

import { useState, useCallback } from "react";
import type { CommandContext } from "@/lib/types";
import { getCommands } from "@/lib/commands";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Terminal } from "lucide-react";

interface CommandPaletteProps {
  context: CommandContext;
}

export function CommandPalette({ context }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const commands = getCommands();

  const handleSelect = useCallback(
    (trigger: string) => {
      const cmd = commands.find((c) => c.trigger === trigger);
      if (cmd) {
        cmd.execute(context);
      }
      setOpen(false);
    },
    [commands, context],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-[120px] justify-between text-xs"
        >
          <Terminal className="mr-1 h-3 w-3" />
          Commands
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <CommandPrimitive>
          <CommandList>
            <CommandEmpty className="py-2 text-xs text-muted-foreground">
              No commands available
            </CommandEmpty>
            <CommandGroup heading="Slash Commands">
              {commands.map((cmd) => (
                <CommandItem
                  key={cmd.trigger}
                  value={cmd.trigger}
                  onSelect={handleSelect}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-xs font-medium">{cmd.trigger}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {cmd.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {cmd.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
