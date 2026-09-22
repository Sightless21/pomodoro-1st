"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A small always-on-top window that keeps the running timer visible even when
 * the app's tab is not. Built on the Document Picture-in-Picture API, which
 * hands us a real browser Window we can render arbitrary DOM into. Chromium
 * only (Chrome/Edge 116+); `supported` stays false elsewhere and the toggle
 * button simply never renders.
 */
type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
  window: Window | null;
};

const MINI_WINDOW_SIZE = { width: 320, height: 216 } as const;

function subscribeNoop() {
  return () => {};
}

function documentPipApi(): DocumentPictureInPictureApi | null {
  if (typeof window === "undefined") return null;
  const api = (window as Window & { documentPictureInPicture?: DocumentPictureInPictureApi })
    .documentPictureInPicture;
  return api?.requestWindow ? api : null;
}

/**
 * The PiP document starts empty, so it has none of the app's styling. Copy the
 * root classes (font variables, color mode) and every stylesheet across — the
 * Cojeev tokens and Tailwind layers are what make the mini view look native.
 */
function adoptStyles(target: Window) {
  const targetDoc = target.document;
  const sourceRoot = document.documentElement;
  const targetRoot = targetDoc.documentElement;
  targetRoot.className = sourceRoot.className;
  targetRoot.lang = sourceRoot.lang || "en";
  if (sourceRoot.dataset.mode) targetRoot.dataset.mode = sourceRoot.dataset.mode;
  targetDoc.body.className = document.body.className;

  for (const source of Array.from(
    document.querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]'),
  )) {
    const clone = source.cloneNode(true) as HTMLElement;
    if (clone.tagName === "LINK") {
      const href = clone.getAttribute("href");
      // The PiP document resolves relative asset URLs against its own base.
      if (href) clone.setAttribute("href", new URL(href, document.baseURI).href);
    }
    targetDoc.head.appendChild(clone);
  }
}

export function useMiniWindow() {
  const [pipWindow, setPipWindow] = React.useState<Window | null>(null);

  // Feature detection has to run after hydration; the server can't know, and
  // the toggle must not render on the server or hydration would mismatch.
  const supported = React.useSyncExternalStore(
    subscribeNoop,
    () => documentPipApi() !== null,
    () => false,
  );

  React.useEffect(() => {
    if (!pipWindow) return;
    adoptStyles(pipWindow);
  }, [pipWindow]);

  const open = React.useCallback(async () => {
    const api = documentPipApi();
    if (!api) return;
    if (api.window) {
      setPipWindow(api.window);
      return;
    }
    try {
      // Must run inside a user gesture, so call this straight from the click.
      const win = await api.requestWindow(MINI_WINDOW_SIZE);
      win.addEventListener("pagehide", () => setPipWindow(null), { once: true });
      setPipWindow(win);
    } catch {
      // Rejected without transient activation, or another PiP window owns it.
    }
  }, []);

  const close = React.useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  // The floating window is owned by this component's lifetime.
  React.useEffect(() => {
    return () => pipWindow?.close();
  }, [pipWindow]);

  return { supported, pipWindow, open, close };
}

export type MiniFocusViewProps = {
  phase: "work" | "break";
  isLongBreak: boolean;
  remaining: number;
  running: boolean;
  /** False while no round is underway, so the controls stay inert. */
  canControl: boolean;
  onToggle: () => void;
  onReset: () => void;
};

export function MiniFocusView({
  phase,
  isLongBreak,
  remaining,
  running,
  canControl,
  onToggle,
  onReset,
}: MiniFocusViewProps) {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const phaseLabel =
    phase === "work" ? "Focus" : isLongBreak ? "Long break" : "Break";

  return (
    <div
      data-slot="mini-focus"
      className="flex h-dvh w-full select-none flex-col items-center justify-center gap-3 bg-background px-4 font-limelight text-foreground"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">
        {phaseLabel}
      </span>

      <span
        role="timer"
        aria-live="off"
        aria-label={`${minutes} minutes ${seconds} seconds remaining`}
        className="text-[56px] leading-none font-bold tabular-nums"
      >
        {String(minutes).padStart(2, "0")}
        <span>:</span>
        {String(seconds).padStart(2, "0")}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canControl}
          onClick={onToggle}
          className={cn(
            buttonVariants({ variant: "accent", size: "sm" }),
            "disabled:opacity-50",
          )}
        >
          {running ? "Pause" : "Resume"}
        </button>

        <button
          type="button"
          disabled={!canControl}
          onClick={onReset}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "disabled:opacity-50",
          )}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/** Renders the mini view into the PiP document without moving it in the DOM. */
export function MiniFocusPortal({
  pipWindow,
  children,
}: {
  pipWindow: Window | null;
  children: React.ReactNode;
}) {
  if (!pipWindow) return null;
  return createPortal(children, pipWindow.document.body);
}
