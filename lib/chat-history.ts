"use client";

import { useMemo } from "react";
import type { UIMessage } from "ai";
import { HISTORY_STORAGE } from "@/lib/chat";
import { createLocalStore } from "@/lib/local-store";

export type SavedChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

/** Oldest chats are dropped past this to stay well inside localStorage limits. */
const MAX_CHATS = 50;

const store = createLocalStore(HISTORY_STORAGE);

function parse(raw: string | null | undefined): SavedChat[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

function titleFor(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first ? textOf(first).replace(/\s+/g, " ").trim() : "";
  if (!text) return "New chat";
  return text.length > 48 ? `${text.slice(0, 48).trimEnd()}…` : text;
}

/** Saved chats, most recent first. Empty until the browser store hydrates. */
export function useChatHistory(): SavedChat[] {
  const raw = store.useValue();
  return useMemo(() => parse(raw), [raw]);
}

export function getChat(id: string): SavedChat | undefined {
  return parse(store.get()).find((c) => c.id === id);
}

/** Insert or update a chat; a no-op when nothing changed, so ordering stays stable. */
export function saveChat(id: string, messages: UIMessage[]) {
  const chats = parse(store.get());
  const existing = chats.find((c) => c.id === id);
  if (existing && JSON.stringify(existing.messages) === JSON.stringify(messages)) return;

  const updated: SavedChat = {
    id,
    title: existing?.title ?? titleFor(messages),
    updatedAt: Date.now(),
    messages,
  };
  store.set(JSON.stringify([updated, ...chats.filter((c) => c.id !== id)].slice(0, MAX_CHATS)));
}

export function deleteChat(id: string) {
  store.set(JSON.stringify(parse(store.get()).filter((c) => c.id !== id)));
}
