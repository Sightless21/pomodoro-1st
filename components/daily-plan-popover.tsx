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

  const matchedTemplate =
    FOCUS_GOAL_TEMPLATES.find((t) => t.hours === numericGoal) ?? null;

  const atMinGoal =
    numericGoal !== null && numericGoal <= FOCUS_GOAL_MIN_HOURS;

  const atMaxGoal =
    numericGoal !== null && numericGoal >= FOCUS_GOAL_MAX_HOURS;

  const clampGoal = (value: number) =>
    Math.max(
      FOCUS_GOAL_MIN_HOURS,
      Math.min(FOCUS_GOAL_MAX_HOURS, value),
    );

  const pickTemplate = (hours: number) =>
    onGoalHoursChange(String(hours));

  const adjustGoal = (delta: number) => {
    const base = numericGoal ?? 0;

    // Round to the nearest 0.5 so repeated +/- clicks never drift off-grid.
    const next = Math.round(clampGoal(base + delta) * 2) / 2;
    onGoalHoursChange(String(next));
  };

  const pickLongBreak = (minutes: number) =>
    onLongBreakMinutesChange(String(minutes));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          variant="pink"
          aria-label="Today's plan settings"
        >
          <AnimatedIcon name="settings" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="grid min-w-64 max-w-90 gap-4 font-limelight">
          {/* Today's focus goal */}
          <div
            className="grid justify-center justify-items-center gap-2 text-center"
            role="group"
            aria-labelledby={goalId}
          >
            <Label
              id={goalId}
              className="text-xs font-semibold uppercase tracking-wide opacity-50"
            >
              Today&apos;s focus goal
            </Label>

            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl leading-none font-bold tabular-nums">
                {numericGoal ?? "—"}
              </span>

              <span className="text-sm opacity-60">hr</span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {FOCUS_GOAL_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  size="sm"
                  variant={
                    numericGoal === template.hours
                      ? "accent"
                      : "outline"
                  }
                  aria-pressed={numericGoal === template.hours}
                  onClick={() => pickTemplate(template.hours)}
                >
                  {template.label} · {template.hours}h
                </Button>
              ))}
            </div>

            <Meta className="opacity-75">
              {matchedTemplate
                ? matchedTemplate.blurb
                : "Pick a preset, or fine-tune below."}
            </Meta>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {[...FOCUS_GOAL_STEP_HOURS]
                .reverse()
                .map((step) => (
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

              <span
                aria-hidden="true"
                className="h-4.5 w-px bg-border opacity-30"
              />

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

          {/* Section divider */}
          <div
            aria-hidden="true"
            className="h-px bg-border opacity-20"
          />

          {/* Long break length */}
          <div
            className="grid justify-center justify-items-center gap-2 text-center"
            role="group"
            aria-labelledby={longBreakId}
          >
            <Label
              id={longBreakId}
              className="text-xs font-semibold uppercase tracking-wide opacity-50"
            >
              Long break length
            </Label>

            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl leading-none font-bold tabular-nums">
                {longBreakMinutes || "—"}
              </span>

              <span className="text-sm opacity-60">min</span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {LONG_BREAK_MINUTE_PRESETS.map((minutes) => (
                <Button
                  key={minutes}
                  type="button"
                  size="sm"
                  variant={
                    Number(longBreakMinutes) === minutes
                      ? "accent"
                      : "outline"
                  }
                  aria-pressed={
                    Number(longBreakMinutes) === minutes
                  }
                  onClick={() => pickLongBreak(minutes)}
                >
                  {minutes} min
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <Meta className="rounded-md bg-muted p-2.5 text-center">
            {sessionsPlanned
              ? `≈ ${sessionsPlanned} sessions of ${workMinutes} min today, with a longer break every ${longBreakEvery}.`
              : `Set a goal to see how many ${workMinutes}-minute sessions that is.`}
          </Meta>
        </div>
      </PopoverContent>
    </Popover>
  );
}