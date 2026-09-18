"use client";

import * as React from "react";
import {
  FocusSession,
  type FocusAction,
  type FocusState,
} from "@/components/focus-timer";
import { DurationPopover } from "@/components/duration-popover";
import { DailyPlanPopover } from "@/components/daily-plan-popover";
import { SoundSettingPopover } from "@/components/sound-setting-popover";
import { Meta } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

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
function useSoundPlayer(src: string, volume: number) {
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

  // volume เปลี่ยนเมื่อไหร่ ก็ sync เข้า element ทันที ไม่ต้องรอรอบเล่นถัดไป
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume / 100));
    }
  }, [volume]);

  return React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
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

  const [volume, setVolume] = React.useState([50]);

  const playTick = useSoundPlayer("/sounds/orb.mp3", volume[0]);
  const playDone = useSoundPlayer("/sounds/levelup.mp3", volume[0]);
  // Tracks the last remaining-seconds value we saw, so we fire each sound
  // (and each progress update) exactly once per second, not per re-render.
  const lastRemaining = React.useRef<number | null>(null);

  // Empty string only exists mid-edit inside a popover input; fall back to
  // the last committed value so a round never runs on an empty duration.
  const activeMinutes =
    phase === "work"
      ? workMinutes || "25"
      : (isLongBreak ? longBreakMinutes : breakMinutes) ||
        (isLongBreak ? "15" : "5");
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
        setReceipt(
          `Break's over — get ready for a fresh ${workMinutes || "25"}-minute session.`,
        );
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
    <div className="grid w-full max-w-md min-w-0 mx-auto gap-5">
      <div className="fixed flex gap-2 top-[calc(var(--marquee-row-height,96px)+16px)] right-4 z-50">
        <SoundSettingPopover
          volume={volume}
          onVolumeChange={setVolume}
        />
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

      <div className="flex flex-wrap justify-center gap-2">
        <DurationPopover
          triggerLabel={`Work: ${workMinutes || "…"} min`}
          label="Work duration"
          minutes={workMinutes}
          onCommit={(value) => {
            setWorkMinutes(value);
            if (phase === "work") {
              setStage("ready");
              setReceipt(
                `A fresh ${value}-minute session is ready.`,
              );
            }
          }}
        />

        <DurationPopover
          triggerLabel={`Break: ${breakMinutes || "…"} min`}
          label="Break duration"
          minutes={breakMinutes}
          onCommit={(value) => {
            setBreakMinutes(value);
            if (phase === "break" && !isLongBreak) {
              setStage("ready");
              setReceipt(
                `A fresh ${value}-minute break is ready.`,
              );
            }
          }}
        />
      </div>

      <Meta className="text-center opacity-60">
        {phase === "work"
          ? `Session ${completedWorkSessions + 1}${sessionsPlanned ? ` of ${sessionsPlanned}` : ""}`
          : `${isLongBreak ? "Long break" : "Break"} after session ${completedWorkSessions}${sessionsPlanned ? ` of ${sessionsPlanned}` : ""}`}
      </Meta>

      {stage === "ready" && (
        <div className="grid min-h-56 content-center justify-items-center gap-4 text-center">
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
        <div
          className="grid min-h-56 content-center justify-items-center gap-4 text-center"
          aria-live="polite"
        >
          <Meta className="text-xl font-semibold">
            {receipt}
          </Meta>

          <Button
            variant="secondary"
            size="sm"
            onClick={beginCountdown}
          >
            Skip
          </Button>
        </div>
      )}

      {stage === "countdown" && (
        <div
          className="grid min-h-56 content-center justify-items-center gap-4 text-center"
          aria-live="polite"
        >
          <Meta>
            {phase === "work"
              ? "Work starts in"
              : "Break starts in"}
          </Meta>

          <span className="text-8xl leading-none font-bold tabular-nums">
            {countdownRemaining > 0
              ? countdownRemaining
              : "Go"}
          </span>
        </div>
      )}

      {stage === "running" && (
        <FocusSession
          key={`${phase}-${activeMinutes}`}
          name={
            phase === "work"
              ? "Make room for one good idea"
              : "Take a breather"
          }
          description={
            phase === "work"
              ? "One task. A little uninterrupted time."
              : "Step away. It will still be there when you return."
          }
          durationSeconds={totalSeconds}
          defaultState={{ focusRunning: true }}
          onAction={action}
          onStateChange={handleStateChange}
        />
      )}

      <Meta
        data-example-receipt="focus-session"
        className="text-center"
      >
        {receipt}
      </Meta>
    </div>
  );
}
