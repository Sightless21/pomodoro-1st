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
  // exactly once per second rather than on every re-render.
  const lastRemaining = React.useRef<number | null>(null);

  // Empty string only exists mid-edit inside the popover input; fall back to
  // the last committed value so the session never runs on an empty duration.
  const activeMinutes =
    (phase === "work" ? workMinutes : breakMinutes) || (phase === "work" ? "25" : "5");

  // Reset the tick tracker whenever a fresh session starts (new duration/phase),
  // so a stale "5 seconds left" from the previous session can't get reused.
  React.useEffect(() => {
    lastRemaining.current = null;
  }, [activeMinutes, phase]);

  const handleStateChange = (state: OrganismState) => {
    const remaining = state.focusRemainingSeconds;
    if (remaining == null || remaining === lastRemaining.current) return;
    lastRemaining.current = remaining;

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
        durationSeconds={Number(activeMinutes) * 60}
        onAction={action}
        onStateChange={handleStateChange}
      />
      <Meta data-example-receipt="focus-session">{receipt}</Meta>
    </div>
  );
}