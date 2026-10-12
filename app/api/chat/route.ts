import Anthropic from "@anthropic-ai/sdk";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import type { NextRequest } from "next/server";
import { DEFAULT_MODEL, SYSTEM_PROMPT, findModel } from "@/lib/chat";

const MAX_TURNS = 40;
const MAX_CHARS = 100_000;

function resolveKey(req: NextRequest): string | null {
  return req.headers.get("x-anthropic-key")?.trim() || process.env.ANTHROPIC_API_KEY || null;
}

/** Flatten AI SDK UI messages into Claude's text-only message format. */
function toClaudeMessages(messages: UIMessage[]): Anthropic.Beta.BetaMessageParam[] | null {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_TURNS) return null;

  const out: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = (m.parts ?? [])
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();
    if (!text) continue;
    if (text.length > MAX_CHARS) return null;
    out.push({ role: m.role, content: text });
  }
  return out.at(-1)?.role === "user" ? out : null;
}

function describeError(err: unknown): { status: number; message: string } {
  if (err instanceof Anthropic.AuthenticationError) {
    return { status: 401, message: "That API key was rejected. Check it and try again." };
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return { status: 403, message: "This API key doesn't have access to the model." };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "Rate limited by the Claude API. Wait a moment and retry." };
  }
  if (err instanceof Anthropic.BadRequestError) {
    return { status: 400, message: err.message };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { status: 502, message: "Couldn't reach the Claude API. Check your connection." };
  }
  if (err instanceof Anthropic.APIError) {
    return { status: err.status ?? 500, message: "The Claude API returned an error. Please retry." };
  }
  return { status: 500, message: "Something went wrong." };
}

export async function POST(req: NextRequest) {
  const apiKey = resolveKey(req);
  if (!apiKey) {
    return new Response("Add your Anthropic API key to start chatting.", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const messages = toClaudeMessages(body?.messages);
  if (!messages) {
    return new Response("Invalid message history.", { status: 400 });
  }

  const model = findModel(body?.model ?? DEFAULT_MODEL);
  if (!model) {
    return new Response("Unknown model.", { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const stream = client.beta.messages.stream(
    {
      model: model.id,
      max_tokens: 64000,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" },
      // Re-route to another model if a safety classifier declines the request.
      ...(model.fallbacks && {
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default" as const,
      }),
      messages,
    },
    { signal: req.signal },
  );

  // Wait for the HTTP response so auth/rate-limit failures surface as real status codes.
  try {
    await stream.withResponse();
  } catch (err) {
    const { status, message } = describeError(err);
    return new Response(message, { status });
  }

  const ui = createUIMessageStream({
    async execute({ writer }) {
      const id = crypto.randomUUID();
      let started = false;

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          if (!started) {
            writer.write({ type: "text-start", id });
            started = true;
          }
          writer.write({ type: "text-delta", id, delta: event.delta.text });
        }
      }
      if (started) writer.write({ type: "text-end", id });

      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        throw new Error("Claude declined to answer this request.");
      }
      if (final.stop_reason === "max_tokens") {
        throw new Error("The response hit the length limit and was cut off.");
      }
    },
    onError: (err) =>
      err instanceof Anthropic.APIError || !(err instanceof Error)
        ? describeError(err).message
        : err.message,
  });

  return createUIMessageStreamResponse({ stream: ui });
}
