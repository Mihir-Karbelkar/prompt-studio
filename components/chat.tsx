"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AlertCircle, Check, Copy, KeyRound, RotateCcw, Sparkles, Square, SquarePen } from "lucide-react";
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
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { KeyDialog } from "@/components/key-dialog";
import { ModelPicker } from "@/components/model-picker";
import { Button } from "@/components/ui/button";
import { DEFAULT_MODEL, KEY_STORAGE, MODEL_STORAGE, findModel } from "@/lib/chat";
import { BRAND } from "@/lib/brand";
import { createLocalStore } from "@/lib/local-store";

// Everyday small-business prompts: marketing copy, client emails, planning.
const SUGGESTIONS = [
  "Write 3 Instagram captions for a fitness studio",
  "Draft a friendly follow-up email to a new client",
  "Plan a week of social media posts",
  "Brainstorm 10 names for a small business",
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

  const send = (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (!keyStore.get() && !hasServerKey) return setManualOpen(true);
    clearError();
    void sendMessage({ text: content });
    setInput("");
  };

  const saveKey = (key: string | null) => {
    keyStore.set(key);
    setManualOpen(false);
    clearError();
  };

  const newChat = () => {
    void stop();
    setMessages([]);
    clearError();
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-7 rounded-lg" />
          <span className="text-[17px] font-semibold tracking-tight">{BRAND.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {!empty && (
            <Button variant="ghost" onClick={newChat} className="text-muted-foreground">
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
        <main className="brand-glow flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-6 text-center">
          <LogoMark className="animate-rise mb-5 size-12 rounded-2xl" />
          <h1 className="animate-rise text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            What do you want to create?
          </h1>
          <p className="animate-rise mt-3 max-w-md text-balance text-muted-foreground">
            {BRAND.tagline}
          </p>
        </main>
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

      <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
        <div className="mx-auto max-w-3xl space-y-3">
          {empty && (
            <Suggestions className="mx-auto">
              {SUGGESTIONS.map((s) => (
                <Suggestion
                  key={s}
                  suggestion={s}
                  onClick={send}
                  className="bg-card font-normal text-foreground/80 hover:border-primary/40 hover:text-primary"
                />
              ))}
            </Suggestions>
          )}
          <PromptInput
            onSubmit={({ text }) => send(text)}
            className="rounded-3xl bg-card shadow-soft *:data-[slot=input-group]:rounded-3xl"
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Describe what you want to generate…"
                className="min-h-14 px-4 pt-3.5 text-base md:text-[15px]"
              />
            </PromptInputBody>
            <PromptInputFooter className="px-2.5 pb-2.5">
              <ModelPicker value={model} onChange={(id) => modelStore.set(id)} />
              <PromptInputSubmit
                status={status}
                onStop={() => void stop()}
                disabled={!busy && !input.trim()}
                aria-label={busy ? "Stop generating" : "Generate"}
                className={`ml-auto h-9 w-auto gap-1.5 rounded-full px-4 font-medium has-[>svg]:px-4 ${
                  busy
                    ? "bg-foreground text-background hover:bg-foreground/85"
                    : "bg-brand text-white shadow-soft hover:opacity-90"
                }`}
              >
                {busy ? (
                  <>
                    <Square className="size-3 fill-current" /> Stop
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Generate
                  </>
                )}
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
          <p className="text-center text-[11px] text-muted-foreground">
            AI responses can be inaccurate. Double-check important details.
          </p>
        </div>
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
