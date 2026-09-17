"use client";

import * as React from "react";
import { FocusSession } from "@/components/ui/focus-session";
import type {
  OrganismAction,
  OrganismState,
} from "@/components/ui/organism-composition";
import { DurationPopover } from "@/components/duration-popover";
import { Meta } from "@/components/ui/typography";

const frame: React.CSSProperties = {
  display: "grid",
  gap: 20,
  width: "100%",
  maxWidth: 440,
  marginInline: "auto",
  minWidth: 0,
};

type Phase = "work" | "break";

/**
 * Preloads a public/ audio file once and returns a function that replays it
 * from the start — safe to call rapidly (e.g. once per second) without
 * waiting for the previous play to finish.
 */
function useSoundPlayer(src: string) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  return React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Playback can be blocked until the user has interacted with the page —
      // safe to ignore, the sound simply won't fire on that first tick.
    });
  }, []);
}

/**
 * Mirrors session progress onto CSS custom properties on <html>, which the
 * fixed marquee bars in app/page.tsx read to fill like an HP bar. Written
 * straight to the DOM (not React state) since it's a pure visual side effect
 * that would otherwise force a re-render every second.
 */
function setProgressVars(progress: number, color: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  root.setProperty("--focus-progress", String(progress));
  root.setProperty("--focus-fill", color);
}

export function FocusTime() {
  const [workMinutes, setWorkMinutes] = React.useState("25");
  const [breakMinutes, setBreakMinutes] = React.useState("5");
  const [phase, setPhase] = React.useState<Phase>("work");
  const [receipt, setReceipt] = React.useState(
    "Choose a duration, then begin when you are ready.",
  );

  const playTick = useSoundPlayer("/sounds/orb.mp3");
  const playDone = useSoundPlayer("/sounds/levelup.mp3");
  // Tracks the last remaining-seconds value we saw, so we fire each sound
  // (and each progress update) exactly once per second, not per re-render.
  const lastRemaining = React.useRef<number | null>(null);

  // Empty string only exists mid-edit inside the popover input; fall back to
  // the last committed value so the session never runs on an empty duration.
  const activeMinutes =
    (phase === "work" ? workMinutes : breakMinutes) || (phase === "work" ? "25" : "5");
  const totalSeconds = Number(activeMinutes) * 60;
  const fillColor = phase === "work" ? "var(--v-blue)" : "var(--v-olive)";

  // Reset both the tick tracker and the marquee fill whenever a fresh
  // session starts (new duration/phase), so nothing carries over visually
  // or audibly from the previous session.
  React.useEffect(() => {
    lastRemaining.current = null;
    setProgressVars(0, fillColor);
  }, [activeMinutes, phase, fillColor]);

  const handleStateChange = (state: OrganismState) => {
    const remaining = state.focusRemainingSeconds;
    if (remaining == null || remaining === lastRemaining.current) return;
    lastRemaining.current = remaining;

    const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
    setProgressVars(Math.min(1, Math.max(0, progress)), fillColor);

    if (remaining > 0 && remaining <= 5) {
      playTick(); // orb.mp3 — last 5 seconds
    } else if (remaining === 0) {
      playDone(); // levelup.mp3 — time's up
    }
  };

  const action = (event: OrganismAction) => {
    if (event.action === "complete") {
      if (phase === "work") {
        setPhase("break");
        setReceipt(`Session complete. Take a ${breakMinutes || "5"}-minute break.`);
      } else {
        setPhase("work");
        setReceipt(`Break's over. A fresh ${workMinutes || "25"}-minute session is ready.`);
      }
      return;
    }
    const label: Record<string, string> = {
      start:
        phase === "work"
          ? "Your local focus session has started."
          : "Break started. Step away for a moment.",
      pause: "Paused. Your remaining time is kept here.",
      reset: "A fresh session is ready.",
    };
    setReceipt(label[event.action] ?? `Local session action: ${event.action}.`);
  };

  return (
    <div style={frame}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <DurationPopover
          triggerLabel={`Work: ${workMinutes || "…"} min`}
          label="Work duration"
          minutes={workMinutes}
          onMinutesChange={(value) => {
            setWorkMinutes(value);
            if (phase === "work" && value) {
              setReceipt(`A fresh ${value}-minute session is ready.`);
            }
          }}
        />
        <DurationPopover
          triggerLabel={`Break: ${breakMinutes || "…"} min`}
          label="Break duration"
          minutes={breakMinutes}
          onMinutesChange={(value) => {
            setBreakMinutes(value);
            if (phase === "break" && value) {
              setReceipt(`A fresh ${value}-minute break is ready.`);
            }
          }}
        />
      </div>

      <FocusSession
        key={`${phase}-${activeMinutes}`}
        name={phase === "work" ? "Make room for one good idea" : "Take a breather"}
        description={
          phase === "work"
            ? "One task. A little uninterrupted time."
            : "Step away. It will still be there when you return."
        }
        durationSeconds={totalSeconds}
        // Break sessions start ticking the instant they mount — no Start
        // click required. Work sessions still wait for the user, unchanged.
        defaultState={phase === "break" ? { focusRunning: true } : undefined}
        onAction={action}
        onStateChange={handleStateChange}
      />
      <Meta data-example-receipt="focus-session">{receipt}</Meta>
    </div>
  );
}