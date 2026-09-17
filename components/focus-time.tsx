"use client";

import * as React from "react";
import { FocusSession } from "@/components/ui/focus-session";
import type { OrganismAction } from "@/components/ui/organism-composition";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Meta } from "@/components/ui/typography";

const frame: React.CSSProperties = {
  display: "grid",
  gap: 20,
  width: "100%",
  maxWidth: 440,
  marginInline: "auto",
  minWidth: 0,
};

export function FocusTime() {
  const [minutes, setMinutes] = React.useState("5");
  const [receipt, setReceipt] = React.useState(
    "Choose a duration, then begin when you are ready.",
  );
  const action = (event: OrganismAction) => {
    const label: Record<string, string> = {
      start: "Your local focus session has started.",
      pause: "Paused. Your remaining time is kept here.",
      reset: "A fresh session is ready.",
      complete: "Session complete. Take a little break.",
    };
    setReceipt(label[event.action] ?? `Local session action: ${event.action}.`);
  };
  return (
    <div style={frame}>
      <ToggleGroup
        type="single"
        value={minutes}
        aria-label="Session duration"
        onValueChange={(value) => {
          if (!value) return;
          setMinutes(value);
          setReceipt(`A fresh ${value}-minute session is ready.`);
        }}
        style={{ justifyContent: "center" }}
      >
        {[5, 15, 25].map((value) => (
          <ToggleGroupItem
            key={value}
            value={String(value)}
            aria-label={`${value} minutes`}
          >
            {value} min
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FocusSession
        key={minutes}
        name="Make room for one good idea"
        description="One task. A little uninterrupted time."
        durationSeconds={Number(minutes) * 60}
        onAction={action}
      />
      <Meta data-example-receipt="focus-session">{receipt}</Meta>
      <Meta>
        Local timer demo. Changing the duration starts a fresh session;
        reloading clears it.
      </Meta>
    </div>
  );
}
