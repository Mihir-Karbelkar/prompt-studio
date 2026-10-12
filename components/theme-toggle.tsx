"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE } from "@/lib/chat";
import { createLocalStore } from "@/lib/local-store";

const themeStore = createLocalStore(THEME_STORAGE);

/** Flips between light and dark; the choice overrides the OS preference from then on. */
export function ThemeToggle() {
  // Subscribing keeps the toggle in sync if the theme changes in another tab.
  themeStore.useValue();

  const toggle = () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    themeStore.set(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      title="Toggle theme"
      className="text-muted-foreground"
    >
      {/* Icons swap via CSS so the server render never mismatches the client. */}
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}
