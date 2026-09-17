"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type DurationPopoverProps = {
  /** Text on the trigger button. */
  triggerLabel: React.ReactNode;
  /** Heading shown above the input, e.g. "Work duration". */
  label: string;
  /** Current value in minutes, as a string ("" while the field is empty mid-edit). */
  minutes: string;
  onMinutesChange: (minutes: string) => void;
  /** Quick +/- steps, in minutes. */
  quickSteps?: number[];
  min?: number;
  /** Defaults to 60 — durations here never exceed one hour. */
  max?: number;
};

/** A borderless, digits-only minute input plus +/- quick steps, in a Popover. */
export function DurationPopover({
  triggerLabel,
  label,
  minutes,
  onMinutesChange,
  quickSteps = [5, 10, 15, 20],
  min = 1,
  max = 60,
}: DurationPopoverProps) {
  const id = React.useId();

  const clamp = (value: number) => Math.max(min, Math.min(max, value));

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
    if (digitsOnly === "") {
      onMinutesChange("");
      return;
    }
    // Cap the live-typed length so no one keys in a huge number by accident.
    const next = clamp(Number(digitsOnly.slice(0, 2)));
    onMinutesChange(String(next));
  };

  const handleBlur = () => {
    if (minutes === "") onMinutesChange(String(min));
  };

  const handleStep = (delta: number) => {
    const base = minutes === "" ? 0 : Number(minutes);
    onMinutesChange(String(clamp(base + delta)));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">{triggerLabel}</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div
          style={{
            display: "grid",
            gap: 16,
            justifyItems: "center",
            minWidth: 240,
          }}
        >
          <Label htmlFor={id}>{label}</Label>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <input
              id={id}
              value={minutes}
              onChange={handleInputChange}
              onBlur={handleBlur}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={2}
              aria-label={`${label} in minutes`}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                appearance: "none",
                width: "2.4ch",
                fontSize: 64,
                lineHeight: 1,
                fontWeight: 700,
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
                color: "inherit",
              }}
            />
            <span style={{ fontSize: 18, opacity: 0.6 }}>min</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {quickSteps.map((step) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  gap: 4,
                  borderRadius: "var(--r-pill, 999px)",
                  overflow: "hidden",
                }}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Decrease by ${step} minutes`}
                  onClick={() => handleStep(-step)}
                >
                  −{step}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Increase by ${step} minutes`}
                  onClick={() => handleStep(step)}
                >
                  +{step}
                </Button>
              </div>
            ))}
          </div>

          <PopoverClose asChild>
            <Button size="sm">Done</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}