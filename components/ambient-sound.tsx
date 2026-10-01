"use client";
import { useRef, useState, useEffect } from "react";
import {
  Slider,
  SliderWrapper,
  SliderRow,
  SliderOutput,
} from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { IconButton } from "@/components/ui/icon";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { AMBIENT, type SoundName } from "@/lib/ambient";

interface AmbientSoundProps {
  sound: SoundName;
}

export default function AmbientSound({ sound }: AmbientSoundProps) {
  const { label, file } = AMBIENT[sound];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) {
      const audio = new Audio(`/sounds/${file}`);
      audio.loop = true;
      audio.volume = volume / 100;
      audioRef.current = audio;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Cannot play audio:", err);
      }
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume / 100;
  };

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 items-center">
        <IconButton onClick={togglePlay} variant={"ink"} size={"sm"}>
          <AnimatedIcon name={isPlaying ? "pause" : "play"} />
        </IconButton>
        <Label>{label}</Label>
      </div>
      <SliderWrapper>
        <SliderRow className="min-w-sm">
          <Slider
            appearance={"organic"}
            thumbLabel={"Volume"}
            value={[volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={100}
          />
          <SliderOutput>{volume}%</SliderOutput>
        </SliderRow>
      </SliderWrapper>
    </div>
  );
}
