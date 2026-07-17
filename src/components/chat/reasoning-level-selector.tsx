"use client";

import { REASONING_LEVELS } from "@/lib/provider-options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReasoningLevelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ReasoningLevelSelector({
  value,
  onChange,
}: ReasoningLevelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-[140px] text-xs">
        <SelectValue placeholder="Reasoning level" />
      </SelectTrigger>
      <SelectContent>
        {REASONING_LEVELS.map((level) => (
          <SelectItem key={level.value} value={level.value} className="text-xs">
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
