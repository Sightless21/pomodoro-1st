"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Meta } from "@/components/ui/typography";

export type FocusState = {
  focusRemainingSeconds?: number;
  focusRunning?: boolean;
  focusEndsAt?: number | null;
};

export type FocusAction = {
  action: "start" | "pause" | "reset" | "complete";
};

export type FocusSessionProps = {
  /** Kept for API compatibility with the design-system FocusSession; not rendered here. */
  name?: string;
  /** Kept for API compatibility with the design-system FocusSession; not rendered here. */
  description?: string;
  /** Real local session length, clamped to 1–86400 seconds. Changing it resets the session. */
  durationSeconds?: number;
  state?: FocusState;
  defaultState?: Partial<FocusState>;
  onStateChange?: (state: FocusState) => void;
  onAction?: (action: FocusAction) => void;
};

function normalizeDuration(value = 1500) {
  return Number.isFinite(value) ? Math.max(1, Math.min(86400, Math.round(value))) : 1500;
}

/** The countdown follows elapsed wall time, including time spent in a hidden tab. */
function secondsRemaining(deadline: number, now = Date.now()) {
  return Number.isFinite(deadline) && Number.isFinite(now)
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : 0;
}

/**
 * A stripped-down focus/break timer: just the big MM:SS readout plus a
 * pause/resume toggle and a reset button — no card surface, heading, art,
 * progress bar, or caption. Mirrors the timer math of the design-system's
 * FocusSession (kind="focus" in organism-composition.tsx) so it's a drop-in
 * replacement wherever only the bare countdown is wanted.
 */
export function FocusSession({
  durationSeconds = 1500,
  state: controlled,
  defaultState,
  onStateChange,
  onAction,
}: FocusSessionProps) {
  const duration = normalizeDuration(durationSeconds);
  const [local, setLocal] = React.useState<FocusState>(() => ({
    focusRemainingSeconds: duration,
    focusRunning: false,
    focusEndsAt: null,
    ...defaultState,
  }));
  const state = controlled ?? local;
  const remaining = Math.max(0, Math.min(duration, state.focusRemainingSeconds ?? duration));

  const latest = React.useRef({ state, controlled, onStateChange, onAction });
  React.useEffect(() => {
    latest.current = { state, controlled, onStateChange, onAction };
  }, [state, controlled, onStateChange, onAction]);

  const update = React.useCallback((patch: Partial<FocusState>) => {
    const current = latest.current;
    const next = { ...current.state, ...patch };
    latest.current = { ...current, state: next };
    if (!current.controlled) setLocal(next);
    current.onStateChange?.(next);
  }, []);

  React.useEffect(() => {
    if (!state.focusRunning) return;
    const deadline =
      state.focusEndsAt ??
      Date.now() + (latest.current.state.focusRemainingSeconds ?? duration) * 1000;
    if (state.focusEndsAt == null) update({ focusEndsAt: deadline });

    let completed = false;
    const tick = () => {
      const seconds = secondsRemaining(deadline);
      if (seconds === 0) {
        if (completed) return;
        completed = true;
        update({ focusRemainingSeconds: 0, focusRunning: false, focusEndsAt: null });
        latest.current.onAction?.({ action: "complete" });
      } else if (seconds !== latest.current.state.focusRemainingSeconds) {
        update({ focusRemainingSeconds: seconds });
      }
    };
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    tick();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
    // The deadline stays stable while tick updates only the displayed seconds.
  }, [state.focusRunning, state.focusEndsAt, duration, update]);

  function focusAction(action: "start" | "pause" | "reset") {
    if (action === "start") {
      const seconds = remaining || duration;
      update({
        focusRunning: true,
        focusRemainingSeconds: seconds,
        focusEndsAt: Date.now() + seconds * 1000,
      });
    } else if (action === "pause") {
      update({
        focusRunning: false,
        focusRemainingSeconds: state.focusEndsAt ? secondsRemaining(state.focusEndsAt) : remaining,
        focusEndsAt: null,
      });
    } else {
      update({ focusRunning: false, focusRemainingSeconds: duration, focusEndsAt: null });
    }
    onAction?.({ action });
  }

  return (
    <div style={{ display: "grid", gap: 20, justifyItems: "center", textAlign: "center" }}>
      <Meta
        role="timer"
        aria-live="off"
        aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
        style={{
          fontSize: 80,
          lineHeight: 1,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(Math.floor(remaining / 60)).padStart(2, "0")}
        <span>:</span>
        {String(remaining % 60).padStart(2, "0")}
      </Meta>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Button variant="accent" onClick={() => focusAction(state.focusRunning ? "pause" : "start")}>
          <AnimatedIcon name={state.focusRunning ? "pause" : "play"} />
          {state.focusRunning
            ? "Pause"
            : remaining === 0
              ? "Start again"
              : remaining < duration
                ? "Resume"
                : "Start focusing"}
        </Button>
        <IconButton variant="cream" aria-label="Reset focus session" onClick={() => focusAction("reset")}>
          <AnimatedIcon name="refresh-cw" />
        </IconButton>
      </div>
    </div>
  );
}