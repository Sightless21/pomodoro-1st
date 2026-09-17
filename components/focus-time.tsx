"use client";

import * as React from "react";
import { FocusSession } from "@/components/ui/focus-session";
import type {
  OrganismAction,
  OrganismState,
} from "@/components/ui/organism-composition";
import { DurationPopover } from "@/components/duration-popover";
import { Meta } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

const frame: React.CSSProperties = {
  display: "grid",
  gap: 20,
  width: "100%",
  maxWidth: 440,
  marginInline: "auto",
  minWidth: 0,
};

// Shared shell for the "ready" and "countdown" gate screens, so the layout
// doesn't jump when swapping between them and the actual FocusSession.
const gateFrame: React.CSSProperties = {
  display: "grid",
  gap: 16,
  justifyItems: "center",
  minHeight: 220,
  alignContent: "center",
  textAlign: "center",
};

const countdownDigit: React.CSSProperties = {
  fontSize: 88,
  lineHeight: 1,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};

type Phase = "work" | "break";

// "ready": waiting for the user to press Start for this round.
// "countdown": the 5-second lead-in, ticking down before the round begins.
// "running": FocusSession is mounted and the round is actually underway.
type Stage = "ready" | "countdown" | "running";

const COUNTDOWN_SECONDS = 5;

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
  const [stage, setStage] = React.useState<Stage>("ready");
  const [countdownRemaining, setCountdownRemaining] =
    React.useState(COUNTDOWN_SECONDS);
  const [receipt, setReceipt] = React.useState(
    "Choose a duration, then begin when you are ready.",
  );

  const playTick = useSoundPlayer("/sounds/orb.mp3");
  const playDone = useSoundPlayer("/sounds/levelup.mp3");
  // Tracks the last remaining-seconds value we saw, so we fire each sound
  // (and each progress update) exactly once per second, not per re-render.
  const lastRemaining = React.useRef<number | null>(null);

  // Empty string only exists mid-edit inside the popover input; fall back to
  // the last committed value so a round never runs on an empty duration.
  const activeMinutes =
    (phase === "work" ? workMinutes : breakMinutes) || (phase === "work" ? "25" : "5");
  const totalSeconds = Number(activeMinutes) * 60;
  const fillColor = phase === "work" ? "var(--v-blue)" : "var(--v-olive)";

  // Reset the tick tracker and the marquee fill whenever a round is being
  // set up fresh (new duration/phase, or stepping back to "ready"/
  // "countdown"). Skipped once actually running so it never clobbers the
  // progress that FocusSession's own onStateChange is now driving.
  React.useEffect(() => {
    if (stage === "running") return;
    lastRemaining.current = null;
    setProgressVars(0, fillColor);
  }, [activeMinutes, phase, fillColor, stage]);

  // The 10-second lead-in before each round (work or break) actually
  // starts. Ticks once a second using the same orb.mp3 cue already used for
  // a session's final 5 seconds, then plays levelup.mp3 — the same cue
  // already used when a session finishes — right as the round begins.
  React.useEffect(() => {
    if (stage !== "countdown") return;

    if (countdownRemaining <= 0) {
      playDone();
      const goTimer = setTimeout(() => setStage("running"), 400);
      return () => clearTimeout(goTimer);
    }

    playTick();
    const tickTimer = setTimeout(
      () => setCountdownRemaining((seconds) => seconds - 1),
      1000,
    );
    return () => clearTimeout(tickTimer);
  }, [stage, countdownRemaining, playTick, playDone]);

  const beginCountdown = () => {
    setCountdownRemaining(COUNTDOWN_SECONDS);
    setStage("countdown");
  };

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
        setReceipt(`Session complete. Get ready for a ${breakMinutes || "5"}-minute break.`);
      } else {
        setPhase("work");
        setReceipt(`Break's over — get ready for a fresh ${workMinutes || "25"}-minute session.`);
      }
      // Every new round — work or break — gets the same 10-second lead-in
      // before it actually starts ticking.
      beginCountdown();
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
          onCommit={(value) => {
            setWorkMinutes(value);
            if (phase === "work") {
              // Committing a new duration always interrupts whatever stage
              // this round was in (that's what the confirm dialog warns
              // about) — drop back to "ready" so Start re-arms the 10s lead-in.
              setStage("ready");
              setReceipt(`A fresh ${value}-minute session is ready.`);
            }
          }}
        />
        <DurationPopover
          triggerLabel={`Break: ${breakMinutes || "…"} min`}
          label="Break duration"
          minutes={breakMinutes}
          onCommit={(value) => {
            setBreakMinutes(value);
            if (phase === "break") {
              setStage("ready");
              setReceipt(`A fresh ${value}-minute break is ready.`);
            }
          }}
        />
      </div>

      {stage === "ready" && (
        <div style={gateFrame}>
          <Meta>
            {phase === "work"
              ? "One task. A little uninterrupted time."
              : "Step away. It will still be there when you return."}
          </Meta>
          <Button
            onClick={() => {
              setReceipt(
                phase === "work"
                  ? "Starting your focus session…"
                  : "Starting your break…",
              );
              beginCountdown();
            }}
          >
            {phase === "work"
              ? `Start ${activeMinutes}-minute session`
              : `Start ${activeMinutes}-minute break`}
          </Button>
        </div>
      )}

      {stage === "countdown" && (
        <div style={gateFrame} aria-live="polite">
          <Meta>{phase === "work" ? "Work starts in" : "Break starts in"}</Meta>
          <span style={countdownDigit}>
            {countdownRemaining > 0 ? countdownRemaining : "Go"}
          </span>
        </div>
      )}

      {stage === "running" && (
        <FocusSession
          key={`${phase}-${activeMinutes}`}
          name={phase === "work" ? "Make room for one good idea" : "Take a breather"}
          description={
            phase === "work"
              ? "One task. A little uninterrupted time."
              : "Step away. It will still be there when you return."
          }
          durationSeconds={totalSeconds}
          // We've already run our own 10s lead-in by the time this mounts,
          // so every round starts ticking immediately — no separate Start
          // click inside FocusSession itself.
          defaultState={{ focusRunning: true }}
          onAction={action}
          onStateChange={handleStateChange}
        />
      )}
      <Meta data-example-receipt="focus-session">{receipt}</Meta>
    </div>
  );
}