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
  triggerLabel: React.ReactNode;
  label: string;
  minutes: string;
  onCommit: (minutes: string) => void;
  quickSteps?: number[];
  min?: number;
  max?: number;
};

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

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    requestDone();
  };

  const handleStep = (delta: number) => {
    const base = draft === "" ? 0 : Number(draft);
    setDraft(String(clamp(base + delta)));
  };

  const requestDone = () => {
    const nextValue = draft === "" ? String(min) : draft;
    if (nextValue === minutes) {
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
            className="grid gap-4 justify-items-center min-w-60 font-limelight"
          >
            <Label htmlFor={id}>{label}</Label>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <input
                id={id}
                value={draft}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleInputKeyDown}
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

            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    opacity: 0.5,
                  }}
                >
                  Decrease
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {quickSteps.map((step) => (
                    <Button
                      key={`decrease-${step}`}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={draft !== "" && Number(draft) <= min}
                      aria-label={`Decrease by ${step} minutes`}
                      onClick={() => handleStep(-step)}
                    >
                      −{step}
                    </Button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    opacity: 0.5,
                  }}
                >
                  Increase
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {quickSteps.map((step) => (
                    <Button
                      key={`increase-${step}`}
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={draft !== "" && Number(draft) >= max}
                      aria-label={`Increase by ${step} minutes`}
                      onClick={() => handleStep(step)}
                    >
                      +{step}
                    </Button>
                  ))}
                </div>
              </div>
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