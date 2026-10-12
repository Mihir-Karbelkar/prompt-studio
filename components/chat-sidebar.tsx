"use client";

import { useEffect } from "react";
import { MessageSquare, SquarePen, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedChat } from "@/lib/chat-history";
import { cn } from "@/lib/utils";

type Props = {
  chats: SavedChat[];
  activeId: string | null;
  /** Desktop: whether the panel is expanded. */
  open: boolean;
  /** Mobile: whether the drawer is showing. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

const DAY = 24 * 60 * 60 * 1000;

function groupChats(chats: SavedChat[]) {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const groups: { label: string; chats: SavedChat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Previous 7 days", chats: [] },
    { label: "Older", chats: [] },
  ];
  for (const chat of chats) {
    if (chat.updatedAt >= startOfToday) groups[0].chats.push(chat);
    else if (chat.updatedAt >= startOfToday - 7 * DAY) groups[1].chats.push(chat);
    else groups[2].chats.push(chat);
  }
  return groups.filter((g) => g.chats.length > 0);
}

export function ChatSidebar({
  chats,
  activeId,
  open,
  mobileOpen,
  onCloseMobile,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseMobile();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  const panel = (
    <div className="flex h-full w-72 flex-col bg-sidebar">
      <div className="flex items-center gap-2 p-3">
        <Button onClick={onNew} variant="outline" className="h-9 flex-1 justify-start gap-2 bg-card">
          <SquarePen />
          New chat
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="text-muted-foreground md:hidden"
        >
          <X />
        </Button>
      </div>

      <nav aria-label="Chat history" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <MessageSquare className="size-5" />
            Your chats will show up here.
          </div>
        ) : (
          groupChats(chats).map((group) => (
            <div key={group.label} className="mt-3 first:mt-1">
              <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
              <ul className="space-y-0.5">
                {group.chats.map((chat) => (
                  <li key={chat.id} className="group/item relative">
                    <button
                      onClick={() => onSelect(chat.id)}
                      aria-current={chat.id === activeId ? "page" : undefined}
                      title={chat.title}
                      className={cn(
                        "w-full truncate rounded-lg py-2 pr-9 pl-3 text-left text-sm transition",
                        chat.id === activeId
                          ? "bg-sidebar-accent font-medium text-foreground"
                          : "text-foreground/80 hover:bg-sidebar-accent/60",
                      )}
                    >
                      {chat.title}
                    </button>
                    <button
                      onClick={() => onDelete(chat.id)}
                      aria-label={`Delete “${chat.title}”`}
                      title="Delete chat"
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover/item:opacity-100 hover:text-destructive focus-visible:opacity-100 max-md:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop: collapsible column. */}
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-sidebar-border transition-[width] duration-200 md:block",
          open ? "w-72" : "w-0 border-r-0",
        )}
      >
        {panel}
      </aside>

      {/* Mobile: slide-in drawer. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 animate-in bg-black/40 fade-in-0"
            onClick={onCloseMobile}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 animate-in shadow-soft duration-200 slide-in-from-left">
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
