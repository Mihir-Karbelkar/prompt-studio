import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

// Lightweight key check: listing models costs nothing and fails fast on a bad key.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-anthropic-key")?.trim();
  if (!apiKey) return Response.json({ ok: false, error: "No key provided." }, { status: 400 });

  try {
    await new Anthropic({ apiKey, maxRetries: 0 }).models.list({ limit: 1 });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ ok: false, error: "That key was rejected by Anthropic." }, { status: 401 });
    }
    return Response.json({ ok: false, error: "Couldn't verify the key right now." }, { status: 502 });
  }
}
