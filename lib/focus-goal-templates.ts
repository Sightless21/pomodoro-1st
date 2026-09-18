/**
 * Config for the "Today's focus goal" picker in DailyPlanPopover.
 * Everything a designer/PM would want to tweak — the presets shown, their
 * blurbs, and the +/- step sizes — lives here instead of inside the
 * component, so adjusting the lineup doesn't mean touching component code.
 *
 * Assumed path: @/lib/focus-goal-templates.ts — matches the existing
 * @/lib/cojeev-motion, @/lib/cojeev, @/lib/utils convention in this project.
 * Move it if your project's config actually lives somewhere else.
 */

export type FocusGoalTemplate = {
  id: string;
  /** Short name shown on the preset button, e.g. "Standard day". */
  label: string;
  /** The goal, in hours. */
  hours: number;
  /** One line explaining who this pace suits / what to expect from it. */
  blurb: string;
};

export const FOCUS_GOAL_TEMPLATES: FocusGoalTemplate[] = [
  {
    id: "light",
    label: "Light day",
    hours: 2,
    blurb:
      "A couple of sessions — enough for real progress without draining your focus reserves.",
  },
  {
    id: "standard",
    label: "Standard day",
    hours: 4,
    blurb:
      "A solid, sustainable day of focused work — the pace most people can keep up daily.",
  },
  {
    id: "deep",
    label: "Deep work day",
    hours: 6,
    blurb:
      "Serious output. The long breaks matter more today — skipping them tanks quality fast.",
  },
  {
    id: "heavy",
    label: "Heavy day",
    hours: 8,
    blurb:
      "A full day of focus. Attention naturally dips after a few hours — expect the later sessions to feel harder, and that's normal.",
  },
];

/** +/- step sizes offered for fine-tuning after picking (or instead of) a preset, in hours. */
export const FOCUS_GOAL_STEP_HOURS = [0.5, 1, 2];

export const FOCUS_GOAL_MIN_HOURS = 0.5;
export const FOCUS_GOAL_MAX_HOURS = 16;

/** Quick-pick options for the periodic long break, in minutes. */
export const LONG_BREAK_MINUTE_PRESETS = [10, 15, 20, 30];