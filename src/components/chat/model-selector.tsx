"use client";

import { useMemo, useState, useCallback } from "react";
import type { UserModel } from "@/lib/types";
import { getProviders, formatProviderName } from "@/config/models";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  models: UserModel[];
  activeModel: UserModel | null;
  onSelect: (model: UserModel) => void;
}

export function ModelSelector({
  models,
  activeModel,
  onSelect,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const providers = getProviders();
    const groups: Record<string, UserModel[]> = {};
    for (const p of providers) {
      const pModels = models.filter((m) => m.provider === p);
      if (pModels.length > 0) {
        groups[p] = pModels;
      }
    }
    return groups;
  }, [models]);

  const providerNames = useMemo(
    () =>
      Object.keys(grouped).map((p) => ({
        slug: p,
        name: formatProviderName(p),
      })),
    [grouped],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const model = models.find((m) => m.id === id);
      if (model) onSelect(model);
      setOpen(false);
    },
    [models, onSelect],
  );

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
        <a href="/settings" className="underline hover:text-foreground">
          Add a model
        </a>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-[200px] justify-between text-xs"
        >
          {activeModel?.name ?? "Select a model"}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-xs text-muted-foreground">
              No models match
            </CommandEmpty>
            {providerNames.map(({ slug, name }) => (
              <CommandGroup key={slug} heading={name}>
                {grouped[slug].map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={handleSelect}
                    className="text-xs"
                  >
                    {model.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
