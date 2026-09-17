"use client";

import * as React from "react";
import { FocusSession } from "@/components/ui/focus-session";
import type { OrganismAction } from "@/components/ui/organism-composition";
import * as DropdownMenuParts from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Meta } from "@/components/ui/typography";

const frame: React.CSSProperties = {
  display: "grid",
  gap: 20,
  width: "100%",
  maxWidth: 440,
  marginInline: "auto",
  minWidth: 0,
};

const WORK_PRESETS = ["25", "45", "60"];
const BREAK_PRESETS = ["5", "10", "15"];

type Phase = "work" | "break";

export function FocusTime() {
  const [workMinutes, setWorkMinutes] = React.useState("25");
  const [breakMinutes, setBreakMinutes] = React.useState("5");
  const [phase, setPhase] = React.useState<Phase>("work");
  const [receipt, setReceipt] = React.useState(
    "Choose a duration, then begin when you are ready.",
  );

  const activeMinutes = phase === "work" ? workMinutes : breakMinutes;

  const action = (event: OrganismAction) => {
    if (event.action === "complete") {
      if (phase === "work") {
        setPhase("break");
        setReceipt(`Session complete. Take a ${breakMinutes}-minute break.`);
      } else {
        setPhase("work");
        setReceipt(`Break's over. A fresh ${workMinutes}-minute session is ready.`);
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
      <div style={{ display: "flex", justifyContent: "center" }}>
        <DropdownMenuParts.DropdownMenu>
          <DropdownMenuParts.DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Work {workMinutes} min · Break {breakMinutes} min
              <Icon name="chevron-down" />
            </Button>
          </DropdownMenuParts.DropdownMenuTrigger>
          <DropdownMenuParts.DropdownMenuContent>
            <DropdownMenuParts.DropdownMenuLabel>
              Work duration
            </DropdownMenuParts.DropdownMenuLabel>
            <DropdownMenuParts.DropdownMenuRadioGroup
              value={workMinutes}
              onValueChange={(value) => {
                setWorkMinutes(value);
                if (phase === "work") {
                  setReceipt(`A fresh ${value}-minute session is ready.`);
                }
              }}
            >
              {WORK_PRESETS.map((value) => (
                <DropdownMenuParts.DropdownMenuRadioItem key={value} value={value}>
                  {value} min
                </DropdownMenuParts.DropdownMenuRadioItem>
              ))}
            </DropdownMenuParts.DropdownMenuRadioGroup>

            <DropdownMenuParts.DropdownMenuSeparator />

            <DropdownMenuParts.DropdownMenuLabel>
              Break duration
            </DropdownMenuParts.DropdownMenuLabel>
            <DropdownMenuParts.DropdownMenuRadioGroup
              value={breakMinutes}
              onValueChange={(value) => {
                setBreakMinutes(value);
                if (phase === "break") {
                  setReceipt(`A fresh ${value}-minute break is ready.`);
                }
              }}
            >
              {BREAK_PRESETS.map((value) => (
                <DropdownMenuParts.DropdownMenuRadioItem key={value} value={value}>
                  {value} min
                </DropdownMenuParts.DropdownMenuRadioItem>
              ))}
            </DropdownMenuParts.DropdownMenuRadioGroup>
          </DropdownMenuParts.DropdownMenuContent>
        </DropdownMenuParts.DropdownMenu>
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
      />
      <Meta data-example-receipt="focus-session">{receipt}</Meta>
    </div>
  );
}