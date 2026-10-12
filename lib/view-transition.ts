import { flushSync } from "react-dom";

/**
 * Run a React state update inside a View Transition so elements with a
 * `view-transition-name` morph between their old and new size/position.
 * Falls back to a plain update where unsupported or when motion is reduced.
 */
export function morph(update: () => void) {
  if (
    typeof document === "undefined" ||
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
