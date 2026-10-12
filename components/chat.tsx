"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Copy,
  KeyRound,
  Lightbulb,
  Mail,
  Megaphone,
  Menu,
  RotateCcw,
  Sparkles,
  Square,
  SquarePen,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ChatSidebar } from "@/components/chat-sidebar";
import { KeyDialog } from "@/components/key-dialog";
import { ModelPicker } from "@/components/model-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { InputGroupAddon } from "@/components/ui/input-group";
import { DEFAULT_MODEL, KEY_STORAGE, MODEL_STORAGE, findModel } from "@/lib/chat";
import { BRAND } from "@/lib/brand";
import { deleteChat, getChat, saveChat, useChatHistory } from "@/lib/chat-history";
import { createLocalStore } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import { morph } from "@/lib/view-transition";

// Everyday small-business prompts: marketing copy, client emails, planning.
const SUGGESTIONS = [
  { icon: Megaphone, color: "text-pink-500", text: "Write 3 Instagram captions for a fitness studio" },
  { icon: Mail, color: "text-sky-500", text: "Draft a friendly follow-up email to a new client" },
  { icon: CalendarDays, color: "text-amber-500", text: "Plan a week of social media posts" },
  { icon: Lightbulb, color: "text-emerald-500", text: "Brainstorm 10 names for a small business" },
];

const keyStore = createLocalStore(KEY_STORAGE);
const modelStore = createLocalStore(MODEL_STORAGE);
const currentModel = () => findModel(modelStore.get())?.id ?? DEFAULT_MODEL;

// Module-level so the transport is stable; headers are resolved per request.
const transport = new DefaultChatTransport<UIMessage>({
  api: "/api/chat",
  headers: (): Record<string, string> => {
    const key = keyStore.get();
    return key ? { "x-anthropic-key": key } : {};
  },
  body: () => ({ model: currentModel() }),
});

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export function Chat({ hasServerKey }: { hasServerKey: boolean }) {
  const apiKey = keyStore.useValue();
  const model = findModel(modelStore.useValue())?.id ?? DEFAULT_MODEL;
  const ready = apiKey !== undefined;
  const [manualOpen, setManualOpen] = useState(false);
  const keyOpen = manualOpen || (ready && !apiKey && !hasServerKey);
  const [input, setInput] = useState("");
  const history = useChatHistory();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const { messages, sendMessage, status, stop, regenerate, setMessages, error, clearError } =
    useChat({
      // A fixed id keeps useChat from calling Math.random() during prerender.
      id: "chat",
      transport,
      onError: (err) => {
        if (/api key/i.test(err.message)) setManualOpen(true);
      },
    });

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;
  const last = messages.at(-1);
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "user");

  // Persist the open conversation whenever it settles (skip mid-stream writes).
  useEffect(() => {
    if (activeId && messages.length > 0 && status !== "streaming") saveChat(activeId, messages);
  }, [activeId, messages, status]);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (!keyStore.get() && !hasServerKey) return setManualOpen(true);
    const start = () => {
      if (!activeId) setActiveId(crypto.randomUUID());
      clearError();
      void sendMessage({ text: content });
      setInput("");
    };
    // The first message morphs the slim start-screen box into the docked composer.
    if (empty) morph(start);
    else start();
  };

  const saveKey = (key: string | null) => {
    keyStore.set(key);
    setManualOpen(false);
    clearError();
  };

  // Finish (and save) any in-flight reply before swapping conversations.
  const openChat = async (id: string | null) => {
    if (busy) await stop();
    const next = id ? (getChat(id)?.messages ?? []) : [];
    const update = () => {
      setMessages(next);
      setActiveId(id);
      clearError();
      setMobileSidebar(false);
    };
    // Animate only when the composer actually moves between the two layouts.
    if (empty !== (next.length === 0)) morph(update);
    else update();
  };

  const newChat = () => void openChat(null);

  const removeChat = (id: string) => {
    deleteChat(id);
    if (id === activeId) newChat();
  };

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 768px)").matches) setSidebarOpen((o) => !o);
    else setMobileSidebar((o) => !o);
  };

  // One composer element in both layouts (never remounted, so focus and text survive):
  // a slim single row on the start screen, a taller box docked at the bottom in a chat.
  const compact = empty;
  const composer = (
    <PromptInput
      onSubmit={({ text }) => send(text)}
      style={{ viewTransitionName: "composer" }}
      className={cn(
        "bg-card shadow-soft *:data-[slot=input-group]:h-auto",
        compact
          ? "rounded-[28px] *:data-[slot=input-group]:rounded-[28px]"
          : "rounded-3xl *:data-[slot=input-group]:rounded-3xl",
      )}
    >
      <PromptInputBody>
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder={compact ? "Ask anything…" : "Describe what you want to generate…"}
          className={cn(
            "text-base md:text-[15px]",
            compact ? "min-h-0 py-3.5 pl-5" : "min-h-16 px-5 pt-4",
          )}
        />
      </PromptInputBody>
      <InputGroupAddon
        align={compact ? "inline-end" : "block-end"}
        className={cn("gap-1", compact ? "self-end pr-2 pb-2" : "justify-end px-3 pb-3")}
      >
        <ModelPicker value={model} onChange={(id) => modelStore.set(id)} />
        <PromptInputSubmit
          status={status}
          onStop={() => void stop()}
          disabled={!busy && !input.trim()}
          aria-label={busy ? "Stop generating" : "Generate"}
          className={cn(
            "h-9 w-auto gap-1.5 rounded-full px-4 font-medium has-[>svg]:px-4",
            // On phones the slim start-screen row is tight, so Generate becomes icon-only there.
            compact && "max-sm:size-9 max-sm:px-0 max-sm:has-[>svg]:px-0",
            busy
              ? "bg-foreground text-background hover:bg-foreground/85"
              : "bg-brand text-white shadow-soft hover:opacity-90",
          )}
        >
          {busy ? (
            <>
              <Square className="size-3 fill-current" />
              <span className={cn(compact && "max-sm:sr-only")}>Stop</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              <span className={cn(compact && "max-sm:sr-only")}>Generate</span>
            </>
          )}
        </PromptInputSubmit>
      </InputGroupAddon>
    </PromptInput>
  );

  return (
    <div className="flex h-full">
      <ChatSidebar
        chats={history}
        activeId={activeId}
        open={sidebarOpen}
        mobileOpen={mobileSidebar}
        onCloseMobile={() => setMobileSidebar(false)}
        onSelect={(id) => void openChat(id)}
        onNew={newChat}
        onDelete={removeChat}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Toggle chat history"
              title="Chat history"
              className="text-muted-foreground"
            >
              <Menu />
            </Button>
            <LogoMark className="size-7 rounded-lg" />
            <span className="text-[17px] font-semibold tracking-tight">{BRAND.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {!empty && (
              <Button
                variant="ghost"
                onClick={newChat}
                className={`text-muted-foreground ${sidebarOpen ? "md:hidden" : ""}`}
              >
                <SquarePen />
                <span className="hidden sm:inline">New chat</span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setManualOpen(true)}
              className="text-muted-foreground"
            >
              <span className="relative">
                <KeyRound />
                {ready && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 size-1.5 rounded-full ${
                      apiKey || hasServerKey ? "bg-emerald-500" : "bg-primary"
                    }`}
                  />
                )}
              </span>
              <span className="hidden sm:inline">{apiKey ? "API key" : "Add key"}</span>
            </Button>
          </div>
        </header>

        {empty ? (
          <div className="brand-glow flex min-h-0 flex-1 flex-col justify-end px-3 sm:px-6">
            <h1 className="animate-rise mb-7 text-center text-[28px] font-medium tracking-tight text-balance sm:text-3xl">
              What do you want to create?
            </h1>
          </div>
        ) : (
          <Conversation className="min-h-0">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-7 px-4 pt-4 pb-10 sm:px-6">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                const streaming = status === "streaming" && isLast && m.role === "assistant";
                const text = textOf(m);
                return (
                  <Message key={m.id} from={m.role} className="animate-rise">
                    {m.role === "assistant" ? (
                      <div className="flex gap-3 sm:gap-4">
                        <Avatar pulsing={streaming} />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <MessageContent className="w-full text-[15px] leading-relaxed">
                            <MessageResponse
                              isAnimating={streaming}
                              animated
                              shikiTheme={["github-light", "github-dark"]}
                            >
                              {text}
                            </MessageResponse>
                          </MessageContent>
                          {!streaming && text && (
                            <MessageActions
                              className={`mt-2 -ml-1.5 transition-opacity ${
                                isLast ? "" : "opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              <CopyAction text={text} />
                              {isLast && (
                                <MessageAction
                                  tooltip="Regenerate"
                                  onClick={() => void regenerate()}
                                  className="text-muted-foreground"
                                >
                                  <RotateCcw />
                                </MessageAction>
                              )}
                            </MessageActions>
                          )}
                        </div>
                      </div>
                    ) : (
                      <MessageContent className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary! px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground!">
                        {text}
                      </MessageContent>
                    )}
                  </Message>
                );
              })}

              {waiting && (
                <div className="flex gap-3 sm:gap-4">
                  <Avatar pulsing />
                  <TypingIndicator />
                </div>
              )}

              {error && !busy && (
                <div className="flex gap-3 pl-10 sm:pl-11">
                  <div className="flex flex-1 items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span className="flex-1">{error.message || "Something went wrong."}</span>
                    <button
                      onClick={() => {
                        clearError();
                        void regenerate();
                      }}
                      className="shrink-0 font-medium underline-offset-4 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton className="shadow-soft" />
          </Conversation>
        )}

        <div
          className={cn(
            "shrink-0 px-3 sm:px-6",
            !empty && "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5",
          )}
        >
          <div className="mx-auto max-w-3xl">
            {!empty && (
              <p className="mb-2 text-center text-[11px] text-muted-foreground">
                AI responses can be inaccurate. Double-check important details.
              </p>
            )}
            {composer}
          </div>
        </div>

        {empty && (
          <div className="min-h-0 flex-[1.3] overflow-y-auto px-3 sm:px-6">
            <ul className="animate-rise mx-auto mt-4 max-w-3xl space-y-0.5" aria-label="Suggestions">
              {SUGGESTIONS.map(({ icon: Icon, color, text }) => (
                <li key={text}>
                  <button
                    onClick={() => send(text)}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] text-foreground/80 transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon className={`size-[18px] shrink-0 ${color}`} />
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <KeyDialog
        open={keyOpen}
        currentKey={apiKey ?? null}
        dismissible={Boolean(apiKey) || hasServerKey}
        onClose={() => setManualOpen(false)}
        onSave={saveKey}
      />
    </div>
  );
}

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-brand flex items-center justify-center text-white shadow-soft ${className}`}>
      <Sparkles className="size-[55%]" />
    </div>
  );
}

function Avatar({ pulsing }: { pulsing?: boolean }) {
  return <LogoMark className={`mt-0.5 size-7 shrink-0 rounded-lg ${pulsing ? "animate-pulse" : ""}`} />;
}

function TypingIndicator() {
  return (
    <div className="flex h-7 items-center gap-1" aria-label="Claude is thinking">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="typing-dot size-1.5 rounded-full bg-muted-foreground"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <MessageAction
      tooltip={copied ? "Copied" : "Copy"}
      className="text-muted-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check /> : <Copy />}
    </MessageAction>
  );
}
