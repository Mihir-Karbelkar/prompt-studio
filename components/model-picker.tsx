"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MODELS, findModel } from "@/lib/chat";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function ModelPicker({ value, onChange }: Props) {
  const current = findModel(value) ?? MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Choose model"
        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm text-muted-foreground transition outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted data-popup-open:text-foreground"
      >
        {current.name}
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-72 p-1.5 shadow-soft">
        {MODELS.map((m) => {
          const selected = m.id === current.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onClick={() => onChange(m.id)}
              className={cn("items-start gap-3 rounded-lg px-2.5 py-2", selected && "bg-accent/60")}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.description}</div>
              </div>
              <Check
                className={cn("mt-0.5 size-4 text-primary", selected ? "opacity-100" : "opacity-0")}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
