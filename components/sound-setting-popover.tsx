"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { IconButton } from "@/components/ui/icon";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import {
  Slider,
  SliderWrapper,
  SliderRow,
  SliderOutput,
  type SliderAppearance,
} from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Meta } from "@/components/ui/typography";

type SoundSettingPopoverProps = {
  volume: number[];
  onVolumeChange: (value: number[]) => void;
};

export function SoundSettingPopover({ volume, onVolumeChange }: SoundSettingPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton variant="pink" aria-label="Sound settings">
          <AnimatedIcon name="volume-2" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="grid gap-4 min-w-55">
          <SliderWrapper>
            <SliderRow className="flex flow-row items-center justify-between gap-2">
              <Label htmlFor="volume-slider">Volume: </Label>
              <SliderOutput>{volume[0]}%</SliderOutput>
            </SliderRow>
            <Slider
              appearance="organic"
              thumbLabel="Volume"
              value={volume}
              onValueChange={onVolumeChange}
              min={0}
              max={100}
            />
          </SliderWrapper>
        </div>
      </PopoverContent>
    </Popover>
  );
}
