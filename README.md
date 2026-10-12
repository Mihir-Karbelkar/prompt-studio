# Prompt Studio

A fast, mobile-friendly AI writing assistant powered by the Claude API. Type a prompt, press **Generate**, and the answer streams in live as rendered Markdown, with code highlighting, tables and math.

**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com) + [AI Elements](https://ai-sdk.dev/elements) · Vercel AI SDK `useChat` · [Streamdown](https://streamdown.ai) · official `@anthropic-ai/sdk`

## Features

- Streaming responses from Claude, rendered with Streamdown (Markdown, syntax-highlighted code, tables, math, Mermaid)
- Chat-style conversation with multi-turn context, a typing indicator, stop, regenerate, copy, and auto-scroll with a "jump to bottom" button
- Model picker (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1); your choice is remembered
- API key popup: paste your key, it's checked against Anthropic, then saved in your browser only
- Light and dark themes: follows your OS setting by default, with a toggle in the header that remembers your choice
- Responsive layout down to phone width

## Rebranding

- **Name and tagline:** `lib/brand.ts`
- **Colors:** `--primary`, `--brand-from` and `--brand-to` in `app/globals.css` (light under `:root`, dark under `.dark`)
- **Starter prompts:** `SUGGESTIONS` in `components/chat.tsx`

## Run locally

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Where the API key goes

You have two options:

1. **In the app (default).** On first load a popup asks for your Anthropic API key (get one at https://console.anthropic.com/settings/keys). The key is saved in your browser's `localStorage` and sent with each request in an `x-anthropic-key` header. The server uses it for that one call and never stores or logs it. You can change or remove it any time with the **API key** button.
2. **On the server.** Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY=sk-ant-...`. On Vercel, add it under *Project → Settings → Environment Variables* instead. When this is set, the popup no longer opens on its own (visitors can still use their own key).

## Deploy (Vercel)

```bash
pnpm dlx vercel
```

Or push to GitHub and import the repo at https://vercel.com/new. No other setup is needed; `ANTHROPIC_API_KEY` is optional (see above).

## Project structure

```
app/
  api/chat/route.ts     Calls Claude through the Anthropic SDK and returns an AI SDK UI message stream
  api/verify/route.ts   Lightweight key check used by the popup
  layout.tsx, page.tsx  Shell, fonts, theme
components/
  chat.tsx              Chat screen (useChat + AI Elements)
  key-dialog.tsx        API key popup
  model-picker.tsx      Model dropdown
  ai-elements/, ui/     Generated shadcn / AI Elements components
lib/
  brand.ts              Product name and tagline
  chat.ts               Model list, system prompt, storage keys
  local-store.ts        Small localStorage-backed React store
```

The server only accepts model IDs from the list in `lib/chat.ts`. Requests use `effort: "low"` for quick chat replies. On models that support it, a declined request is automatically retried on another model through server-side fallbacks.
