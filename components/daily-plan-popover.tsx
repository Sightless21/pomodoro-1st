"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { IconButton } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Label } from "@/components/ui/label";
import { Meta } from "@/components/ui/typography";
import {
  FOCUS_GOAL_TEMPLATES,
  FOCUS_GOAL_STEP_HOURS,
  FOCUS_GOAL_MIN_HOURS,
  FOCUS_GOAL_MAX_HOURS,
  LONG_BREAK_MINUTE_PRESETS,
} from "@/lib/focus-goal-templates";

type DailyPlanPopoverProps = {
  /** The current work-round length, just to show "≈ N sessions of X min". */
  workMinutes: string;
  /** Hours the user wants to focus today, as a free-typed string ("" = no goal set). */
  goalHours: string;
  onGoalHoursChange: (value: string) => void;
  /** Length of the periodic long break, in minutes. */
  longBreakMinutes: string;
  onLongBreakMinutesChange: (value: string) => void;
  /** How many work sessions between each long break (e.g. 4, classic Pomodoro). */
  longBreakEvery: number;
  /** Sessions implied by goalHours ÷ workMinutes, or null if no goal is set. */
  sessionsPlanned: number | null;
};

// Shared tokens for the two sections below, so "goal" and "long break" stay
// visually identical without repeating each style object inline twice.
const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
  minWidth: 260,
  maxWidth: 300,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  justifyItems: "center",
  textAlign: "center",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  opacity: 0.5,
};

const valueRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
};

const bigNumberStyle: React.CSSProperties = {
  fontSize: 36,
  lineHeight: 1,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};

const unitStyle: React.CSSProperties = { fontSize: 14, opacity: 0.6 };

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "center",
};

// One row instead of two separately-labeled "Decrease"/"Increase" blocks —
// the − / + on each button plus the outline/secondary color split already
// say which is which, so the extra headers were just noise.
const stepperRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
};

const stepperDividerStyle: React.CSSProperties = {
  width: 1,
  height: 18,
  background: "var(--v-border, currentColor)",
  opacity: 0.3,
};

const sectionDividerStyle: React.CSSProperties = {
  height: 1,
  background: "var(--v-border, currentColor)",
  opacity: 0.2,
};

const summaryBoxStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "var(--r-md, 12px)",
  background: "var(--v-beige, rgba(0,0,0,0.04))",
  textAlign: "center",
};

/**
 * Today's plan: how many focused hours the user is aiming for, and how
 * long the periodic long break should be. Unlike DurationPopover, edits
 * here commit instantly on click — no confirm dialog — since changing the
 * day's goal doesn't interrupt whatever round is currently running, it
 * only changes the planning numbers (session counter, long-break timing).
 *
 * Assumes PopoverContent accepts an `align` prop the way most Radix-based
 * popovers do, to pin the panel under the top-right trigger instead of
 * centering it off-screen — its own source wasn't available to check.
 */
export function DailyPlanPopover({
  workMinutes,
  goalHours,
  onGoalHoursChange,
  longBreakMinutes,
  onLongBreakMinutesChange,
  longBreakEvery,
  sessionsPlanned,
}: DailyPlanPopoverProps) {
  const goalId = React.useId();
  const longBreakId = React.useId();

  const numericGoal = goalHours === "" ? null : Number(goalHours);
  const matchedTemplate = FOCUS_GOAL_TEMPLATES.find((t) => t.hours === numericGoal) ?? null;
  const atMinGoal = numericGoal !== null && numericGoal <= FOCUS_GOAL_MIN_HOURS;
  const atMaxGoal = numericGoal !== null && numericGoal >= FOCUS_GOAL_MAX_HOURS;

  const clampGoal = (value: number) =>
    Math.max(FOCUS_GOAL_MIN_HOURS, Math.min(FOCUS_GOAL_MAX_HOURS, value));

  const pickTemplate = (hours: number) => onGoalHoursChange(String(hours));

  const adjustGoal = (delta: number) => {
    const base = numericGoal ?? 0;
    // Round to the nearest 0.5 so repeated +/- clicks never drift off-grid
    // from float error (e.g. 0.1 + 0.2 style rounding).
    const next = Math.round(clampGoal(base + delta) * 2) / 2;
    onGoalHoursChange(String(next));
  };

  const pickLongBreak = (minutes: number) => onLongBreakMinutesChange(String(minutes));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton variant="cream" aria-label="Today's plan settings">
          <AnimatedIcon name="settings" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div style={panelStyle}>
          <div style={sectionStyle} role="group" aria-labelledby={goalId}>
            <Label id={goalId} style={sectionLabelStyle}>
              Today&apos;s focus goal
            </Label>

            <div style={valueRowStyle}>
              <span style={bigNumberStyle}>{numericGoal ?? "—"}</span>
              <span style={unitStyle}>hr</span>
            </div>

            <div style={chipRowStyle}>
              {FOCUS_GOAL_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  size="sm"
                  variant={numericGoal === template.hours ? "accent" : "outline"}
                  aria-pressed={numericGoal === template.hours}
                  onClick={() => pickTemplate(template.hours)}
                >
                  {template.label} · {template.hours}h
                </Button>
              ))}
            </div>

            <Meta style={{ opacity: 0.75 }}>
              {matchedTemplate
                ? matchedTemplate.blurb
                : "Pick a preset, or fine-tune below."}
            </Meta>

            <div style={stepperRowStyle}>
              {[...FOCUS_GOAL_STEP_HOURS].reverse().map((step) => (
                <Button
                  key={`goal-decrease-${step}`}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={atMinGoal}
                  aria-label={`Decrease goal by ${step} hours`}
                  onClick={() => adjustGoal(-step)}
                >
                  −{step}h
                </Button>
              ))}
              <span aria-hidden style={stepperDividerStyle} />
              {FOCUS_GOAL_STEP_HOURS.map((step) => (
                <Button
                  key={`goal-increase-${step}`}
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={atMaxGoal}
                  aria-label={`Increase goal by ${step} hours`}
                  onClick={() => adjustGoal(step)}
                >
                  +{step}h
                </Button>
              ))}
            </div>
          </div>

          <div aria-hidden style={sectionDividerStyle} />

          <div style={sectionStyle} role="group" aria-labelledby={longBreakId}>
            <Label id={longBreakId} style={sectionLabelStyle}>
              Long break length
            </Label>

            <div style={valueRowStyle}>
              <span style={bigNumberStyle}>{longBreakMinutes || "—"}</span>
              <span style={unitStyle}>min</span>
            </div>

            <div style={chipRowStyle}>
              {LONG_BREAK_MINUTE_PRESETS.map((minutes) => (
                <Button
                  key={minutes}
                  type="button"
                  size="sm"
                  variant={Number(longBreakMinutes) === minutes ? "accent" : "outline"}
                  aria-pressed={Number(longBreakMinutes) === minutes}
                  onClick={() => pickLongBreak(minutes)}
                >
                  {minutes} min
                </Button>
              ))}
            </div>
          </div>

          <Meta style={summaryBoxStyle}>
            {sessionsPlanned
              ? `≈ ${sessionsPlanned} sessions of ${workMinutes} min today, with a longer break every ${longBreakEvery}.`
              : `Set a goal to see how many ${workMinutes}-minute sessions that is.`}
          </Meta>
        </div>
      </PopoverContent>
    </Popover>
  );
}