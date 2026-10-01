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

import { Checkbox, CheckboxBody } from "@/components/ui/checkbox";

interface AmbientSoundProps {
  sound: SoundName;
  isMuted: boolean;
  onPlayingChange: (isPlaying: boolean) => void;
}

function AmbientSound({
  sound,
  isMuted,
  onPlayingChange,
}: AmbientSoundProps) {
  const { label, file } = AMBIENT[sound];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState(50);
  const muted = isMuted || volume === 0;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

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
      onPlayingChange(false);
      return;
    }

    if (muted) {
      console.warn("Cannot play audio while muted.");
      return;
    }

    try {
      await audioRef.current.play();

      setIsPlaying(true);
      onPlayingChange(true);
    } catch (err) {
      console.error("Cannot play audio:", err);
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

export default function SoundPanel() {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playingSounds, setPlayingSounds] = useState<Set<SoundName>>(new Set());

  function handlePlayingChange(sound: SoundName, isPlaying: boolean) {
    setPlayingSounds((current) => {
      const next = new Set(current);

      if (isPlaying) {
        next.add(sound);
      } else {
        next.delete(sound);

        if (next.size === 0) {
          setIsMuted(false);
        }
      }

      return next;
    });
  }

  const hasPlayingAmbient = playingSounds.size > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-center">
        {hasPlayingAmbient && (
          <Checkbox
            appearance={"chip"}
            onCheckedChange={() => setIsMuted((prev) => !prev)}
            size={"sm"}
            checked={isMuted}
          >
            <CheckboxBody>
              <b>Mute all</b>
            </CheckboxBody>
          </Checkbox>
        )}
      </div>
      {(Object.keys(AMBIENT) as SoundName[]).map((name) => (
        <AmbientSound
          key={name}
          sound={name}
          isMuted={isMuted}
          onPlayingChange={(isPlaying) => handlePlayingChange(name, isPlaying)}
        />
      ))}
    </div>
  );
}
