"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import * as AlertDialogParts from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type DurationPopoverProps = {
  /** Text on the trigger button. */
  triggerLabel: React.ReactNode;
  /** Heading shown above the input, e.g. "Work duration". */
  label: string;
  /** Currently committed value, in minutes. */
  minutes: string;
  /** Fires only after the user confirms the reset warning. */
  onCommit: (minutes: string) => void;
  /** Quick +/- steps, in minutes. */
  quickSteps?: number[];
  min?: number;
  /** Defaults to 60 — durations here never exceed one hour. */
  max?: number;
};

/**
 * A borderless, digits-only minute input plus +/- quick steps, in a Popover.
 * Edits stay local (a draft) until "Done" is pressed; committing a real
 * change always asks for confirmation first, since it resets the running
 * session.
 */
export function DurationPopover({
  triggerLabel,
  label,
  minutes,
  onCommit,
  quickSteps = [5, 10, 15, 20],
  min = 1,
  max = 60,
}: DurationPopoverProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(minutes);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setDraft(minutes);
  };

  const clamp = (value: number) => Math.max(min, Math.min(max, value));

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
    if (digitsOnly === "") {
      setDraft("");
      return;
    }
    setDraft(String(clamp(Number(digitsOnly.slice(0, 2)))));
  };

  const handleBlur = () => {
    if (draft === "") setDraft(String(min));
  };

  const handleStep = (delta: number) => {
    const base = draft === "" ? 0 : Number(draft);
    setDraft(String(clamp(base + delta)));
  };

  const requestDone = () => {
    const nextValue = draft === "" ? String(min) : draft;
    if (nextValue === minutes) {
      // Nothing actually changed — nothing to warn about, just close.
      setOpen(false);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmChange = () => {
    const nextValue = draft === "" ? String(min) : draft;
    onCommit(nextValue);
    setConfirmOpen(false);
    setOpen(false);
  };

  const cancelChange = () => {
    setDraft(minutes);
    setConfirmOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
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

            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <input
                id={id}
                value={draft}
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
                    variant="outline"
                    aria-label={`Increase by ${step} minutes`}
                    onClick={() => handleStep(step)}
                  >
                    +{step}
                  </Button>
                </div>
              ))}
            </div>

            <Button size="sm" onClick={requestDone}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialogParts.AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogParts.AlertDialogContent>
          <AlertDialogParts.AlertDialogHeader>
            <AlertDialogParts.AlertDialogTitle>
              Change {label.toLowerCase()}?
            </AlertDialogParts.AlertDialogTitle>
          </AlertDialogParts.AlertDialogHeader>
          <AlertDialogParts.AlertDialogDescription>
            The current session will reset to {draft || min} minutes and start
            over. Any progress on the running timer will be lost.
          </AlertDialogParts.AlertDialogDescription>
          <AlertDialogParts.AlertDialogFooter>
            <AlertDialogParts.AlertDialogCancel onClick={cancelChange}>
              Keep current time
            </AlertDialogParts.AlertDialogCancel>
            <AlertDialogParts.AlertDialogAction onClick={confirmChange}>
              Reset and apply
            </AlertDialogParts.AlertDialogAction>
          </AlertDialogParts.AlertDialogFooter>
        </AlertDialogParts.AlertDialogContent>
      </AlertDialogParts.AlertDialog>
    </>
  );
}