"use client";
import AmbientSound from "@/components/ambient-sound";
import { AMBIENT, type SoundName } from "@/lib/ambient";

export default function Page() {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center gap-6 font-limelight">
      {(Object.keys(AMBIENT) as SoundName[]).map((name) => (
        <AmbientSound key={name} sound={name} />
      ))}
    </div>
  );
}
