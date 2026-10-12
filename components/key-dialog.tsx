"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  open: boolean;
  currentKey: string | null;
  dismissible: boolean;
  onClose: () => void;
  onSave: (key: string | null) => void;
};

export function KeyDialog({ open, currentKey, dismissible, onClose, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismissible && onClose()}>
      <DialogContent showCloseButton={dismissible} className="gap-5 p-6 shadow-soft sm:max-w-md">
        {/* Remount the form each time the dialog opens so it starts fresh. */}
        {open && <KeyForm currentKey={currentKey} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function KeyForm({ currentKey, onSave }: Pick<Props, "currentKey" | "onSave">) {
  const [value, setValue] = useState(currentKey ?? "");
  const [reveal, setReveal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const key = value.trim();
    if (!key) return setError("Paste your API key first.");
    if (!key.startsWith("sk-ant-")) return setError("Anthropic keys start with “sk-ant-”.");

    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", { method: "POST", headers: { "x-anthropic-key": key } });
      const data = await res.json();
      if (!data.ok) return setError(data.error);
      onSave(key);
    } catch {
      setError("Couldn't reach the server to verify the key.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DialogHeader className="gap-3">
        <div className="bg-brand flex size-11 items-center justify-center rounded-xl text-white shadow-soft">
          <KeyRound className="size-5" />
        </div>
        <DialogTitle className="text-xl font-semibold tracking-tight">
          Connect your Claude API key
        </DialogTitle>
        <DialogDescription>
          Your key is stored only in this browser and sent with each request. Get one from the{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Anthropic Console
          </a>
          .
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <label htmlFor="api-key" className="text-sm font-medium">
          API key
        </label>
        <div className="relative">
          <Input
            id="api-key"
            type={reveal ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-ant-api03-…"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            aria-invalid={Boolean(error)}
            className="h-11 pr-11 font-mono"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide key" : "Show key"}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          >
            {reveal ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Never logged or stored on the server.
        </p>
      </div>

      <DialogFooter className="-mx-6 -mb-6 mt-1">
        {currentKey && (
          <Button type="button" variant="destructive" size="lg" onClick={() => onSave(null)}>
            Remove key
          </Button>
        )}
        <Button type="submit" size="lg" disabled={checking} className="bg-brand text-white hover:opacity-90">
          {checking && <Spinner />}
          {checking ? "Verifying…" : "Save key"}
        </Button>
      </DialogFooter>
    </form>
  );
}
