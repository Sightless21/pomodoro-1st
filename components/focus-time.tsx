"use client";

import * as React from "react";
import { FocusSession, type FocusAction, type FocusState } from "@/components/focus-timer";
import { DurationPopover } from "@/components/duration-popover";
import { DailyPlanPopover } from "@/components/daily-plan-popover";
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

// Shared shell for the "ready" / "complete" / "countdown" gate screens, so
// the layout doesn't jump when swapping between them and FocusSession.
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
// "complete": a brief "nice work" acknowledgment right after a round ends,
//   before the lead-in countdown for the *next* round begins.
// "countdown": the 5-second lead-in, ticking down before the round begins.
// "running": FocusSession is mounted and the round is actually underway.
type Stage = "ready" | "complete" | "countdown" | "running";

const COUNTDOWN_SECONDS = 5;
const COMPLETE_PAUSE_MS = 4500;
// Classic Pomodoro cadence — a longer break after every Nth work session.
const LONG_BREAK_EVERY = 4;

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

  // How many work sessions have been completed today, and today's plan.
  const [completedWorkSessions, setCompletedWorkSessions] = React.useState(0);
  const [isLongBreak, setIsLongBreak] = React.useState(false);
  const [dailyGoalHours, setDailyGoalHours] = React.useState(""); // "" = no goal set
  const [longBreakMinutes, setLongBreakMinutes] = React.useState("15");

  const sessionsPlanned = React.useMemo(() => {
    const goalHours = Number(dailyGoalHours);
    const workMin = Number(workMinutes);
    if (!goalHours || !workMin) return null;
    return Math.max(1, Math.round((goalHours * 60) / workMin));
  }, [dailyGoalHours, workMinutes]);

  const playTick = useSoundPlayer("/sounds/orb.mp3");
  const playDone = useSoundPlayer("/sounds/levelup.mp3");
  // Tracks the last remaining-seconds value we saw, so we fire each sound
  // (and each progress update) exactly once per second, not per re-render.
  const lastRemaining = React.useRef<number | null>(null);

  // Empty string only exists mid-edit inside a popover input; fall back to
  // the last committed value so a round never runs on an empty duration.
  const activeMinutes =
    phase === "work"
      ? workMinutes || "25"
      : (isLongBreak ? longBreakMinutes : breakMinutes) || (isLongBreak ? "15" : "5");
  const totalSeconds = Number(activeMinutes) * 60;
  const fillColor = phase === "work" ? "var(--v-blue)" : "var(--v-olive)";

  // Reset the tick tracker and the marquee fill whenever a round is being
  // set up fresh (new duration/phase, or stepping back to "ready"/
  // "complete"/"countdown"). Skipped once actually running so it never
  // clobbers the progress that FocusSession's own onStateChange is driving.
  React.useEffect(() => {
    if (stage === "running") return;
    lastRemaining.current = null;
    setProgressVars(0, fillColor);
  }, [activeMinutes, phase, fillColor, stage]);

  // The brief "nice work" pause right after a round ends, before the next
  // round's lead-in countdown starts. Auto-advances on its own; the Skip
  // button in the JSX below can also jump straight to "countdown".
  React.useEffect(() => {
    if (stage !== "complete") return;
    const t = setTimeout(() => beginCountdown(), COMPLETE_PAUSE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // The 5-second lead-in before each round (work or break) actually
  // starts. Ticks once a second using the same orb.mp3 cue already used for
  // a session's final 5 seconds, then plays levelup.mp3 right as the round
  // begins — the "complete" pause above already separates this from the
  // levelup that played when the previous round actually finished, so the
  // two no longer land right on top of each other.
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

  function beginCountdown() {
    setCountdownRemaining(COUNTDOWN_SECONDS);
    setStage("countdown");
  }

  const handleStateChange = (state: FocusState) => {
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

  const action = (event: FocusAction) => {
    if (event.action === "complete") {
      if (phase === "work") {
        const nextCompleted = completedWorkSessions + 1;
        const longBreakDue = nextCompleted % LONG_BREAK_EVERY === 0;
        setCompletedWorkSessions(nextCompleted);
        setIsLongBreak(longBreakDue);
        setPhase("break");
        setReceipt(
          longBreakDue
            ? `Session ${nextCompleted} done — nice streak. Time for a longer ${longBreakMinutes}-minute break.`
            : `Session ${nextCompleted} done. Get ready for a ${breakMinutes || "5"}-minute break.`,
        );
      } else {
        setPhase("work");
        setIsLongBreak(false);
        setReceipt(`Break's over — get ready for a fresh ${workMinutes || "25"}-minute session.`);
      }
      // A short acknowledgment pause first; the countdown for the next
      // round starts once it elapses (or once Skip is pressed).
      setStage("complete");
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
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
        <DailyPlanPopover
          workMinutes={workMinutes}
          goalHours={dailyGoalHours}
          onGoalHoursChange={setDailyGoalHours}
          longBreakMinutes={longBreakMinutes}
          onLongBreakMinutesChange={setLongBreakMinutes}
          longBreakEvery={LONG_BREAK_EVERY}
          sessionsPlanned={sessionsPlanned}
        />
      </div>

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
              // about) — drop back to "ready" so Start re-arms the lead-in.
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
            // Only the regular break is affected — editing it mid long-break
            // shouldn't interrupt the long break already in progress.
            if (phase === "break" && !isLongBreak) {
              setStage("ready");
              setReceipt(`A fresh ${value}-minute break is ready.`);
            }
          }}
        />
      </div>

      <Meta style={{ textAlign: "center", opacity: 0.6 }}>
        {phase === "work"
          ? `Session ${completedWorkSessions + 1}${sessionsPlanned ? ` of ${sessionsPlanned}` : ""}`
          : `${isLongBreak ? "Long break" : "Break"} after session ${completedWorkSessions}${sessionsPlanned ? ` of ${sessionsPlanned}` : ""}`}
      </Meta>

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

      {stage === "complete" && (
        <div style={gateFrame} aria-live="polite">
          <Meta style={{ fontSize: 20, fontWeight: 600 }}>{receipt}</Meta>
          <Button variant="secondary" size="sm" onClick={beginCountdown}>
            Skip
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
          // We've already run our own lead-in by the time this mounts, so
          // every round starts ticking immediately — no separate Start
          // click inside FocusSession itself.
          defaultState={{ focusRunning: true }}
          onAction={action}
          onStateChange={handleStateChange}
        />
      )}
      <Meta data-example-receipt="focus-session" className="text-center">{receipt}</Meta>
    </div>
  );
}